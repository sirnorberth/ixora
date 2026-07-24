import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { daysSince } from '@/lib/dateUtils';

export default function BottleneckFeed({ bottlenecks, projectOf }) {
  const feed = [...bottlenecks].sort((a, b) => daysSince(b.date_flagged) - daysSince(a.date_flagged));
  if (!feed.length) return <p className="text-sm text-stone-500">No bottlenecks logged.</p>;
  return (
    <div className="space-y-2">
      {feed.map((b) => {
        const age = daysSince(b.date_flagged);
        const escalation = b.status === 'Open' && age > 10;
        const project = projectOf(b.project);
        return (
          <div
            key={b.id}
            className={`p-3 rounded-xl border ${escalation ? 'border-red-300 bg-red-50' : 'border-stone-100 bg-white'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-stone-800 truncate">{b.title}</div>
                <div className="text-xs text-stone-500 truncate">
                  {project?.name || '—'} · {b.waiting_on || '—'}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-xs font-semibold ${b.status === 'Open' ? 'text-red-600' : 'text-emerald-600'}`}>
                  {b.status}
                </span>
                <span className="text-xs text-stone-500">{age} day{age === 1 ? '' : 's'}</span>
              </div>
            </div>
            {escalation && (
              <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                <AlertTriangle className="w-3.5 h-3.5" /> Escalation due
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}