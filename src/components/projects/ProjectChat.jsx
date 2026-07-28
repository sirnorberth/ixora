// ProjectChat.jsx — per-project discussion thread
// Self-contained: renders its own floating button + panel, fetches its own
// messages. Drop <ProjectChat ... /> anywhere inside a project page.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { MessageCircle, Send, CornerUpLeft, X, Loader2, Pencil, Check } from 'lucide-react';
import { notifyProjectMessage } from '@/lib/notify';

function initials(name) {
  return (name || '?').charAt(0).toUpperCase();
}

function whenLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// Treat a message as edited if it was updated more than a couple of seconds
// after it was created (the create call stamps both fields at once).
function wasEdited(m) {
  if (!m?.created_date || !m?.updated_date) return false;
  return new Date(m.updated_date).getTime() - new Date(m.created_date).getTime() > 2000;
}

export default function ProjectChat({ project, currentUser, users = [], milestones = [] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Inline editing
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const endRef = useRef(null);

  const nameOf = (uid) => {
    const u = users.find((x) => x.id === uid);
    return u ? (u.full_name || u.email) : 'Someone';
  };

  const load = useCallback(async () => {
    if (!project?.id) return;
    try {
      const rows = await base44.entities.ProjectMessage.filter({ project: project.id }, 'created_date', 200);
      setMessages(rows);
    } catch (e) {
      console.error('Could not load project messages', e);
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => { load(); }, [load]);

  // Refresh while the panel is open so replies from others appear.
  // Skipped while editing so a poll can't wipe what you're typing.
  useEffect(() => {
    if (!open || editingId) return;
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [open, editingId, load]);

  // Keep the newest message in view
  useEffect(() => {
    if (open && !editingId) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, editingId]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const created = await base44.entities.ProjectMessage.create({
        project: project.id,
        author: currentUser?.id,
        text,
        reply_to: replyTo?.id || null,
      });
      setMessages((prev) => [...prev, created]);
      setDraft('');
      setReplyTo(null);
      notifyProjectMessage(created, project, milestones, currentUser).catch(() => {});
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setEditDraft(m.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft('');
  };

  const saveEdit = async () => {
    const text = editDraft.trim();
    if (!text || savingEdit) return;
    const original = messages.find((m) => m.id === editingId);
    if (original && text === original.text) {
      cancelEdit();
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await base44.entities.ProjectMessage.update(editingId, { text });
      setMessages((prev) => prev.map((m) => (m.id === editingId ? updated : m)));
      cancelEdit();
    } catch (e) {
      console.error('Could not update the message', e);
    } finally {
      setSavingEdit(false);
    }
  };

  const onKeyDown = (e) => {
    // Enter sends, Shift+Enter makes a new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const onEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const messageById = (id) => messages.find((m) => m.id === id);

  return (
    <>
      {/* Floating chat button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Project discussion"
        className="fixed bottom-5 right-5 z-30 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#EA580C] text-white shadow-lg hover:bg-[#c2410c] active:scale-95 transition"
      >
        <MessageCircle className="w-6 h-6" />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center">
            {messages.length > 99 ? '99+' : messages.length}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <div className="px-4 py-3 border-b border-stone-100">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#EA580C]" /> Project discussion
            </SheetTitle>
            <p className="text-xs text-stone-500 mt-0.5 truncate">{project?.name}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#FFF8F2]">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 text-[#EA580C] animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-stone-500 text-center py-10">
                No messages yet. Share the first update on this project.
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.author === currentUser?.id;
                const parent = m.reply_to ? messageById(m.reply_to) : null;
                const isEditing = editingId === m.id;

                return (
                  <div key={m.id} className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 shrink-0 rounded-full bg-orange-100 text-[#EA580C] font-bold text-sm flex items-center justify-center">
                      {initials(nameOf(m.author))}
                    </div>
                    <div className={`min-w-0 max-w-[80%] ${mine ? 'items-end text-right' : ''}`}>
                      <div className="flex items-baseline gap-2 mb-0.5" style={mine ? { justifyContent: 'flex-end' } : undefined}>
                        <span className="text-xs font-semibold text-stone-700 truncate">
                          {mine ? 'You' : nameOf(m.author)}
                        </span>
                        <span className="text-[10px] text-stone-400 shrink-0">{whenLabel(m.created_date)}</span>
                      </div>

                      {parent && (
                        <div className="mb-1 px-2.5 py-1.5 rounded-lg bg-stone-100 border-l-2 border-stone-300 text-left">
                          <p className="text-[10px] font-semibold text-stone-500">{nameOf(parent.author)}</p>
                          <p className="text-[11px] text-stone-500 line-clamp-2">{parent.text}</p>
                        </div>
                      )}

                      {isEditing ? (
                        <div className="text-left">
                          <textarea
                            rows={3}
                            autoFocus
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            onKeyDown={onEditKeyDown}
                            className="w-full resize-none rounded-xl border border-[#EA580C] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                          />
                          <div className="mt-1.5 flex items-center gap-2">
                            <button
                              onClick={saveEdit}
                              disabled={!editDraft.trim() || savingEdit}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#c2410c] px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                            >
                              {savingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-700 px-2 py-1.5"
                            >
                              <X className="w-3 h-3" /> Cancel
                            </button>
                            <span className="text-[10px] text-stone-400">Esc to cancel</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            className={`inline-block px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words text-left ${
                              mine ? 'bg-[#EA580C] text-white' : 'bg-white text-stone-800 border border-stone-100'
                            }`}
                          >
                            {m.text}
                          </div>

                          <div className={`flex items-center gap-3 mt-1 ${mine ? 'justify-end' : ''}`}>
                            {wasEdited(m) && (
                              <span className="text-[10px] text-stone-400 italic">edited</span>
                            )}
                            <button
                              onClick={() => setReplyTo(m)}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-400 hover:text-[#EA580C]"
                            >
                              <CornerUpLeft className="w-3 h-3" /> Reply
                            </button>
                            {mine && (
                              <button
                                onClick={() => startEdit(m)}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-400 hover:text-[#EA580C]"
                              >
                                <Pencil className="w-3 h-3" /> Edit
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          {/* Composer */}
          <div className="border-t border-stone-100 p-3 bg-white">
            {replyTo && (
              <div className="mb-2 flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-stone-100 border-l-2 border-[#EA580C]">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold text-stone-500">
                    Replying to {replyTo.author === currentUser?.id ? 'yourself' : nameOf(replyTo.author)}
                  </p>
                  <p className="text-[11px] text-stone-500 truncate">{replyTo.text}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-stone-400 hover:text-stone-600 shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Share an update or idea…"
                className="flex-1 resize-none max-h-32 rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#EA580C]"
              />
              <button
                onClick={send}
                disabled={!draft.trim() || sending}
                className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#EA580C] text-white hover:bg-[#c2410c] transition disabled:opacity-40"
                aria-label="Send"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-stone-400">Enter to send · Shift+Enter for a new line</p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}