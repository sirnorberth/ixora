import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fmtDate, todayISODate } from '@/lib/dateUtils';

export default function ResistanceLogPanel({ logs, onAdd, onDelete }) {
  const [form, setForm] = useState({ quote: '', resolution: '', logged_date: todayISODate() });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.quote.trim() || saving) return;
    setSaving(true);
    try {
      await onAdd(form);
      setForm({ quote: '', resolution: '', logged_date: todayISODate() });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="rl-quote">Objection (verbatim)</Label>
          <Textarea
            id="rl-quote"
            rows={2}
            value={form.quote}
            onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
            placeholder="What was said, exactly"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rl-res">How it was resolved</Label>
          <Textarea
            id="rl-res"
            rows={2}
            value={form.resolution}
            onChange={(e) => setForm((f) => ({ ...f, resolution: e.target.value }))}
            placeholder="What turned it around"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rl-date">Date</Label>
          <Input
            id="rl-date"
            type="date"
            value={form.logged_date}
            onChange={(e) => setForm((f) => ({ ...f, logged_date: e.target.value }))}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={submit} disabled={!form.quote.trim() || saving} className="bg-[#EA580C] hover:bg-[#c2410c]">
            <Plus className="w-4 h-4" /> {saving ? 'Adding…' : 'Add entry'}
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {logs.length === 0 && <p className="text-sm text-stone-500">No entries yet.</p>}
        {logs.map((l) => (
          <div key={l.id} className="p-3 rounded-xl bg-stone-50 border border-stone-100">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-stone-500">{fmtDate(l.logged_date)}</div>
              <button onClick={() => onDelete(l.id)} className="text-stone-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-1 text-sm font-medium text-stone-800">“{l.quote}”</p>
            {l.resolution && <p className="mt-1 text-sm text-stone-600">{l.resolution}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}