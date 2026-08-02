// InstallPrompt.jsx — offers "Add Ixora to your home screen".
// Chrome/Edge/Android: uses the beforeinstallprompt event for a real install.
// iOS Safari: shows the manual Share → Add to Home Screen instructions.

import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

const DISMISS_KEY = 'ixora_install_dismissed';

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;                       // already installed
    if (localStorage.getItem(DISMISS_KEY)) return;    // user said no thanks

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // iOS never fires that event — offer the manual route instead
    if (isIos()) {
      const t = setTimeout(() => setShow(true), 3000);
      return () => {
        clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', onPrompt);
      };
    }

    const onInstalled = () => setShow(false);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) {
      setIosHelp(true);
      return;
    }
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-40">
      <div className="bg-white rounded-2xl shadow-lg border border-orange-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-[#EA580C] text-white font-bold text-lg flex items-center justify-center">
            I
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-stone-800 text-sm">Install Ixora</h3>
            {iosHelp || (isIos() && !deferred) ? (
              <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                Tap <Share className="w-3.5 h-3.5 inline mx-0.5" /> in Safari's toolbar,
                then choose <span className="font-semibold">Add to Home Screen</span>.
              </p>
            ) : (
              <p className="mt-1 text-xs text-stone-600">
                Add it to your home screen for quicker access, even offline.
              </p>
            )}
            {!isIos() && (
              <button
                onClick={install}
                className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#c2410c] px-3 py-2 rounded-xl transition"
              >
                <Download className="w-4 h-4" /> Install app
              </button>
            )}
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 text-stone-400 hover:text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}