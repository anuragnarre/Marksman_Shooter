import React, { useState, useEffect } from "react";

export function BookingsDark({
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
      <div className="flex flex-col w-full gap-space-lg text-on-surface">
        {/* Operational Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl shadow-md">
          <div className="flex flex-wrap items-center gap-space-md">
            {/* Date Picker Trigger */}
            <div className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface shadow-sm cursor-pointer hover:bg-surface-bright transition-colors">
              <span className="material-symbols-outlined text-[18px] text-primary">
                calendar_today
              </span>
              <span className="font-telemetry-sm text-telemetry-sm tracking-wide">
                THU, 14 NOV 2025
              </span>
              <span className="material-symbols-outlined text-[16px] text-outline">
                arrow_drop_down
              </span>
            </div>
            {/* Bay Range Segment Selector */}
            <div className="flex items-center p-space-xs bg-surface-container rounded-lg gap-space-xs">
              <button
                className="px-space-md py-space-xs rounded font-label-caps text-label-caps uppercase bg-primary-container text-on-primary-container font-bold shadow-sm"
                type="button"
              >
                All Bays
              </button>
              <button
                className="px-space-md py-space-xs rounded font-label-caps text-label-caps uppercase text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                type="button"
              >
                10m Olympic Hall
              </button>
              <button
                className="px-space-md py-space-xs rounded font-label-caps text-label-caps uppercase text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                type="button"
              >
                25m Precision Bay
              </button>
            </div>
            <div className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-lowest">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              <span className="font-label-caps text-label-caps text-tertiary">
                LIVE TELEMETRY SYNCED
              </span>
            </div>
          </div>
          {/* Quick Action Triggers */}
          <div className="flex items-center gap-space-sm">
            <button
              className="flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-colors shadow-sm"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-tertiary">
                person_add
              </span>
              <span className="font-headline-md text-body-md font-semibold">
                New Shooter Reg
              </span>
            </button>
            <button
              className="flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-primary-container hover:bg-primary text-on-primary-container transition-all shadow-md active:scale-95 font-headline-md text-body-md font-bold"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                add_circle
              </span>
              <span>+ Book Range Session</span>
            </button>
          </div>
        </div>
        {/* Telemetry Summary KPI Grid (4 Compact Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {/* Card 1: Total Bookings */}
          <div className="relative overflow-hidden bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col justify-between h-[106px]">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                Total Bookings Today
              </span>
              <span className="material-symbols-outlined text-primary text-[18px]">
                sports_score
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-space-xs">
                <span className="font-telemetry-lg text-telemetry-lg text-on-surface">
                  28
                </span>
                <span className="font-label-caps text-label-caps text-outline">
                  SESSIONS
                </span>
              </div>
              <div className="flex items-center gap-space-xs font-telemetry-sm text-body-sm text-on-surface-variant">
                <span className="text-tertiary">18 Done</span>
                <span className="text-outline">/</span>
                <span className="text-primary font-bold">7 Act</span>
                <span className="text-outline">/</span>
                <span className="text-secondary">3 Q</span>
              </div>
            </div>
          </div>
          {/* Card 2: Bay Occupancy */}
          <div className="relative overflow-hidden bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col justify-between h-[106px]">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-tertiary" />
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                Bay Occupancy Rate
              </span>
              <span className="material-symbols-outlined text-tertiary text-[18px]">
                grid_view
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-space-xs">
                <span className="font-telemetry-lg text-telemetry-lg text-tertiary font-bold">
                  85%
                </span>
                <span className="font-label-caps text-label-caps text-secondary-fixed-dim uppercase">
                  High Load
                </span>
              </div>
              <div className="flex items-center gap-space-xs font-telemetry-sm text-body-sm text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
                <span>Lanes 1-8 Saturated</span>
              </div>
            </div>
          </div>
          {/* Card 3: PCP Air Fills */}
          <div className="relative overflow-hidden bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col justify-between h-[106px]">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-secondary" />
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                Air Dispensed (300 BAR)
              </span>
              <span className="material-symbols-outlined text-secondary text-[18px]">
                compress
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-space-xs">
                <span className="font-telemetry-lg text-telemetry-lg text-on-surface">
                  14
                </span>
                <span className="font-label-caps text-label-caps text-outline">
                  CYLINDERS
                </span>
              </div>
              <div className="font-telemetry-sm text-body-sm text-secondary-fixed-dim">
                <span>Compressor 310 Bar</span>
              </div>
            </div>
          </div>
          {/* Card 4: Pending Check-ins */}
          <div className="relative overflow-hidden bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col justify-between h-[106px]">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-error" />
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                Pending Range Intake
              </span>
              <span className="material-symbols-outlined text-error text-[18px]">
                pending_actions
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-space-xs">
                <span className="font-telemetry-lg text-telemetry-lg text-error font-bold">
                  {requests.filter((r: any) => r.status === 'PENDING').length < 10 ? '0' : ''}{requests.filter((r: any) => r.status === 'PENDING').length}
                </span>
                <span className="font-label-caps text-label-caps text-outline">
                  WAITLIST
                </span>
              </div>
              <div className="px-space-sm py-space-xs rounded bg-secondary-container text-on-secondary-container font-label-caps text-label-caps font-bold">
                {requests.length > 0 ? requests[0].shooterName : 'UNPAID / WAIVER DUE'}
              </div>
            </div>
          </div>
        </div>
        {/* Main 65% / 35% Tactical Operational Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
          {/* LEFT 65%: Bay & Lane Matrix Timeline Grid (xl:col-span-8) */}
          <div className="xl:col-span-8 flex flex-col gap-space-md">
            <div className="bg-surface-container-low rounded-xl p-space-lg shadow-md flex flex-col">
              {/* Matrix Subheader & Visual Legend */}
              <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-md">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    view_timeline
                  </span>
                  <span className="font-headline-lg text-headline-lg text-on-surface">
                    Lane Dispatch Schedule
                  </span>
                  <span className="font-label-caps text-label-caps px-space-sm py-0.5 rounded bg-surface-container-high text-outline">
                    10M MATCH DISCIPLINE
                  </span>
                </div>
                {/* Color-coded status legend */}
                <div className="flex items-center gap-space-md">
                  <div className="flex items-center gap-space-xs">
                    <div className="w-2.5 h-2.5 rounded-sm bg-primary-container" />
                    <span className="font-label-caps text-label-caps text-on-surface-variant">
                      Member (Live)
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <div className="w-2.5 h-2.5 rounded-sm bg-tertiary" />
                    <span className="font-label-caps text-label-caps text-on-surface-variant">
                      Walk-in
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <div className="w-2.5 h-2.5 rounded-sm bg-secondary-container" />
                    <span className="font-label-caps text-label-caps text-on-surface-variant">
                      Junior Match
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <div className="w-2.5 h-2.5 rounded-sm bg-surface-variant" />
                    <span className="font-label-caps text-label-caps text-on-surface-variant">
                      Paper Swap / Maint
                    </span>
                  </div>
                </div>
              </div>
              {/* Schedule Matrix Visual Container */}
              <div className="w-full overflow-x-auto">
                <div className="min-w-[700px] flex flex-col">
                  {/* Timeline Header (Hours 09:00 to 17:00) */}
                  <div className="grid grid-cols-9 gap-1 pb-space-xs text-center font-label-caps text-label-caps text-outline bg-surface-container-lowest py-space-xs px-space-sm rounded-lg">
                    <div className="text-left pl-space-xs font-bold text-on-surface">
                      LANE / BAY
                    </div>
                    <div>09:00</div>
                    <div>10:00</div>
                    <div>11:00</div>
                    <div>12:00</div>
                    <div>13:00</div>
                    <div>14:00</div>
                    <div>15:00</div>
                    <div>16:00</div>
                  </div>
                  {/* Lanes Rows L01 to L08 */}
                  <div className="flex flex-col gap-1.5 pt-space-xs">
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
                            className={`grid grid-cols-9 gap-1 items-center px-space-sm py-1 rounded transition-colors cursor-pointer ${laneNum === 1 ? "bg-surface-container shadow-sm ring-1 ring-primary/40" : "bg-surface-container-low hover:bg-surface-container"}`}
                          >
                            <div className="flex items-center justify-between pr-space-xs">
                              <span
                                className={`font-telemetry-sm text-telemetry-sm font-bold ${laneNum === 1 ? "text-primary" : "text-on-surface"}`}
                              >
                                L-0{laneNum}
                              </span>
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${laneNum === 1 ? "bg-primary animate-pulse w-2 h-2" : "bg-outline"}`}
                              />
                            </div>

                            {laneEvents.length === 0 ? (
                              <div className="col-span-8 bg-surface-container-lowest/60 text-outline text-center py-1.5 rounded font-label-caps text-[0.65rem] flex items-center justify-center">
                                OPEN ALL DAY
                              </div>
                            ) : (
                              <>
                                <div className="col-span-8 flex gap-1 items-center">
                                  {laneEvents.map((event: any) => (
                                    <div 
                                      key={event.id}
                                      onClick={(e) => { e.stopPropagation(); setSelectedEventId(event.id); }}
                                      className={`px-2 py-1.5 rounded font-label-caps text-[0.65rem] truncate border ${selectedEventId === event.id ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-container-lowest/60 border-transparent text-outline hover:bg-surface-container-highest'}`}
                                      title={`${event.shooterName} - ${event.startTime}-${event.endTime}`}
                                    >
                                      {event.shooterName} ({event.startTime})
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              </div>
            {/* Selected Session Telemetry Card (Active Session Details) */}
            {/* Selected Session Telemetry Card (Active Session Details) */}
            <div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="font-label-caps text-label-caps uppercase text-primary font-bold">
                    Active Selected Bay Telemetry
                  </span>
                  <span className="font-label-caps text-label-caps px-space-xs py-0.5 rounded bg-primary-container text-on-primary-container font-semibold">
                    {selectedEvent ? `LANE ${selectedEvent.laneId.split('-')[1]} ACTIVE` : 'NO SESSION SELECTED'}
                  </span>
                </div>
                <div className="flex items-center gap-space-xs text-tertiary font-label-caps text-label-caps">
                  <span className="material-symbols-outlined text-[16px]">
                    verified_user
                  </span>
                  <span>RSO VERIFIED • RANGE HOT</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md bg-surface-container p-space-md rounded-lg items-center">
                {/* Shooter & Membership */}
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-outline uppercase">
                    Shooter Identification
                  </span>
                  <span className="font-headline-md text-body-md font-bold text-on-surface">
                    {selectedEvent?.shooterName || 'Select a session'}
                  </span>
                  <span className="font-telemetry-sm text-body-sm text-tertiary">
                    {selectedEvent ? `MEMBER ID: #${selectedEvent.id.slice(0, 8).toUpperCase()}` : 'N/A'}
                  </span>
                </div>
                {/* Airgun Rifle Profile */}
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-outline uppercase">
                    Registered Profile
                  </span>
                  <span className="font-headline-md text-body-md font-bold text-on-surface">
                    {selectedEvent?.type || 'N/A'}
                  </span>
                  <span className="font-telemetry-sm text-body-sm text-on-surface-variant">
                    Caliber: {selectedEvent?.caliber || 'N/A'}
                  </span>
                </div>
                {/* Session Timing */}
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-outline uppercase">
                    Session Allocated Time
                  </span>
                  <span className="font-telemetry-sm text-headline-md font-bold text-on-surface">
                    {selectedEvent ? `${selectedEvent.startTime} - ${selectedEvent.endTime}` : '00:00 - 00:00'}
                  </span>
                  <span className="font-label-caps text-label-caps text-primary">
                    {selectedEvent ? `${Math.round((new Date(`1970/01/01 ${selectedEvent.endTime}`).getTime() - new Date(`1970/01/01 ${selectedEvent.startTime}`).getTime()) / 60000)} MIN` : 'N/A'}
                  </span>
                </div>
                {/* Target Telemetry Real-time */}
                <div className="flex flex-col justify-end items-end gap-space-xs">
                  <div className="flex items-center gap-space-xs bg-surface-container-high px-space-md py-space-xs rounded font-telemetry-sm text-body-sm">
                    <span className="text-outline">AIR RES:</span>
                    <span className="text-primary font-bold">198 BAR</span>
                    <span className="text-outline">| SCORING:</span>
                    <span className="text-tertiary font-bold">
                      104.8 / 109
                    </span>
                  </div>
                  <button
                    className="font-label-caps text-label-caps text-primary hover:text-on-surface transition-colors uppercase tracking-wider flex items-center gap-1"
                    type="button"
                  >
                    View Optical Target Cam{" "}
                    <span className="material-symbols-outlined text-[14px]">
                      open_in_new
                    </span>
                  </button>
                </div>
                </div>
              </div>
            </div>
            {/* RIGHT 35%: Quick Intake & Range Booking Form (xl:col-span-4) */}
            <div className="xl:col-span-4 flex flex-col gap-space-md">
              <div className="bg-surface-container-low rounded-xl p-space-lg shadow-md flex flex-col gap-space-md">
                {/* Header & Member Toggle */}
                <div className="flex flex-col gap-space-sm pb-space-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        assignment
                      </span>
                      <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                        Range Session Intake
                      </h2>
                    </div>
                    <span className="font-label-caps text-label-caps text-tertiary bg-surface-container px-space-xs py-0.5 rounded">
                      FAST DESK
                    </span>
                  </div>
                  {/* Segmented Toggle: Member vs Walk-in */}
                  <div className="grid grid-cols-2 gap-1 bg-surface-container-lowest p-1 rounded-lg">
                    <button
                      className="py-space-xs font-label-caps text-label-caps uppercase rounded bg-primary-container text-on-primary-container font-bold shadow-sm transition-all text-center"
                      id="btn-member"
                      type="button"
                    >
                      Existing Member
                    </button>
                    <button
                      className="py-space-xs font-label-caps text-label-caps uppercase rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all text-center"
                      id="btn-walkin"
                      type="button"
                    >
                      New / Walk-in
                    </button>
                  </div>
                </div>
                {/* Intake Form Fields */}
                <div className="flex flex-col gap-space-md">
                  {/* Shooter Member Search Field */}
                  <div className="flex flex-col gap-space-xs">
                    <label className="font-label-caps text-label-caps text-outline uppercase flex items-center justify-between">
                      <span>Shooter Lookup (ID / Name)</span>
                      <span className="text-tertiary">VERIFIED PASS</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-space-md text-outline text-[18px]">
                        search
                      </span>
                      <input
                        className="w-full bg-surface-container-high text-on-surface font-body-md text-body-md pl-10 pr-space-md py-space-sm rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                        type="text"
                        defaultValue="M-7431 (Elena Rostova)"
                      />
                      <button
                        className="absolute right-space-sm text-outline hover:text-on-surface"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          cancel
                        </span>
                      </button>
                    </div>
                  </div>
                  {/* Airgun Profile & Caliber */}
                  <div className="flex flex-col gap-space-xs">
                    <label className="font-label-caps text-label-caps text-outline uppercase">
                      Airgun Profile &amp; Caliber
                    </label>
                    <div className="relative">
                      <select className="w-full bg-surface-container-high text-on-surface font-body-md text-body-md px-space-md py-space-sm rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none font-medium">
                        <option>Steyr Challenge HFT • 4.5mm (.177)</option>
                        <option>Feinwerkbau 800 Universal • .177 Cal</option>
                        <option>Air Arms TX200 MKIII • .177 Spring</option>
                        <option>Range Loaner: Walther LG400 Club</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-space-md top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">
                        expand_more
                      </span>
                    </div>
                  </div>
                  {/* Lane and Duration Two-Column Setup */}
                  <div className="grid grid-cols-2 gap-space-md">
                    {/* Lane Selection */}
                    <div className="flex flex-col gap-space-xs">
                      <label className="font-label-caps text-label-caps text-outline uppercase">
                        Assigned Lane
                      </label>
                      <div className="relative">
                        <select className="w-full bg-surface-container-high text-on-surface font-telemetry-sm text-telemetry-sm px-space-md py-space-sm rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none">
                          <option>Lane 01 (10m Olympic)</option>
                          <option>Lane 02 (10m Olympic)</option>
                          <option>Lane 03 (10m Olympic)</option>
                          <option>Lane 04 (10m Open)</option>
                          <option>Lane 07 (25m Precision)</option>
                          <option>Lane 08 (25m Precision)</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-space-sm top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                          expand_more
                        </span>
                      </div>
                    </div>
                    {/* Duration Selection */}
                    <div className="flex flex-col gap-space-xs">
                      <label className="font-label-caps text-label-caps text-outline uppercase">
                        Session Duration
                      </label>
                      <div className="relative">
                        <select
                          className="w-full bg-surface-container-high text-on-surface font-telemetry-sm text-telemetry-sm px-space-md py-space-sm rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                          id="select-duration"
                        >
                          <option value="15">60 Min ($15.00)</option>
                          <option value="25">90 Min ($25.00)</option>
                          <option value="30">120 Min ($30.00)</option>
                          <option value="50">Half-Day Pass ($50.00)</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-space-sm top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
                          expand_more
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Add-on Facility Services */}
                  <div className="flex flex-col gap-space-xs pt-space-xs">
                    <span className="font-label-caps text-label-caps text-outline uppercase">
                      Facility Add-on Services
                    </span>
                    <div className="flex flex-col gap-space-xs bg-surface-container p-space-sm rounded-lg">
                      {/* Service 1 */}
                      <label className="flex items-center justify-between p-space-xs rounded hover:bg-surface-container-high transition-colors cursor-pointer">
                        <div className="flex items-center gap-space-sm">
                          <input
                            defaultChecked
                            className="rounded bg-surface-container-highest text-primary-container focus:ring-0 focus:outline-none w-4 h-4 cursor-pointer"
                            type="checkbox"
                          />
                          <span className="font-body-md text-body-md text-on-surface">
                            PCP Scuba Tank Refill (300 Bar)
                          </span>
                        </div>
                        <span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">
                          +$8.00
                        </span>
                      </label>
                      {/* Service 2 */}
                      <label className="flex items-center justify-between p-space-xs rounded hover:bg-surface-container-high transition-colors cursor-pointer">
                        <div className="flex items-center gap-space-sm">
                          <input
                            defaultChecked
                            className="rounded bg-surface-container-highest text-primary-container focus:ring-0 focus:outline-none w-4 h-4 cursor-pointer"
                            type="checkbox"
                          />
                          <span className="font-body-md text-body-md text-on-surface">
                            Match Pellet Tin (JSB Exact 500ct)
                          </span>
                        </div>
                        <span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">
                          +$15.00
                        </span>
                      </label>
                      {/* Service 3 */}
                      <label className="flex items-center justify-between p-space-xs rounded hover:bg-surface-container-high transition-colors cursor-pointer">
                        <div className="flex items-center gap-space-sm">
                          <input
                            className="rounded bg-surface-container-highest text-primary-container focus:ring-0 focus:outline-none w-4 h-4 cursor-pointer"
                            type="checkbox"
                          />
                          <span className="font-body-md text-body-md text-on-surface">
                            Electronic Target Cloud Scoring
                          </span>
                        </div>
                        <span className="font-telemetry-sm text-telemetry-sm text-outline">
                          +$5.00
                        </span>
                      </label>
                    </div>
                  </div>
                  {/* Safety & Digital Waiver Checklist */}
                  <div className="flex flex-col gap-space-xs pt-space-xs">
                    <span className="font-label-caps text-label-caps text-outline uppercase">
                      Safety &amp; RSO Compliance
                    </span>
                    <div className="flex items-start gap-space-sm bg-surface-container p-space-sm rounded-lg">
                      <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
                        verified
                      </span>
                      <div className="flex flex-col">
                        <span className="font-headline-md text-body-sm font-semibold text-on-surface">
                          Safety Briefing &amp; Waiver Signed
                        </span>
                        <span className="font-body-sm text-body-sm text-outline">
                          Digital waiver active until Oct 2026. Chamber flag
                          inspect verified.
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Total Calculation & CTA */}
                  <div className="flex flex-col gap-space-md pt-space-md bg-surface-container-lowest p-space-md rounded-lg shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-label-caps text-label-caps text-outline uppercase">
                          Total Estimate Due
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Tax inclusive • Member pricing
                        </span>
                      </div>
                      <span className="font-telemetry-lg text-telemetry-lg text-primary font-bold">
                        $38.00
                      </span>
                    </div>
                    <button
                      className="w-full py-space-md bg-primary-container hover:bg-primary text-on-primary-container rounded-lg font-headline-md text-headline-md font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-space-sm"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        how_to_reg
                      </span>
                      <span>Assign Lane &amp; Generate Booking</span>
                    </button>
                  </div>
                </div>
              </div>

            {/* Pending Requests interactive list */}
            {requests.length > 0 && (
              <div className="bg-surface-container-low rounded-xl p-space-lg shadow-md flex flex-col mt-space-md">
                <div className="flex items-center gap-space-sm pb-space-sm border-b border-surface-container-high mb-space-sm">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    assignment_ind
                  </span>
                  <h3 className="font-headline-sm text-headline-sm uppercase tracking-wide text-on-surface font-bold">
                    Pending Requests ({requests.filter((r: any) => r.status === 'PENDING').length})
                  </h3>
                </div>
                <div className="flex flex-col gap-space-sm max-h-[300px] overflow-y-auto">
                  {requests.filter((r: any) => r.status === 'PENDING').map((req: any) => (
                    <div key={req.id} className="bg-surface-container p-space-sm rounded-lg flex items-center justify-between border border-transparent hover:border-primary-container transition-colors">
                      <div className="flex flex-col">
                        <span className="font-body-md text-on-surface font-semibold">{req.shooterName}</span>
                        <span className="font-body-sm text-outline">{req.requestedDate} @ {req.requestedTime}</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => rejectRequest && rejectRequest(req.id)}
                          className="p-1 rounded bg-error-container hover:bg-error text-on-error-container hover:text-on-error transition-colors" 
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
