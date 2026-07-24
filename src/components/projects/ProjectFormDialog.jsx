import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DEPARTMENTS, PROJECT_CATEGORIES, PROJECT_STATUSES } from '@/lib/constants';
import { addMonths, differenceInMonths, format, parseISO } from 'date-fns';

const HEALTH = ['On track', 'At risk', 'Blocked'];

function userSelectItems(users) {
  return users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>);
}

export default function ProjectFormDialog({ open, onOpenChange, project, users, onSubmit }) {
  const isEdit = !!project;
  const [form, setForm] = useState({
    name: '',
    category: '',
    project_lead: 'none',
    sponsor: 'none',
    approver: 'none',
    functions_involved: [],
    phasesText: '',
    current_phase: '',
    start_date: '',
    target_date: '',
    value_at_stake: '',
    health_status: 'On track',
    status: 'Not Started',
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: project?.name || '',
        category: project?.category || '',
        project_lead: project?.project_lead || 'none',
        sponsor: project?.sponsor || 'none',
        approver: project?.approver || 'none',
        functions_involved: project?.functions_involved || [],
        phasesText: (project?.phase_names || []).join(', '),
        current_phase: project?.current_phase || '',
        start_date: project?.start_date || '',
        target_date: project?.target_date || '',
        value_at_stake: project?.value_at_stake || '',
        health_status: project?.health_status || 'On track',
        status: project?.status || 'Not Started',
      });
    }
  }, [open, project]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDept = (d) =>
    setForm((f) => {
      const has = f.functions_involved.includes(d);
      return {
        ...f,
        functions_involved: has ? f.functions_involved.filter((x) => x !== d) : [...f.functions_involved, d],
      };
    });

  const cat = PROJECT_CATEGORIES.find((c) => c.value === form.category);
  const maxMonths = cat?.maxMonths;

  const defaultTarget = (startStr, categoryValue) => {
    const c = PROJECT_CATEGORIES.find((x) => x.value === categoryValue);
    if (!startStr || !c) return null;
    try {
      return format(addMonths(parseISO(startStr), c.maxMonths), 'yyyy-MM-dd');
    } catch {
      return null;
    }
  };

  const onCategoryChange = (v) => {
    setForm((f) => ({ ...f, category: v, target_date: defaultTarget(f.start_date, v) || f.target_date }));
  };
  const onStartDateChange = (v) => {
    setForm((f) => ({ ...f, start_date: v, target_date: defaultTarget(v, f.category) || f.target_date }));
  };

  let durationMonths = null;
  let durationError = null;
  if (form.start_date && form.target_date) {
    try {
      durationMonths = differenceInMonths(parseISO(form.target_date), parseISO(form.start_date));
    } catch {
      durationMonths = null;
    }
  }
  if (durationMonths != null) {
    if (durationMonths < 0) {
      durationError = 'Delivery date is before the start date.';
    } else if (maxMonths && durationMonths > maxMonths) {
      durationError = `Duration (${durationMonths} mo) exceeds the ${form.category} limit of ${maxMonths} months.`;
    }
  }

  const phases = form.phasesText.split(',').map((s) => s.trim()).filter(Boolean);
  const currentOptions = Array.from(new Set([...phases, form.current_phase].filter(Boolean)));

  const submit = (e) => {
    e?.preventDefault();
    if (durationError) return;
    onSubmit({
      name: form.name.trim(),
      category: form.category || undefined,
      project_lead: form.project_lead === 'none' ? undefined : form.project_lead,
      sponsor: form.sponsor === 'none' ? undefined : form.sponsor,
      approver: form.approver === 'none' ? undefined : form.approver,
      functions_involved: form.functions_involved,
      phase_names: phases,
      current_phase: form.current_phase || undefined,
      start_date: form.start_date || undefined,
      target_date: form.target_date || undefined,
      value_at_stake: form.value_at_stake.trim() || undefined,
      health_status: form.health_status,
      status: form.status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit project' : 'New project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Project name</Label>
            <Input id="p-name" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="e.g. Ixora Cough Syrup Launch" />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category || undefined} onValueChange={onCategoryChange}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {PROJECT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.value} (≤ {c.maxMonths} mo)</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {maxMonths && (
              <p className="text-[11px] text-stone-400">Default max duration: {maxMonths} months.</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label>Project lead</Label>
              <Select value={form.project_lead} onValueChange={(v) => set('project_lead', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {userSelectItems(users)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sponsor</Label>
              <Select value={form.sponsor} onValueChange={(v) => set('sponsor', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {userSelectItems(users)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Approver</Label>
              <Select value={form.approver} onValueChange={(v) => set('approver', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {userSelectItems(users)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Functions involved</Label>
            <div className="flex flex-wrap gap-1.5">
              {DEPARTMENTS.map((d) => {
                const sel = form.functions_involved.includes(d);
                return (
                  <button
                    type="button"
                    key={d}
                    onClick={() => toggleDept(d)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${sel ? 'bg-[#EA580C] text-white border-[#EA580C]' : 'bg-white text-stone-600 border-stone-200'}`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-phases">Phases (in order)</Label>
            <Input id="p-phases" value={form.phasesText} onChange={(e) => set('phasesText', e.target.value)} placeholder="Develop, Register, Produce, Launch" />
            <p className="text-[11px] text-stone-400">Comma-separated, in execution order.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Current phase</Label>
              <Select value={form.current_phase || undefined} onValueChange={(v) => set('current_phase', v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {currentOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Health</Label>
              <Select value={form.health_status} onValueChange={(v) => set('health_status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HEALTH.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-start">Start date</Label>
              <Input id="p-start" type="date" value={form.start_date} onChange={(e) => onStartDateChange(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-target">Delivery date</Label>
              <Input id="p-target" type="date" value={form.target_date} onChange={(e) => set('target_date', e.target.value)} />
            </div>
          </div>
          {durationMonths != null && !durationError && (
            <p className="text-[11px] text-stone-400">Duration: {durationMonths} month(s).</p>
          )}
          {durationError && (
            <p className="text-[11px] text-red-600 font-medium">{durationError}</p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="p-value">Value at stake</Label>
            <Input id="p-value" value={form.value_at_stake} onChange={(e) => set('value_at_stake', e.target.value)} placeholder="₦38M first-quarter revenue" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!!durationError} className="bg-[#EA580C] hover:bg-[#c2410c]">{isEdit ? 'Save' : 'Create project'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}