// FlagBottleneck.jsx
import React, { useState } from 'react';
import { Flag, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DEPARTMENTS } from '@/lib/constants';

export default function FlagBottleneck({ onSubmit }) {
  const [title, setTitle] = useState('');
  const [waitingOn, setWaitingOn] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !waitingOn) return;
    setBusy(true);
    try {
      await onSubmit({ title: title.trim(), waiting_on: waitingOn });
      setTitle('');
      setWaitingOn('');
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <Flag className="w-4 h-4 text-[#EA580C]" />
        <h3 className="font-semibold text-stone-800">Flag a bottleneck</h3>
      </div>
      <form onSubmit={submit} className="space-y-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Artwork approval waiting 4 days"
          required
        />
        <Select value={waitingOn || undefined} onValueChange={setWaitingOn}>
          <SelectTrigger><SelectValue placeholder="Waiting on which function?" /></SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={busy} className="w-full bg-[#EA580C] hover:bg-[#c2410c]">
          <Send className="w-4 h-4 mr-1.5" /> Flag it
        </Button>
      </form>
      <p className="mt-2 text-[11px] text-stone-400">Anyone can flag — status describes the work, never the person.</p>
      {done && <p className="mt-2 text-xs text-emerald-700 font-medium">Bottleneck flagged — it's now visible on the project.</p>}
    </div>
  );
}