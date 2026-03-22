import { useEffect, useState, useCallback } from "react";
import type { Word } from "../types";
import { fetchWords } from "../api";

type Mode = "en-ja" | "ja-en";
type QuizState = "loading" | "question" | "result";

interface AnswerRecord {
  question: Word;
  isCorrect: boolean;
}

const MAX_QUESTIONS = 20;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildChoices(correct: Word, all: Word[]): Word[] {
  const others = all.filter((w) => w.id !== correct.id);
  const wrong = shuffle(others).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

export default function Quiz() {
  const [mode, setMode] = useState<Mode>("en-ja");
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [questions, setQuestions] = useState<Word[]>([]);
  const [choices, setChoices] = useState<Word[][]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<QuizState>("loading");
  const [error, setError] = useState<string | null>(null);

  const startQuiz = useCallback((words: Word[]) => {
    const qs = shuffle(words).slice(0, MAX_QUESTIONS);
    const cs = qs.map((q) => buildChoices(q, words));
    setQuestions(qs);
    setChoices(cs);
    setCurrentIndex(0);
    setRecords([]);
    setSelected(null);
    setQuizState("question");
  }, []);

  useEffect(() => {
    fetchWords()
      .then((words) => {
        setAllWords(words);
        startQuiz(words);
      })
      .catch((e: Error) => {
        setError(e.message);
      });
  }, [startQuiz]);

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
      } else {
        setCurrentIndex((i) => i + 1);
        setSelected(null);
      }
    }, 900);
  };

  if (error) return <p className="error">{error}</p>;
  if (quizState === "loading") return <p className="status">読み込み中...</p>;

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

        <button className="restart-btn" onClick={() => startQuiz(allWords)}>
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
