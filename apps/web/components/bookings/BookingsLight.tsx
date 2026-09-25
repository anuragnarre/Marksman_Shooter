import React, { useState, useEffect } from "react";

export function BookingsLight({
  events = [],
  requests = [],
  isLoading = false,
  approveRequest,
  rejectRequest,
}: {
  events?: any[];
  requests?: any[];
  isLoading?: boolean;
  approveRequest?: (id: string) => void;
  rejectRequest?: (id: string) => void;
}) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0];

  return (
    <div className="flex flex-col w-full gap-space-lg h-full overflow-y-auto pb-10">
      <div className="flex flex-col w-full pb-16">
        {/* Operational Sub-Header Bar & Filter Palette */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-5 bg-surface-container-lowest px-2">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Selector Pill */}
            <div className="flex items-center bg-surface-container-low px-3.5 py-2 rounded">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant mr-2">
                calendar_month
              </span>
              <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                THU, 14 NOV 2025
              </span>
              <button className="ml-2.5 text-on-surface-variant hover:text-on-surface flex items-center">
                <span className="material-symbols-outlined text-[16px]">
                  expand_more
                </span>
              </button>
            </div>
            {/* Bay Selection Filter Pills */}
            <div className="flex items-center bg-surface-container-low p-1 rounded">
              <button className="px-3 py-1.5 rounded font-label-md text-label-md bg-primary text-on-primary font-semibold transition-all">
                ALL BAYS
              </button>
              <button className="px-3 py-1.5 rounded font-label-md text-label-md text-on-surface-variant hover:text-on-surface font-semibold transition-all">
                10M OLYMPIC HALL
              </button>
              <button className="px-3 py-1.5 rounded font-label-md text-label-md text-on-surface-variant hover:text-on-surface font-semibold transition-all">
                25M PRECISION BAY
              </button>
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
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-surface-container-low hover:bg-surface-container text-on-surface px-4 py-2 rounded font-label-md text-label-md uppercase tracking-wider font-semibold transition-colors">
              <span className="material-symbols-outlined text-[18px]">
                person_add
              </span>
              New Shooter Registration
            </button>
            <button className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-5 py-2 rounded font-label-md text-label-md uppercase tracking-wider font-bold transition-colors">
              <span className="material-symbols-outlined text-[18px]">
                add_circle
              </span>
              + Book Range Session
            </button>
          </div>
        </div>
        {/* Telemetry KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 my-6">
          {/* Card 1: Total Bookings */}
          <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Total Bookings Today
              </span>
              <span className="p-1.5 rounded bg-surface-container-low text-on-surface">
                <span className="material-symbols-outlined text-[18px]">
                  scoreboard
                </span>
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-3">
              <span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">
                28
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
                SESSIONS
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-3 bg-surface-container-low p-2 rounded">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Done
                </span>
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  18
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-tertiary-container">
                  Active
                </span>
                <span className="font-label-md text-label-md font-bold text-on-tertiary-container">
                  7
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-secondary">
                  Queue
                </span>
                <span className="font-label-md text-label-md font-bold text-secondary">
                  3
                </span>
              </div>
            </div>
          </div>
          {/* Card 2: Bay Occupancy */}
          <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Bay Occupancy
              </span>
              <span className="p-1.5 rounded bg-surface-container-low text-on-tertiary-container">
                <span className="material-symbols-outlined text-[18px]">
                  meeting_room
                </span>
              </span>
            </div>
            <div className="flex items-baseline gap-2 my-3">
              <span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">
                85%
              </span>
              <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold bg-surface-container-low px-2 py-0.5 rounded">
                High Load
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="w-full bg-surface-container-low h-2 rounded overflow-hidden">
                <div
                  className="bg-on-tertiary-container h-full rounded"
                  style={{ width: "85%" }}
                />
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Lanes 1-8 Full • 10m Air Hall At Peak
              </span>
            </div>
          </div>
          {/* Card 3: Air Fills Dispensed */}
          <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Air Fills Dispensed
              </span>
              <span className="p-1.5 rounded bg-surface-container-low text-on-surface">
                <span className="material-symbols-outlined text-[18px]">
                  compress
                </span>
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-3">
              <span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">
                14
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
                PCP CYLINDERS
              </span>
            </div>
            <div className="flex items-center justify-between bg-surface-container-low px-2.5 py-1.5 rounded">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Bauer Compressor
              </span>
              <span className="font-label-md text-label-md text-on-surface font-bold">
                300 BAR NOMINAL
              </span>
            </div>
          </div>
          {/* Card 4: Pending Check-ins */}
          <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Pending Check-Ins
              </span>
              <span className="p-1.5 rounded bg-error-container text-on-error-container">
                <span className="material-symbols-outlined text-[18px]">
                  assignment_ind
                </span>
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-3">
              <span className="font-telemetry-xl text-telemetry-xl text-error font-bold">
                {requests.filter((r: any) => r.status === 'PENDING').length}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
                AWAITING BAY
              </span>
            </div>
            <div className="flex items-center justify-between bg-surface-container-low px-2.5 py-1.5 rounded">
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                {requests.length > 0 ? requests[0].shooterName : 'None'}
              </span>
              <span className="font-label-sm text-label-sm font-bold text-secondary">
                UNPAID
              </span>
            </div>
          </div>
        </div>
        {/* Main Content Layout (65% Schedule Grid / 35% Quick Intake) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT 65% (8/12 Col): Interactive Bay & Lane Timeline Schedule */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded p-6 shadow-sm flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 gap-4">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold uppercase tracking-tight">
                  10M &amp; 25M Lane Matrix
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Live firing allocations across 8 Olympic specification
                  electronic lanes
                </p>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-primary-container" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    Member
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-on-tertiary-container" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    Walk-in
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-surface-tint" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    Junior Match
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-secondary-container" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    Target Roll Maint.
                  </span>
                </div>
              </div>
            </div>
            {/* Timeline Matrix Table Container */}
            <div className="overflow-x-auto w-full">
              <div className="min-w-[780px] flex flex-col">
                {/* Timeline Header (Hours) */}
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
                {/* Lane Rows */}
                <div className="flex flex-col gap-2 mt-2">
                  {isLoading ? (
                    <div className="text-center py-8 text-on-surface-variant font-label-caps">
                      Loading schedule...
                    </div>
                  ) : (
                    [1, 2, 3, 4, 5, 6, 7, 8].map((laneNum) => {
                      // Map dynamic events to grid columns
                      const laneEvents = events.filter(
                        (e: any) => e.laneId === `L-0${laneNum}`,
                      );
                      return (
                        <div
                          key={laneNum}
                          className={`grid grid-cols-10 items-center p-2 rounded transition-colors ${laneNum === 1 ? "bg-surface-container-low shadow-sm" : "bg-surface-container-lowest hover:bg-surface-container-low"}`}
                        >
                          <div className="flex items-center gap-2 pl-2">
                            <span
                              className={`font-label-md text-label-md font-bold ${laneNum === 1 ? "text-primary" : "text-on-surface"}`}
                            >
                              L0{laneNum}
                            </span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${laneNum === 1 ? "bg-primary animate-pulse w-2 h-2" : "bg-on-tertiary-container"}`}
                            />
                          </div>

                          {laneEvents.length === 0 ? (
                            <div className="col-span-9 bg-surface-container/50 text-on-surface-variant text-center py-2 rounded font-body-sm text-body-sm flex items-center justify-center border border-dashed border-outline-variant/30 h-12">
                              OPEN ALL DAY
                            </div>
                          ) : (
                            <div className="col-span-9 flex gap-1 items-center bg-surface-container/20 p-1 rounded h-12">
                                {laneEvents.map((event: any) => (
                                  <div 
                                    key={event.id}
                                    onClick={(e) => { e.stopPropagation(); setSelectedEventId(event.id); }}
                                    className={`px-3 py-1.5 rounded font-label-caps text-[0.7rem] font-semibold truncate border cursor-pointer transition-colors ${selectedEventId === event.id ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low'}`}
                                    title={`${event.shooterName} - ${event.startTime}-${event.endTime}`}
                                  >
                                    {event.shooterName} ({event.startTime})
                                  </div>
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
            {/* Live Block Inspector Modal / Detail Tray */}
            <div
              className="bg-surface-container-low p-5 rounded flex flex-col gap-4"
              id="sessionDetailBox"
            >
          <div className="flex items-center justify-between border-b border-surface pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-on-surface">
                center_focus_strong
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold uppercase">
                Selected Session Telemetry
              </span>
            </div>
            <span
              className="font-label-sm text-label-sm px-2.5 py-1 bg-surface-container rounded text-on-surface font-semibold tracking-wider"
              id="detailBadge"
            >
              CLICK ANY SCHEDULE BLOCK
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                SHOOTER / TEAM
              </span>
              <span
                className="font-label-lg text-label-lg text-on-surface font-bold mt-1"
                id="detailShooter"
              >
                {selectedEvent?.shooterName || 'Select a session'}
              </span>
              <span
                className="font-body-sm text-body-sm text-on-surface-variant"
                id="detailMemberId"
              >
                {selectedEvent ? `MEMBER ID: #${selectedEvent.id.slice(0, 8).toUpperCase()}` : 'N/A'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                AIRGUN SPECIFICATION
              </span>
              <span
                className="font-label-lg text-label-lg text-on-surface font-bold mt-1"
                id="detailGun"
              >
                {selectedEvent?.type || 'N/A'}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Caliber: {selectedEvent?.caliber || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                TIME &amp; LOCATION
              </span>
              <span
                className="font-label-lg text-label-lg text-on-surface font-bold mt-1"
                id="detailTime"
              >
                {selectedEvent ? `${selectedEvent.startTime} - ${selectedEvent.endTime} (${Math.round((new Date(`1970/01/01 ${selectedEvent.endTime}`).getTime() - new Date(`1970/01/01 ${selectedEvent.startTime}`).getTime()) / 60000)} min)` : '00:00 - 00:00'}
              </span>
              <span
                className="font-body-sm text-body-sm text-on-surface-variant"
                id="detailLocation"
              >
                {selectedEvent ? `Lane ${selectedEvent.laneId.split('-')[1]} - Olympic Target` : 'N/A'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                RSO &amp; WAIVER STATUS
              </span>
              <span
                className="font-label-lg text-label-lg text-on-surface font-bold mt-1"
                id="detailRso"
              >
                {selectedEvent ? 'C. Vance (RSO-1)' : 'N/A'}
              </span>
              <span
                className="font-label-sm text-label-sm text-on-tertiary-container font-semibold"
                id="detailWaiver"
              >
                VERIFIED (SIGNED)
              </span>
            </div>
          </div>
            </div>
          </div>
          {/* RIGHT 35% (4/12 Col): Quick Intake & New Shooter Registration Panel */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded p-6 shadow-sm flex flex-col">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">
              app_registration
            </span>
            <h3 className="font-headline-sm text-headline-sm uppercase tracking-wide text-on-surface font-bold">
              Quick Intake Form
            </h3>
          </div>
          <span className="font-label-sm text-label-sm bg-surface-container-low text-on-surface-variant px-2 py-1 rounded font-semibold">
            FAST-TRACK
          </span>
        </div>
        {/* Form Inputs Container */}
        <div className="flex flex-col gap-5 pt-2">
          {/* Toggle: Registered Member vs New Shooter */}
          <div className="flex items-center bg-surface-container-low p-1 rounded">
            <button
              className="flex-1 py-1.5 rounded font-label-md text-label-md bg-primary text-on-primary font-semibold transition-all"
              id="tabMember"
            >
              EXISTING MEMBER
            </button>
            <button
              className="flex-1 py-1.5 rounded font-label-md text-label-md text-on-surface-variant font-semibold hover:text-on-surface transition-all"
              id="tabNew"
            >
              NEW / WALK-IN
            </button>
          </div>
          {/* Shooter Name / Member Lookup */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Shooter Identification
            </label>
            <div className="relative flex items-center">
              <input
                className="w-full h-9 px-3 bg-surface-container-low rounded font-label-md text-label-md text-on-surface focus:outline-none focus:bg-surface-container"
                id="shooterInput"
                placeholder="Scan Badge or Enter Member ID..."
                type="text"
                defaultValue="M-7431 (Elena Rostov)"
              />
              <span className="absolute right-3 material-symbols-outlined text-[18px] text-on-surface-variant">
                badge
              </span>
            </div>
          </div>
          {/* Airgun Type / Serial */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Airgun Profile &amp; Caliber
            </label>
            <div className="relative flex items-center">
              <input
                className="w-full h-9 px-3 bg-surface-container-low rounded font-label-md text-label-md text-on-surface focus:outline-none focus:bg-surface-container"
                placeholder="e.g., Steyr Challenge .177 PCP"
                type="text"
                value="Steyr Challenge HFT 4.5mm"
              />
              <span className="absolute right-3 material-symbols-outlined text-[18px] text-on-surface-variant">
                sports_score
              </span>
            </div>
          </div>
          {/* Lane & Duration Selectors (2-Col Grid) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Assign Lane
              </label>
              <div className="relative">
                <select className="w-full h-9 px-2.5 bg-surface-container-low rounded font-label-md text-label-md text-on-surface appearance-none focus:outline-none focus:bg-surface-container">
                  <option>Lane 01 (10m Olympic)</option>
                  <option>Lane 02 (10m Olympic)</option>
                  <option>Lane 03 (25m Precision)</option>
                  <option>Lane 04 (10m Olympic)</option>
                  <option>Lane 05 (25m Precision)</option>
                  <option>Lane 06 (25m Olympic)</option>
                  <option>Lane 07 (25m Precision)</option>
                  <option>Lane 08 (Plinking Bay)</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-2 material-symbols-outlined text-[18px] text-on-surface-variant">
                  arrow_drop_down
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Duration Block
              </label>
              <div className="relative">
                <select
                  className="w-full h-9 px-2.5 bg-surface-container-low rounded font-label-md text-label-md text-on-surface appearance-none focus:outline-none focus:bg-surface-container"
                  id="durationSelect"
                >
                  <option value="15">30 Min Practice ($15)</option>
                  <option value="25">60 Min Session ($25)</option>
                  <option value="45">2-Hr Match Block ($45)</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-2 material-symbols-outlined text-[18px] text-on-surface-variant">
                  schedule
                </span>
              </div>
            </div>
          </div>
          {/* Add-On Range Services */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Add-On Facility Services
            </span>
            <div className="flex flex-col gap-2">
              {/* Addon 1: PCP Air Tank Fill */}
              <label className="flex items-center justify-between p-3 bg-surface-container-low rounded cursor-pointer hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    defaultChecked
                    className="w-4 h-4 rounded text-primary focus:ring-0"
                    id="addonAir"
                    type="checkbox"
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
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  +$8.00
                </span>
              </label>
              {/* Addon 2: Match Pellets */}
              <label className="flex items-center justify-between p-3 bg-surface-container-low rounded cursor-pointer hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    className="w-4 h-4 rounded text-primary focus:ring-0"
                    id="addonPellets"
                    type="checkbox"
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
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  +$15.00
                </span>
              </label>
              {/* Addon 3: Electronic Target Vision Scoring */}
              <label className="flex items-center justify-between p-3 bg-surface-container-low rounded cursor-pointer hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    defaultChecked
                    className="w-4 h-4 rounded text-primary focus:ring-0"
                    id="addonTarget"
                    type="checkbox"
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
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  +$5.00
                </span>
              </label>
            </div>
          </div>
          {/* Safety Waiver & Briefing Verification */}
          <div className="p-3.5 bg-surface-container-low rounded flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">
                  verified_user
                </span>
                RSO Safety Verification
              </span>
              <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">
                MANDATORY
              </span>
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer mt-1">
              <input
                defaultChecked
                className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-0"
                type="checkbox"
              />
              <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
                Safety Briefing &amp; Waiver Signed (Digital Verified). Eye
                protection inspected and PCP air tank hydro-test in-date.
              </span>
            </label>
          </div>
          {/* Session Price Total Bar */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                SESSION FEE ESTIMATE
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Tax included • Payable now
              </span>
            </div>
            <div className="text-right">
              <span
                className="font-telemetry-lg text-telemetry-lg font-bold text-on-surface"
                id="bookingTotal"
              >
                $38.00
              </span>
            </div>
          </div>
          {/* Primary Action Button */}
          <button className="w-full h-11 bg-primary hover:bg-primary-container text-on-primary rounded font-label-md text-label-md uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-[18px]">
              verified
            </span>
            Assign Lane &amp; Generate Booking
          </button>
          {/* Notification Banner Container */}
          <div
            className="hidden p-3 bg-surface-container-low text-on-tertiary-container rounded flex items-center justify-between"
            id="bookingBanner"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                check_circle
              </span>
              <span className="font-label-sm text-label-sm font-bold">
                LANE 01 ASSIGNED &amp; SCHEDULE COMMITTED
              </span>
            </div>
            <button className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-[16px]">
                close
              </span>
            </button>
          </div>
            </div>
          </div>

          {/* Pending Requests interactive list */}
          {requests.length > 0 && (
            <div className="bg-surface-container-lowest rounded p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 pb-4 border-b border-surface mb-4">
              <span className="material-symbols-outlined text-[20px] text-primary">
                assignment_ind
              </span>
              <h3 className="font-headline-sm text-headline-sm uppercase tracking-wide text-on-surface font-bold">
                Pending Requests ({requests.filter((r: any) => r.status === 'PENDING').length})
              </h3>
            </div>
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto">
              {requests.filter((r: any) => r.status === 'PENDING').map((req: any) => (
                <div key={req.id} className="bg-surface-container-low p-3 rounded flex items-center justify-between border border-transparent hover:border-primary-container transition-colors">
                  <div className="flex flex-col">
                    <span className="font-label-md text-on-surface font-semibold">{req.shooterName}</span>
                    <span className="font-body-sm text-on-surface-variant">{req.requestedDate} @ {req.requestedTime}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => rejectRequest && rejectRequest(req.id)}
                      className="p-1 rounded bg-error/10 hover:bg-error text-error hover:text-on-error transition-colors" 
                      title="Reject"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                    <button 
                      onClick={() => approveRequest && approveRequest(req.id)}
                      className="p-1 rounded bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary transition-colors" 
                      title="Approve"
                    >
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </button>
                  </div>
                </div>
              ))}
              {requests.filter((r: any) => r.status === 'PENDING').length === 0 && (
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
