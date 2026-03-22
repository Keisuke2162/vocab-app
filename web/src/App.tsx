import { useState } from "react";
import WordList from "./components/WordList";
import Quiz from "./components/Quiz";
import "./App.css";

type Tab = "list" | "quiz";

export default function App() {
  const [tab, setTab] = useState<Tab>("list");

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
        </nav>
      </header>
      <main>{tab === "list" ? <WordList /> : <Quiz />}</main>
    </div>
  );
}
