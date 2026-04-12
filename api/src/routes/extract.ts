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
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8192,
    system:
      "あなたは英語教育のスペシャリストです。基本的な英語はわかるが語彙・熟語・表現は乏しい日本語話者向けに、英語記事から学習すべき語彙・表現を漏れなく抽出します。専門的な記事も扱います。指定のJSON形式のみで返してください。",
    messages: [
      {
        role: "user",
        content: `以下の英語記事から、英語学習に役立つ単語・熟語・表現を漏れなく全て抽出してください。1記事あたり通常50〜150語程度になるはずです。\n\n【必ず含める】\n1. 中級〜上級の英単語\n   例: "pragmatic", "rationale", "motivation", "shortcoming", "computation", "scope", "payload", "equivalent", "drawback", "failable", "syntax", "explicit", "behavior"\n2. 句動詞・イディオム・汎用表現（4語以内）\n   例: "result in", "lay out", "given that", "allow for", "as part of", "in the meantime", "break apart", "conform to", "not only A but B", "in the way of"\n3. 専門・技術用語\n   例: "implement", "refactor", "breaking change", "asynchronous", "closure"\n\n【除外するもの】\n- 超基本単語のみ（"go", "get", "make", "have", "be", "do", "say" など中学1年レベル）\n- コードそのもの（コードブロック・変数名・関数呼び出しなど）\n- 5語以上の長いフレーズ・完全な文\n- URL・固有名詞（人名・製品名など）\n\n【日本語訳】簡潔に（例: "lay out" → "説明する・提示する"、"result in" → "〜という結果になる"）\n\n説明文や前置きは不要です。JSONのみ返してください。\n\n{\n  "words": [\n    { "en": "...", "ja": "..." }\n  ]\n}\n\n記事:\n${body.text}`,
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
    return c.json({ data: parsed });
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
