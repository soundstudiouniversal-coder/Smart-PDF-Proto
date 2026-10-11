import { DocumentSummary, ParagraphAnalysis, ParagraphItem, StudyLanguage } from '../types';

class GeminiStudyService {
  private cache = new Map<string, ParagraphAnalysis>();
  private pendingRequests = new Map<string, Promise<ParagraphAnalysis>>();

  private getCacheKey(paragraphId: string, language: StudyLanguage = 'English'): string {
    return `${paragraphId}_${language}`;
  }

  public getCachedAnalysis(paragraphId: string, language: StudyLanguage = 'English'): ParagraphAnalysis | undefined {
    return this.cache.get(this.getCacheKey(paragraphId, language));
  }

  public setCachedAnalysis(paragraphId: string, data: ParagraphAnalysis, language: StudyLanguage = 'English') {
    this.cache.set(this.getCacheKey(paragraphId, language), data);
  }

  public async analyzeParagraph(
    paragraph: ParagraphItem,
    previousSummary?: string,
    language: StudyLanguage = 'English',
    retryCount: number = 0
  ): Promise<ParagraphAnalysis> {
    const key = this.getCacheKey(paragraph.id, language);
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    // Deduplicate if already in-flight
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    const requestPromise = (async () => {
      try {
        const response = await fetch('/api/gemini/analyze-paragraph', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paragraphText: paragraph.text,
            sectionHeading: paragraph.subtopicHeading,
            previousSummary: previousSummary || '',
            pageNumber: paragraph.pageNumber,
            paragraphIndex: paragraph.paragraphIndex,
            targetLanguage: language,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const isRateLimit = response.status === 429 || errData.isRateLimit;

          if (isRateLimit && retryCount < 2) {
            // Wait 2.5 seconds and retry
            await new Promise((r) => setTimeout(r, 2500 * (retryCount + 1)));
            return this.analyzeParagraph(paragraph, previousSummary, language, retryCount + 1);
          }

          throw new Error(errData.error || `Server responded with ${response.status}`);
        }

        const data = await response.json();

        const analysis: ParagraphAnalysis = {
          paragraphId: paragraph.id,
          pageNumber: paragraph.pageNumber,
          paragraphIndex: paragraph.paragraphIndex,
          language,
          explanation: data.explanation || 'No explanation provided.',
          keyTerms: Array.isArray(data.keyTerms) ? data.keyTerms : [],
          examNotes: Array.isArray(data.examNotes) ? data.examNotes : [],
          examQuestion: data.examQuestion || {
            question: 'What is the core takeaway of this section?',
            answer: 'Review the key terms and points above.',
          },
          cachedAt: Date.now(),
        };

        this.cache.set(key, analysis);
        return analysis;
      } finally {
        this.pendingRequests.delete(key);
      }
    })();

    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }

  // Prefetches in background without throwing unhandled exceptions
  public prefetchParagraph(
    paragraph?: ParagraphItem,
    previousSummary?: string,
    language: StudyLanguage = 'English'
  ): void {
    if (!paragraph) return;
    const key = this.getCacheKey(paragraph.id, language);
    if (this.cache.has(key) || this.pendingRequests.has(key)) {
      return;
    }

    this.analyzeParagraph(paragraph, previousSummary, language).catch((err) => {
      console.warn(`Background prefetch for paragraph ${paragraph.id} failed:`, err);
    });
  }

  public async summarizeDocument(
    documentText: string,
    title?: string,
    language: StudyLanguage = 'English'
  ): Promise<DocumentSummary> {
    const response = await fetch('/api/gemini/summarize-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentText,
        title: title || 'Study Document',
        targetLanguage: language,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to generate document summary.');
    }

    return response.json();
  }

  public clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

export const geminiService = new GeminiStudyService();
