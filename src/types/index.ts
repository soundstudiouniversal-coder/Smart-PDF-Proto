export interface BoundingBox {
  leftPercent: number; // 0 to 100% of page width
  topPercent: number;  // 0 to 100% of page height
  widthPercent: number;
  heightPercent: number;
}

export interface LineItem {
  id: string; // e.g. "p1-l0"
  pageNumber: number;
  paragraphId: string;
  lineIndex: number;
  lineText: string;
  box: BoundingBox;
}

export interface ParagraphItem {
  id: string; // e.g. "para-0"
  pageNumber: number;
  paragraphIndex: number;
  text: string;
  lineIds: string[];
  subtopicHeading: string;
  box: BoundingBox;
}

export interface SubtopicHeading {
  id: string;
  title: string;
  pageNumber: number;
  paragraphId: string;
}

export type StudyLanguage = 'English' | 'Tamil' | 'Telugu';

export interface KeyTerm {
  term: string;
  meaning: string;
}

export interface ExamQuestion {
  question: string;
  answer: string;
}

export interface ParagraphAnalysis {
  paragraphId: string;
  pageNumber: number;
  paragraphIndex: number;
  language?: StudyLanguage;
  explanation: string;
  keyTerms: KeyTerm[];
  examNotes: string[];
  examQuestion: ExamQuestion;
  cachedAt?: number;
}

export interface DocumentSummaryTheme {
  theme: string;
  keyTakeaways: string[];
}

export interface DocumentSummary {
  title: string;
  language?: StudyLanguage;
  executiveSummary: string;
  coreThemes: DocumentSummaryTheme[];
  topExamTips: string[];
  highYieldDefinitions: Array<{
    term: string;
    definition: string;
  }>;
}

export interface SavedNote {
  id: string;
  paragraphId: string;
  pageNumber: number;
  subtopic: string;
  language?: StudyLanguage;
  paragraphSnippet: string;
  explanation: string;
  keyTerms: KeyTerm[];
  examNotes: string[];
  examQuestion: ExamQuestion;
  starred: boolean;
  createdAt: number;
}

export interface ReadingSettings {
  wpm: number; // words per minute e.g. 150 (slow), 220 (med), 320 (fast)
  readAloud: boolean;
  autoContinue: boolean;
  language: StudyLanguage;
  autoReadExplanation: boolean;
  voiceIndex?: number;
}
