// NOTIFICATIONBELL.JSX
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Bell, CheckCheck } from 'lucide-react';
import { fmtDate } from '@/lib/dateUtils';

function NotifItem({ n, onTap }) {
  return (
    <button
      onClick={() => onTap(n)}
      className={`w-full text-left p-3 rounded-xl border transition ${n.read ? 'border-stone-100 bg-white' : 'border-orange-200 bg-orange-50/60'}`}
    >
      <p className="text-sm text-stone-800 leading-snug">{n.text}</p>
      <p className="text-[11px] text-stone-400 mt-1">{fmtDate(n.created_date)}</p>
    </button>
  );
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    try {
      const me = await base44.auth.me().catch(() => null);
      if (!me) return;
      const all = await base44.entities.Notification.filter({ user: me.id }, '-created_date', 50);
      setItems(all);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Initial load + refresh whenever the user navigates to another page
  useEffect(() => {
    load();
  }, [load, location.pathname]);

  // Poll every 60s so the badge updates while the user sits on one screen
  useEffect(() => {
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  // Refresh when the tab regains focus (e.g. back from email or another app)
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [load]);

  const unread = items.filter((n) => !n.read).length;

  const markRead = async (n) => {
    if (n.read) return;
    try {
      await base44.entities.Notification.update(n.id, { read: true });
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    const unreadItems = items.filter((n) => !n.read);
    if (!unreadItems.length) return;
    // Optimistic: update the UI first, then persist
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    try {
      await base44.entities.Notification.bulkUpdate(
        unreadItems.map((n) => ({ ...n, read: true }))
      );
    } catch (e) {
      console.error(e);
      load(); // roll back to server truth if it failed
    }
  };

  const handleTap = async (n) => {
    await markRead(n);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const tasks = items.filter((n) => n.category === 'task');
  const updates = items.filter((n) => n.category === 'update');

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          load();
        }}
        aria-label="Notifications"
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl text-stone-600 hover:bg-orange-50 hover:text-[#EA580C] transition"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EA580C] text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-semibold text-[#EA580C] inline-flex items-center gap-1 hover:underline">
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {items.length === 0 ? (
              <p className="text-sm text-stone-500 text-center py-10">You're all caught up.</p>
            ) : (
              <>
                {tasks.length > 0 && (
                  <section>
                    <h3 className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2">Your tasks</h3>
                    <div className="space-y-2">
                      {tasks.map((n) => (
                        <NotifItem key={n.id} n={n} onTap={handleTap} />
                      ))}
                    </div>
                  </section>
                )}
                {updates.length > 0 && (
                  <section>
                    <h3 className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2">Updates</h3>
                    <div className="space-y-2">
                      {updates.map((n) => (
                        <NotifItem key={n.id} n={n} onTap={handleTap} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}