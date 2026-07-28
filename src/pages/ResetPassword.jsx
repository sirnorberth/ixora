import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44, supabase } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();

  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);      // recovery session established
  const [linkError, setLinkError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [doneMsg, setDoneMsg] = useState(false);

  // Supabase puts the recovery tokens in the URL (hash, or ?code= for PKCE)
  // and supabase-js turns them into a temporary session. We wait for that
  // session rather than looking for a ?token= parameter.
  useEffect(() => {
    let alive = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setChecking(false);
      }
    });

    (async () => {
      // Expired or already-used links come back with an error in the URL
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const errDesc =
        hash.get("error_description") || searchParams.get("error_description");
      if (errDesc) {
        if (alive) {
          setLinkError(errDesc.replace(/\+/g, " "));
          setChecking(false);
        }
        return;
      }

      // PKCE-style links carry a code to exchange
      const code = searchParams.get("code");
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr && alive) {
          setLinkError(exErr.message);
          setChecking(false);
          return;
        }
      }

      let { data } = await supabase.auth.getSession();
      if (!data.session) {
        // Hash parsing can land a moment later — give it one grace period
        await new Promise((r) => setTimeout(r, 1200));
        ({ data } = await supabase.auth.getSession());
      }
      if (!alive) return;
      setReady(!!data.session);
      setChecking(false);
    })();

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ newPassword });
      setDoneMsg(true);
      // Sign the recovery session out so they log in fresh with the new password
      await supabase.auth.signOut();
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <AuthLayout icon={Lock} title="Checking your link" subtitle="One moment…">
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AuthLayout>
    );
  }

  if (!ready) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Invalid or expired link"
        subtitle="This password reset link can't be used"
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            Request a new link
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          {linkError ||
            "Reset links expire after a short time and can only be used once. Please request a new one."}
        </p>
      </AuthLayout>
    );
  }

  if (doneMsg) {
    return (
      <AuthLayout icon={CheckCircle2} title="Password updated" subtitle="You're all set">
        <p className="text-sm text-foreground text-center">
          Your password has been changed. Taking you to the login page…
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="New password"
      subtitle="Enter your new password below"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}