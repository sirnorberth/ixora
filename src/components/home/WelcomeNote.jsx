import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function WelcomeNote() {
  const [seen, setSeen] = useState(() => {
    try {
      return localStorage.getItem('ixora_welcome_seen') === '1';
    } catch {
      return false;
    }
  });

  if (seen) return null;

  const dismiss = () => {
    try {
      localStorage.setItem('ixora_welcome_seen', '1');
    } catch {
      /* ignore */
    }
    setSeen(true);
  };

  return (
    <div className="bg-[#EA580C] text-white rounded-2xl shadow-sm p-4 relative">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
      >
        <X className="w-4 h-4" />
      </button>
      <p className="text-sm font-semibold">Welcome to Ixora</p>
      <p className="mt-1 text-sm text-white/90 pr-6">
        See every project. Flag any delay. Join any challenge. Your manager is informed, not asked.
      </p>
    </div>
  );
}