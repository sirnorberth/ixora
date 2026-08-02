// AvatarUpload.jsx — profile picture upload to Supabase Storage
import React, { useRef, useState } from 'react';
import { base44, supabase } from '@/api/base44Client';
import { Camera, Loader2, Trash2 } from 'lucide-react';

const MAX_MB = 3;

export default function AvatarUpload({ currentUser, onUpdated, size = 'lg' }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const dim = size === 'lg' ? 'w-20 h-20' : 'w-11 h-11';
  const letter = (currentUser?.full_name || currentUser?.email || '?').charAt(0).toUpperCase();

  const pick = () => {
    setError('');
    inputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_MB}MB.`);
      return;
    }

    setBusy(true);
    setError('');
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      // One stable path per user, overwritten on each change
      const path = `${currentUser.id}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      // Cache-bust so the new picture shows immediately
      const url = `${data.publicUrl}?v=${Date.now()}`;

      await base44.auth.updateMe({ avatar_url: url });
      onUpdated?.(url);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    setBusy(true);
    setError('');
    try {
      await base44.auth.updateMe({ avatar_url: null });
      onUpdated?.(null);
    } catch (err) {
      setError(err?.message || 'Could not remove the picture.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="relative inline-block">
        {currentUser?.avatar_url ? (
          <img
            src={currentUser.avatar_url}
            alt=""
            className={`${dim} rounded-full object-cover bg-orange-100`}
          />
        ) : (
          <div className={`${dim} rounded-full bg-orange-100 flex items-center justify-center text-[#EA580C] font-bold text-2xl`}>
            {letter}
          </div>
        )}

        <button
          type="button"
          onClick={pick}
          disabled={busy}
          aria-label="Change profile picture"
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#EA580C] text-white flex items-center justify-center shadow-md hover:bg-[#c2410c] transition disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {currentUser?.avatar_url && !busy && (
        <button
          onClick={removePhoto}
          className="mt-2 flex items-center gap-1 text-[11px] text-stone-400 hover:text-red-500 transition"
        >
          <Trash2 className="w-3 h-3" /> Remove photo
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-600 max-w-[180px]">{error}</p>}
    </div>
  );
}