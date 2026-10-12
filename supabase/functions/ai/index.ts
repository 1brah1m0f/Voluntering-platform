// The entry point only wires runtime configuration and dependencies.
import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import { createHandler } from "./handler.ts";
import { createGemini } from "./provider.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const key = Deno.env.get("GEMINI_API_KEY") ?? "";
Deno.serve(createHandler({
  configured: key !== "",
  userClient: (authorization) => createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } }, auth: { persistSession: false },
  }),
  adminClient: () => createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } }),
  generate: createGemini(key, Deno.env.get("GEMINI_MODEL") || "gemini-3.1-flash-lite"),
}));
