import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 7.4a: Parse query params
  const url = new URL(req.url);
  const examId = url.searchParams.get("exam_id");
  const format = url.searchParams.get("format") ?? "csv";

  if (
    !examId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      examId
    )
  ) {
    return new Response(
      JSON.stringify({ error: "Invalid or missing exam_id (UUID required)" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!["csv", "markdown", "pdf"].includes(format)) {
    return new Response(
      JSON.stringify({
        error: "Invalid format. Supported: csv, markdown, pdf",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
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

  // Verify ownership
  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("id, title, created_by")
    .eq("id", examId)
    .single();

  if (examError || !exam) {
    return new Response(JSON.stringify({ error: "Exam not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (exam.created_by !== user.id) {
    return new Response(
      JSON.stringify({ error: "Forbidden: not the owner of this exam" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // 7.4b: Fetch questions + assessments
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("*, assessments(*)")
    .eq("exam_id", examId)
    .order("position", { ascending: true });

  if (questionsError) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch questions" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 7.4c & 7.4d: Generate export
  if (format === "csv") {
    return generateCsv(exam, questions ?? []);
  } else if (format === "markdown") {
    return generateMarkdown(exam, questions ?? []);
  } else {
    // PDF not yet implemented — return error for now
    return new Response(
      JSON.stringify({ error: "PDF export not yet implemented" }),
      { status: 501, headers: { "Content-Type": "application/json" } }
    );
  }
});

interface Question {
  id: string;
  stem: string;
  options: { text: string; position: number; is_correct: boolean }[];
  position: number;
  assessments: Assessment[];
}

interface Assessment {
  bet_score: number | null;
  tech_kwal_score: number | null;
  val_score: number | null;
  tech_kwant_flags: string[];
  bet_toelichting: string | null;
  tech_toelichting: string | null;
  val_toelichting: string | null;
}

function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function generateCsv(
  exam: { title: string },
  questions: Question[]
): Response {
  const headers = [
    "Nr",
    "Stam",
    "Aantal opties",
    "Correct antwoord",
    "Betrouwbaarheid (1-5)",
    "Technisch (1-5)",
    "Validiteit (1-5)",
    "Flags",
  ];

  const rows = questions.map((q, i) => {
    const a = q.assessments?.[0];
    const correctOpt = q.options?.find((o) => o.is_correct);
    return [
      String(i + 1),
      escapeCsv(q.stem ?? ""),
      String(q.options?.length ?? 0),
      escapeCsv(correctOpt?.text ?? ""),
      a?.bet_score != null ? String(a.bet_score) : "",
      a?.tech_kwal_score != null ? String(a.tech_kwal_score) : "",
      a?.val_score != null ? String(a.val_score) : "",
      escapeCsv((a?.tech_kwant_flags ?? []).join("; ")),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `${exam.title ?? "export"}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function generateMarkdown(
  exam: { title: string },
  questions: Question[]
): Response {
  const lines: string[] = [`# ${exam.title ?? "Export"}`, ""];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const a = q.assessments?.[0];
    lines.push(`## Vraag ${i + 1}`);
    lines.push("");
    lines.push(`**Stam:** ${q.stem}`);
    lines.push("");

    if (q.options) {
      for (const opt of q.options) {
        const marker = opt.is_correct ? " **(correct)**" : "";
        lines.push(
          `- ${String.fromCharCode(65 + opt.position)}. ${opt.text}${marker}`
        );
      }
    }
    lines.push("");

    if (a) {
      lines.push("| Dimensie | Score |");
      lines.push("|----------|-------|");
      lines.push(
        `| Betrouwbaarheid | ${a.bet_score != null ? a.bet_score : "-"} |`
      );
      lines.push(
        `| Technisch | ${a.tech_kwal_score != null ? a.tech_kwal_score : "-"} |`
      );
      lines.push(
        `| Validiteit | ${a.val_score != null ? a.val_score : "-"} |`
      );
      if (a.tech_kwant_flags?.length) {
        lines.push("");
        lines.push(`**Flags:** ${a.tech_kwant_flags.join(", ")}`);
      }
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  const md = lines.join("\n");
  const filename = `${exam.title ?? "export"}.md`;

  return new Response(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
