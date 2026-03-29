import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const words = new Hono();

// GET /words
words.get("/", async (c) => {
  const tag = c.req.query("tags");

  let query = supabase.from("words").select("id, en, ja, tags");

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ data });
});

// GET /words/tags
words.get("/tags", async (c) => {
  const { data, error } = await supabase.rpc("get_distinct_tags");

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ data });
});

// GET /words/:id
words.get("/:id", async (c) => {
  const id = c.req.param("id");

  const { data, error } = await supabase
    .from("words")
    .select("id, en, ja, tags")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json({ error: error.message }, 500);
  }

  return c.json({ data });
});

export default words;
