"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardActions({ projectId }: { projectId?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true); await supabase.auth.signOut(); router.push("/"); router.refresh();
  }
  async function removeProject() {
    if (!projectId || !window.confirm("Delete this design permanently?")) return;
    setBusy(true);
    const response = await fetch("/api/projects/"+projectId, { method:"DELETE" });
    setBusy(false);
    if (response.ok) router.refresh();
    else window.alert("Could not delete this project. Please try again.");
  }
  if (projectId) return <button className="dashboard-delete" onClick={removeProject} disabled={busy} aria-label="Delete project"> {busy ? "…" : "Delete"} </button>;
  return <button className="dashboard-signout" onClick={signOut} disabled={busy}>{busy?"Signing out…":"Sign out"}</button>;
}
