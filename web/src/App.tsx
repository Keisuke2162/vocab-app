import { useState } from "react";
import WordList from "./components/WordList";
import Quiz from "./components/Quiz";
import ArticleRegister from "./components/ArticleRegister";
import ArticleList from "./components/ArticleList";
import ArticleDetail from "./components/ArticleDetail";
import Management from "./components/Management";
import Login from "./components/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import "./App.css";

type Tab = "list" | "quiz" | "articles" | "register" | "manage";

function AppContent() {
  const [tab, setTab] = useState<Tab>("list");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  if (loading) return <p className="status">読み込み中...</p>;
  if (!user) return <Login />;

  const navigate = (next: Tab) => {
    setTab(next);
    setMenuOpen(false);
    if (next !== "articles") setSelectedArticleId(null);
  };

  return (
    <div className="app">
      <header>
        <h1>Vocab App</h1>
        <nav className={menuOpen ? "nav-open" : ""}>
          <button
            className={tab === "list" ? "active" : ""}
            onClick={() => navigate("list")}
          >
            一覧
          </button>
          <button
            className={tab === "quiz" ? "active" : ""}
            onClick={() => navigate("quiz")}
          >
            クイズ
          </button>
          <button
            className={tab === "articles" ? "active" : ""}
            onClick={() => { navigate("articles"); setSelectedArticleId(null); }}
          >
            記事
          </button>
          <button
            className={tab === "register" ? "active" : ""}
            onClick={() => navigate("register")}
          >
            記事登録
          </button>
          <button
            className={tab === "manage" ? "active" : ""}
            onClick={() => navigate("manage")}
          >
            管理
          </button>
          <button className="signout-btn nav-signout" onClick={signOut}>
            ログアウト
          </button>
        </nav>
        <div className="header-right">
          <button className="signout-btn" onClick={signOut}>
            ログアウト
          </button>
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="メニュー"
          >
            <span className={menuOpen ? "bar bar-top open" : "bar bar-top"} />
            <span className={menuOpen ? "bar bar-mid open" : "bar bar-mid"} />
            <span className={menuOpen ? "bar bar-bot open" : "bar bar-bot"} />
          </button>
        </div>
      </header>
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)} />}
      <main>
        {tab === "list" && <WordList />}
        {tab === "quiz" && <Quiz />}
        {tab === "articles" && !selectedArticleId && (
          <ArticleList onSelect={(id) => setSelectedArticleId(id)} />
        )}
        {tab === "articles" && selectedArticleId && (
          <ArticleDetail
            articleId={selectedArticleId}
            onBack={() => setSelectedArticleId(null)}
          />
        )}
        {tab === "register" && <ArticleRegister />}
        {tab === "manage" && <Management />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
