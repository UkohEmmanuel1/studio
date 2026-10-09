import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp"
};

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Cloud storage is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to upload cloud assets." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  const extension = TYPES[file.type];
  if (!extension) return NextResponse.json({ error: "Only PNG, JPEG and WebP files are supported." }, { status: 415 });
  if (file.size < 1 || file.size > MAX_BYTES) return NextResponse.json({ error: "Images must be smaller than 8 MB." }, { status: 413 });

  const path = user.id + "/" + crypto.randomUUID() + "." + extension;
  const { error } = await supabase.storage.from("design-assets").upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false
  });
  if (error) return NextResponse.json({ error: "Could not upload this image." }, { status: 500 });
  const { data, error: urlError } = await supabase.storage.from("design-assets").createSignedUrl(path, 3600);
  if (urlError || !data?.signedUrl) return NextResponse.json({ error: "Image uploaded, but its preview URL could not be created." }, { status: 500 });
  return NextResponse.json({ path, url: data.signedUrl }, { status: 201 });
}

export async function GET(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Cloud storage is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to access cloud assets." }, { status: 401 });

  const path = new URL(request.url).searchParams.get("path") || "";
  if (!path.startsWith(user.id + "/") || path.split("/").length !== 2 || path.includes("..")) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }
  const { data, error } = await supabase.storage.from("design-assets").createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  return NextResponse.json({ url: data.signedUrl });
}
