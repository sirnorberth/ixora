import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { daysSince } from '@/lib/dateUtils';
import { Clock } from 'lucide-react';

export default function ProjectsAtAGlance() {
  const [counts, setCounts] = useState({ ontrack: 0, atrisk: 0, blocked: 0 });
  const [oldest, setOldest] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [projects, bns] = await Promise.all([
          base44.entities.Project.list('-created_date', 500),
          base44.entities.Bottleneck.filter({ status: 'Open' }, 'date_flagged', 500),
        ]);
        const c = { ontrack: 0, atrisk: 0, blocked: 0 };
        projects.forEach((p) => {
          if (p.health_status === 'On track') c.ontrack++;
          else if (p.health_status === 'At risk') c.atrisk++;
          else if (p.health_status === 'Blocked') c.blocked++;
        });
        setCounts(c);
        if (bns.length) {
          const o = bns.reduce((a, b) => (daysSince(b.date_flagged) > daysSince(a.date_flagged) ? b : a));
          setOldest({ title: o.title, age: daysSince(o.date_flagged) });
        } else {
          setOldest(null);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <Link to="/projects" className="block">
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:border-orange-200 transition">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-stone-800">Projects at a glance</h3>
          <span className="text-xs text-stone-400">tap to open →</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-emerald-50 py-2">
            <div className="text-xl font-bold text-emerald-700">{counts.ontrack}</div>
            <div className="text-[11px] text-emerald-700/80">On track</div>
          </div>
          <div className="rounded-xl bg-amber-50 py-2">
            <div className="text-xl font-bold text-amber-700">{counts.atrisk}</div>
            <div className="text-[11px] text-amber-700/80">At risk</div>
          </div>
          <div className="rounded-xl bg-red-50 py-2">
            <div className="text-xl font-bold text-red-700">{counts.blocked}</div>
            <div className="text-[11px] text-red-700/80">Blocked</div>
          </div>
        </div>
        <div className="mt-3 text-sm text-stone-600 flex items-center gap-2">
          <Clock className="w-4 h-4 text-stone-400 shrink-0" />
          {oldest ? (
            <span>
              Oldest blocker: <span className="font-semibold text-stone-800">{oldest.age} day{oldest.age === 1 ? '' : 's'}</span> — {oldest.title}
            </span>
          ) : (
            <span>No open blockers right now.</span>
          )}
        </div>
      </div>
    </Link>
  );
}