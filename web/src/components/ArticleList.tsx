import { useEffect, useState } from "react";
import type { Article } from "../types";
import { fetchArticles, deleteArticle } from "../api";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  onSelect: (id: string) => void;
}

export default function ArticleList({ onSelect }: Props) {
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchArticles(token)
      .then(setArticles)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`「${article.title}」を削除しますか？\n関連する単語もすべて削除されます。`)) return;
    try {
      await deleteArticle(token, article.id);
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  if (loading) return <p className="status">読み込み中...</p>;
  if (error) return <p className="error">{error}</p>;

  if (articles.length === 0) {
    return <p className="status">登録した記事がまだありません</p>;
  }

  return (
    <ul className="article-list">
      {articles.map((a) => (
        <li key={a.id} className="article-list-item" onClick={() => onSelect(a.id)}>
          <div className="article-list-info">
            <span className="article-list-title">{a.title}</span>
            <span className="article-list-date">
              {new Date(a.created_at).toLocaleDateString("ja-JP")}
            </span>
          </div>
          <button
            className="btn-delete-sm"
            onClick={(e) => handleDelete(a, e)}
          >
            削除
          </button>
        </li>
      ))}
    </ul>
  );
}
