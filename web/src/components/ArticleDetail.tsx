import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { ArticleWithWords } from "../types";
import { fetchArticle, patchWord, extractCommentary, patchArticle } from "../api";
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
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

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

  const runGenerateCommentary = async () => {
    if (!article?.original_text) return;
    setGenerating(true);
    setGenerateError("");
    try {
      const commentary = await extractCommentary(token, article.original_text);
      await patchArticle(token, article.id, { commentary });
      setArticle((prev) => prev ? { ...prev, commentary } : prev);
    } catch (e: unknown) {
      setGenerateError(e instanceof Error ? e.message : "解説の生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateCommentary = () => runGenerateCommentary();

  const handleRegenerateCommentary = () => {
    if (!window.confirm("解説を再生成しますか？\n現在の解説は上書きされます。")) return;
    runGenerateCommentary();
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

      <section className="detail-section">
        <div className="detail-section-header">
          <h3 className="detail-section-title">解説</h3>
          {article.commentary && article.original_text && (
            <button
              className="regenerate-commentary-btn"
              onClick={handleRegenerateCommentary}
              disabled={generating}
            >
              {generating ? "生成中..." : "再生成"}
            </button>
          )}
        </div>
        {generating && article.commentary && (
          <p className="status">生成中...</p>
        )}
        {article.commentary && !generating ? (
          <div className="commentary-text">
            <ReactMarkdown>{article.commentary}</ReactMarkdown>
          </div>
        ) : !article.commentary ? (
          <>
            {article.original_text ? (
              <button
                className="generate-commentary-btn"
                onClick={handleGenerateCommentary}
                disabled={generating}
              >
                {generating ? "生成中..." : "解説を生成する"}
              </button>
            ) : (
              <p className="status">元の記事テキストがないため解説を生成できません</p>
            )}
          </>
        ) : null}
        {generateError && <p className="error">{generateError}</p>}
      </section>

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
