import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ProjectReviewDialog({ open, onOpenChange, onSubmit }) {
  const [notes, setNotes] = useState('');
  const [realized, setRealized] = useState('');

  useEffect(() => {
    if (open) {
      setNotes('');
      setRealized('');
    }
  }, [open]);

  const submit = (e) => {
    e?.preventDefault();
    onSubmit({
      review_notes: notes.trim() || undefined,
      realized_value: realized.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Completion review</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="r-value">Realized value / gain</Label>
            <Input id="r-value" value={realized} onChange={(e) => setRealized(e.target.value)} placeholder="e.g. ₦42M cost saved in Q1" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-notes">Impact / benefit assessment</Label>
            <Textarea id="r-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder="Quantify the impact, benefit and gain of this project..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-[#EA580C] hover:bg-[#c2410c]">Complete review</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}