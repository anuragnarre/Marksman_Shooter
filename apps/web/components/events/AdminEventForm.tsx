'use client';

import { useState } from 'react';
import type { CompetitionEvent } from '@shooting-platform/shared-types';

interface CategoryInput {
  name: string;
  fee: string;
  maxParticipants: string;
}

interface AdminEventFormProps {
  initial?: CompetitionEvent | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function AdminEventForm({ initial, onSubmit, onCancel }: AdminEventFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [date, setDate] = useState(
    initial?.date
      ? new Date(initial.date).toISOString().split('T')[0]
      : '',
  );
  const [time, setTime] = useState(initial?.time ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [registrationFee, setRegistrationFee] = useState(
    initial?.registrationFee?.toString() ?? '',
  );
  const [rules, setRules] = useState(initial?.rules ?? '');
  const [guidelines, setGuidelines] = useState(initial?.guidelines ?? '');
  const [maxParticipants, setMaxParticipants] = useState(
    initial?.maxParticipants?.toString() ?? '',
  );
  const [images, setImages] = useState(initial?.images?.join('\n') ?? '');
  const [videos, setVideos] = useState(initial?.videos?.join('\n') ?? '');
  const [categories, setCategories] = useState<CategoryInput[]>(
    initial?.categories?.map((c) => ({
      name: c.name,
      fee: c.fee?.toString() ?? '',
      maxParticipants: c.maxParticipants?.toString() ?? '',
    })) ?? [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addCategory() {
    setCategories([...categories, { name: '', fee: '', maxParticipants: '' }]);
  }

  function removeCategory(idx: number) {
    setCategories(categories.filter((_, i) => i !== idx));
  }

  function updateCategory(idx: number, field: keyof CategoryInput, value: string) {
    const updated = [...categories];
    updated[idx] = { ...updated[idx], [field]: value };
    setCategories(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload: any = {
      name,
      description: description || undefined,
      date: new Date(date).toISOString(),
      time,
      location,
      registrationFee: registrationFee ? Number(registrationFee) : undefined,
      rules: rules || undefined,
      guidelines: guidelines || undefined,
      maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
      images: images
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean),
      videos: videos
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean),
    };

    if (!initial && categories.length > 0) {
      payload.categories = categories
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name.trim(),
          fee: c.fee ? Number(c.fee) : undefined,
          maxParticipants: c.maxParticipants ? Number(c.maxParticipants) : undefined,
        }));
    }

    try {
      await onSubmit(payload);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save event');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-[#161B26] px-3 py-2.5 text-sm text-white outline-none focus:border-[#F5A623]/50 placeholder:text-[#8892A4]/50';
  const labelClass = 'mb-1.5 block text-sm font-medium text-[#8892A4]';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-[#FF4D6D]/20 bg-[#FF4D6D]/10 p-3 text-sm text-[#FF4D6D]">
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Event Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. State Shooting Championship 2026"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Time *</label>
          <input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="e.g. 9:00 AM - 5:00 PM"
            required
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Location *</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. National Shooting Range, Delhi"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Registration Fee (Rs.)</label>
          <input
            type="number"
            min="0"
            value={registrationFee}
            onChange={(e) => setRegistrationFee(e.target.value)}
            placeholder="Leave empty for free"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Max Participants</label>
          <input
            type="number"
            min="1"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
            placeholder="No limit"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Event description..."
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Rules</label>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            rows={3}
            placeholder="Competition rules..."
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Guidelines</label>
          <textarea
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
            rows={3}
            placeholder="Event guidelines..."
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Image URLs (one per line)</label>
          <textarea
            value={images}
            onChange={(e) => setImages(e.target.value)}
            rows={2}
            placeholder="https://example.com/image.jpg"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Video URLs (one per line)</label>
          <textarea
            value={videos}
            onChange={(e) => setVideos(e.target.value)}
            rows={2}
            placeholder="https://youtube.com/watch?v=..."
            className={inputClass}
          />
        </div>
      </div>

      {/* Categories */}
      {!initial && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className={labelClass}>Categories</label>
            <button
              type="button"
              onClick={addCategory}
              className="text-xs font-medium text-[#F5A623] hover:underline"
            >
              + Add Category
            </button>
          </div>
          {categories.map((cat, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input
                value={cat.name}
                onChange={(e) => updateCategory(i, 'name', e.target.value)}
                placeholder="Category name"
                className={`${inputClass} flex-1`}
              />
              <input
                type="number"
                value={cat.fee}
                onChange={(e) => updateCategory(i, 'fee', e.target.value)}
                placeholder="Fee"
                className={`${inputClass} w-24`}
              />
              <input
                type="number"
                value={cat.maxParticipants}
                onChange={(e) => updateCategory(i, 'maxParticipants', e.target.value)}
                placeholder="Max"
                className={`${inputClass} w-20`}
              />
              <button
                type="button"
                onClick={() => removeCategory(i)}
                className="rounded-lg px-2 text-[#FF4D6D] hover:bg-[#FF4D6D]/10"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#F5A623] px-6 py-2.5 text-sm font-semibold text-[#080A0F] transition-all hover:bg-[#F5A623]/90 disabled:opacity-50"
        >
          {loading ? 'Saving...' : initial ? 'Update Event' : 'Create Event'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-white/10 px-6 py-2.5 text-sm text-[#8892A4] transition-all hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
