import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  width: z.number().int().min(50).max(10000).optional(),
  height: z.number().int().min(50).max(10000).optional(),
  document: z.record(z.string(), z.unknown()).optional(),
  thumbnail: z.string().max(2_000_000).nullable().optional()
});

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Cloud storage is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).eq("user_id", user.id).single();
  if (error || !data) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  return NextResponse.json({ project: data });
}

export async function PATCH(request: Request, context: Context) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Cloud storage is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid project payload." }, { status: 400 });
  const { id } = await context.params;
  const { data, error } = await supabase.from("projects").update(parsed.data).eq("id", id).eq("user_id", user.id).select("id,title,width,height,updated_at").single();
  if (error || !data) return NextResponse.json({ error: "Could not update project." }, { status: 404 });
  return NextResponse.json({ project: data });
}

export async function DELETE(_request: Request, context: Context) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Cloud storage is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Could not delete project." }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
