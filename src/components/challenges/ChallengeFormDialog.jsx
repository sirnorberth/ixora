import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { SKILL_TAGS } from '@/lib/constants';

const TYPES = ['Revenue', 'Cost saving', 'Improves efficiency'];

export default function ChallengeFormDialog({ open, onOpenChange, currentUser, onSubmit, challenge = null }) {
  const isEdit = !!challenge;
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'Cost saving',
    value_at_stake: '',
    duration_weeks: '',
    open_spots: '',
    skill_tags: [],
  });

  useEffect(() => {
    if (open) {
      setForm({
        title: challenge?.title || '',
        description: challenge?.description || '',
        type: challenge?.type || 'Cost saving',
        value_at_stake: challenge?.value_at_stake || '',
        duration_weeks: challenge?.duration_weeks != null ? String(challenge.duration_weeks) : '',
        open_spots: challenge?.open_spots != null ? String(challenge.open_spots) : '',
        skill_tags: challenge?.skill_tags || [],
      });
    }
  }, [open, challenge]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleTag = (t) =>
    setForm((f) => {
      const has = f.skill_tags.includes(t);
      return { ...f, skill_tags: has ? f.skill_tags.filter((x) => x !== t) : [...f.skill_tags, t] };
    });

  const submit = (e) => {
    e?.preventDefault();
    const values = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      value_at_stake: form.value_at_stake.trim() || undefined,
      duration_weeks: form.duration_weeks !== '' ? Number(form.duration_weeks) : undefined,
      open_spots: form.open_spots !== '' ? Number(form.open_spots) : undefined,
      skill_tags: form.skill_tags,
    };
    if (!isEdit) {
      values.source = 'Seeded';
      values.sponsor = currentUser?.id;
      values.sponsor_name = currentUser?.full_name || currentUser?.email;
      values.status = 'Open';
    }
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit challenge' : 'New seeded challenge'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-title">Title</Label>
            <Input id="c-title" value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-desc">Description</Label>
            <Textarea id="c-desc" value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-value">Value at stake</Label>
              <Input id="c-value" value={form.value_at_stake} onChange={(e) => set('value_at_stake', e.target.value)} placeholder="₦38M" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-dur">Duration (weeks)</Label>
              <Input id="c-dur" type="number" min="1" value={form.duration_weeks} onChange={(e) => set('duration_weeks', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-spots">Open spots</Label>
              <Input id="c-spots" type="number" min="0" value={form.open_spots} onChange={(e) => set('open_spots', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Skill tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_TAGS.map((t) => {
                const sel = form.skill_tags.includes(t);
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${sel ? 'bg-[#EA580C] text-white border-[#EA580C]' : 'bg-white text-stone-600 border-stone-200'}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-[#EA580C] hover:bg-[#c2410c]">{isEdit ? 'Save' : 'Create challenge'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}