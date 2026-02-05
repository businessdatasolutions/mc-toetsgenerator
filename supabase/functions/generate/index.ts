import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const SIDECAR_URL = Deno.env.get("SIDECAR_URL") ?? "http://localhost:8000";

interface Specification {
  count: number;
  bloom_level: string;
  learning_goal: string;
  num_options: number;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 13.6a: Validate request body
  let materialId: string;
  let examId: string | null;
  let specification: Specification;
  try {
    const body = await req.json();
    materialId = body.material_id;
    examId = body.exam_id ?? null;
    specification = body.specification;

    if (
      !materialId ||
      typeof materialId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        materialId
      )
    ) {
      return new Response(
        JSON.stringify({
          error: "Invalid or missing material_id (UUID required)",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (
      examId &&
      (typeof examId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          examId
        ))
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid exam_id (UUID required)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!specification || typeof specification !== "object") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid specification object" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { count, bloom_level, learning_goal, num_options } = specification;
    if (
      typeof count !== "number" ||
      count < 1 ||
      count > 20 ||
      !["onthouden", "begrijpen", "toepassen", "analyseren"].includes(
        bloom_level
      ) ||
      typeof learning_goal !== "string" ||
      !learning_goal.trim() ||
      ![3, 4].includes(num_options)
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid specification: count (1-20), bloom_level, learning_goal, num_options (3 or 4) required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing Authorization header" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
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
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify material ownership
  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("id, uploaded_by")
    .eq("id", materialId)
    .single();

  if (materialError || !material) {
    return new Response(JSON.stringify({ error: "Material not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (material.uploaded_by !== user.id) {
    return new Response(
      JSON.stringify({ error: "Forbidden: not the owner of this material" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // 13.6b: Create generation_jobs record using service role
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: job, error: jobError } = await adminClient
    .from("generation_jobs")
    .insert({
      created_by: user.id,
      material_id: materialId,
      exam_id: examId,
      specification,
      status: "pending",
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return new Response(
      JSON.stringify({ error: "Failed to create generation job" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 13.6c: Fire-and-forget POST to sidecar
  try {
    fetch(`${SIDECAR_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: job.id }),
    });
  } catch {
    // Fire-and-forget
  }

  // 13.6d: Return response
  return new Response(
    JSON.stringify({
      job_id: job.id,
      status: "processing",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
