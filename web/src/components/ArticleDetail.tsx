import { useEffect, useState } from "react";
import type { ArticleWithWords } from "../types";
import { fetchArticle, patchWord } from "../api";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  articleId: string;
  onBack: () => void;
}

export default function ArticleDetail({ articleId, onBack }: Props) {
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const [article, setArticle] = useState<ArticleWithWords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchArticle(token, articleId)
      .then(setArticle)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, articleId]);

  const handleToggleQuiz = async (wordId: string, current: boolean) => {
    if (!article) return;
    await patchWord(token, wordId, { quiz_enabled: !current });
    setArticle((prev) =>
      prev
        ? {
            ...prev,
            words: prev.words.map((w) =>
              w.id === wordId ? { ...w, quiz_enabled: !current } : w
            ),
          }
        : prev
    );
  };

  if (loading) return <p className="status">読み込み中...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!article) return null;

  return (
    <div className="article-detail">
      <button className="btn-back" onClick={onBack}>← 記事一覧</button>

      <h2 className="article-detail-title">{article.title}</h2>
      <p className="article-detail-date">
        {new Date(article.created_at).toLocaleDateString("ja-JP")}
      </p>

      {article.commentary ? (
        <section className="detail-section">
          <h3 className="detail-section-title">解説</h3>
          <pre className="commentary-text">{article.commentary}</pre>
        </section>
      ) : (
        <section className="detail-section">
          <h3 className="detail-section-title">解説</h3>
          <p className="status">解説はまだ生成されていません</p>
        </section>
      )}

      <section className="detail-section">
        <h3 className="detail-section-title">登録単語（{article.words.length}語）</h3>
        {article.words.length === 0 ? (
          <p className="status">単語がありません</p>
        ) : (
          <table className="word-table">
            <thead>
              <tr>
                <th>クイズ</th>
                <th>英語</th>
                <th>日本語</th>
              </tr>
            </thead>
            <tbody>
              {article.words.map((w) => (
                <tr key={w.id} className={w.quiz_enabled ? "" : "quiz-off"}>
                  <td className="quiz-check">
                    <input
                      type="checkbox"
                      checked={w.quiz_enabled}
                      onChange={() => handleToggleQuiz(w.id, w.quiz_enabled)}
                    />
                  </td>
                  <td>{w.en}</td>
                  <td>{w.ja}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
