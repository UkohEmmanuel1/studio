import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const projectInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  width: z.number().int().min(50).max(10000),
  height: z.number().int().min(50).max(10000),
  document: z.record(z.string(), z.unknown()),
  thumbnail: z.string().max(2_000_000).optional().nullable()
});

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Cloud storage is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to access cloud projects." }, { status: 401 });
  const { data, error } = await supabase.from("projects")
    .select("id,title,width,height,thumbnail,created_at,updated_at")
    .eq("user_id", user.id).order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load projects." }, { status: 500 });
  return NextResponse.json({ projects: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Cloud storage is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to save cloud projects." }, { status: 401 });
  const parsed = projectInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid project payload.", details: parsed.error.flatten() }, { status: 400 });
  const { id, ...input } = parsed.data;
  const payload = { ...input, user_id: user.id };
  const query = id
    ? supabase.from("projects").update(payload).eq("id", id).eq("user_id", user.id).select("id,title,width,height,updated_at").single()
    : supabase.from("projects").insert(payload).select("id,title,width,height,updated_at").single();
  const { data, error } = await query;
  if (error || !data) return NextResponse.json({ error: "Could not save project. Check the database migration and project permissions." }, { status: 500 });
  return NextResponse.json({ project: data }, { status: id ? 200 : 201 });
}
