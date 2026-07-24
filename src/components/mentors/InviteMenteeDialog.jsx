import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function InviteMenteeDialog({ open, onOpenChange, users, currentUser, onSubmit }) {
  const [menteeId, setMenteeId] = useState('');

  useEffect(() => {
    if (open) setMenteeId('');
  }, [open]);

  const others = users.filter((u) => u.id !== currentUser?.id);

  const submit = () => {
    if (!menteeId) return;
    onSubmit(menteeId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite an employee</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Choose an employee</Label>
          <Select value={menteeId} onValueChange={setMenteeId}>
            <SelectTrigger><SelectValue placeholder="Select an employee" /></SelectTrigger>
            <SelectContent>
              {others.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!menteeId} className="bg-[#EA580C] hover:bg-[#c2410c]" onClick={submit}>
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}