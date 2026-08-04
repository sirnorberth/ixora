// ChallengeStatusBadge.jsx
import React from 'react';
import { CHALLENGE_STATUS_STYLES } from '@/lib/constants';

export default function ChallengeStatusBadge({ status }) {
  if (!status) return null;
  const s = CHALLENGE_STATUS_STYLES[status] || CHALLENGE_STATUS_STYLES['Open'];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}