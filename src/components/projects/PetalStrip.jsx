import React from 'react';
import { PETAL_STYLES } from '@/lib/constants';

function petalKey(fn, milestones) {
  const ms = milestones.filter((m) => m.owning_function === fn);
  if (!ms.length) return 'neutral';
  if (ms.some((m) => m.status === 'Blocked')) return 'red';
  if (ms.some((m) => m.status === 'Delayed')) return 'amber';
  return 'green';
}

export default function PetalStrip({ functions, milestones }) {
  const fns = functions || [];
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {fns.map((f) => {
          const k = petalKey(f, milestones);
          return (
            <span key={f} className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${PETAL_STYLES[k]}`}>
              {f}
            </span>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-stone-400 italic">Every petal is a function. The bloom is the project.</p>
    </div>
  );
}