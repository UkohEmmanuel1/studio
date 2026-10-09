"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setMessage("Cloud sign-in is not configured yet. Add the Supabase URL and anon key to your deployment environment.");
      return;
    }
    setBusy(true); setMessage("");
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin + "/auth/callback" : undefined } });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (mode === "signup" && !result.data.session) {
      setMessage("Account created. Check your email to confirm your address, then sign in.");
      return;
    }
    router.push("/dashboard"); router.refresh();
  }

  return <main className="auth-page">
    <section className="auth-card">
      <Link href="/" className="auth-brand"><span className="create-mark">P</span> PosterStudio</Link>
      <p className="create-eyebrow">YOUR CREATIVE WORKSPACE</p>
      <h1>{mode === "signin" ? "Welcome back." : "Create your account."}</h1>
      <p className="auth-copy">Sign in to keep your designs available across devices.</p>
      <form onSubmit={submit} className="auth-form">
        <label>Email address<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" autoComplete={mode==="signin"?"current-password":"new-password"} minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required /></label>
        <button className="btn btn-primary" disabled={busy}>{busy ? "Please wait…" : mode==="signin" ? "Sign in" : "Create account"}</button>
      </form>
      {message && <p className="auth-message" role="status">{message}</p>}
      <p className="auth-switch">{mode==="signin"?"New to PosterStudio?":"Already have an account?"} <button onClick={()=>{setMode(mode==="signin"?"signup":"signin");setMessage("");}}>{mode==="signin"?"Create an account":"Sign in"}</button></p>
      <Link href="/editor" className="auth-local">Continue without an account →</Link>
    </section>
  </main>;
}
