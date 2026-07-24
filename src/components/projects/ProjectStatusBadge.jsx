import React from 'react';
import { PROJECT_STATUS_STYLES } from '@/lib/constants';

export default function ProjectStatusBadge({ status }) {
  if (!status) return null;
  const s = PROJECT_STATUS_STYLES[status];
  if (!s) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}