import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { authMiddleware } from "../middleware/auth.js";
import type { AppVariables } from "../types.js";

const serviceSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const extract = new Hono<{ Variables: AppVariables }>();

extract.use("*", authMiddleware);

async function getAnthropicClient(userId: string): Promise<Anthropic | null> {
  const { data, error } = await serviceSupabase
    .from("user_profiles")
    .select("anthropic_api_key")
    .eq("id", userId)
    .single();

  if (error || !data?.anthropic_api_key) return null;
  return new Anthropic({ apiKey: data.anthropic_api_key });
}

// POST /extract/words
// 記事テキストから単語・熟語を抽出してJSONで返す
extract.post("/words", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ text: string }>();

  const client = await getAnthropicClient(user.id);
  if (!client) {
    return c.json({ error: "Anthropic APIキーが設定されていません" }, 400);
  }

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    system:
      "あなたは英語教育のスペシャリストです。与えられた英語記事に登場する単語・熟語・表現を全て抽出し、指定のJSON形式のみで返してください。",
    messages: [
      {
        role: "user",
        content: `以下の英語記事に登場する単語・熟語・表現を全て抽出してください。\n説明文や前置きは不要です。JSONのみ返してください。\n\n{\n  "words": [\n    { "en": "...", "ja": "..." }\n  ]\n}\n\n記事:\n${body.text}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = raw.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return c.json({ data: parsed });
  } catch {
    return c.json({ error: "単語の抽出に失敗しました。再試行してください。" }, 500);
  }
});

// POST /extract/commentary
// 記事テキストの解説（構造・文法・翻訳・要約）を生成して返す
extract.post("/commentary", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ text: string }>();

  const client = await getAnthropicClient(user.id);
  if (!client) {
    return c.json({ error: "Anthropic APIキーが設定されていません" }, 400);
  }

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 8192,
    system:
      "あなたは英語教育のスペシャリストです。英語がほとんど読めない日本語話者に向けて、英語記事の詳細な解説を行ってください。専門的な内容の記事も扱うため、背景知識の補足も行ってください。",
    messages: [
      {
        role: "user",
        content: `以下の英語記事を解説してください。\n\n## 構造・文法・翻訳\n文をチャンクに分けて、チャンクごとに「翻訳 → 文法説明」の順で解説してください。\n最後に全文翻訳を記載してください。\n\n## 要約\n記事の内容を日本語で要約してください。\n\n記事:\n${body.text}`,
      },
    ],
  });

  const commentary =
    message.content[0].type === "text" ? message.content[0].text : "";

  return c.json({ data: { commentary } });
});

export default extract;
