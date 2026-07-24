import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Target, Calendar } from 'lucide-react';
import { SKILL_TAGS } from '@/lib/constants';
import { addMonths, format } from 'date-fns';
import { fmtDate } from '@/lib/dateUtils';

export default function GoalFormDialog({ open, onOpenChange, currentUser, goal, onSubmit }) {
  const isEdit = !!goal;
  const [form, setForm] = useState({ goal_text: '', goal_type: '', skill_tags: [], timeline: 6 });
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        goal_text: goal?.goal_text || '',
        goal_type: goal?.goal_type || '',
        skill_tags: goal?.matching_skill_tags || [],
        timeline: 6,
      });
      setDone(false);
    }
  }, [open, goal]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleTag = (t) =>
    setForm((f) => {
      const has = f.skill_tags.includes(t);
      return { ...f, skill_tags: has ? f.skill_tags.filter((x) => x !== t) : [...f.skill_tags, t] };
    });

  const submit = async () => {
    if (submitting || !form.goal_text.trim()) return;
    setSubmitting(true);
    try {
      const values = {
        goal_text: form.goal_text.trim(),
        goal_type: form.goal_type.trim() || undefined,
        matching_skill_tags: form.skill_tags,
        target_date: format(addMonths(new Date(), Number(form.timeline)), 'yyyy-MM-dd'),
      };
      if (!isEdit) {
        values.user = currentUser?.id;
        values.visible_to_manager_and_mentor = true;
        values.lessons_done = false;
        values.archived = false;
      }
      await onSubmit(values);
      if (isEdit) {
        onOpenChange(false);
      } else {
        setDone(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#EA580C]" /> {isEdit ? 'Edit goal' : 'Set your development goal'}
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-lg font-semibold text-stone-800">Goal set</p>
            <p className="mt-1 text-sm text-stone-500">Recommendations updated across the app.</p>
            <Button className="mt-5 bg-[#EA580C] hover:bg-[#c2410c]" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="g-text">Your goal</Label>
              <Textarea
                id="g-text"
                rows={3}
                value={form.goal_text}
                onChange={(e) => set('goal_text', e.target.value)}
                placeholder="Write out what you want to achieve"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="g-cat">Category</Label>
              <Input
                id="g-cat"
                value={form.goal_type}
                onChange={(e) => set('goal_type', e.target.value)}
                placeholder="e.g. Career, Productivity, Leadership"
              />
              <p className="text-[11px] text-stone-400">You decide the category — there are no fixed options.</p>
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
              <p className="text-[11px] text-stone-400">Used to recommend challenges linked to this goal.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Timeline</Label>
              {isEdit && goal?.target_date && (
                <p className="text-[11px] text-stone-400">Current target: {fmtDate(goal.target_date)}</p>
              )}
              <div className="grid grid-cols-3 gap-2.5">
                {[6, 12, 24].map((m) => {
                  const sel = Number(form.timeline) === m;
                  return (
                    <button
                      type="button"
                      key={m}
                      onClick={() => set('timeline', m)}
                      className={`p-3 rounded-2xl border-2 transition text-center ${sel ? 'border-[#EA580C] bg-orange-50' : 'border-stone-200 bg-white hover:border-orange-200'}`}
                    >
                      <Calendar className="w-4 h-4 text-[#EA580C] mx-auto mb-0.5" />
                      <div className="text-lg font-bold text-stone-800">{m}</div>
                      <div className="text-[11px] text-stone-500">months</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!form.goal_text.trim() || submitting}
                className="bg-[#EA580C] hover:bg-[#c2410c]"
                onClick={submit}
              >
                {submitting ? 'Saving…' : isEdit ? 'Save goal' : 'Set goal'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}