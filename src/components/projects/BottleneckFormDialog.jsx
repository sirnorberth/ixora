// BottleneckFormDialog.jsx — edit an existing bottleneck
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AlertOctagon } from 'lucide-react';
import { DEPARTMENTS } from '@/lib/constants';

const STATUSES = ['Open', 'Cleared'];

export default function BottleneckFormDialog({ open, onOpenChange, bottleneck, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    waiting_on: '',
    milestones_blocked: 0,
    status: 'Open',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && bottleneck) {
      setForm({
        title: bottleneck.title || '',
        description: bottleneck.description || '',
        waiting_on: bottleneck.waiting_on || '',
        milestones_blocked: bottleneck.milestones_blocked ?? 0,
        status: bottleneck.status || 'Open',
      });
      setError('');
    }
  }, [open, bottleneck]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (saving) return;
    if (!form.title.trim()) {
      setError('A title is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim() || null,
        waiting_on: form.waiting_on || null,
        milestones_blocked: Number(form.milestones_blocked) || 0,
        status: form.status,
      });
    } catch (e) {
      setError(e?.message || 'Could not save the changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-[#EA580C]" /> Update bottleneck
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="b-title">Title</Label>
            <Input
              id="b-title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Artwork approval waiting 4 days"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-desc">Description</Label>
            <Textarea
              id="b-desc"
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What exactly is blocked, and what would unblock it?"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Waiting on</Label>
            <Select value={form.waiting_on || undefined} onValueChange={(v) => set('waiting_on', v)}>
              <SelectTrigger><SelectValue placeholder="Which function?" /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="b-blocked">Milestones blocked</Label>
              <Input
                id="b-blocked"
                type="number"
                min="0"
                step="1"
                value={form.milestones_blocked}
                onChange={(e) => set('milestones_blocked', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-[11px] text-stone-400">
            Setting the status back to Open reopens a bottleneck cleared by mistake.
          </p>

          <div className="flex justify-end pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={saving || !form.title.trim()}
              className="bg-[#EA580C] hover:bg-[#c2410c]"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}