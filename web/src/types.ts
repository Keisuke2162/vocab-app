export interface Word {
  id: string;
  en: string;
  ja: string;
  tags: string[];
  source: string | null;
  article_id: string | null;
  quiz_enabled: boolean;
}

export interface Article {
  id: string;
  title: string;
  input_type: "text" | "link";
  url: string | null;
  created_at: string;
}

export interface ArticleWithWords extends Article {
  original_text: string | null;
  translation: string | null;
  commentary: string | null;
  words: Pick<Word, "id" | "en" | "ja" | "tags" | "quiz_enabled">[];
}

export interface Tag {
  id: string;
  name: string;
}

export interface ExtractedWord {
  en: string;
  ja: string;
  quiz_enabled: boolean;
}
