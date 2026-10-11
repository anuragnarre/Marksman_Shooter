// apps/web/components/planning/CalendarSection.tsx
'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useIsMobile } from '../../lib/use-mobile';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin   from '@fullcalendar/daygrid';
import timeGridPlugin  from '@fullcalendar/timegrid';
import listPlugin      from '@fullcalendar/list';
import interactionPlugin, { type EventResizeDoneArg } from '@fullcalendar/interaction';
import type {
  EventClickArg,
  EventDropArg,
  DateSelectArg,
  EventInput,
  EventContentArg,
} from '@fullcalendar/core';
import { io, Socket } from 'socket.io-client';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../contexts/auth-context';
import type {
  TrainingEvent, User, EventType, RecurringType, ScheduleRequest, RequestStatus,
} from '@shooting-platform/shared-types';
import { EVENT_TYPE_META } from '@shooting-platform/shared-types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EventFormState {
  title: string; description: string; eventType: EventType;
  start: string; end: string; allDay: boolean;
  assigneeIds: string[]; recurringType: RecurringType; recurringUntil: string;
}
interface RequestFormState {
  suggestedStart: string; suggestedEnd: string;
  suggestedTitle: string; notes: string;
}

const BLANK_FORM: EventFormState = {
  title: '', description: '', eventType: 'SESSION',
  start: '', end: '', allDay: false,
  assigneeIds: [], recurringType: 'none', recurringUntil: '',
};
const BLANK_REQ: RequestFormState = {
  suggestedStart: '', suggestedEnd: '', suggestedTitle: '', notes: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toLocal(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toIso(local: string) { return local ? new Date(local).toISOString() : ''; }

function eventColor(type: EventType, custom?: string | null) {
  return custom ?? EVENT_TYPE_META[type]?.color ?? '#F5A623';
}
function toFCEvent(ev: TrainingEvent): EventInput {
  const col = eventColor(ev.eventType, ev.color);
  return {
    id: ev.id, title: ev.title,
    start: ev.start as string, end: ev.end as string, allDay: ev.allDay,
    backgroundColor: col + 'CC', borderColor: col, textColor: 'var(--text-primary)',
    extendedProps: ev,
  };
}
function fmtDate(iso: string | Date | null | undefined) {
  if (!iso) return '—';
  return new Date(iso as string).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}
function fmtTime(iso: string | Date | null | undefined) {
  if (!iso) return '';
  return new Date(iso as string).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const STATUS_META: Record<RequestStatus, { label: string; color: string; bg: string }> = {
  PENDING:  { label: 'Pending',  color: '#F5A623', bg: 'rgba(245,166,35,0.12)'  },
  APPROVED: { label: 'Approved', color: '#00E5A0', bg: 'rgba(0,229,160,0.12)'   },
  REJECTED: { label: 'Rejected', color: '#FF4D6D', bg: 'rgba(255,77,109,0.12)'  },
};

// ── Main Section ─────────────────────────────────────────────────────────────

export default function CalendarSection() {
  const { user } = useAuth();
  const isCoach = user?.role === 'COACH';
  return (
    <>
      {isCoach ? <CoachCalendar /> : <ShooterCalendar />}
    </>
  );
}

// ── Coach Calendar ─────────────────────────────────────────────────────────────

function CoachCalendar() {
  const { user } = useAuth();
  const isMobile = useIsMobile(768);
  const calRef = useRef<FullCalendar>(null);
  const calendarConfig = useMemo(() => ({
    initialView: isMobile ? 'listWeek' : 'dayGridMonth',
    headerToolbar: isMobile
      ? { left: 'prev,next', center: 'title', right: 'listWeek,dayGridMonth' }
      : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' },
  }), [isMobile]);
  const [events,        setEvents]        = useState<TrainingEvent[]>([]);
  const [shooters,      setShooters]      = useState<User[]>([]);
  const [requests,      setRequests]      = useState<ScheduleRequest[]>([]);
  const [pendingCount,  setPendingCount]  = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [modal,         setModal]         = useState<'create' | 'edit' | null>(null);
  const [showRequests,  setShowRequests]  = useState(false);
  const [selected,      setSelected]      = useState<TrainingEvent | null>(null);
  const [form,          setForm]          = useState<EventFormState>(BLANK_FORM);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [range, setRange] = useState(() => {
    const s = new Date(); s.setDate(1);
    const e = new Date(s); e.setMonth(e.getMonth() + 3);
    return { start: s.toISOString(), end: e.toISOString() };
  });

  const fetchEvents = useCallback(async () => {
    try {
      const data = await apiFetch<TrainingEvent[]>(
        `/calendar/events?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`
      );
      setEvents(data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [range]);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await apiFetch<ScheduleRequest[]>('/schedule-requests');
      setRequests(data);
      setPendingCount(data.filter(r => r.status === 'PENDING').length);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchRequests();
    apiFetch<User[]>('/calendar/shooters').then(setShooters).catch(() => {});
  }, [fetchEvents, fetchRequests]);

  // WebSocket — receive new request notifications
  useEffect(() => {
    if (!user?.id) return;
    const socket: Socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001');
    socket.emit('joinUserRoom', user.id);
    socket.on('schedule.request.created', () => {
      fetchRequests();
      setPendingCount(c => c + 1);
    });
    return () => { socket.disconnect(); };
  }, [user?.id, fetchRequests]);

  function openCreate(startStr?: string, endStr?: string) {
    const now = startStr ? new Date(startStr) : new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    setForm({ ...BLANK_FORM, start: toLocal(now.toISOString()), end: toLocal(end.toISOString()) });
    setSelected(null); setModal('create'); setError(null);
  }
  function openEdit(ev: TrainingEvent) {
    setForm({
      title: ev.title, description: ev.description ?? '', eventType: ev.eventType,
      start: toLocal(ev.start as string), end: toLocal(ev.end as string), allDay: ev.allDay,
      assigneeIds: ev.assignees?.map(a => a.shooterId) ?? [],
      recurringType: 'none', recurringUntil: '',
    });
    setSelected(ev); setModal('edit'); setError(null);
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError(null);
    try {
      const body = {
        title: form.title, description: form.description || undefined,
        eventType: form.eventType, start: toIso(form.start), end: toIso(form.end),
        allDay: form.allDay, assigneeIds: form.assigneeIds,
        recurringType:  modal === 'create' ? form.recurringType : undefined,
        recurringUntil: modal === 'create' && form.recurringType !== 'none' ? toIso(form.recurringUntil) : undefined,
      };
      if (modal === 'create') {
        await apiFetch('/calendar/events', { method: 'POST', body: JSON.stringify(body) });
      } else if (selected) {
        await apiFetch(`/calendar/events/${selected.id}`, { method: 'PUT', body: JSON.stringify(body) });
      }
      setModal(null); fetchEvents();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to save');
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      if (selected.recurringGroupId) {
        const all = confirm('Delete all events in this series?\nOK = all series  Cancel = just this one');
        if (all) await apiFetch(`/calendar/events/recurring/${selected.recurringGroupId}`, { method: 'DELETE' });
        else     await apiFetch(`/calendar/events/${selected.id}`, { method: 'DELETE' });
      } else {
        await apiFetch(`/calendar/events/${selected.id}`, { method: 'DELETE' });
      }
      setModal(null); fetchEvents();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally { setSaving(false); }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleDrop(arg: any) {
    const ev = arg.event.extendedProps as TrainingEvent;
    const dur = new Date(ev.end as string).getTime() - new Date(ev.start as string).getTime();
    const ns = arg.event.start!;
    await apiFetch(`/calendar/events/${ev.id}`, {
      method: 'PUT',
      body: JSON.stringify({ start: ns.toISOString(), end: new Date(ns.getTime() + dur).toISOString() }),
    });
    fetchEvents();
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleResize(arg: any) {
    const ev = arg.event.extendedProps as TrainingEvent;
    await apiFetch(`/calendar/events/${ev.id}`, {
      method: 'PUT',
      body: JSON.stringify({ start: arg.event.start!.toISOString(), end: arg.event.end!.toISOString() }),
    });
    fetchEvents();
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Training Calendar</h1>
          <p className="text-text-muted text-sm mt-0.5">Plan and manage training schedules for your shooters</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:gap-3">
          {/* Requests badge button */}
          <button
            onClick={() => setShowRequests(true)}
            className="relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-semibold transition-all hover:opacity-80 min-h-[44px]"
            style={{ color: pendingCount > 0 ? '#F5A623' : 'var(--text-muted)', background: pendingCount > 0 ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${pendingCount > 0 ? 'rgba(245,166,35,0.3)' : 'rgba(255,255,255,0.08)'}` }}
          >
            <InboxIcon />
            Change Requests
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center"
                style={{ background: '#FF4D6D', color: '#fff', boxShadow: '0 0 8px rgba(255,77,109,0.6)' }}>
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => openCreate()}
            className="btn-primary flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-display font-semibold rounded-xl min-h-[44px]"
          >
            <span className="text-lg leading-none">+</span> New Event
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 animate-fade-in overflow-x-auto pb-1">
        {(Object.entries(EVENT_TYPE_META) as [EventType, typeof EVENT_TYPE_META[EventType]][]).map(([type, meta]) => (
          <span key={type} className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-display uppercase tracking-wide px-3 py-1 rounded-full"
            style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.color}30` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
            {meta.label}
          </span>
        ))}
      </div>

      {/* Calendar */}
      <div className="card p-0 overflow-hidden animate-fade-in" style={{ minHeight: 'min(600px, calc(100vh - 180px))' }}>
        <style>{FULLCALENDAR_CSS}</style>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-t-[#F5A623] border-border-subtle rounded-full animate-spin" />
          </div>
        ) : (
          <FullCalendar
            key={calendarConfig.initialView}
            ref={calRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView={calendarConfig.initialView}
            headerToolbar={calendarConfig.headerToolbar}
            events={events.map(toFCEvent)}
            editable selectable selectMirror dayMaxEvents={3} nowIndicator height="auto"
            select={(arg: DateSelectArg) => openCreate(arg.startStr, arg.endStr)}
            eventClick={(arg: EventClickArg) => openEdit(arg.event.extendedProps as TrainingEvent)}
            eventDrop={handleDrop}
            eventResize={handleResize}
            datesSet={(arg) =>
              setRange((prev) =>
                prev.start === arg.startStr && prev.end === arg.endStr
                  ? prev
                  : { start: arg.startStr, end: arg.endStr }
              )
            }
            eventContent={(arg: EventContentArg) => <EventPill info={arg} />}
          />
        )}
      </div>

      {/* Modals */}
      {modal && (
        <EventModal mode={modal} form={form} setForm={setForm} shooters={shooters}
          saving={saving} error={error} onSave={handleSave}
          onDelete={modal === 'edit' ? handleDelete : undefined} onClose={() => setModal(null)} />
      )}
      {showRequests && (
        <RequestsPanel requests={requests} onClose={() => setShowRequests(false)}
          onRefresh={fetchRequests} onEventRefresh={fetchEvents} />
      )}
    </div>
  );
}

// ── Shooter Calendar ───────────────────────────────────────────────────────────

function ShooterCalendar() {
  const { user } = useAuth();
  const isMobile = useIsMobile(768);
  const canManageOwnItems = user?.role === 'SHOOTER';
  const calendarConfig = useMemo(() => ({
    initialView: isMobile ? 'listWeek' : 'dayGridMonth',
    headerToolbar: isMobile
      ? { left: 'prev,next', center: 'title', right: 'listWeek,dayGridMonth' }
      : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' },
  }), [isMobile]);
  const [events,      setEvents]      = useState<TrainingEvent[]>([]);
  const [requests,    setRequests]    = useState<ScheduleRequest[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [detail,      setDetail]      = useState<TrainingEvent | null>(null);
  const [reqModal,    setReqModal]    = useState<TrainingEvent | null>(null);
  const [itemModal,   setItemModal]   = useState<'create' | 'edit' | null>(null);
  const [itemTarget,  setItemTarget]  = useState<TrainingEvent | null>(null);
  const [itemForm,    setItemForm]    = useState<EventFormState>(BLANK_FORM);
  const [itemSaving,  setItemSaving]  = useState(false);
  const [itemError,   setItemError]   = useState<string | null>(null);
  const [range, setRange] = useState(() => {
    const s = new Date(); s.setDate(1);
    const e = new Date(s); e.setMonth(e.getMonth() + 3);
    return { start: s.toISOString(), end: e.toISOString() };
  });

  const isOwnItem = useCallback((ev: TrainingEvent) => {
    return Boolean(user?.id && ev.coachId === user.id);
  }, [user?.id]);

  const fetchAll = useCallback(async () => {
    try {
      const [eventsResult, requestsResult] = await Promise.allSettled([
        apiFetch<TrainingEvent[]>(
          `/calendar/events?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`
        ),
        apiFetch<ScheduleRequest[]>('/schedule-requests'),
      ]);
      if (eventsResult.status === 'fulfilled') {
        setEvents(eventsResult.value);
      } else {
        setEvents([]);
      }
      if (requestsResult.status === 'fulfilled') {
        setRequests(requestsResult.value);
      } else {
        setRequests([]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // WebSocket — get notified when coach resolves a request
  useEffect(() => {
    if (!user?.id) return;
    const socket: Socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001');
    socket.emit('joinUserRoom', user.id);
    socket.on('schedule.request.resolved', () => {
      apiFetch<ScheduleRequest[]>('/schedule-requests').then(setRequests).catch(() => {});
    });
    return () => { socket.disconnect(); };
  }, [user?.id]);

  const upcoming = [...events]
    .filter(ev => new Date(ev.start as string) >= new Date())
    .sort((a, b) => new Date(a.start as string).getTime() - new Date(b.start as string).getTime())
    .slice(0, 8);

  const pendingReqs = requests.filter(r => r.status === 'PENDING');
  const ownItemsCount = events.filter(isOwnItem).length;

  function openItemCreate(startStr?: string, endStr?: string) {
    if (!canManageOwnItems) return;
    const startDate = startStr ? new Date(startStr) : new Date();
    const endDate = endStr ? new Date(endStr) : new Date(startDate.getTime() + 60 * 60 * 1000);
    setItemForm({
      ...BLANK_FORM,
      title: '',
      eventType: 'TASK',
      start: toLocal(startDate.toISOString()),
      end: toLocal(endDate.toISOString()),
    });
    setItemTarget(null);
    setItemError(null);
    setItemModal('create');
  }

  function openItemEdit(ev: TrainingEvent) {
    if (!canManageOwnItems || !isOwnItem(ev)) return;
    setItemForm({
      ...BLANK_FORM,
      title: ev.title,
      description: ev.description ?? '',
      eventType: ev.eventType,
      start: toLocal(ev.start as string),
      end: toLocal(ev.end as string),
      allDay: ev.allDay,
    });
    setItemTarget(ev);
    setItemError(null);
    setItemModal('edit');
  }

  async function saveOwnItem() {
    if (!itemForm.title.trim()) {
      setItemError('Title is required');
      return;
    }
    const startIso = toIso(itemForm.start);
    let endIso = toIso(itemForm.end);
    if (itemForm.allDay && startIso && endIso && new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      const nextDay = new Date(startIso);
      nextDay.setDate(nextDay.getDate() + 1);
      endIso = nextDay.toISOString();
    }
    if (!startIso || !endIso || new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setItemError('End time must be after start time');
      return;
    }
    setItemSaving(true);
    setItemError(null);
    try {
      const body = {
        title: itemForm.title.trim(),
        description: itemForm.description || undefined,
        eventType: itemForm.eventType,
        start: startIso,
        end: endIso,
        allDay: itemForm.allDay,
      };
      if (itemModal === 'create') {
        await apiFetch('/calendar/events', { method: 'POST', body: JSON.stringify(body) });
      } else if (itemTarget) {
        await apiFetch(`/calendar/events/${itemTarget.id}`, { method: 'PUT', body: JSON.stringify(body) });
      }
      setItemModal(null);
      fetchAll();
    } catch (e: unknown) {
      setItemError(e instanceof Error ? e.message : 'Failed to save item');
    } finally {
      setItemSaving(false);
    }
  }

  async function deleteOwnItem() {
    if (!itemTarget) return;
    setItemSaving(true);
    setItemError(null);
    try {
      await apiFetch(`/calendar/events/${itemTarget.id}`, { method: 'DELETE' });
      setItemModal(null);
      fetchAll();
    } catch (e: unknown) {
      setItemError(e instanceof Error ? e.message : 'Failed to delete item');
    } finally {
      setItemSaving(false);
    }
  }

  async function handleOwnDrop(arg: EventDropArg) {
    const ev = arg.event.extendedProps as TrainingEvent;
    if (!canManageOwnItems || !isOwnItem(ev)) {
      arg.revert();
      return;
    }

    const originalStart = new Date(ev.start as string).getTime();
    const originalEnd = ev.end ? new Date(ev.end as string).getTime() : originalStart + 60 * 60 * 1000;
    const duration = Math.max(15 * 60 * 1000, originalEnd - originalStart);
    const newStart = arg.event.start ?? new Date();
    const newEnd = arg.event.end ?? new Date(newStart.getTime() + duration);

    try {
      await apiFetch(`/calendar/events/${ev.id}`, {
        method: 'PUT',
        body: JSON.stringify({ start: newStart.toISOString(), end: newEnd.toISOString() }),
      });
      fetchAll();
    } catch {
      arg.revert();
    }
  }

  async function handleOwnResize(arg: EventResizeDoneArg) {
    const ev = arg.event.extendedProps as TrainingEvent;
    if (!canManageOwnItems || !isOwnItem(ev)) {
      arg.revert();
      return;
    }
    if (!arg.event.start || !arg.event.end) {
      arg.revert();
      return;
    }
    try {
      await apiFetch(`/calendar/events/${ev.id}`, {
        method: 'PUT',
        body: JSON.stringify({ start: arg.event.start.toISOString(), end: arg.event.end.toISOString() }),
      });
      fetchAll();
    } catch {
      arg.revert();
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between animate-slide-up">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>My Schedule</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {canManageOwnItems
              ? 'View coach sessions and manage your personal training tasks in one place'
              : 'Track upcoming assigned sessions and schedule updates in one place'}
          </p>
        </div>
        {canManageOwnItems && (
          <button
            onClick={() => openItemCreate()}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-display font-semibold rounded-xl min-h-[44px]"
          >
            <span className="text-lg leading-none">+</span> Add Training Item
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Calendar */}
        <div className="xl:col-span-2 card p-0 overflow-hidden animate-fade-in">
          <style>{FULLCALENDAR_CSS}</style>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-t-[#F5A623] border-border-subtle rounded-full animate-spin" />
            </div>
          ) : (
            <FullCalendar
              key={calendarConfig.initialView}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView={calendarConfig.initialView}
              headerToolbar={calendarConfig.headerToolbar}
              events={events.map(toFCEvent)}
              editable={canManageOwnItems}
              selectable={canManageOwnItems}
              selectMirror={canManageOwnItems}
              dayMaxEvents={3} height="auto"
              select={(arg: DateSelectArg) => openItemCreate(arg.startStr, arg.endStr)}
              eventClick={(arg: EventClickArg) => {
                const ev = arg.event.extendedProps as TrainingEvent;
                if (isOwnItem(ev)) {
                  openItemEdit(ev);
                  return;
                }
                setDetail(ev);
              }}
              eventDrop={handleOwnDrop}
              eventResize={handleOwnResize}
              datesSet={(arg) =>
                setRange((prev) =>
                  prev.start === arg.startStr && prev.end === arg.endStr
                    ? prev
                    : { start: arg.startStr, end: arg.endStr }
                )
              }
              eventContent={(arg: EventContentArg) => <EventPill info={arg} />}
            />
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-3 sm:space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>

          {canManageOwnItems && (
            <div className="rounded-xl p-3 sm:p-4" style={{ background: 'rgba(79,195,247,0.07)', border: '1px solid rgba(79,195,247,0.22)' }}>
              <p className="text-xs uppercase tracking-widest font-display font-bold" style={{ color: '#4FC3F7' }}>My Training Items</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                You have <span className="font-display font-bold text-[#4FC3F7]">{ownItemsCount}</span> personal item{ownItemsCount === 1 ? '' : 's'} in this view.
              </p>
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                Tap a day on the calendar to quickly add tasks, activities, or reminders.
              </p>
            </div>
          )}

          {/* Pending requests badge */}
          {pendingReqs.length > 0 && (
            <div className="rounded-xl p-3 flex items-center gap-2 animate-fade-in"
              style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)' }}>
              <span style={{ color: '#F5A623' }}>⏳</span>
              <p className="text-sm font-display" style={{ color: '#F5A623' }}>
                {pendingReqs.length} change request{pendingReqs.length > 1 ? 's' : ''} awaiting coach review
              </p>
            </div>
          )}

          {/* Upcoming events */}
          <div>
            <h2 className="font-display font-bold text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Upcoming Sessions
            </h2>
            {upcoming.length === 0 ? (
              <div className="card p-8 flex flex-col items-center text-center">
                <p className="text-text-primary font-display font-bold">No upcoming sessions</p>
                <p className="text-text-muted text-sm mt-1">Your coach hasn't scheduled any sessions yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((ev, i) => {
                  const req = requests.find(r => r.eventId === ev.id);
                  const ownItem = isOwnItem(ev);
                  return (
                    <UpcomingCard key={ev.id} ev={ev} request={req} delay={i * 50}
                      canRequestChange={!ownItem}
                      isSelfManaged={ownItem}
                      onClick={() => (ownItem ? openItemEdit(ev) : setDetail(ev))}
                      onRequestChange={() => setReqModal(ev)} />
                  );
                })}
              </div>
            )}
          </div>

          {/* My requests history */}
          {requests.length > 0 && (
            <div>
              <h2 className="font-display font-bold text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                My Change Requests
              </h2>
              <div className="space-y-2">
                {requests.slice(0, 5).map(req => (
                  <RequestStatusCard key={req.id} req={req} onCancel={() =>
                    apiFetch(`/schedule-requests/${req.id}`, { method: 'DELETE' })
                      .then(fetchAll).catch(() => {})
                  } />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {detail && (
        <EventDetailModal ev={detail} onClose={() => setDetail(null)}
          onRequestChange={() => { setReqModal(detail); setDetail(null); }}
          existingRequest={requests.find(r => r.eventId === detail.id)} />
      )}
      {reqModal && (
        <RequestChangeModal ev={reqModal} onClose={() => setReqModal(null)}
          onSuccess={() => { setReqModal(null); fetchAll(); }} />
      )}
      {itemModal && (
        <SelfEventModal
          mode={itemModal}
          form={itemForm}
          setForm={setItemForm}
          saving={itemSaving}
          error={itemError}
          onSave={saveOwnItem}
          onDelete={itemModal === 'edit' ? deleteOwnItem : undefined}
          onClose={() => setItemModal(null)}
        />
      )}
    </div>
  );
}

// ── Upcoming Event Card (Shooter) ─────────────────────────────────────────────

function UpcomingCard({ ev, request, delay, canRequestChange, isSelfManaged, onClick, onRequestChange }:
  { ev: TrainingEvent; request?: ScheduleRequest; delay: number; canRequestChange: boolean; isSelfManaged: boolean; onClick: () => void; onRequestChange: () => void }) {
  const meta  = EVENT_TYPE_META[ev.eventType] ?? EVENT_TYPE_META.SESSION;
  const start = new Date(ev.start as string);
  const dayStr  = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = ev.allDay ? 'All day' : fmtTime(ev.start as string);
  const canRequest = canRequestChange && (!request || request.status === 'REJECTED');

  return (
    <div className="card p-4 animate-slide-up" style={{ animationDelay: `${delay}ms`, borderLeft: `3px solid ${meta.color}` }}>
      <button onClick={onClick} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{ev.title}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{dayStr} · {timeStr}</p>
          </div>
          <span className="shrink-0 text-[10px] font-display uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
        </div>
      </button>

      {/* Request status chip or button */}
      <div className="mt-2 flex items-center gap-2">
        {isSelfManaged && (
          <span className="inline-flex items-center gap-1 text-[10px] font-display uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ color: '#4FC3F7', background: 'rgba(79,195,247,0.12)' }}>
            My item
          </span>
        )}
        {request && request.status !== 'REJECTED' ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-display uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ color: STATUS_META[request.status].color, background: STATUS_META[request.status].bg }}>
            ● {STATUS_META[request.status].label}
          </span>
        ) : canRequest ? (
          <button onClick={(e) => { e.stopPropagation(); onRequestChange(); }}
            className="text-[11px] font-display font-semibold px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
            style={{ color: '#4FC3F7', background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.2)' }}>
            Request Change
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ── Request Status Card (Shooter) ─────────────────────────────────────────────

function RequestStatusCard({ req, onCancel }: { req: ScheduleRequest; onCancel: () => void }) {
  const sm = STATUS_META[req.status];
  return (
    <div className="card p-3 animate-fade-in" style={{ borderLeft: `3px solid ${sm.color}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {req.event?.title ?? 'Event'}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Requested {new Date(req.createdAt as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-display uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{ color: sm.color, background: sm.bg }}>{sm.label}</span>
      </div>
      {req.coachNote && (
        <p className="mt-2 text-xs italic" style={{ color: 'var(--text-muted)' }}>"{req.coachNote}"</p>
      )}
      {req.status === 'PENDING' && (
        <button onClick={onCancel}
          className="mt-2 text-[10px] font-display font-semibold transition-all hover:opacity-80"
          style={{ color: '#FF4D6D' }}>
          Cancel request
        </button>
      )}
    </div>
  );
}

// ── Event Detail Modal (Shooter) ───────────────────────────────────────────────

function EventDetailModal({ ev, onClose, onRequestChange, existingRequest }:
  { ev: TrainingEvent; onClose: () => void; onRequestChange: () => void; existingRequest?: ScheduleRequest }) {
  const meta  = EVENT_TYPE_META[ev.eventType] ?? EVENT_TYPE_META.SESSION;
  const start = new Date(ev.start as string);
  const end   = new Date(ev.end as string);
  const canRequest = !existingRequest || existingRequest.status === 'REJECTED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl p-6 animate-slide-up"
        style={{ background: 'var(--bg-surface)', border: `1px solid ${meta.color}30`, boxShadow: `0 0 40px ${meta.color}20` }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-[10px] font-display uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</span>
            <h2 className="font-display font-bold text-lg mt-1" style={{ color: 'var(--text-primary)' }}>{ev.title}</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors text-xl leading-none">&times;</button>
        </div>

        <div className="space-y-3 text-sm mb-5">
          <InfoRow label="Date" value={start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />
          {!ev.allDay && <InfoRow label="Time" value={`${fmtTime(ev.start as string)} – ${fmtTime(ev.end as string)}`} />}
          {ev.description && <InfoRow label="Notes" value={ev.description} />}
        </div>

        {/* Existing request status */}
        {existingRequest && existingRequest.status !== 'REJECTED' && (
          <div className="mb-4 p-3 rounded-xl" style={{ background: STATUS_META[existingRequest.status].bg, border: `1px solid ${STATUS_META[existingRequest.status].color}30` }}>
            <p className="text-sm font-display font-semibold" style={{ color: STATUS_META[existingRequest.status].color }}>
              Change request {existingRequest.status.toLowerCase()}
            </p>
            {existingRequest.coachNote && (
              <p className="text-xs mt-1 italic" style={{ color: 'var(--text-secondary)' }}>"{existingRequest.coachNote}"</p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          {canRequest && (
            <button onClick={onRequestChange}
              className="flex-1 py-2.5 text-sm font-display font-semibold rounded-xl transition-all hover:opacity-80"
              style={{ color: '#4FC3F7', background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.25)' }}>
              Request Change
            </button>
          )}
          <button onClick={onClose} className="flex-1 btn-primary py-2.5 text-sm font-display font-semibold rounded-xl">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-display mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p style={{ color: 'var(--text-secondary)' }}>{value}</p>
    </div>
  );
}

// ── Request Change Modal (Shooter) ────────────────────────────────────────────

function RequestChangeModal({ ev, onClose, onSuccess }:
  { ev: TrainingEvent; onClose: () => void; onSuccess: () => void }) {
  const [form,   setForm]   = useState<RequestFormState>({ ...BLANK_REQ, suggestedTitle: ev.title });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const f = (k: keyof RequestFormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit() {
    if (!form.notes.trim()) { setError('Please provide a reason for the change request'); return; }
    setSaving(true); setError(null);
    try {
      await apiFetch('/schedule-requests', {
        method: 'POST',
        body: JSON.stringify({
          eventId:        ev.id,
          coachId:        ev.coachId ?? (ev as TrainingEvent & { coachId: string }).coachId,
          suggestedStart: form.suggestedStart ? toIso(form.suggestedStart) : undefined,
          suggestedEnd:   form.suggestedEnd   ? toIso(form.suggestedEnd)   : undefined,
          suggestedTitle: form.suggestedTitle && form.suggestedTitle !== ev.title ? form.suggestedTitle : undefined,
          notes:          form.notes,
        }),
      });
      onSuccess();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to submit request');
    } finally { setSaving(false); }
  }

  const meta = EVENT_TYPE_META[ev.eventType] ?? EVENT_TYPE_META.SESSION;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl animate-slide-up"
        style={{ background: 'var(--bg-surface)', border: '1px solid rgba(79,195,247,0.15)', boxShadow: '0 -20px 60px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#2A3350]" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-display uppercase tracking-widest" style={{ color: '#4FC3F7' }}>Request Change</p>
              <h2 className="font-display font-bold text-base mt-0.5" style={{ color: 'var(--text-primary)' }}>{ev.title}</h2>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-subtle transition-all">✕</button>
          </div>
          {/* Current event info */}
          <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: meta.color }}>●</span>
            <span>{fmtDate(ev.start as string)}</span>
            {!ev.allDay && <span>→ {fmtTime(ev.end as string)}</span>}
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', color: '#FF4D6D' }}>
              {error}
            </div>
          )}

          {/* Suggested title */}
          <div>
            <label className="label block mb-1.5">Suggest Different Activity (optional)</label>
            <input className="field w-full" placeholder="Leave blank to keep current activity"
              value={form.suggestedTitle} onChange={e => f('suggestedTitle', e.target.value)} />
          </div>

          {/* Suggested time */}
          <div>
            <label className="label block mb-1.5">Suggest New Date & Time (optional)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-display uppercase tracking-widest mb-1 block" style={{ color: 'var(--text-muted)' }}>Start</label>
                <input type="datetime-local" className="field w-full text-sm"
                  value={form.suggestedStart} onChange={e => f('suggestedStart', e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-display uppercase tracking-widest mb-1 block" style={{ color: 'var(--text-muted)' }}>End</label>
                <input type="datetime-local" className="field w-full text-sm"
                  value={form.suggestedEnd} onChange={e => f('suggestedEnd', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Reason — required */}
          <div>
            <label className="label block mb-1.5">Reason / Notes <span style={{ color: '#FF4D6D' }}>*</span></label>
            <textarea className="field w-full resize-none" rows={3}
              placeholder="Explain why you need this change (e.g. conflict, injury, travel)..."
              value={form.notes} onChange={e => f('notes', e.target.value)} />
          </div>

          <p className="text-[11px]" style={{ color: 'var(--bg-subtle)' }}>
            Your coach will be notified and can approve, reject, or modify the schedule.
          </p>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-border-subtle">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-display font-semibold rounded-xl"
            style={{ color: 'var(--text-muted)', background: 'var(--chip-bg)', border: '1px solid var(--glass-border)' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 text-sm font-display font-semibold rounded-xl transition-all hover:opacity-90"
            style={{ background: 'rgba(79,195,247,0.15)', color: '#4FC3F7', border: '1px solid rgba(79,195,247,0.3)' }}>
            {saving ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-3 h-3 border-2 border-t-transparent border-[#4FC3F7] rounded-full animate-spin" />
                Submitting…
              </span>
            ) : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Requests Panel (Coach) ────────────────────────────────────────────────────

function RequestsPanel({ requests, onClose, onRefresh, onEventRefresh }:
  { requests: ScheduleRequest[]; onClose: () => void; onRefresh: () => void; onEventRefresh: () => void }) {
  const [filter,     setFilter]     = useState<RequestStatus | 'ALL'>('ALL');
  const [resolving,  setResolving]  = useState<string | null>(null);
  const [coachNote,  setCoachNote]  = useState('');
  const [applyChg,   setApplyChg]   = useState(true);
  const [activeReq,  setActiveReq]  = useState<ScheduleRequest | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);
  const counts = {
    ALL:      requests.length,
    PENDING:  requests.filter(r => r.status === 'PENDING').length,
    APPROVED: requests.filter(r => r.status === 'APPROVED').length,
    REJECTED: requests.filter(r => r.status === 'REJECTED').length,
  };

  async function resolve(requestId: string, status: 'APPROVED' | 'REJECTED') {
    setSaving(true); setError(null);
    try {
      await apiFetch(`/schedule-requests/${requestId}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ status, coachNote: coachNote.trim() || undefined, applyChanges: applyChg }),
      });
      setResolving(null); setCoachNote(''); setApplyChg(true); setActiveReq(null);
      onRefresh(); onEventRefresh();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to resolve');
    } finally { setSaving(false); }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col animate-slide-up"
        style={{ background: 'var(--bg-void)', borderLeft: '1px solid rgba(245,166,35,0.12)', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-border-subtle flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Change Requests</h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Review schedule change requests from shooters</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-subtle transition-all text-lg">✕</button>
        </div>

        {/* Filter tabs */}
        <div className="px-6 py-3 border-b border-border-subtle flex gap-2 shrink-0 overflow-x-auto">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(f => {
            const active = filter === f;
            const color  = f === 'ALL' ? 'var(--text-primary)' : STATUS_META[f as RequestStatus].color;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-display font-bold uppercase tracking-wide transition-all"
                style={{
                  color:      active ? (f === 'ALL' ? 'var(--bg-void)' : color) : 'var(--text-muted)',
                  background: active ? (f === 'ALL' ? 'var(--text-primary)' : `${color}20`) : 'rgba(255,255,255,0.03)',
                  border:     `1px solid ${active ? (f === 'ALL' ? 'var(--text-primary)' : `${color}40`) : 'rgba(255,255,255,0.06)'}`,
                }}>
                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()} ({counts[f]})
              </button>
            );
          })}
        </div>

        {/* Request list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {error && (
            <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', color: '#FF4D6D' }}>
              {error}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ background: 'var(--chip-bg)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <InboxIcon />
              </div>
              <p className="font-display font-bold" style={{ color: 'var(--text-muted)' }}>No requests</p>
            </div>
          ) : (
            filtered.map(req => (
              <RequestCard key={req.id} req={req}
                isExpanded={activeReq?.id === req.id}
                isResolving={resolving === req.id}
                coachNote={coachNote} setCoachNote={setCoachNote}
                applyChg={applyChg} setApplyChg={setApplyChg}
                saving={saving}
                onExpand={() => { setActiveReq(activeReq?.id === req.id ? null : req); setResolving(null); setCoachNote(''); setApplyChg(true); }}
                onStartResolve={(id) => { setResolving(id); setError(null); }}
                onApprove={() => resolve(req.id, 'APPROVED')}
                onReject={()  => resolve(req.id, 'REJECTED')}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ── Individual Request Card (Coach Panel) ─────────────────────────────────────

interface RequestCardProps {
  req: ScheduleRequest;
  isExpanded: boolean;
  isResolving: boolean;
  coachNote: string; setCoachNote: (v: string) => void;
  applyChg: boolean; setApplyChg: (v: boolean) => void;
  saving: boolean;
  onExpand: () => void;
  onStartResolve: (id: string) => void;
  onApprove: () => void;
  onReject: () => void;
}

function RequestCard({ req, isExpanded, isResolving, coachNote, setCoachNote, applyChg, setApplyChg, saving, onExpand, onStartResolve, onApprove, onReject }: RequestCardProps) {
  const sm = STATUS_META[req.status];
  const hasChanges = req.suggestedStart || req.suggestedEnd || req.suggestedTitle;

  return (
    <div className="rounded-xl overflow-hidden animate-fade-in transition-all"
      style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${isExpanded ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.06)'}` }}>

      {/* Card header — always visible */}
      <button className="w-full px-4 py-3 text-left" onClick={onExpand}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-display font-black"
            style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>
            {req.shooter?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {req.shooter?.name ?? 'Shooter'}
              </p>
              <span className="shrink-0 text-[10px] font-display uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={{ color: sm.color, background: sm.bg }}>{sm.label}</span>
            </div>
            <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {req.event?.title ?? 'Event'} · {new Date(req.createdAt as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border-subtle">

          {/* Current event */}
          <div className="pt-3">
            <p className="text-[10px] font-display uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Current Schedule</p>
            <p className="text-sm font-display font-semibold" style={{ color: 'var(--text-primary)' }}>{req.event?.title}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{fmtDate(req.event?.start as string)}</p>
          </div>

          {/* Suggested changes */}
          {hasChanges && (
            <div className="p-3 rounded-xl" style={{ background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.15)' }}>
              <p className="text-[10px] font-display uppercase tracking-widest mb-2" style={{ color: '#4FC3F7' }}>Suggested Changes</p>
              {req.suggestedTitle && (
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span style={{ color: 'var(--text-muted)' }}>Activity:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{req.suggestedTitle}</span>
                </div>
              )}
              {req.suggestedStart && (
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span style={{ color: 'var(--text-muted)' }}>Start:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{fmtDate(req.suggestedStart as string)}</span>
                </div>
              )}
              {req.suggestedEnd && (
                <div className="flex items-center gap-2 text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>End:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{fmtDate(req.suggestedEnd as string)}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {req.notes && (
            <div>
              <p className="text-[10px] font-display uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Reason</p>
              <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>"{req.notes}"</p>
            </div>
          )}

          {/* Coach response for resolved */}
          {req.status !== 'PENDING' ? (
            req.coachNote && (
              <div className="p-3 rounded-xl" style={{ background: `${sm.color}10`, border: `1px solid ${sm.color}25` }}>
                <p className="text-[10px] font-display uppercase tracking-widest mb-1" style={{ color: sm.color }}>Your Response</p>
                <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>"{req.coachNote}"</p>
              </div>
            )
          ) : (
            /* Resolve UI */
            isResolving ? (
              <div className="space-y-3">
                <div>
                  <label className="label block mb-1.5">Note to Shooter (optional)</label>
                  <textarea className="field w-full resize-none text-sm" rows={2}
                    placeholder="Explain your decision..."
                    value={coachNote} onChange={e => setCoachNote(e.target.value)} />
                </div>
                {hasChanges && (
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div onClick={() => setApplyChg(!applyChg)}
                      className="w-9 h-5 rounded-full transition-all relative shrink-0"
                      style={{ background: applyChg ? '#00E5A0' : 'var(--bg-subtle)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                        style={{ left: applyChg ? '20px' : '2px', background: applyChg ? 'var(--bg-void)' : 'var(--text-muted)' }} />
                    </div>
                    <span className="text-sm font-display" style={{ color: 'var(--text-secondary)' }}>Apply shooter's suggested changes</span>
                  </label>
                )}
                <div className="flex gap-2">
                  <button onClick={onReject} disabled={saving}
                    className="flex-1 py-2.5 text-sm font-display font-semibold rounded-xl transition-all hover:opacity-80"
                    style={{ color: '#FF4D6D', background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.25)' }}>
                    {saving ? '…' : 'Reject'}
                  </button>
                  <button onClick={onApprove} disabled={saving}
                    className="flex-1 py-2.5 text-sm font-display font-semibold rounded-xl transition-all hover:opacity-80"
                    style={{ color: '#00E5A0', background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.25)' }}>
                    {saving ? '…' : 'Approve'}
                  </button>
                </div>
                <button onClick={() => onStartResolve('')}
                  className="w-full text-[11px] font-display" style={{ color: 'var(--text-muted)' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => onStartResolve(req.id)}
                className="w-full py-2 text-sm font-display font-semibold rounded-xl transition-all hover:opacity-80"
                style={{ color: '#F5A623', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)' }}>
                Review Request
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── Self Event Modal (Shooter) ───────────────────────────────────────────────

interface SelfEventModalProps {
  mode: 'create' | 'edit';
  form: EventFormState;
  setForm: React.Dispatch<React.SetStateAction<EventFormState>>;
  saving: boolean;
  error: string | null;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

function SelfEventModal({ mode, form, setForm, saving, error, onSave, onDelete, onClose }: SelfEventModalProps) {
  const f = (k: keyof EventFormState, v: unknown) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl animate-slide-up"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid rgba(79,195,247,0.2)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#2A3350]" />
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            {mode === 'create' ? 'Add Training Item' : 'Edit Training Item'}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-subtle transition-all"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', color: '#FF4D6D' }}>
              {error}
            </div>
          )}
          <div>
            <label className="label block mb-1.5">Title *</label>
            <input
              className="field w-full"
              placeholder="e.g. Breathing drill, dry fire, stretch routine"
              value={form.title}
              onChange={(e) => f('title', e.target.value)}
            />
          </div>
          <div>
            <label className="label block mb-1.5">Type</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(EVENT_TYPE_META) as EventType[]).map((type) => {
                const meta = EVENT_TYPE_META[type];
                const active = form.eventType === type;
                return (
                  <button
                    key={type}
                    onClick={() => f('eventType', type)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-display uppercase tracking-wide transition-all min-h-[36px]"
                    style={{
                      color: active ? meta.color : 'var(--text-muted)',
                      background: active ? meta.bg : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? `${meta.color}50` : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label block mb-1.5">Start</label>
              <input
                type={form.allDay ? 'date' : 'datetime-local'}
                className="field w-full"
                value={form.allDay ? form.start.slice(0, 10) : form.start}
                onChange={(e) => f('start', e.target.value)}
              />
            </div>
            <div>
              <label className="label block mb-1.5">End</label>
              <input
                type={form.allDay ? 'date' : 'datetime-local'}
                className="field w-full"
                value={form.allDay ? form.end.slice(0, 10) : form.end}
                onChange={(e) => f('end', e.target.value)}
              />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => f('allDay', !form.allDay)}
              className="w-10 h-5 rounded-full transition-all relative"
              style={{ background: form.allDay ? '#4FC3F7' : 'var(--bg-subtle)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                style={{ left: form.allDay ? '22px' : '2px', background: form.allDay ? 'var(--bg-void)' : 'var(--text-muted)' }}
              />
            </div>
            <span className="text-sm font-display" style={{ color: 'var(--text-secondary)' }}>All day</span>
          </label>
          <div>
            <label className="label block mb-1.5">Notes (optional)</label>
            <textarea
              className="field w-full resize-none"
              rows={3}
              placeholder="Focus points, checklists, equipment prep..."
              value={form.description}
              onChange={(e) => f('description', e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-t border-border-subtle">
          {onDelete && (
            <button
              onClick={onDelete}
              disabled={saving}
              className="px-4 py-2.5 text-sm font-display font-semibold rounded-xl transition-all hover:opacity-80 min-h-[42px]"
              style={{ color: '#FF4D6D', background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.25)' }}
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2.5 text-sm font-display font-semibold rounded-xl min-h-[42px]"
            style={{ color: 'var(--text-muted)', background: 'var(--chip-bg)', border: '1px solid var(--glass-border)' }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="btn-primary px-5 py-2.5 text-sm font-display font-semibold rounded-xl min-w-[120px] min-h-[42px]"
          >
            {saving ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-3 h-3 border-2 border-t-transparent border-[#060810] rounded-full animate-spin" />
                Saving...
              </span>
            ) : mode === 'create' ? 'Create Item' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Event Modal (Coach: Create / Edit) ────────────────────────────────────────

interface EventModalProps {
  mode: 'create' | 'edit'; form: EventFormState;
  setForm: React.Dispatch<React.SetStateAction<EventFormState>>;
  shooters: User[]; saving: boolean; error: string | null;
  onSave: () => void; onDelete?: () => void; onClose: () => void;
}
function EventModal({ mode, form, setForm, shooters, saving, error, onSave, onDelete, onClose }: EventModalProps) {
  const f = (k: keyof EventFormState, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const toggleAssignee = (id: string) =>
    setForm(p => ({ ...p, assigneeIds: p.assigneeIds.includes(id) ? p.assigneeIds.filter(x => x !== id) : [...p.assigneeIds, id] }));
  const RECURRING: { value: RecurringType; label: string }[] = [
    { value: 'none', label: 'Does not repeat' }, { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' }, { value: 'biweekly', label: 'Every 2 weeks' },
    { value: 'monthly', label: 'Monthly' },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl animate-slide-up"
        style={{ background: 'var(--bg-surface)', border: '1px solid rgba(245,166,35,0.12)', boxShadow: '0 -20px 60px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}>
        <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-[#2A3350]" /></div>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            {mode === 'create' ? 'New Training Event' : 'Edit Event'}
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-subtle transition-all">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', color: '#FF4D6D' }}>{error}</div>}
          <div>
            <label className="label block mb-1.5">Event Title *</label>
            <input className="field w-full" placeholder="e.g. Prone position drill" value={form.title} onChange={e => f('title', e.target.value)} />
          </div>
          <div>
            <label className="label block mb-1.5">Type</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(EVENT_TYPE_META) as EventType[]).map(type => {
                const meta = EVENT_TYPE_META[type]; const active = form.eventType === type;
                return (
                  <button key={type} onClick={() => f('eventType', type)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-display uppercase tracking-wide transition-all"
                    style={{ color: active ? meta.color : 'var(--text-muted)', background: active ? meta.bg : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? meta.color+'50' : 'rgba(255,255,255,0.06)'}` }}>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label block mb-1.5">Start</label>
              <input type={form.allDay ? 'date' : 'datetime-local'} className="field w-full"
                value={form.allDay ? form.start.slice(0,10) : form.start} onChange={e => f('start', e.target.value)} />
            </div>
            <div>
              <label className="label block mb-1.5">End</label>
              <input type={form.allDay ? 'date' : 'datetime-local'} className="field w-full"
                value={form.allDay ? form.end.slice(0,10) : form.end} onChange={e => f('end', e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => f('allDay', !form.allDay)} className="w-10 h-5 rounded-full transition-all relative"
              style={{ background: form.allDay ? '#F5A623' : 'var(--bg-subtle)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                style={{ left: form.allDay ? '22px' : '2px', background: form.allDay ? 'var(--bg-void)' : 'var(--text-muted)' }} />
            </div>
            <span className="text-sm font-display" style={{ color: 'var(--text-secondary)' }}>All day event</span>
          </label>
          <div>
            <label className="label block mb-1.5">Notes (optional)</label>
            <textarea className="field w-full resize-none" rows={2} placeholder="Drill notes, goals..."
              value={form.description} onChange={e => f('description', e.target.value)} />
          </div>
          {shooters.length > 0 && (
            <div>
              <label className="label block mb-1.5">Assign to Shooters</label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {shooters.map(s => {
                  const assigned = form.assigneeIds.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => toggleAssignee(s.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left"
                      style={{ background: assigned ? 'rgba(245,166,35,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${assigned ? 'rgba(245,166,35,0.3)' : 'rgba(255,255,255,0.05)'}` }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-display font-bold shrink-0"
                        style={{ background: assigned ? 'rgba(245,166,35,0.2)' : 'var(--bg-subtle)', color: assigned ? '#F5A623' : 'var(--text-muted)' }}>
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-display font-semibold" style={{ color: assigned ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s.name}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.email}</p>
                      </div>
                      {assigned && <span className="ml-auto text-[#F5A623] text-sm">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {mode === 'create' && (
            <div>
              <label className="label block mb-1.5">Repeat</label>
              <select className="field w-full" value={form.recurringType} onChange={e => f('recurringType', e.target.value)}>
                {RECURRING.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {form.recurringType !== 'none' && (
                <div className="mt-2">
                  <label className="label block mb-1.5">Repeat until</label>
                  <input type="date" className="field w-full" value={form.recurringUntil} onChange={e => f('recurringUntil', e.target.value)} />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 px-6 py-4 border-t border-border-subtle">
          {onDelete && (
            <button onClick={onDelete} disabled={saving} className="px-4 py-2.5 text-sm font-display font-semibold rounded-xl transition-all hover:opacity-80"
              style={{ color: '#FF4D6D', background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.25)' }}>
              Delete
            </button>
          )}
          <button onClick={onClose} className="ml-auto px-4 py-2.5 text-sm font-display font-semibold rounded-xl"
            style={{ color: 'var(--text-muted)', background: 'var(--chip-bg)', border: '1px solid var(--glass-border)' }}>
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} className="btn-primary px-5 py-2.5 text-sm font-display font-semibold rounded-xl min-w-[100px]">
            {saving ? <span className="flex items-center gap-2 justify-center"><span className="w-3 h-3 border-2 border-t-transparent border-[#060810] rounded-full animate-spin" />Saving…</span>
              : mode === 'create' ? 'Create Event' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EventPill ─────────────────────────────────────────────────────────────────

function EventPill({ info }: { info: EventContentArg }) {
  const ev   = info.event.extendedProps as TrainingEvent;
  const meta = EVENT_TYPE_META[ev.eventType] ?? EVENT_TYPE_META.SESSION;
  return (
    <div className="truncate px-1.5 py-0.5 text-[11px] font-display font-semibold rounded" style={{ color: 'var(--text-primary)' }}>
      <span className="opacity-70 mr-1" style={{ color: meta.color }}>●</span>
      {info.event.title}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function InboxIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 10l2-7h9l2 7H1z" /><path d="M1 10h3l1 2h5l1-2h3" />
    </svg>
  );
}

// ── FullCalendar dark theme ───────────────────────────────────────────────────

const FULLCALENDAR_CSS = `
  .fc {
    --fc-border-color: var(--bg-subtle);
    --fc-button-bg-color: rgba(255,255,255,0.04);
    --fc-button-border-color: rgba(255,255,255,0.08);
    --fc-button-hover-bg-color: rgba(245,166,35,0.12);
    --fc-button-hover-border-color: rgba(245,166,35,0.3);
    --fc-button-active-bg-color: rgba(245,166,35,0.18);
    --fc-button-active-border-color: rgba(245,166,35,0.5);
    --fc-button-text-color: var(--text-secondary);
    --fc-today-bg-color: rgba(245,166,35,0.04);
    --fc-now-indicator-color: #F5A623;
    --fc-highlight-color: rgba(245,166,35,0.08);
    --fc-page-bg-color: transparent;
    --fc-neutral-bg-color: var(--bg-surface);
    --fc-list-event-hover-bg-color: rgba(245,166,35,0.06);
    font-family: 'Rajdhani', sans-serif;
  }
  .fc .fc-toolbar-title { font-size:1.1rem; font-weight:700; color:var(--text-primary); letter-spacing:0.02em; text-transform:uppercase; }
  .fc .fc-button { font-family:'Rajdhani',sans-serif; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; border-radius:8px!important; padding:5px 12px; transition:all 0.15s ease; }
  .fc .fc-button-primary:not(:disabled):hover,.fc .fc-button-primary:not(:disabled).fc-button-active { color:#F5A623!important; box-shadow:0 0 12px rgba(245,166,35,0.2); }
  .fc .fc-col-header-cell-cushion { color:var(--text-muted); font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; padding:8px 4px; text-decoration:none; }
  .fc .fc-daygrid-day-number { color:var(--text-secondary); font-size:12px; font-weight:600; padding:6px; text-decoration:none; }
  .fc .fc-day-today .fc-daygrid-day-number { color:#F5A623; font-weight:800; }
  .fc .fc-daygrid-day:hover { background:rgba(245,166,35,0.03); cursor:pointer; }
  .fc .fc-event { border-radius:5px; cursor:pointer; transition:all 0.15s ease; }
  .fc .fc-event:hover { filter:brightness(1.15); transform:translateY(-1px); }
  .fc .fc-timegrid-slot { height:2.5rem; border-color:var(--bg-subtle); }
  .fc .fc-timegrid-slot-label { color:var(--bg-subtle); font-size:10px; font-weight:600; letter-spacing:0.04em; }
  .fc .fc-list-event td { color:var(--text-secondary); }
  .fc .fc-list-event-title a { color:var(--text-primary); font-weight:600; text-decoration:none; }
  .fc .fc-list-day-cushion { background:var(--bg-subtle)!important; color:var(--text-muted)!important; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; }
  .fc .fc-list-empty { background:transparent; color:var(--text-muted); }
  .fc .fc-scroller { scrollbar-width:thin; scrollbar-color:var(--bg-subtle) transparent; }
  .fc .fc-more-link { color:#F5A623; font-size:11px; font-weight:700; }
  .fc .fc-popover { background:var(--bg-surface)!important; border:1px solid rgba(245,166,35,0.15)!important; border-radius:12px!important; box-shadow:0 16px 48px rgba(0,0,0,0.6)!important; }
  .fc .fc-popover-header { background:var(--bg-subtle)!important; color:var(--text-primary)!important; font-weight:700; border-radius:12px 12px 0 0; padding:8px 12px; }
  .fc .fc-popover-close { color:var(--text-muted); }
  .fc .fc-now-indicator-line { border-color:#F5A623; border-width:2px; }
  .fc .fc-now-indicator-arrow { border-top-color:#F5A623; border-bottom-color:#F5A623; }
  @media (max-width: 640px) {
    .fc .fc-toolbar {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      padding: 8px 8px 2px;
    }
    .fc .fc-toolbar-chunk {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 6px;
    }
    .fc .fc-toolbar-title {
      font-size: 0.9rem;
      text-align: center;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.15;
    }
    .fc .fc-button {
      min-height: 34px;
      padding: 4px 9px;
      font-size: 10px;
      letter-spacing: 0.05em;
    }
    .fc .fc-daygrid-day-number {
      font-size: 11px;
      padding: 4px;
    }
    .fc .fc-list-table td {
      padding-top: 8px;
      padding-bottom: 8px;
    }
    .fc .fc-event {
      min-height: 18px;
    }
  }
`;
