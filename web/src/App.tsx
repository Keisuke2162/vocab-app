import { useState } from "react";
import WordList from "./components/WordList";
import Quiz from "./components/Quiz";
import ArticleRegister from "./components/ArticleRegister";
import Login from "./components/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import "./App.css";

type Tab = "list" | "quiz" | "register";

function AppContent() {
  const [tab, setTab] = useState<Tab>("list");
  const { user, loading, signOut } = useAuth();

  if (loading) return <p className="status">読み込み中...</p>;
  if (!user) return <Login />;

  return (
    <div className="app">
      <header>
        <h1>Vocab App</h1>
        <nav>
          <button
            className={tab === "list" ? "active" : ""}
            onClick={() => setTab("list")}
          >
            一覧
          </button>
          <button
            className={tab === "quiz" ? "active" : ""}
            onClick={() => setTab("quiz")}
          >
            クイズ
          </button>
          <button
            className={tab === "register" ? "active" : ""}
            onClick={() => setTab("register")}
          >
            記事登録
          </button>
        </nav>
        <button className="signout-btn" onClick={signOut}>
          ログアウト
        </button>
      </header>
      <main>
        {tab === "list" && <WordList />}
        {tab === "quiz" && <Quiz />}
        {tab === "register" && <ArticleRegister />}
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
