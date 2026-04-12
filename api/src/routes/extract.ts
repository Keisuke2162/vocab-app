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
    model: "claude-sonnet-4-6",
    max_tokens: 16384,
    system:
      "あなたは英語教育のスペシャリストです。基本的な英語はわかるが語彙・熟語・表現は乏しい日本語話者向けに、英語記事から学習すべき語彙と表現を漏れなく抽出します。専門的な記事も扱います。指定のJSON形式のみで返してください。",
    messages: [
      {
        role: "user",
        content: `以下の英語記事から、英語学習者が記事内で遭遇する語彙・表現を全て抽出してください。wordsとexpressionsに分けて出力します。\n\n【words】記事中の中級以上の単語・専門用語\n- 超基本単語（go, get, make, have, be, do, say 等の中学1年レベル）以外は全て含める\n- 迷ったら含める\n- 除外: コード・固有名詞のみ\n\n【expressions】記事中の句動詞・接続表現・前置詞句・イディオム（4語以内）を全て出力\n- 除外: "of the", "in a" のような文法的な結合のみ\n\n【日本語訳】簡潔に\n\n説明文や前置きは不要です。JSONのみ返してください。\n\n{\n  "words": [ { "en": "...", "ja": "..." } ],\n  "expressions": [ { "en": "...", "ja": "..." } ]\n}\n\n記事:\n${body.text}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  console.log("[extract/words] raw response:", raw.slice(0, 200));

  // markdownコードブロック除去 or JSON部分を直接抽出
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const cleaned = jsonMatch ? jsonMatch[0] : raw.trim();

  try {
    const parsed = JSON.parse(cleaned);
    // words と expressions を結合して返す
    const words = parsed.words ?? [];
    const expressions = parsed.expressions ?? [];
    return c.json({ data: { words: [...words, ...expressions] } });
  } catch (e) {
    console.error("[extract/words] JSON parse error:", e, "cleaned:", cleaned.slice(0, 200));
    const reason = e instanceof Error ? e.message : String(e);
    return c.json({ error: `単語の抽出に失敗しました: ${reason}` }, 500);
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
