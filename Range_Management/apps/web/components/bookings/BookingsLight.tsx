'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/TacticalIcons";
import { useToast } from "@/contexts/toast-context";
import type { CreateBookingPayload } from "@/hooks/useBookings";

const DATE_SLOTS = ["TODAY • LIVE SCHEDULE", "TOMORROW • RESERVE", "THU, 14 NOV 2025"];
const DURATION_OPTIONS = [
  { fee: 15, minutes: 30, label: "30 Min Practice ($15)" },
  { fee: 25, minutes: 60, label: "60 Min Session ($25)" },
  { fee: 45, minutes: 120, label: "2-Hr Match Block ($45)" },
];

function getDurationMinutes(startTime?: string, endTime?: string): number {
  if (!startTime || !endTime) return 60;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 60;
  return Math.max(30, eh * 60 + em - (sh * 60 + sm));
}

export function BookingsLight({
  events = [],
  requests = [],
  isLoading = false,
  createBooking,
  approveRequest,
  rejectRequest,
}: {
  events?: any[];
  requests?: any[];
  isLoading?: boolean;
  createBooking?: (payload: CreateBookingPayload) => Promise<any>;
  approveRequest?: (id: string) => void;
  rejectRequest?: (id: string) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const intakeInputRef = useRef<HTMLInputElement>(null);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [dateIndex, setDateIndex] = useState(0);
  const [bayFilter, setBayFilter] = useState<"ALL" | "10M" | "25M">("ALL");

  // Controlled intake form state (fixes static/uneditable value inputs)
  const [intakeMode, setIntakeMode] = useState<"MEMBER" | "WALKIN">("MEMBER");
  const [shooterQuery, setShooterQuery] = useState("M-7431 (Elena Rostova)");
  const [airgunProfile, setAirgunProfile] = useState("Steyr Challenge HFT 4.5mm");
  const [assignedLane, setAssignedLane] = useState<number>(1);
  const [durationFee, setDurationFee] = useState<number>(25); // 25 + 8 + 5 = $38.00 default
  const [addonAir, setAddonAir] = useState(true);
  const [addonPellets, setAddonPellets] = useState(false);
  const [addonTarget, setAddonTarget] = useState(true);
  const [waiverSigned, setWaiverSigned] = useState(true);
  const [bookingBanner, setBookingBanner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];
  const pendingRequests = requests.filter((r: any) => r.status === "PENDING");

  const visibleLanes =
    bayFilter === "10M" ? [1, 2, 3, 4] : bayFilter === "25M" ? [5, 6, 7, 8] : [1, 2, 3, 4, 5, 6, 7, 8];

  const occupiedLanesCount = new Set(events.map((e: any) => e.laneNumber || e.laneId)).size;
  const occupancyPct = Math.min(100, Math.round((occupiedLanesCount / 8) * 100));

  const totalEstimate =
    Number(durationFee) + (addonAir ? 8 : 0) + (addonPellets ? 15 : 0) + (addonTarget ? 5 : 0);

  const jumpToIntake = (mode: "MEMBER" | "WALKIN") => {
    setIntakeMode(mode);
    if (mode === "WALKIN" && shooterQuery.startsWith("M-")) {
      setShooterQuery("");
    }
    const panel = document.getElementById("intake-panel-light");
    panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => intakeInputRef.current?.focus(), 200);
    toast(mode === "WALKIN" ? "New walk-in shooter registration ready" : "Quick booking desk ready", "info");
  };

  const handleGenerateBooking = async () => {
    const cleanName = shooterQuery.trim();
    if (!cleanName) {
      toast("Please enter shooter name or Member ID.", "warning");
      intakeInputRef.current?.focus();
      return;
    }
    if (!waiverSigned) {
      toast("Mandatory RSO safety verification checkbox must be checked.", "warning");
      return;
    }

    const durationMeta = DURATION_OPTIONS.find((d) => d.fee === durationFee) || DURATION_OPTIONS[1];
    setIsSubmitting(true);
    try {
      const created = await createBooking?.({
        shooterName: cleanName,
        airgunProfile,
        laneNumber: assignedLane,
        durationMinutes: durationMeta.minutes,
        totalFee: totalEstimate,
        mode: intakeMode,
      });
      if (created?.id) {
        setSelectedEventId(created.id);
      }
      const laneCode = String(assignedLane).padStart(2, "0");
      setBookingBanner(`LANE ${laneCode} ASSIGNED & SCHEDULE COMMITTED ($${totalEstimate.toFixed(2)})`);
      toast(`Lane ${laneCode} assigned to ${cleanName} ($${totalEstimate.toFixed(2)})`, "success");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-space-lg h-full overflow-y-auto pb-[calc(5.5rem+var(--sab))] lg:pb-10">
      <div className="flex flex-col w-full pb-16">
        {/* Operational Sub-Header Bar & Filter Palette */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-5 bg-surface-container-lowest px-3 rounded-lg">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Selector Pill */}
            <button
              type="button"
              onClick={() => setDateIndex((i) => (i + 1) % DATE_SLOTS.length)}
              className="flex items-center bg-surface-container-low hover:bg-surface-container px-3.5 py-2 rounded transition-colors"
            >
              <MaterialIcon name="calendar_month" className="text-[18px] text-on-surface-variant mr-2" />
              <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                {DATE_SLOTS[dateIndex]}
              </span>
              <MaterialIcon name="expand_more" className="ml-2.5 text-[16px] text-on-surface-variant" />
            </button>
            {/* Bay Selection Filter Pills */}
            <div className="flex flex-wrap items-center bg-surface-container-low p-1 rounded gap-1">
              {(
                [
                  { id: "ALL", label: "ALL BAYS" },
                  { id: "10M", label: "10M OLYMPIC HALL" },
                  { id: "25M", label: "25M PRECISION BAY" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBayFilter(tab.id)}
                  className={`px-3 py-1.5 rounded font-label-md text-label-md font-semibold transition-all ${
                    bayFilter === tab.id
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Live Sync Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded">
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-ping" />
              <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">
                TELEMETRY SYNCED
              </span>
            </div>
          </div>
          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => jumpToIntake("WALKIN")}
              className="flex items-center gap-2 bg-surface-container-low hover:bg-surface-container text-on-surface px-4 py-2 rounded font-label-md text-label-md uppercase tracking-wider font-semibold transition-colors"
            >
              <MaterialIcon name="person_add" className="text-[18px]" />
              <span>New Shooter Registration</span>
            </button>
            <button
              type="button"
              onClick={() => jumpToIntake("MEMBER")}
              className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-5 py-2 rounded font-label-md text-label-md uppercase tracking-wider font-bold transition-colors"
            >
              <MaterialIcon name="add_circle" className="text-[18px]" />
              <span>+ Book Range Session</span>
            </button>
          </div>
        </div>

        {/* Telemetry KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 my-6">
          <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Scheduled Sessions
              </span>
              <span className="p-1.5 rounded bg-surface-container-low text-on-surface">
                <MaterialIcon name="scoreboard" className="text-[18px]" />
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-3">
              <span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">
                {String(events.length).padStart(2, "0")}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
                SESSIONS
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-3 bg-surface-container-low p-2 rounded">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">10m</span>
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  {events.filter((e: any) => (e.laneNumber || 1) <= 4).length}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-tertiary-container">Active</span>
                <span className="font-label-md text-label-md font-bold text-on-tertiary-container">
                  {events.length}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-secondary">Queue</span>
                <span className="font-label-md text-label-md font-bold text-secondary">
                  {pendingRequests.length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Bay Occupancy
              </span>
              <span className="p-1.5 rounded bg-surface-container-low text-on-tertiary-container">
                <MaterialIcon name="meeting_room" className="text-[18px]" />
              </span>
            </div>
            <div className="flex items-baseline gap-2 my-3">
              <span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">
                {occupancyPct}%
              </span>
              <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold bg-surface-container-low px-2 py-0.5 rounded">
                {occupiedLanesCount}/8 Occupied
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="w-full bg-surface-container-low h-2 rounded overflow-hidden">
                <div className="bg-on-tertiary-container h-full rounded transition-all" style={{ width: `${occupancyPct}%` }} />
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {bayFilter === "ALL" ? "Lanes 1-8 Live Dispatch" : `${bayFilter} Filtered View`}
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Air Fills Dispensed
              </span>
              <span className="p-1.5 rounded bg-surface-container-low text-on-surface">
                <MaterialIcon name="compress" className="text-[18px]" />
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-3">
              <span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">
                {14 + (addonAir ? 1 : 0)}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
                PCP CYLINDERS
              </span>
            </div>
            <div className="flex items-center justify-between bg-surface-container-low px-2.5 py-1.5 rounded">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Bauer Compressor</span>
              <span className="font-label-md text-label-md text-on-surface font-bold">300 BAR NOMINAL</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Pending Check-Ins
              </span>
              <span className="p-1.5 rounded bg-error-container text-on-error-container">
                <MaterialIcon name="assignment_ind" className="text-[18px]" />
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-3">
              <span className="font-telemetry-xl text-telemetry-xl text-error font-bold">
                {pendingRequests.length}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
                AWAITING BAY
              </span>
            </div>
            <div className="flex items-center justify-between bg-surface-container-low px-2.5 py-1.5 rounded">
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                {pendingRequests.length > 0 ? pendingRequests[0].shooterName : "None"}
              </span>
              <span className="font-label-sm text-label-sm font-bold text-secondary">
                {pendingRequests.length > 0 ? "REVIEW" : "CLEAR"}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Layout (65% Schedule Grid / 35% Quick Intake) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT: Interactive Bay & Lane Timeline Schedule */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded p-6 shadow-sm flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 gap-4">
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold uppercase tracking-tight">
                    {bayFilter === "10M" ? "10M Olympic Hall" : bayFilter === "25M" ? "25M Precision Bay" : "10M & 25M Lane Matrix"}
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Live firing allocations across {visibleLanes.length} electronic specification lanes
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-primary-container" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Member</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-on-tertiary-container" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Walk-in</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-surface-tint" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Junior Match</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <div className="min-w-[740px] flex flex-col">
                  <div className="grid grid-cols-10 bg-surface-container-low py-2.5 px-3 rounded text-on-surface-variant font-label-md text-label-md font-semibold text-center">
                    <div className="text-left pl-2">LANE ID</div>
                    <div>09:00</div>
                    <div>10:00</div>
                    <div>11:00</div>
                    <div>12:00</div>
                    <div>13:00</div>
                    <div>14:00</div>
                    <div>15:00</div>
                    <div>16:00</div>
                    <div>17:00</div>
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    {isLoading ? (
                      <div className="text-center py-8 text-on-surface-variant font-label-caps">
                        Loading schedule...
                      </div>
                    ) : (
                      visibleLanes.map((laneNum) => {
                        const laneCode = `L-0${laneNum}`;
                        const laneEvents = events.filter(
                          (e: any) => e.laneId === laneCode || e.laneNumber === laneNum,
                        );
                        const isSelectedRow = assignedLane === laneNum;
                        return (
                          <div
                            key={laneNum}
                            onClick={() => {
                              setAssignedLane(laneNum);
                              if (laneEvents.length > 0) setSelectedEventId(laneEvents[0].id);
                            }}
                            className={`grid grid-cols-10 items-center p-2 rounded transition-colors cursor-pointer ${
                              isSelectedRow
                                ? "bg-surface-container-low shadow-sm ring-1 ring-primary/40"
                                : "bg-surface-container-lowest hover:bg-surface-container-low"
                            }`}
                          >
                            <div className="flex items-center gap-2 pl-2">
                              <span
                                className={`font-label-md text-label-md font-bold ${
                                  isSelectedRow ? "text-primary" : "text-on-surface"
                                }`}
                              >
                                L0{laneNum}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  laneEvents.length > 0 ? "bg-primary animate-pulse" : "bg-on-tertiary-container"
                                }`}
                              />
                            </div>

                            {laneEvents.length === 0 ? (
                              <div className="col-span-9 bg-surface-container/50 text-on-surface-variant text-center py-2 rounded font-body-sm text-body-sm flex items-center justify-center border border-dashed border-outline-variant/30 min-h-[3rem]">
                                OPEN ALL DAY — CLICK TO ASSIGN
                              </div>
                            ) : (
                              <div className="col-span-9 flex flex-wrap gap-1.5 items-center bg-surface-container/20 p-1 rounded min-h-[3rem]">
                                {laneEvents.map((event: any) => (
                                  <button
                                    key={event.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEventId(event.id);
                                      setAssignedLane(laneNum);
                                    }}
                                    className={`px-3 py-1.5 rounded font-label-caps text-[0.7rem] font-semibold truncate border cursor-pointer transition-colors ${
                                      selectedEventId === event.id
                                        ? "bg-primary/15 border-primary text-primary"
                                        : "bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low"
                                    }`}
                                    title={`${event.shooterName} (${event.startTime}-${event.endTime})`}
                                  >
                                    {event.shooterName} ({event.startTime}–{event.endTime})
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Inspector Card */}
            <div className="bg-surface-container-low p-5 rounded flex flex-col gap-4" id="sessionDetailBox">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface pb-3">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="center_focus_strong" className="text-[20px] text-on-surface" />
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold uppercase">
                    Selected Session Telemetry
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/lanes")}
                  className="font-label-sm text-label-sm px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded text-primary font-semibold tracking-wider flex items-center gap-1 transition-colors"
                >
                  <span>VIEW OPTICAL TARGET CAM</span>
                  <MaterialIcon name="open_in_new" className="text-[14px]" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    SHOOTER / TEAM
                  </span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold mt-1">
                    {selectedEvent?.shooterName || "Select a session"}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {selectedEvent ? `MEMBER ID: #${String(selectedEvent.id).slice(0, 8).toUpperCase()}` : "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    AIRGUN SPECIFICATION
                  </span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold mt-1 truncate">
                    {selectedEvent?.type || "N/A"}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Caliber: {selectedEvent?.caliber || "4.5mm (.177)"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    TIME &amp; LOCATION
                  </span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold mt-1">
                    {selectedEvent
                      ? `${selectedEvent.startTime} - ${selectedEvent.endTime} (${getDurationMinutes(
                          selectedEvent.startTime,
                          selectedEvent.endTime,
                        )} min)`
                      : "00:00 - 00:00"}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {selectedEvent
                      ? `Lane ${String(selectedEvent.laneNumber || 1).padStart(2, "0")} - Olympic Target`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    RSO &amp; WAIVER STATUS
                  </span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold mt-1">
                    {selectedEvent ? "C. Vance (RSO-1)" : "N/A"}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">
                    VERIFIED (SIGNED)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Quick Intake & New Shooter Registration Panel */}
          <div id="intake-panel-light" className="xl:col-span-4 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="app_registration" className="text-[20px] text-primary" />
                  <h3 className="font-headline-sm text-headline-sm uppercase tracking-wide text-on-surface font-bold">
                    Quick Intake Form
                  </h3>
                </div>
                <span className="font-label-sm text-label-sm bg-surface-container-low text-on-surface-variant px-2 py-1 rounded font-semibold">
                  FAST-TRACK
                </span>
              </div>

              <div className="flex flex-col gap-5 pt-2">
                {/* Toggle: Registered Member vs New Shooter */}
                <div className="flex items-center bg-surface-container-low p-1 rounded">
                  <button
                    id="tabMember"
                    type="button"
                    onClick={() => setIntakeMode("MEMBER")}
                    className={`flex-1 py-1.5 rounded font-label-md text-label-md font-semibold transition-all ${
                      intakeMode === "MEMBER"
                        ? "bg-primary text-on-primary"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    EXISTING MEMBER
                  </button>
                  <button
                    id="tabNew"
                    type="button"
                    onClick={() => {
                      setIntakeMode("WALKIN");
                      if (shooterQuery.startsWith("M-")) setShooterQuery("");
                    }}
                    className={`flex-1 py-1.5 rounded font-label-md text-label-md font-semibold transition-all ${
                      intakeMode === "WALKIN"
                        ? "bg-primary text-on-primary"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    NEW / WALK-IN
                  </button>
                </div>

                {/* Shooter Name / Member Lookup */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                    {intakeMode === "WALKIN" ? "Walk-in Full Name" : "Shooter Identification"}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="shooterInput"
                      ref={intakeInputRef}
                      type="text"
                      value={shooterQuery}
                      onChange={(e) => setShooterQuery(e.target.value)}
                      placeholder={intakeMode === "WALKIN" ? "Enter full name..." : "Scan Badge or Enter Member ID..."}
                      className="w-full h-9 px-3 pr-9 bg-surface-container-low rounded font-label-md text-label-md text-on-surface focus:outline-none focus:bg-surface-container"
                    />
                    <MaterialIcon name="badge" className="absolute right-3 text-[18px] text-on-surface-variant pointer-events-none" />
                  </div>
                </div>

                {/* Airgun Type / Serial (Controlled!) */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                    Airgun Profile &amp; Caliber
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={airgunProfile}
                      onChange={(e) => setAirgunProfile(e.target.value)}
                      placeholder="e.g., Steyr Challenge .177 PCP"
                      className="w-full h-9 px-3 pr-9 bg-surface-container-low rounded font-label-md text-label-md text-on-surface focus:outline-none focus:bg-surface-container"
                    />
                    <MaterialIcon name="sports_score" className="absolute right-3 text-[18px] text-on-surface-variant pointer-events-none" />
                  </div>
                </div>

                {/* Lane & Duration Selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                      Assign Lane
                    </label>
                    <div className="relative">
                      <select
                        value={assignedLane}
                        onChange={(e) => setAssignedLane(Number(e.target.value))}
                        className="w-full h-9 px-2.5 bg-surface-container-low rounded font-label-md text-label-md text-on-surface appearance-none focus:outline-none focus:bg-surface-container"
                      >
                        <option value={1}>Lane 01 (10m Olympic)</option>
                        <option value={2}>Lane 02 (10m Olympic)</option>
                        <option value={3}>Lane 03 (10m Olympic)</option>
                        <option value={4}>Lane 04 (10m Olympic)</option>
                        <option value={5}>Lane 05 (25m Precision)</option>
                        <option value={6}>Lane 06 (25m Olympic)</option>
                        <option value={7}>Lane 07 (25m Precision)</option>
                        <option value={8}>Lane 08 (Plinking Bay)</option>
                      </select>
                      <MaterialIcon name="arrow_drop_down" className="pointer-events-none absolute right-2 top-2 text-[18px] text-on-surface-variant" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                      Duration Block
                    </label>
                    <div className="relative">
                      <select
                        id="durationSelect"
                        value={durationFee}
                        onChange={(e) => setDurationFee(Number(e.target.value))}
                        className="w-full h-9 px-2.5 bg-surface-container-low rounded font-label-md text-label-md text-on-surface appearance-none focus:outline-none focus:bg-surface-container"
                      >
                        {DURATION_OPTIONS.map((opt) => (
                          <option key={opt.fee} value={opt.fee}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <MaterialIcon name="schedule" className="pointer-events-none absolute right-2 top-2.5 text-[16px] text-on-surface-variant" />
                    </div>
                  </div>
                </div>

                {/* Add-On Range Services */}
                <div className="flex flex-col gap-2 pt-1">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                    Add-On Facility Services
                  </span>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center justify-between p-3 bg-surface-container-low rounded cursor-pointer hover:bg-surface-container transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          id="addonAir"
                          type="checkbox"
                          checked={addonAir}
                          onChange={(e) => setAddonAir(e.target.checked)}
                          className="w-4 h-4 rounded accent-primary cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-semibold text-on-surface">
                            PCP Scuba Tank Refill
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            300 Bar Pure Dry Air Fill
                          </span>
                        </div>
                      </div>
                      <span className="font-label-md text-label-md font-bold text-on-surface">+$8.00</span>
                    </label>

                    <label className="flex items-center justify-between p-3 bg-surface-container-low rounded cursor-pointer hover:bg-surface-container transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          id="addonPellets"
                          type="checkbox"
                          checked={addonPellets}
                          onChange={(e) => setAddonPellets(e.target.checked)}
                          className="w-4 h-4 rounded accent-primary cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-semibold text-on-surface">
                            Match Pellet Tin (500ct)
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            JSB Exact Heavy 4.52mm
                          </span>
                        </div>
                      </div>
                      <span className="font-label-md text-label-md font-bold text-on-surface">+$15.00</span>
                    </label>

                    <label className="flex items-center justify-between p-3 bg-surface-container-low rounded cursor-pointer hover:bg-surface-container transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          id="addonTarget"
                          type="checkbox"
                          checked={addonTarget}
                          onChange={(e) => setAddonTarget(e.target.checked)}
                          className="w-4 h-4 rounded accent-primary cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-semibold text-on-surface">
                            Electronic Target Scoring
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Meyton/SIUS Cloud Telemetry Feed
                          </span>
                        </div>
                      </div>
                      <span className="font-label-md text-label-md font-bold text-on-surface">+$5.00</span>
                    </label>
                  </div>
                </div>

                {/* Safety Waiver Verification */}
                <div className="p-3.5 bg-surface-container-low rounded flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-bold flex items-center gap-1.5">
                      <MaterialIcon name="verified_user" className="text-[16px] text-on-tertiary-container" />
                      RSO Safety Verification
                    </span>
                    <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">
                      MANDATORY
                    </span>
                  </div>
                  <label className="flex items-start gap-2.5 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={waiverSigned}
                      onChange={(e) => setWaiverSigned(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
                      Safety Briefing &amp; Waiver Signed (Digital Verified). Eye protection inspected and PCP air tank hydro-test in-date.
                    </span>
                  </label>
                </div>

                {/* Price Total */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                      SESSION FEE ESTIMATE
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Tax included • {intakeMode === "WALKIN" ? "Walk-in rate" : "Member pricing"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span id="bookingTotal" className="font-telemetry-lg text-telemetry-lg font-bold text-on-surface">
                      ${totalEstimate.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Primary CTA */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleGenerateBooking}
                  className="w-full h-11 bg-primary hover:bg-primary-container text-on-primary rounded font-label-md text-label-md uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  <MaterialIcon name="verified" className="text-[18px]" />
                  <span>{isSubmitting ? "Assigning..." : "Assign Lane & Generate Booking"}</span>
                </button>

                {bookingBanner && (
                  <div
                    id="bookingBanner"
                    className="p-3 bg-surface-container-low text-on-tertiary-container rounded flex items-center justify-between gap-2 border border-primary/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MaterialIcon name="check_circle" className="text-[18px] shrink-0" />
                      <span className="font-label-sm text-label-sm font-bold truncate">
                        {bookingBanner}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBookingBanner(null)}
                      className="text-on-surface-variant hover:text-on-surface shrink-0"
                      aria-label="Dismiss banner"
                    >
                      <MaterialIcon name="close" className="text-[16px]" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Requests interactive list */}
            {requests.length > 0 && (
              <div className="bg-surface-container-lowest rounded p-6 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 pb-4 border-b border-surface mb-4">
                  <MaterialIcon name="assignment_ind" className="text-[20px] text-primary" />
                  <h3 className="font-headline-sm text-headline-sm uppercase tracking-wide text-on-surface font-bold">
                    Pending Requests ({pendingRequests.length})
                  </h3>
                </div>
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto">
                  {pendingRequests.map((req: any) => (
                    <div
                      key={req.id}
                      className="bg-surface-container-low p-3 rounded flex items-center justify-between border border-transparent hover:border-primary-container transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-label-md text-on-surface font-semibold">{req.shooterName}</span>
                        <span className="font-body-sm text-on-surface-variant">
                          {req.laneId} • {req.requestedDate} @ {req.requestedTime}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            rejectRequest?.(req.id);
                            toast(`Rejected request from ${req.shooterName}`, "info");
                          }}
                          className="p-1.5 rounded bg-error/10 hover:bg-error text-error hover:text-on-error transition-colors"
                          title="Reject"
                        >
                          <MaterialIcon name="close" className="text-[18px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            approveRequest?.(req.id);
                            toast(`Approved ${req.shooterName} onto ${req.laneId}`, "success");
                          }}
                          className="p-1.5 rounded bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary transition-colors"
                          title="Approve"
                        >
                          <MaterialIcon name="check" className="text-[18px]" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingRequests.length === 0 && (
                    <div className="text-center py-4 text-on-surface-variant font-body-sm">
                      No pending requests.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
