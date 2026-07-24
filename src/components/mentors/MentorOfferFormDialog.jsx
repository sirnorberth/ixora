import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { SKILL_TAGS } from '@/lib/constants';
import { canBeMentor } from '@/lib/mentorUtils';

export default function MentorOfferFormDialog({ open, onOpenChange, currentUser, onSubmit }) {
  const [form, setForm] = useState({ topics: '', skill_tags: [], mentee_slots: 1 });

  useEffect(() => {
    if (open) setForm({ topics: '', skill_tags: [], mentee_slots: 1 });
  }, [open]);

  const eligible = canBeMentor(currentUser);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleTag = (t) =>
    setForm((f) => {
      const has = f.skill_tags.includes(t);
      return { ...f, skill_tags: has ? f.skill_tags.filter((x) => x !== t) : [...f.skill_tags, t] };
    });

  const submit = () => {
    if (!eligible) return;
    onSubmit({
      mentor: currentUser?.id,
      topics: form.topics.trim(),
      skill_tags: form.skill_tags,
      mentee_slots: Number(form.mentee_slots) || 1,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a mentor offer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!eligible && (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>You need at least 5 years of work experience to post a mentor offer. Add your years of experience on your profile.</span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="mo-topics">Topics</Label>
            <Input
              id="mo-topics"
              value={form.topics}
              onChange={(e) => set('topics', e.target.value)}
              placeholder="Comma-separated, e.g. Regulatory, Leadership"
            />
            <p className="text-[11px] text-stone-400">Shown as tags on your card.</p>
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
            <p className="text-[11px] text-stone-400">Matches these to users' goals.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mo-slots">Available slots</Label>
            <Input
              id="mo-slots"
              type="number"
              min="1"
              value={form.mentee_slots}
              onChange={(e) => set('mentee_slots', e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!eligible} className="bg-[#EA580C] hover:bg-[#c2410c]" onClick={submit}>
            Post offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}