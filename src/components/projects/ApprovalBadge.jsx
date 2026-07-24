import React from 'react';
import { APPROVAL_STYLES } from '@/lib/constants';

const LABELS = {
  Pending: 'Pending approval',
  Approved: 'Approved',
  Rejected: 'Rejected',
};

export default function ApprovalBadge({ status }) {
  if (!status) return null;
  const s = APPROVAL_STYLES[status];
  if (!s) return null;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {LABELS[status] || status}
    </span>
  );
}