// PhaseRoadmap.jsx
import React from 'react';
import { Check } from 'lucide-react';

export default function PhaseRoadmap({ phases, currentPhase }) {
  const list = phases || [];
  if (!list.length) {
    return <p className="text-sm text-stone-400">No phases defined.</p>;
  }
  const currentIdx = list.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
      {list.map((phase, i) => {
        const isCurrent = phase === currentPhase;
        const isDone = currentIdx === -1 ? false : i < currentIdx;
        return (
          <React.Fragment key={phase}>
            <div className="flex flex-col items-center min-w-[72px]">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold border-2 ${
                  isDone
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-[#EA580C] border-[#EA580C] text-white'
                    : 'bg-white border-stone-200 text-stone-400'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span
                className={`mt-1.5 text-[10px] text-center leading-tight ${
                  isCurrent ? 'font-semibold text-[#EA580C]' : isDone ? 'text-emerald-600' : 'text-stone-400'
                }`}
              >
                {phase}
              </span>
            </div>
            {i < list.length - 1 && (
              <div className={`h-0.5 w-5 mt-3.5 rounded ${isDone ? 'bg-emerald-400' : 'bg-stone-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}