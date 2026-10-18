import type { SupabaseClient } from "npm:@supabase/supabase-js@2.117.3";
import { STUDENT_ACTIONS, type Action } from "./schema.ts";
import { buildPrompt, buildStudentPrompt, localized, STUDENT_SYSTEM, type Row } from "./prompts.ts";
import { validate, type Lang, type PdfFile } from "./validation.ts";
import { json, readJson, PayloadTooLarge, preflight } from "./http.ts";
import { dailyLimit, reserveRequest } from "./usage.ts";
import { GeminiError } from "./provider.ts";

export function createHandler(deps: {
  configured: boolean;
  userClient: (auth: string) => SupabaseClient;
  adminClient: () => SupabaseClient;
  generate: (action: Action, prompt: string, pdf?: PdfFile, system?: string) => Promise<unknown>;
}) {
 return async (req: Request): Promise<Response> => {
  try {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  const userClient = deps.userClient(auth);
  const { data: userData } = await userClient.auth.getUser();
  const user = userData?.user;
  if (!user) return json({ error: "unauthorized" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await readJson(req);
  } catch (err) {
    return json({ error: "bad_request" }, err instanceof PayloadTooLarge ? 413 : 400);
  }
  const admin = deps.adminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, interests, country, about, plan, account_type, is_admin")
    .eq("id", user.id)
    .single();
  // Today's uses so far (ai_usage.day is the database's current_date, UTC).
  const usedToday = async () => {
    const { data } = await admin.from("ai_usage").select("count").eq("user_id", user.id).eq("day", new Date().toISOString().slice(0, 10)).maybeSingle();
    return ((data as { count?: number } | null)?.count ?? 0) as number;
  };

  if (body.action === "status") {
    if (!profile) return json({ configured: deps.configured });
    const limit = dailyLimit(profile);
    return json({ configured: deps.configured, limit, remaining: Math.max(0, limit - (await usedToday())) });
  }
  if (!deps.configured) return json({ error: "not_configured" }, 503);

  const invalid = validate(body);
  if (invalid) return json({ error: "bad_request", detail: invalid }, 400);

  if (!profile) return json({ error: "premium_required" }, 403);
  const isStudentAction = STUDENT_ACTIONS.includes(body.action as string);
  // Account type selects the tools; every account has 10 free AI uses per day.
  if (!profile.is_admin) {
    if (isStudentAction && !(profile.account_type === "student")) return json({ error: "student_required" }, 403);
    if (!isStudentAction && profile.account_type === "student") return json({ error: "premium_required" }, 403);
  }

  if (isStudentAction) {
    // Read on its own: if supabase/app.sql (Student section, v2) hasn't been run yet the
    // column is missing, and the advisor still works without the preferences.
    const { data: prefsRow } = await admin.from("profiles").select("student_prefs").eq("id", user.id).maybeSingle();
    (profile as Row).student_prefs = (prefsRow as Row | null)?.student_prefs ?? {};
    const lang = (body.lang as Lang) === "en" ? "en" : "az";
    const target = body.target as { kind: "scholarship" | "university"; id: string } | undefined;
    const needsCatalogue = body.action === "student_plan" || body.action === "student_ask";
    const [sch, uni, tgt] = await Promise.all([
      needsCatalogue ? admin.from("scholarships").select("*").order("sort") : Promise.resolve({ data: [] }),
      needsCatalogue ? admin.from("universities").select("*").order("sort") : Promise.resolve({ data: [] }),
      target ? admin.from(target.kind === "scholarship" ? "scholarships" : "universities").select("*").eq("id", target.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    if (target && !tgt.data) return json({ error: "not_found" }, 404);
    // The plan only needs what the student can apply to at their level.
    const level = (((profile as Row).student_prefs ?? {}) as Row).level as string | undefined;
    const atLevel = (r: Row) => !level || body.action !== "student_plan" || (r.levels as string[]).includes(level);
    const scholarships = ((sch.data ?? []) as Row[]).filter(atLevel).map((r) => localized(r, lang));
    const universities = ((uni.data ?? []) as Row[]).filter(atLevel).map((r) => localized(r, lang));

    const reservation = await reserveRequest(admin, user.id, body.action as Action);
    if (reservation.response) return reservation.response;
    try {
      const prompt = buildStudentPrompt(body.action as Action, profile, scholarships, universities, tgt.data ? localized(tgt.data as Row, lang) : null, body);
      const result = await deps.generate(body.action as Action, prompt, undefined, STUDENT_SYSTEM);
      return json({ result, remaining: reservation.remaining });
    } catch (err) {
      if (err instanceof GeminiError) {
        console.error(err.message);
        const status = { busy: 503, refused: 422, too_long: 422, empty: 502, server_error: 502 }[err.code];
        return json({ error: err.code, ...(profile.is_admin ? { detail: err.message } : {}) }, status);
      }
      console.error(err);
      return json({ error: "server_error", ...(profile.is_admin ? { detail: String(err) } : {}) }, 500);
    }
  }

  const { data: opportunity } = await userClient.from("opportunities").select("*").eq("id", body.opportunityId).single();
  if (!opportunity || (!opportunity.published && !profile.is_admin)) return json({ error: "not_found" }, 404);

  const action = body.action as "questions" | "draft" | "review";
  const reservation = await reserveRequest(admin, user.id, action);
  if (reservation.response) return reservation.response;

  // Read on its own so the assistant still works if supabase/app.sql (prefs) hasn't been run yet.
  const { data: prefsRow } = await admin.from("profiles").select("prefs").eq("id", user.id).maybeSingle();
  (profile as Row).prefs = (prefsRow as Row | null)?.prefs ?? {};
  try {
    const pdf = action === "review" && body.file ? (body.file as PdfFile) : undefined;
    const result = await deps.generate(action, buildPrompt(action, opportunity, profile, body), pdf);
    return json({ result, remaining: reservation.remaining });
  } catch (err) {
    if (err instanceof GeminiError) {
      console.error(err.message);
      const status = { busy: 503, refused: 422, too_long: 422, empty: 502, server_error: 502 }[err.code];
      return json({ error: err.code, ...(profile.is_admin ? { detail: err.message } : {}) }, status);
    }
    console.error(err);
    return json({ error: "server_error", ...(profile.is_admin ? { detail: String(err) } : {}) }, 500);
  }
  } catch {
    console.error("ai: request failed");
    return json({ error: "server_error" }, 500);
  }
 };
}
