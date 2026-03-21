'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '../../../lib/api';
import { getStoredUser, isAuthenticated } from '../../../lib/auth';
import AdminEventForm from '../../../components/events/AdminEventForm';
import type { CompetitionEvent, CompetitionEventRegistration } from '@shooting-platform/shared-types';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

export default function AdminEventsPage() {
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState<'events' | 'registrations'>('events');
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<CompetitionEvent | null>(null);

  // Registrations tab
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState<CompetitionEventRegistration[]>([]);
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!isAuthenticated() || !user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setAuthorized(true);
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const data = await apiFetch<CompetitionEvent[]>('/events/admin/all');
      setEvents(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function loadRegistrations(eventId: string) {
    setRegLoading(true);
    try {
      const data = await apiFetch<CompetitionEventRegistration[]>(
        `/events/${eventId}/registrations`,
      );
      setRegistrations(data);
    } catch {
      setRegistrations([]);
    } finally {
      setRegLoading(false);
    }
  }

  async function handleCreate(data: any) {
    await apiFetch('/events', { method: 'POST', body: JSON.stringify(data) });
    setShowForm(false);
    await loadEvents();
  }

  async function handleUpdate(data: any) {
    if (!editEvent) return;
    await apiFetch(`/events/${editEvent.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setEditEvent(null);
    await loadEvents();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    await apiFetch(`/events/${id}`, { method: 'DELETE' });
    await loadEvents();
  }

  async function handleStatusToggle(event: CompetitionEvent) {
    const nextStatus = event.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT';
    await apiFetch(`/events/${event.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: nextStatus }),
    });
    await loadEvents();
  }

  function exportCsv() {
    if (!registrations.length) return;
    const header = 'Name,Email,Category,Payment Status,Registered At';
    const rows = registrations.map((r) =>
      [
        (r.user as any)?.name ?? '',
        (r.user as any)?.email ?? '',
        r.category?.name ?? 'General',
        r.paymentStatus,
        new Date(r.registeredAt).toLocaleString(),
      ].join(','),
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${selectedEventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!authorized && !loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold text-white">Access Denied</h2>
          <p className="text-sm text-[#8892A4]">
            You must be logged in as an admin to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5A623] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Events Admin</h1>
          {tab === 'events' && !showForm && !editEvent && (
            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-[#F5A623] px-4 py-2 text-sm font-semibold text-[#080A0F] transition-all hover:bg-[#F5A623]/90"
            >
              + Create Event
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-[#0E1118] p-1">
          {(['events', 'registrations'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                tab === t
                  ? 'bg-[#161B26] text-white'
                  : 'text-[#8892A4] hover:text-white'
              }`}
            >
              {t === 'events' ? 'Events' : 'Registrations'}
            </button>
          ))}
        </div>

        {/* Events Tab */}
        {tab === 'events' && (
          <>
            {(showForm || editEvent) ? (
              <div className="rounded-2xl border border-white/5 bg-[#0E1118] p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">
                  {editEvent ? 'Edit Event' : 'Create New Event'}
                </h2>
                <AdminEventForm
                  initial={editEvent}
                  onSubmit={editEvent ? handleUpdate : handleCreate}
                  onCancel={() => {
                    setShowForm(false);
                    setEditEvent(null);
                  }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-[#0E1118] py-16 text-center">
                    <p className="text-[#8892A4]">No events yet. Create your first event.</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-col gap-4 rounded-xl border border-white/5 bg-[#0E1118] p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="font-semibold text-white">{event.name}</h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              event.status === 'PUBLISHED'
                                ? 'bg-[#00E5A0]/15 text-[#00E5A0]'
                                : event.status === 'CANCELLED'
                                ? 'bg-[#FF4D6D]/15 text-[#FF4D6D]'
                                : 'bg-[#8892A4]/15 text-[#8892A4]'
                            }`}
                          >
                            {event.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-[#8892A4]">
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                          <span>{event.location}</span>
                          <span>{event._count?.registrations ?? 0} registered</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          onClick={() => handleStatusToggle(event)}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#8892A4] transition-all hover:bg-white/5"
                        >
                          {event.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => setEditEvent(event)}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#4FC3F7] transition-all hover:bg-[#4FC3F7]/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="rounded-lg border border-[#FF4D6D]/20 px-3 py-1.5 text-xs text-[#FF4D6D] transition-all hover:bg-[#FF4D6D]/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* Registrations Tab */}
        {tab === 'registrations' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  if (e.target.value) loadRegistrations(e.target.value);
                  else setRegistrations([]);
                }}
                className="flex-1 rounded-lg border border-white/10 bg-[#161B26] px-3 py-2.5 text-sm text-white outline-none focus:border-[#F5A623]/50"
              >
                <option value="">Select an event...</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              {registrations.length > 0 && (
                <button
                  onClick={exportCsv}
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-[#F5A623] transition-all hover:bg-[#F5A623]/10"
                >
                  Export CSV
                </button>
              )}
            </div>

            {regLoading ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#F5A623] border-t-transparent" />
              </div>
            ) : registrations.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0E1118]">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-[#8892A4]">
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Payment</th>
                      <th className="px-4 py-3 font-medium hidden sm:table-cell">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((r, i) => (
                      <tr key={r.id} className="border-b border-white/5">
                        <td className="px-4 py-3 text-[#8892A4]">{i + 1}</td>
                        <td className="px-4 py-3 text-white">
                          {(r.user as any)?.name ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-[#8892A4] hidden sm:table-cell">
                          {(r.user as any)?.email ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-[#8892A4]">
                          {r.category?.name ?? 'General'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-[#F5A623]/15 px-2 py-0.5 text-xs font-medium text-[#F5A623]">
                            {r.paymentStatus === 'COMING_SOON' ? 'Coming Soon' : r.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#8892A4] hidden sm:table-cell">
                          {new Date(r.registeredAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : selectedEventId ? (
              <div className="rounded-xl border border-white/5 bg-[#0E1118] py-10 text-center text-sm text-[#8892A4]">
                No registrations yet for this event.
              </div>
            ) : null}
          </div>
        )}
      </motion.div>
    </div>
  );
}
