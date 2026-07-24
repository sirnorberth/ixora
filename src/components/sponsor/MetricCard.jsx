import React from 'react';

export default function MetricCard({ label, value, sub, className }) {
  return (
    <div className={`bg-white rounded-2xl border border-stone-100 shadow-sm p-4 ${className || ''}`}>
      <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-2xl font-bold text-stone-800">{value}</div>
      {sub && <div className="text-xs text-stone-500 mt-0.5">{sub}</div>}
    </div>
  );
}