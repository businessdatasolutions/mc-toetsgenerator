import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const SIDECAR_URL = Deno.env.get("SIDECAR_URL") ?? "http://localhost:8000";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 7.2a: Validate request body
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let examId: string;
  let questionId: string | undefined;
  try {
    const body = await req.json();
    examId = body.exam_id;
    if (!examId || typeof examId !== "string" || !uuidRegex.test(examId)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing exam_id (UUID required)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (body.question_id) {
      if (typeof body.question_id !== "string" || !uuidRegex.test(body.question_id)) {
        return new Response(
          JSON.stringify({ error: "Invalid question_id (UUID required)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      questionId = body.question_id;
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 7.2b: Check auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing Authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 7.2c: Verify ownership
  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("id, created_by")
    .eq("id", examId)
    .single();

  if (examError || !exam) {
    return new Response(
      JSON.stringify({ error: "Exam not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (exam.created_by !== user.id) {
    return new Response(
      JSON.stringify({ error: "Forbidden: not the owner of this exam" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const sidecarBody: Record<string, string> = { exam_id: examId };

  // Single-question re-analysis: skip exam status changes
  if (!questionId) {
    // Get question count
    const { count } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("exam_id", examId);

    // 7.2d: Update status to processing
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    await adminClient
      .from("exams")
      .update({
        analysis_status: "processing",
        question_count: count ?? 0,
        questions_analyzed: 0,
      })
      .eq("id", examId);
  } else {
    sidecarBody.question_id = questionId;
  }

  // 7.2e: POST to sidecar (must await to ensure request is sent before worker exits)
  try {
    const sidecarResp = await fetch(`${SIDECAR_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sidecarBody),
    });
    if (!sidecarResp.ok) {
      console.error(`Sidecar returned ${sidecarResp.status}`);
    }
  } catch (err) {
    console.error("Sidecar fetch failed:", err);
  }

  // 7.2f: Return response
  return new Response(
    JSON.stringify({
      job_id: questionId ?? examId,
      status: "processing",
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
