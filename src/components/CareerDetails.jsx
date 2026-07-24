import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Briefcase, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function CareerDetails({ currentUser, onSaved }) {
  const [jobTitle, setJobTitle] = useState('');
  const [years, setYears] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setJobTitle(currentUser?.job_title || '');
    setYears(currentUser?.years_of_experience != null ? String(currentUser.years_of_experience) : '');
  }, [currentUser?.id, currentUser?.job_title, currentUser?.years_of_experience]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        job_title: jobTitle.trim() || undefined,
        years_of_experience: years === '' ? undefined : Number(years),
      });
      onSaved?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Briefcase className="w-4 h-4 text-[#EA580C]" />
        <h3 className="font-semibold text-stone-800">Career details</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cd-title">Job title</Label>
          <Input id="cd-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Production Manager" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cd-years">Years of experience</Label>
          <Input id="cd-years" type="number" min="0" value={years} onChange={(e) => setYears(e.target.value)} placeholder="e.g. 7" />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-[#EA580C] hover:bg-[#c2410c]">
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-stone-400">Used to match you as a mentor and check mentorship eligibility.</p>
    </section>
  );
}