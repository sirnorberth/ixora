import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GoalFormDialog from './GoalFormDialog';

export default function SetGoalCard({ currentUser, onComplete }) {
  const [open, setOpen] = useState(false);

  const handleCreate = async (values) => {
    await base44.entities.Goal.create(values);
    onComplete?.();
  };

  return (
    <div className="bg-gradient-to-br from-[#EA580C] to-[#c2410c] text-white rounded-2xl shadow-md p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Target className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg leading-tight">Set your development goal</h3>
          <p className="mt-1 text-sm text-white/85">Challenges, mentors and lessons get recommended around it.</p>
          <button
            onClick={() => setOpen(true)}
            className="mt-3 inline-flex items-center gap-2 bg-white text-[#EA580C] font-semibold text-sm px-4 py-2 rounded-xl hover:bg-orange-50 transition"
          >
            Set your goal
          </button>
        </div>
      </div>
      <GoalFormDialog open={open} onOpenChange={setOpen} currentUser={currentUser} goal={null} onSubmit={handleCreate} />
    </div>
  );
}