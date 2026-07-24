import React from 'react';
import { HEALTH_STYLES } from '@/lib/constants';

export default function HealthBadge({ status }) {
  const s = HEALTH_STYLES[status] || HEALTH_STYLES['On track'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status || 'On track'}
    </span>
  );
}