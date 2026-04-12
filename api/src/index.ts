import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import words from "./routes/words.js";
import articles from "./routes/articles.js";
import tags from "./routes/tags.js";
import extract from "./routes/extract.js";

const app = new Hono();

app.use("*", cors());

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.route("/words", words);
app.route("/articles", articles);
app.route("/tags", tags);
app.route("/extract", extract);

const port = Number(process.env.PORT) || 3000;

serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`);
});
