import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import type { JobStatus } from "@/types/database";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    status?: JobStatus;
    result?: Record<string, unknown>;
    error_message?: string | null;
  };

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status !== undefined) update.status = body.status;
  if (body.result !== undefined) update.result = body.result;
  if (body.error_message !== undefined) update.error_message = body.error_message;

  if (body.status === "processing") update.started_at = new Date().toISOString();
  if (body.status === "completed" || body.status === "failed") {
    update.completed_at = new Date().toISOString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: job, error } = await db
    .from("production_jobs")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(job);
}
