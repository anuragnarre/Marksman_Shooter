'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/TacticalIcons";
import { useToast } from "@/contexts/toast-context";
import type { CreateBookingPayload } from "@/hooks/useBookings";

const DATE_SLOTS = ["TODAY • LIVE SCHEDULE", "TOMORROW • RESERVE", "THU, 14 NOV 2025"];
const DURATION_OPTIONS = [
  { fee: 15, minutes: 60, label: "60 Min ($15.00)" },
  { fee: 25, minutes: 90, label: "90 Min ($25.00)" },
  { fee: 30, minutes: 120, label: "120 Min ($30.00)" },
  { fee: 50, minutes: 240, label: "Half-Day Pass ($50.00)" },
];

function getDurationMinutes(startTime?: string, endTime?: string): number {
  if (!startTime || !endTime) return 60;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 60;
  return Math.max(30, eh * 60 + em - (sh * 60 + sm));
}

export function BookingsDark({
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

  // Intake form controlled state
  const [intakeMode, setIntakeMode] = useState<"MEMBER" | "WALKIN">("MEMBER");
  const [shooterQuery, setShooterQuery] = useState("M-7431 (Elena Rostova)");
  const [airgunProfile, setAirgunProfile] = useState("Steyr Challenge HFT • 4.5mm (.177)");
  const [assignedLane, setAssignedLane] = useState<number>(1);
  const [durationFee, setDurationFee] = useState<number>(15);
  const [addonAir, setAddonAir] = useState(true);
  const [addonPellets, setAddonPellets] = useState(true);
  const [addonTarget, setAddonTarget] = useState(false);
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
    const panel = document.getElementById("intake-panel");
    panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => intakeInputRef.current?.focus(), 200);
    toast(mode === "WALKIN" ? "Walk-in shooter intake ready" : "Quick booking desk ready", "info");
  };

  const handleGenerateBooking = async () => {
    const cleanName = shooterQuery.trim();
    if (!cleanName) {
      toast("Enter shooter ID or full name before assigning a lane.", "warning");
      intakeInputRef.current?.focus();
      return;
    }
    if (!waiverSigned) {
      toast("RSO safety briefing and digital waiver verification required.", "warning");
      return;
    }

    const durationMeta = DURATION_OPTIONS.find((d) => d.fee === durationFee) || DURATION_OPTIONS[0];
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
      setBookingBanner(`LANE ${laneCode} ASSIGNED TO ${cleanName.toUpperCase()} ($${totalEstimate.toFixed(2)})`);
      toast(`Lane L-${laneCode} assigned & session scheduled ($${totalEstimate.toFixed(2)})`, "success");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-space-lg h-full overflow-y-auto pb-[calc(5.5rem+var(--sab))] lg:pb-10">
      <div className="flex flex-col w-full gap-space-lg text-on-surface">
        {/* Operational Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl shadow-md">
          <div className="flex flex-wrap items-center gap-space-md">
            {/* Date Picker Trigger */}
            <button
              type="button"
              onClick={() => setDateIndex((i) => (i + 1) % DATE_SLOTS.length)}
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface shadow-sm cursor-pointer hover:bg-surface-bright transition-colors"
            >
              <MaterialIcon name="calendar_today" className="text-[18px] text-primary" />
              <span className="font-telemetry-sm text-telemetry-sm tracking-wide">
                {DATE_SLOTS[dateIndex]}
              </span>
              <MaterialIcon name="arrow_drop_down" className="text-[16px] text-outline" />
            </button>
            {/* Bay Range Segment Selector */}
            <div className="flex flex-wrap items-center p-space-xs bg-surface-container rounded-lg gap-space-xs">
              {(
                [
                  { id: "ALL", label: "All Bays" },
                  { id: "10M", label: "10m Olympic Hall" },
                  { id: "25M", label: "25m Precision Bay" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBayFilter(tab.id)}
                  className={`px-space-md py-space-xs rounded font-label-caps text-label-caps uppercase transition-colors ${
                    bayFilter === tab.id
                      ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-lowest">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span className="font-label-caps text-label-caps text-tertiary">
                LIVE TELEMETRY SYNCED
              </span>
            </div>
          </div>
          {/* Quick Action Triggers */}
          <div className="flex flex-wrap items-center gap-space-sm">
            <button
              type="button"
              onClick={() => jumpToIntake("WALKIN")}
              className="flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-colors shadow-sm"
            >
              <MaterialIcon name="person_add" className="text-[18px] text-tertiary" />
              <span className="font-headline-md text-body-md font-semibold">
                New Shooter Reg
              </span>
            </button>
            <button
              type="button"
              onClick={() => jumpToIntake("MEMBER")}
              className="flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-primary-container hover:bg-primary text-on-primary-container transition-all shadow-md active:scale-95 font-headline-md text-body-md font-bold"
            >
              <MaterialIcon name="add_circle" className="text-[20px]" />
              <span>+ Book Range Session</span>
            </button>
          </div>
        </div>

        {/* Telemetry Summary KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          <div className="relative overflow-hidden bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col justify-between h-[106px]">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                Scheduled Sessions
              </span>
              <MaterialIcon name="sports_score" className="text-primary text-[18px]" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-space-xs">
                <span className="font-telemetry-lg text-telemetry-lg text-on-surface">
                  {String(events.length).padStart(2, "0")}
                </span>
                <span className="font-label-caps text-label-caps text-outline">SESSIONS</span>
              </div>
              <div className="flex items-center gap-space-xs font-telemetry-sm text-body-sm text-on-surface-variant">
                <span className="text-tertiary">{events.length} Conf</span>
                <span className="text-outline">/</span>
                <span className="text-secondary">{pendingRequests.length} Q</span>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col justify-between h-[106px]">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-tertiary" />
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                Bay Occupancy Rate
              </span>
              <MaterialIcon name="grid_view" className="text-tertiary text-[18px]" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-space-xs">
                <span className="font-telemetry-lg text-telemetry-lg text-tertiary font-bold">
                  {occupancyPct}%
                </span>
                <span className="font-label-caps text-label-caps text-secondary-fixed-dim uppercase">
                  {occupiedLanesCount}/8 Lanes
                </span>
              </div>
              <div className="flex items-center gap-space-xs font-telemetry-sm text-body-sm text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
                <span>{bayFilter === "ALL" ? "Lanes 1-8 Live" : `${bayFilter} View`}</span>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col justify-between h-[106px]">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-secondary" />
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                Air Dispensed (300 BAR)
              </span>
              <MaterialIcon name="compress" className="text-secondary text-[18px]" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-space-xs">
                <span className="font-telemetry-lg text-telemetry-lg text-on-surface">
                  {14 + (addonAir ? 1 : 0)}
                </span>
                <span className="font-label-caps text-label-caps text-outline">CYLINDERS</span>
              </div>
              <div className="font-telemetry-sm text-body-sm text-secondary-fixed-dim">
                <span>Compressor 310 Bar</span>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col justify-between h-[106px]">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-error" />
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                Pending Range Intake
              </span>
              <MaterialIcon name="pending_actions" className="text-error text-[18px]" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-space-xs">
                <span className="font-telemetry-lg text-telemetry-lg text-error font-bold">
                  {String(pendingRequests.length).padStart(2, "0")}
                </span>
                <span className="font-label-caps text-label-caps text-outline">WAITLIST</span>
              </div>
              <div className="px-space-sm py-space-xs rounded bg-secondary-container text-on-secondary-container font-label-caps text-label-caps font-bold truncate max-w-[140px]">
                {pendingRequests.length > 0 ? pendingRequests[0].shooterName : "QUEUE CLEAR"}
              </div>
            </div>
          </div>
        </div>

        {/* Main 65% / 35% Tactical Operational Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
          {/* LEFT: Bay & Lane Matrix Timeline Grid */}
          <div className="xl:col-span-8 flex flex-col gap-space-md">
            <div className="bg-surface-container-low rounded-xl p-space-lg shadow-md flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-md">
                <div className="flex flex-wrap items-center gap-space-sm">
                  <MaterialIcon name="view_timeline" className="text-primary text-[20px]" />
                  <span className="font-headline-lg text-headline-lg text-on-surface">
                    Lane Dispatch Schedule
                  </span>
                  <span className="font-label-caps text-label-caps px-space-sm py-0.5 rounded bg-surface-container-high text-outline">
                    {bayFilter === "25M" ? "25M PRECISION BAY" : bayFilter === "10M" ? "10M MATCH DISCIPLINE" : "10M & 25M ALL BAYS"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-space-md">
                  <div className="flex items-center gap-space-xs">
                    <div className="w-2.5 h-2.5 rounded-sm bg-primary-container" />
                    <span className="font-label-caps text-label-caps text-on-surface-variant">Member (Live)</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <div className="w-2.5 h-2.5 rounded-sm bg-tertiary" />
                    <span className="font-label-caps text-label-caps text-on-surface-variant">Walk-in</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <div className="w-2.5 h-2.5 rounded-sm bg-secondary-container" />
                    <span className="font-label-caps text-label-caps text-on-surface-variant">Junior Match</span>
                  </div>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <div className="min-w-[680px] flex flex-col">
                  <div className="grid grid-cols-9 gap-1 pb-space-xs text-center font-label-caps text-label-caps text-outline bg-surface-container-lowest py-space-xs px-space-sm rounded-lg">
                    <div className="text-left pl-space-xs font-bold text-on-surface">LANE / BAY</div>
                    <div>09:00</div>
                    <div>10:00</div>
                    <div>11:00</div>
                    <div>12:00</div>
                    <div>13:00</div>
                    <div>14:00</div>
                    <div>15:00</div>
                    <div>16:00</div>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-space-xs">
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
                        const isAssignedLane = assignedLane === laneNum;
                        return (
                          <div
                            key={laneNum}
                            onClick={() => {
                              setAssignedLane(laneNum);
                              if (laneEvents.length > 0) setSelectedEventId(laneEvents[0].id);
                            }}
                            className={`grid grid-cols-9 gap-1 items-center px-space-sm py-1.5 rounded transition-colors cursor-pointer ${
                              isAssignedLane
                                ? "bg-surface-container shadow-sm ring-1 ring-primary/50"
                                : "bg-surface-container-low hover:bg-surface-container"
                            }`}
                          >
                            <div className="flex items-center justify-between pr-space-xs">
                              <span
                                className={`font-telemetry-sm text-telemetry-sm font-bold ${
                                  isAssignedLane ? "text-primary" : "text-on-surface"
                                }`}
                              >
                                {laneCode}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  laneEvents.length > 0 ? "bg-primary animate-pulse" : "bg-outline"
                                }`}
                              />
                            </div>

                            {laneEvents.length === 0 ? (
                              <div className="col-span-8 bg-surface-container-lowest/60 text-outline text-center py-1.5 rounded font-label-caps text-[0.65rem] flex items-center justify-center">
                                OPEN ALL DAY — CLICK TO SELECT LANE
                              </div>
                            ) : (
                              <div className="col-span-8 flex flex-wrap gap-1.5 items-center">
                                {laneEvents.map((event: any) => (
                                  <button
                                    key={event.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEventId(event.id);
                                      setAssignedLane(laneNum);
                                    }}
                                    className={`px-2.5 py-1.5 rounded font-label-caps text-[0.68rem] truncate border transition-colors ${
                                      selectedEventId === event.id
                                        ? "bg-primary/20 border-primary text-primary font-bold"
                                        : "bg-surface-container-lowest/80 border-transparent text-on-surface-variant hover:bg-surface-container-highest"
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

            {/* Selected Session Telemetry Card */}
            <div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-col gap-space-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-space-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="font-label-caps text-label-caps uppercase text-primary font-bold">
                    Active Selected Bay Telemetry
                  </span>
                  <span className="font-label-caps text-label-caps px-space-xs py-0.5 rounded bg-primary-container text-on-primary-container font-semibold">
                    {selectedEvent
                      ? `LANE ${String(selectedEvent.laneNumber || 1).padStart(2, "0")} ACTIVE`
                      : "NO SESSION SELECTED"}
                  </span>
                </div>
                <div className="flex items-center gap-space-xs text-tertiary font-label-caps text-label-caps">
                  <MaterialIcon name="verified_user" className="text-[16px]" />
                  <span>RSO VERIFIED • RANGE HOT</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md bg-surface-container p-space-md rounded-lg items-center">
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-outline uppercase">
                    Shooter Identification
                  </span>
                  <span className="font-headline-md text-body-md font-bold text-on-surface">
                    {selectedEvent?.shooterName || "Select a session"}
                  </span>
                  <span className="font-telemetry-sm text-body-sm text-tertiary">
                    {selectedEvent ? `MEMBER ID: #${String(selectedEvent.id).slice(0, 8).toUpperCase()}` : "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-outline uppercase">
                    Registered Profile
                  </span>
                  <span className="font-headline-md text-body-md font-bold text-on-surface truncate">
                    {selectedEvent?.type || "N/A"}
                  </span>
                  <span className="font-telemetry-sm text-body-sm text-on-surface-variant">
                    Caliber: {selectedEvent?.caliber || "4.5mm (.177)"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-outline uppercase">
                    Session Allocated Time
                  </span>
                  <span className="font-telemetry-sm text-headline-md font-bold text-on-surface">
                    {selectedEvent ? `${selectedEvent.startTime} - ${selectedEvent.endTime}` : "00:00 - 00:00"}
                  </span>
                  <span className="font-label-caps text-label-caps text-primary">
                    {selectedEvent
                      ? `${getDurationMinutes(selectedEvent.startTime, selectedEvent.endTime)} MIN`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex flex-col justify-end md:items-end gap-space-xs">
                  <div className="flex items-center gap-space-xs bg-surface-container-high px-space-md py-space-xs rounded font-telemetry-sm text-body-sm">
                    <span className="text-outline">AIR RES:</span>
                    <span className="text-primary font-bold">198 BAR</span>
                    <span className="text-outline">| SCORE:</span>
                    <span className="text-tertiary font-bold">104.8</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/lanes")}
                    className="font-label-caps text-label-caps text-primary hover:text-on-surface transition-colors uppercase tracking-wider flex items-center gap-1"
                  >
                    <span>View Optical Target Cam</span>
                    <MaterialIcon name="open_in_new" className="text-[14px]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Quick Intake & Range Booking Form */}
          <div id="intake-panel" className="xl:col-span-4 flex flex-col gap-space-md">
            <div className="bg-surface-container-low rounded-xl p-space-lg shadow-md flex flex-col gap-space-md">
              <div className="flex flex-col gap-space-sm pb-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <MaterialIcon name="assignment" className="text-primary text-[20px]" />
                    <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                      Range Session Intake
                    </h2>
                  </div>
                  <span className="font-label-caps text-label-caps text-tertiary bg-surface-container px-space-xs py-0.5 rounded">
                    FAST DESK
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 bg-surface-container-lowest p-1 rounded-lg">
                  <button
                    id="btn-member"
                    type="button"
                    onClick={() => setIntakeMode("MEMBER")}
                    className={`py-space-xs font-label-caps text-label-caps uppercase rounded transition-all text-center ${
                      intakeMode === "MEMBER"
                        ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    Existing Member
                  </button>
                  <button
                    id="btn-walkin"
                    type="button"
                    onClick={() => {
                      setIntakeMode("WALKIN");
                      if (shooterQuery.startsWith("M-")) setShooterQuery("");
                    }}
                    className={`py-space-xs font-label-caps text-label-caps uppercase rounded transition-all text-center ${
                      intakeMode === "WALKIN"
                        ? "bg-primary-container text-on-primary-container font-bold shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    New / Walk-in
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-space-md">
                {/* Shooter Search / Input */}
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-caps text-label-caps text-outline uppercase flex items-center justify-between">
                    <span>{intakeMode === "WALKIN" ? "Walk-in Full Name / Phone" : "Shooter Lookup (ID / Name)"}</span>
                    <span className="text-tertiary">{intakeMode === "WALKIN" ? "DAY PASS" : "VERIFIED PASS"}</span>
                  </label>
                  <div className="relative flex items-center">
                    <MaterialIcon name="search" className="absolute left-space-md text-outline text-[18px]" />
                    <input
                      id="shooterInput"
                      ref={intakeInputRef}
                      type="text"
                      value={shooterQuery}
                      onChange={(e) => setShooterQuery(e.target.value)}
                      placeholder={intakeMode === "WALKIN" ? "Enter full name..." : "Member ID or name..."}
                      className="w-full bg-surface-container-high text-on-surface font-body-md text-body-md pl-10 pr-9 py-space-sm rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    />
                    {shooterQuery && (
                      <button
                        type="button"
                        aria-label="Clear shooter field"
                        onClick={() => setShooterQuery("")}
                        className="absolute right-space-sm text-outline hover:text-on-surface"
                      >
                        <MaterialIcon name="cancel" className="text-[18px]" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Airgun Profile & Caliber */}
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-caps text-label-caps text-outline uppercase">
                    Airgun Profile &amp; Caliber
                  </label>
                  <div className="relative">
                    <select
                      value={airgunProfile}
                      onChange={(e) => setAirgunProfile(e.target.value)}
                      className="w-full bg-surface-container-high text-on-surface font-body-md text-body-md px-space-md py-space-sm rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none font-medium"
                    >
                      <option>Steyr Challenge HFT • 4.5mm (.177)</option>
                      <option>Feinwerkbau 800 Universal • .177 Cal</option>
                      <option>Air Arms TX200 MKIII • .177 Spring</option>
                      <option>Range Loaner: Walther LG400 Club</option>
                    </select>
                    <MaterialIcon name="expand_more" className="absolute right-space-md top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]" />
                  </div>
                </div>

                {/* Lane and Duration */}
                <div className="grid grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-space-xs">
                    <label className="font-label-caps text-label-caps text-outline uppercase">
                      Assigned Lane
                    </label>
                    <div className="relative">
                      <select
                        value={assignedLane}
                        onChange={(e) => setAssignedLane(Number(e.target.value))}
                        className="w-full bg-surface-container-high text-on-surface font-telemetry-sm text-telemetry-sm px-space-md py-space-sm rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                      >
                        <option value={1}>Lane 01 (10m Olympic)</option>
                        <option value={2}>Lane 02 (10m Olympic)</option>
                        <option value={3}>Lane 03 (10m Olympic)</option>
                        <option value={4}>Lane 04 (10m Open)</option>
                        <option value={5}>Lane 05 (25m Precision)</option>
                        <option value={6}>Lane 06 (25m Match)</option>
                        <option value={7}>Lane 07 (25m Precision)</option>
                        <option value={8}>Lane 08 (25m Precision)</option>
                      </select>
                      <MaterialIcon name="expand_more" className="absolute right-space-sm top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <label className="font-label-caps text-label-caps text-outline uppercase">
                      Session Duration
                    </label>
                    <div className="relative">
                      <select
                        id="select-duration"
                        value={durationFee}
                        onChange={(e) => setDurationFee(Number(e.target.value))}
                        className="w-full bg-surface-container-high text-on-surface font-telemetry-sm text-telemetry-sm px-space-md py-space-sm rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                      >
                        {DURATION_OPTIONS.map((opt) => (
                          <option key={opt.fee} value={opt.fee}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <MaterialIcon name="expand_more" className="absolute right-space-sm top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]" />
                    </div>
                  </div>
                </div>

                {/* Add-on Services */}
                <div className="flex flex-col gap-space-xs pt-space-xs">
                  <span className="font-label-caps text-label-caps text-outline uppercase">
                    Facility Add-on Services
                  </span>
                  <div className="flex flex-col gap-space-xs bg-surface-container p-space-sm rounded-lg">
                    <label className="flex items-center justify-between p-space-xs rounded hover:bg-surface-container-high transition-colors cursor-pointer">
                      <div className="flex items-center gap-space-sm">
                        <input
                          checked={addonAir}
                          onChange={(e) => setAddonAir(e.target.checked)}
                          className="rounded accent-primary w-4 h-4 cursor-pointer"
                          type="checkbox"
                        />
                        <span className="font-body-md text-body-md text-on-surface">
                          PCP Scuba Tank Refill (300 Bar)
                        </span>
                      </div>
                      <span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">+$8.00</span>
                    </label>
                    <label className="flex items-center justify-between p-space-xs rounded hover:bg-surface-container-high transition-colors cursor-pointer">
                      <div className="flex items-center gap-space-sm">
                        <input
                          checked={addonPellets}
                          onChange={(e) => setAddonPellets(e.target.checked)}
                          className="rounded accent-primary w-4 h-4 cursor-pointer"
                          type="checkbox"
                        />
                        <span className="font-body-md text-body-md text-on-surface">
                          Match Pellet Tin (JSB Exact 500ct)
                        </span>
                      </div>
                      <span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">+$15.00</span>
                    </label>
                    <label className="flex items-center justify-between p-space-xs rounded hover:bg-surface-container-high transition-colors cursor-pointer">
                      <div className="flex items-center gap-space-sm">
                        <input
                          checked={addonTarget}
                          onChange={(e) => setAddonTarget(e.target.checked)}
                          className="rounded accent-primary w-4 h-4 cursor-pointer"
                          type="checkbox"
                        />
                        <span className="font-body-md text-body-md text-on-surface">
                          Electronic Target Cloud Scoring
                        </span>
                      </div>
                      <span className="font-telemetry-sm text-telemetry-sm text-outline">+$5.00</span>
                    </label>
                  </div>
                </div>

                {/* Safety & Waiver */}
                <div className="flex flex-col gap-space-xs pt-space-xs">
                  <span className="font-label-caps text-label-caps text-outline uppercase">
                    Safety &amp; RSO Compliance
                  </span>
                  <label className="flex items-start gap-space-sm bg-surface-container p-space-sm rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waiverSigned}
                      onChange={(e) => setWaiverSigned(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-primary rounded cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="font-headline-md text-body-sm font-semibold text-on-surface flex items-center gap-1">
                        <MaterialIcon name="verified" className="text-primary text-[16px]" />
                        Safety Briefing &amp; Waiver Signed
                      </span>
                      <span className="font-body-sm text-body-sm text-outline">
                        Digital waiver active until Oct 2026. Chamber flag inspect verified.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Total & CTA */}
                <div className="flex flex-col gap-space-md pt-space-md bg-surface-container-lowest p-space-md rounded-lg shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-outline uppercase">
                        Total Estimate Due
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Tax inclusive • {intakeMode === "WALKIN" ? "Walk-in rate" : "Member pricing"}
                      </span>
                    </div>
                    <span className="font-telemetry-lg text-telemetry-lg text-primary font-bold">
                      ${totalEstimate.toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleGenerateBooking}
                    className="w-full py-space-md bg-primary-container hover:bg-primary text-on-primary-container rounded-lg font-headline-md text-headline-md font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-space-sm disabled:opacity-60"
                  >
                    <MaterialIcon name="how_to_reg" className="text-[20px]" />
                    <span>{isSubmitting ? "Assigning..." : "Assign Lane & Generate Booking"}</span>
                  </button>

                  {bookingBanner && (
                    <div className="p-3 bg-primary/15 border border-primary/40 text-primary rounded-lg flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <MaterialIcon name="check_circle" className="text-[18px] shrink-0" />
                        <span className="font-label-caps text-[11px] font-bold truncate">
                          {bookingBanner}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBookingBanner(null)}
                        className="text-on-surface-variant hover:text-on-surface shrink-0"
                        aria-label="Dismiss confirmation"
                      >
                        <MaterialIcon name="close" className="text-[16px]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pending Requests interactive list */}
            {requests.length > 0 && (
              <div className="bg-surface-container-low rounded-xl p-space-lg shadow-md flex flex-col mt-space-md">
                <div className="flex items-center gap-space-sm pb-space-sm border-b border-surface-container-high mb-space-sm">
                  <MaterialIcon name="assignment_ind" className="text-primary text-[20px]" />
                  <h3 className="font-headline-sm text-headline-sm uppercase tracking-wide text-on-surface font-bold">
                    Pending Requests ({pendingRequests.length})
                  </h3>
                </div>
                <div className="flex flex-col gap-space-sm max-h-[300px] overflow-y-auto">
                  {pendingRequests.map((req: any) => (
                    <div
                      key={req.id}
                      className="bg-surface-container p-space-sm rounded-lg flex items-center justify-between border border-transparent hover:border-primary-container transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-body-md text-on-surface font-semibold">{req.shooterName}</span>
                        <span className="font-body-sm text-outline">
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
                          className="p-1.5 rounded bg-error-container hover:bg-error text-on-error-container hover:text-on-error transition-colors"
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
                    <div className="text-center py-4 text-outline font-body-sm">
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
