import { useState } from "react";
import TagManager from "./TagManager";
import ArticleList from "./ArticleList";
import ArticleDetail from "./ArticleDetail";
import Settings from "./Settings";

type ManagementTab = "articles" | "tags" | "settings";

export default function Management() {
  const [tab, setTab] = useState<ManagementTab>("articles");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  return (
    <div>
      <div className="sub-nav">
        <button
          className={tab === "articles" ? "active" : ""}
          onClick={() => { setTab("articles"); setSelectedArticleId(null); }}
        >
          記事一覧
        </button>
        <button
          className={tab === "tags" ? "active" : ""}
          onClick={() => setTab("tags")}
        >
          タグ管理
        </button>
        <button
          className={tab === "settings" ? "active" : ""}
          onClick={() => setTab("settings")}
        >
          設定
        </button>
      </div>

      {tab === "tags" && <TagManager />}

      {tab === "settings" && <Settings />}

      {tab === "articles" && !selectedArticleId && (
        <ArticleList onSelect={(id) => setSelectedArticleId(id)} />
      )}

      {tab === "articles" && selectedArticleId && (
        <ArticleDetail
          articleId={selectedArticleId}
          onBack={() => setSelectedArticleId(null)}
        />
      )}
    </div>
  );
}
