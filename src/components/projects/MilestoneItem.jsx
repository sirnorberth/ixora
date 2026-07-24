import React from 'react';
import { Pencil } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MILESTONE_STYLES, MILESTONE_STATUSES } from '@/lib/constants';
import { fmtDate, daysSince } from '@/lib/dateUtils';

export default function MilestoneItem({ milestone, canEdit, onStatusChange, onEdit, ownerName }) {
  const m = milestone;
  const s = MILESTONE_STYLES[m.status] || MILESTONE_STYLES['Planned'];
  const isDone = m.status === 'Done';
  const showAge = m.status === 'Delayed' || m.status === 'Blocked';

  return (
    <div className="flex items-start gap-3 py-3 border-b border-stone-100 last:border-0">
      <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`font-medium leading-snug ${isDone ? 'line-through text-stone-400' : 'text-stone-800'}`}>
            {m.title}
          </p>
          {canEdit && (
            <button
              onClick={() => onEdit(m)}
              className="shrink-0 p-1.5 rounded-lg text-stone-400 hover:text-[#EA580C] hover:bg-orange-50 transition"
              aria-label="Edit milestone"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
          <span className="font-medium text-stone-600">{m.owning_function || '—'}</span>
          {ownerName && <span>· {ownerName}</span>}
          <span>· Due {fmtDate(m.due_date)}</span>
          <span className={`font-semibold ${s.text}`}>{m.status}</span>
          {showAge && <span className="font-semibold text-amber-600">+{daysSince(m.status_since)} days</span>}
        </div>
        {canEdit && (
          <div className="mt-2">
            <Select value={m.status} onValueChange={(v) => onStatusChange(m.id, v)}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MILESTONE_STATUSES.map((st) => (
                  <SelectItem key={st} value={st}>{st}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}