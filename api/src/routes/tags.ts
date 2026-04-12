import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/auth.js";
import type { AppVariables } from "../types.js";

const serviceSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const tags = new Hono<{ Variables: AppVariables }>();

tags.use("*", authMiddleware);

// GET /tags
tags.get("/", async (c) => {
  const user = c.get("user");

  const { data, error } = await serviceSupabase
    .from("tags")
    .select("id, name, created_at")
    .eq("user_id", user.id)
    .order("name");

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// POST /tags
tags.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ name: string }>();

  const { data, error } = await serviceSupabase
    .from("tags")
    .insert({ user_id: user.id, name: body.name })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return c.json({ error: "このタグはすでに存在します" }, 409);
    }
    return c.json({ error: error.message }, 500);
  }
  return c.json({ data }, 201);
});

// DELETE /tags/:id
tags.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const { error } = await serviceSupabase
    .from("tags")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

export default tags;
