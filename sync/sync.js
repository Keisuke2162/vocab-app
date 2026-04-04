import "dotenv/config";
import { Client } from "@notionhq/client";
import { createClient } from "@supabase/supabase-js";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

async function fetchAllNotionPages() {
  const pages = [];
  let cursor = undefined;

  console.log("Notionからデータを取得中...");

  while (true) {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    pages.push(...response.results);
    console.log(`  取得済み: ${pages.length} 件`);

    if (!response.has_more) break;
    cursor = response.next_cursor;
  }

  console.log(`Notion取得完了: 合計 ${pages.length} 件`);
  return pages;
}

function parseNotionPage(page) {
  const props = page.properties;

  const isUnnecessary = props["不要"]?.checkbox ?? false;
  if (isUnnecessary) return null;

  const en =
    props["単語、熟語"]?.title?.map((t) => t.plain_text).join("") ?? "";

  const ja =
    props["日本語訳"]?.rich_text?.map((t) => t.plain_text).join("") ?? "";

  const tags =
    props["選択"]?.multi_select?.map((s) => s.name) ?? [];

  const source = props["出典"]?.select?.name ?? null;

  return { notion_id: page.id, en, ja, tags, source };
}

async function syncToSupabase(records) {
  let upserted = 0;
  let skipped = 0;
  let errors = 0;

  console.log("\nSupabaseへの同期を開始...");

  for (const record of records) {
    if (record === null) {
      console.log("  スキップ (不要フラグあり)");
      skipped++;
      continue;
    }

    if (!record.en.trim() || !record.ja.trim()) {
      console.log(`  スキップ (en/ja が空): notion_id=${record.notion_id}`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from("words").upsert(
      {
        notion_id: record.notion_id,
        en: record.en.trim(),
        ja: record.ja.trim(),
        tags: record.tags,
        source: record.source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "notion_id" }
    );

    if (error) {
      console.error(`  エラー: notion_id=${record.notion_id}`, error.message);
      errors++;
    } else {
      console.log(`  upsert完了: "${record.en}" / "${record.ja}"`);
      upserted++;
    }
  }

  return { upserted, skipped, errors };
}

async function main() {
  console.log("=== Notion → Supabase 同期開始 ===\n");

  const pages = await fetchAllNotionPages();
  const records = pages.map(parseNotionPage);

  const { upserted, skipped, errors } = await syncToSupabase(records);

  console.log("\n=== 同期完了 ===");
  console.log(`  upsert: ${upserted} 件`);
  console.log(`  スキップ: ${skipped} 件`);
  console.log(`  エラー: ${errors} 件`);
}

main().catch((err) => {
  console.error("予期しないエラー:", err);
  process.exit(1);
});
