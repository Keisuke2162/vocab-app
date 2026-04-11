import { useEffect, useState, useCallback } from "react";
import type { Word } from "../types";
import { fetchWords, fetchTags, fetchSources } from "../api";

type Mode = "en-ja" | "ja-en";
type QuizState = "loading" | "setup" | "question" | "result";

interface AnswerRecord {
  question: Word;
  isCorrect: boolean;
}

type QuestionCount = 5 | 10 | 20 | 50 | "unlimited";
const QUESTION_COUNT_OPTIONS: QuestionCount[] = [5, 10, 20, 50, "unlimited"];
const CHOICE_COUNT_OPTIONS = [4, 5, 6, 7, 8, 9, 10];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildChoices(correct: Word, all: Word[], count: number): Word[] {
  const others = all.filter((w) => w.id !== correct.id);
  const wrong = shuffle(others).slice(0, count - 1);
  return shuffle([correct, ...wrong]);
}

export default function Quiz() {
  const [mode, setMode] = useState<Mode>("en-ja");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [sources, setSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [questionCount, setQuestionCount] = useState<QuestionCount>(20);
  const [choiceCount, setChoiceCount] = useState<number>(4);
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [filteredWords, setFilteredWords] = useState<Word[]>([]);
  const [questions, setQuestions] = useState<Word[]>([]);
  const [choices, setChoices] = useState<Word[][]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<QuizState>("loading");
  const [error, setError] = useState<string | null>(null);

  const startQuiz = useCallback((words: Word[], count: number, qCount: QuestionCount) => {
    const limit = qCount === "unlimited" ? words.length : qCount;
    const qs = shuffle(words).slice(0, limit);
    const cs = qs.map((q) => buildChoices(q, words, count));
    setQuestions(qs);
    setChoices(cs);
    setCurrentIndex(0);
    setRecords([]);
    setSelected(null);
    setQuizState("question");
  }, []);

  useEffect(() => {
    Promise.all([fetchWords(), fetchTags(), fetchSources()])
      .then(([words, fetchedTags, fetchedSources]) => {
        setAllWords(words);
        setFilteredWords(words);
        setTags(fetchedTags);
        setSources(fetchedSources);
        setQuizState("setup");
      })
      .catch((e: Error) => {
        setError(e.message);
      });
  }, []);

  useEffect(() => {
    let words = allWords;
    if (selectedTag !== "all") {
      words = words.filter((w) => w.tags.includes(selectedTag));
    }
    if (selectedSource !== "all") {
      words = words.filter((w) => w.source === selectedSource);
    }
    setFilteredWords(words);
  }, [selectedTag, selectedSource, allWords]);

  const handleSelect = (wordId: string) => {
    if (selected !== null) return;

    (document.activeElement as HTMLElement)?.blur();

    const question = questions[currentIndex];
    const isCorrect = wordId === question.id;

    setSelected(wordId);
    setRecords((prev) => [...prev, { question, isCorrect }]);

    setTimeout(() => {
      if (currentIndex + 1 >= questions.length) {
        setQuizState("result");
        window.scrollTo({ top: 0 });
      } else {
        setCurrentIndex((i) => i + 1);
        setSelected(null);
        window.scrollTo({ top: 0 });
      }
    }, 900);
  };

  if (error) return <p className="error">{error}</p>;
  if (quizState === "loading") return <p className="status">読み込み中...</p>;

  if (quizState === "setup") {
    const canStart = filteredWords.length >= choiceCount;
    return (
      <div className="quiz-setup">
        <div className="setup-section">
          <p className="setup-label">カテゴリ</p>
          <select
            className="setup-select"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
          >
            <option value="all">すべて</option>
            {tags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="setup-section">
          <p className="setup-label">出典</p>
          <select
            className="setup-select"
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
          >
            <option value="all">すべて</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="setup-section">
          <p className="setup-label">問題数</p>
          <select
            className="setup-select"
            value={questionCount}
            onChange={(e) => {
              const v = e.target.value;
              setQuestionCount(v === "unlimited" ? "unlimited" : (Number(v) as QuestionCount));
            }}
          >
            {QUESTION_COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>{n === "unlimited" ? "無制限" : `${n}問`}</option>
            ))}
          </select>
        </div>

        <div className="setup-section">
          <p className="setup-label">択数</p>
          <select
            className="setup-select"
            value={choiceCount}
            onChange={(e) => setChoiceCount(Number(e.target.value))}
          >
            {CHOICE_COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}択</option>
            ))}
          </select>
        </div>

        {!canStart && (
          <p className="error">
            単語数（{filteredWords.length}件）が択数（{choiceCount}）より少ないため開始できません
          </p>
        )}

        <button
          className="start-btn"
          onClick={() => startQuiz(filteredWords, choiceCount, questionCount)}
          disabled={!canStart}
        >
          スタート
        </button>
      </div>
    );
  }

  if (quizState === "result") {
    const score = records.filter((r) => r.isCorrect).length;
    return (
      <div className="quiz-result">
        <h2>結果</h2>
        <p className="score">
          {score} <span>/ {records.length}</span>
        </p>

        <table className="result-table">
          <thead>
            <tr>
              <th></th>
              <th>英語</th>
              <th>日本語</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i} className={r.isCorrect ? "" : "row-wrong"}>
                <td className="verdict">{r.isCorrect ? "✓" : "✗"}</td>
                <td>{r.question.en}</td>
                <td>{r.question.ja}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button className="restart-btn" onClick={() => setQuizState("setup")}>
          もう一度
        </button>
      </div>
    );
  }

  const current = questions[currentIndex];
  const currentChoices = choices[currentIndex];
  const question = mode === "en-ja" ? current.en : current.ja;

  return (
    <div className="quiz">
      <div className="quiz-header">
        <div className="mode-toggle">
          <button
            className={mode === "en-ja" ? "active" : ""}
            onClick={() => setMode("en-ja")}
          >
            英→日
          </button>
          <button
            className={mode === "ja-en" ? "active" : ""}
            onClick={() => setMode("ja-en")}
          >
            日→英
          </button>
        </div>
        <span className="progress">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <div className="question">
        <p>{question}</p>
        {current.source && <span className="question-source">{current.source}</span>}
      </div>

      <div className="choices">
        {currentChoices.map((choice) => {
          const isSelected = selected === choice.id;
          const isCorrect = choice.id === current.id;
          let cls = "choice";
          if (selected !== null) {
            if (isCorrect) cls += " correct";
            else if (isSelected) cls += " wrong";
          }
          return (
            <button
              key={choice.id}
              className={cls}
              onClick={() => handleSelect(choice.id)}
              disabled={selected !== null}
            >
              {mode === "en-ja" ? choice.ja : choice.en}
            </button>
          );
        })}
      </div>
    </div>
  );
}
