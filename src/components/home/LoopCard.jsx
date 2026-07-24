import React from 'react';
import { Eye, Flag, Trophy, Sparkles } from 'lucide-react';

export default function LoopCard() {
  const steps = [
    { label: 'See the work', icon: Eye },
    { label: 'Spot the block', icon: Flag },
    { label: 'Take the challenge', icon: Trophy },
    { label: 'Grow', icon: Sparkles },
  ];
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
      <h3 className="font-semibold text-stone-800">How Ixora works</h3>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={s.label}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-orange-50 text-[#EA580C] border border-orange-100">
              <s.icon className="w-3.5 h-3.5" /> {s.label}
            </span>
            {i < steps.length - 1 && <span className="text-stone-300">→</span>}
          </React.Fragment>
        ))}
      </div>
      <p className="mt-3 text-xs text-stone-500">
        No permission needed to raise your hand. Your manager is informed, not asked.
      </p>
    </div>
  );
}