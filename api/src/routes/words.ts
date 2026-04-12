import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/auth.js";
import type { AppVariables } from "../types.js";

const serviceSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const words = new Hono<{ Variables: AppVariables }>();

// GET /words
words.get("/", async (c) => {
  const tag = c.req.query("tags");
  const source = c.req.query("source");
  const userId = c.req.query("user_id");

  let query = serviceSupabase
    .from("words")
    .select("id, en, ja, tags, source, article_id, quiz_enabled");

  if (userId) {
    query = query.eq("user_id", userId);
  }
  if (tag) {
    query = query.contains("tags", [tag]);
  }
  if (source) {
    query = query.eq("source", source);
  }

  const { data, error } = await query;

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// GET /words/tags
words.get("/tags", async (c) => {
  const { data, error } = await serviceSupabase.rpc("get_distinct_tags");
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// GET /words/sources
words.get("/sources", async (c) => {
  const { data, error } = await serviceSupabase.rpc("get_distinct_sources");
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// GET /words/:id
words.get("/:id", async (c) => {
  const id = c.req.param("id");

  const { data, error } = await serviceSupabase
    .from("words")
    .select("id, en, ja, tags, source, article_id, quiz_enabled")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return c.json({ error: "Not found" }, 404);
    return c.json({ error: error.message }, 500);
  }
  return c.json({ data });
});

// POST /words
words.post("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{
    en: string;
    ja: string;
    tags?: string[];
    source?: string;
    article_id?: string;
    quiz_enabled?: boolean;
  }>();

  const { data, error } = await serviceSupabase
    .from("words")
    .insert({
      user_id: user.id,
      en: body.en,
      ja: body.ja,
      tags: body.tags ?? [],
      source: body.source ?? null,
      article_id: body.article_id ?? null,
      quiz_enabled: body.quiz_enabled ?? true,
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data }, 201);
});

// PATCH /words/:id
words.patch("/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json<{
    en?: string;
    ja?: string;
    tags?: string[];
    quiz_enabled?: boolean;
  }>();

  const { data, error } = await serviceSupabase
    .from("words")
    .update(body)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") return c.json({ error: "Not found" }, 404);
    return c.json({ error: error.message }, 500);
  }
  return c.json({ data });
});

// DELETE /words/:id
words.delete("/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const { error } = await serviceSupabase
    .from("words")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

export default words;
