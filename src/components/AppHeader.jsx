import React from 'react';
import BackButton from './BackButton';
import NotificationBell from './NotificationBell';

export default function AppHeader({ right }) {
  return (
    <header className="sticky top-0 z-10 bg-[#FFF8F2]/90 backdrop-blur border-b border-orange-100">
      <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-2">
        <BackButton />
        <div className="leading-tight">
          <div className="font-bold text-stone-800">Ixora</div>
          <div className="text-[11px] text-stone-500">Many hands, one bloom</div>
        </div>
        <div className="flex-1" />
        {right}
        <NotificationBell />
      </div>
    </header>
  );
}