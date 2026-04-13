import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/auth.js";
import type { AppVariables } from "../types.js";

const serviceSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const articles = new Hono<{ Variables: AppVariables }>();

articles.use("*", authMiddleware);

// GET /articles
articles.get("/", async (c) => {
  const user = c.get("user");

  const { data, error } = await serviceSupabase
    .from("articles")
    .select("id, title, input_type, url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// GET /articles/:id
articles.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const { data, error } = await serviceSupabase
    .from("articles")
    .select("*, words(id, en, ja, tags, quiz_enabled)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return c.json({ error: "Not found" }, 404);
    return c.json({ error: error.message }, 500);
  }
  return c.json({ data });
});

// POST /articles
articles.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{
    title: string;
    input_type: "text" | "link";
    url?: string;
    original_text?: string;
    translation?: string;
    commentary?: string;
  }>();

  const { data, error } = await serviceSupabase
    .from("articles")
    .insert({
      user_id: user.id,
      title: body.title,
      input_type: body.input_type,
      url: body.url ?? null,
      original_text: body.original_text ?? null,
      translation: body.translation ?? null,
      commentary: body.commentary ?? null,
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data }, 201);
});

// PATCH /articles/:id
articles.patch("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json<{ commentary?: string }>();

  const { data, error } = await serviceSupabase
    .from("articles")
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

// DELETE /articles/:id
articles.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const { error } = await serviceSupabase
    .from("articles")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

export default articles;
