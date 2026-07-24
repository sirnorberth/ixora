import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DEPARTMENTS, MILESTONE_STATUSES } from '@/lib/constants';
import { Trash2 } from 'lucide-react';

export default function MilestoneFormDialog({ open, onOpenChange, milestone, users, onSubmit, onDelete }) {
  const isEdit = !!milestone;
  const [form, setForm] = useState({ title: '', owning_function: '', owner: 'none', due_date: '', status: 'Planned' });

  useEffect(() => {
    if (open) {
      setForm({
        title: milestone?.title || '',
        owning_function: milestone?.owning_function || '',
        owner: milestone?.owner || 'none',
        due_date: milestone?.due_date || '',
        status: milestone?.status || 'Planned',
      });
    }
  }, [open, milestone]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e?.preventDefault();
    onSubmit({
      title: form.title.trim(),
      owning_function: form.owning_function || undefined,
      owner: form.owner === 'none' ? undefined : form.owner,
      due_date: form.due_date || undefined,
      status: form.status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit milestone' : 'Add milestone'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="m-title">Title</Label>
            <Input id="m-title" value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. Stability study complete" />
          </div>

          <div className="space-y-1.5">
            <Label>Owning function</Label>
            <Select value={form.owning_function || undefined} onValueChange={(v) => set('owning_function', v)}>
              <SelectTrigger><SelectValue placeholder="Select function" /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Owner</Label>
            <Select value={form.owner} onValueChange={(v) => set('owner', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-due">Due date</Label>
              <Input id="m-due" type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MILESTONE_STATUSES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            {isEdit && onDelete ? (
              <Button type="button" variant="ghost" onClick={onDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#EA580C] hover:bg-[#c2410c]">{isEdit ? 'Save' : 'Add milestone'}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}