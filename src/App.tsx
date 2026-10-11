/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  LineItem,
  ParagraphItem,
  SubtopicHeading,
  ParagraphAnalysis,
  SavedNote,
  ReadingSettings,
  DocumentSummary,
  StudyLanguage,
} from './types';
import { extractPdfData, ExtractedPdfResult } from './utils/pdfExtractor';
import { DEMO_DOCS, DemoDocOption } from './utils/demoDocs';
import { geminiService } from './services/geminiService';
import { speechManager } from './utils/speech';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { PdfViewer } from './components/PdfViewer';
import { ReadingControls } from './components/ReadingControls';
import { AiStudyPanel } from './components/AiStudyPanel';
import { OutlineSidebar } from './components/OutlineSidebar';
import { ExamNotesView } from './components/ExamNotesView';
import { DocumentSummaryModal } from './components/DocumentSummaryModal';
import { BookOpen, Sparkles, FileText } from 'lucide-react';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // PDF Document State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [fileName, setFileName] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [paragraphs, setParagraphs] = useState<ParagraphItem[]>([]);
  const [subtopics, setSubtopics] = useState<SubtopicHeading[]>([]);
  const [fullText, setFullText] = useState<string>('');
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [loadingPdfMessage, setLoadingPdfMessage] = useState<string>('');

  // Reading Mode State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [isParagraphPaused, setIsParagraphPaused] = useState<boolean>(false);
  const [currentParagraphId, setCurrentParagraphId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ReadingSettings>({
    wpm: 210,
    readAloud: true,
    autoContinue: false,
    language: 'English',
    autoReadExplanation: false,
  });

  // AI Study State
  const [currentAnalysis, setCurrentAnalysis] = useState<ParagraphAnalysis | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [analyzedParagraphIds, setAnalyzedParagraphIds] = useState<Set<string>>(new Set());

  // Saved Notes & Summaries
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>(() => {
    try {
      const saved = localStorage.getItem('smart_pdf_saved_notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals & Panels State
  const [isOutlineOpen, setIsOutlineOpen] = useState<boolean>(true);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState<boolean>(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<DocumentSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Responsive mobile tab ('pdf' | 'notes')
  const [mobileActiveTab, setMobileActiveTab] = useState<'pdf' | 'notes'>('pdf');

  // Timer Ref for reading mode
  const lineTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Save notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('smart_pdf_saved_notes', JSON.stringify(savedNotes));
    } catch (err) {
      console.warn('Could not persist notes:', err);
    }
  }, [savedNotes]);

  // Load PDF data helper
  const loadPdfData = async (
    source: File | ArrayBuffer | Uint8Array,
    name: string
  ) => {
    try {
      setIsLoadingPdf(true);
      setLoadingPdfMessage('Extracting text content & coordinates...');
      speechManager.stop();
      geminiService.clearCache();

      const result: ExtractedPdfResult = await extractPdfData(source, name);

      setPdfDoc(result.pdfDoc);
      setFileName(name);
      setNumPages(result.numPages);
      setCurrentPage(1);
      setLines(result.lines);
      setParagraphs(result.paragraphs);
      setSubtopics(result.subtopics);
      setFullText(result.fullText);

      // Reset reading
      setIsPlaying(false);
      setIsParagraphPaused(false);
      setCurrentLineIndex(-1);
      setCurrentParagraphId(result.paragraphs[0]?.id || null);
      setCurrentAnalysis(null);
      setAnalyzedParagraphIds(new Set());

      // Auto-open outline on wider screens
      if (window.innerWidth >= 1024) {
        setIsOutlineOpen(true);
      } else {
        setIsOutlineOpen(false);
      }
    } catch (err: any) {
      console.error('Failed to parse PDF:', err);
      alert(`Could not parse this PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Handle User File Upload
  const handleFileSelect = (file: File) => {
    loadPdfData(file, file.name);
  };

  // Handle Demo Selection
  const handleDemoSelect = (demo: DemoDocOption) => {
    const buffer = demo.generate();
    loadPdfData(buffer, `${demo.title}.pdf`);
  };

  // Active line object
  const currentLine = useMemo(() => {
    if (currentLineIndex >= 0 && currentLineIndex < lines.length) {
      return lines[currentLineIndex];
    }
    return null;
  }, [lines, currentLineIndex]);

  // Active paragraph object
  const currentParagraph = useMemo(() => {
    if (currentLine) {
      return paragraphs.find((p) => p.id === currentLine.paragraphId) || null;
    }
    if (currentParagraphId) {
      return paragraphs.find((p) => p.id === currentParagraphId) || null;
    }
    return paragraphs[0] || null;
  }, [currentLine, currentParagraphId, paragraphs]);

  // Fetch AI analysis for a paragraph in the specified or current language
  const triggerParagraphAnalysis = useCallback(
    async (para: ParagraphItem, targetLang: StudyLanguage = settings.language) => {
      if (!para) return;
      setIsAiLoading(true);
      setAiError(null);

      try {
        // Find previous paragraph's summary or explanation if any
        const prevIndex = para.paragraphIndex - 1;
        const prevPara = prevIndex >= 0 ? paragraphs[prevIndex] : undefined;
        const prevCached = prevPara
          ? geminiService.getCachedAnalysis(prevPara.id, targetLang)
          : undefined;
        const prevContext = prevCached?.explanation || undefined;

        const analysis = await geminiService.analyzeParagraph(para, prevContext, targetLang);
        setCurrentAnalysis(analysis);

        // Mark as analyzed in progress
        setAnalyzedParagraphIds((prev) => new Set(prev).add(para.id));

        // Auto-save to saved notes list if not already present
        setSavedNotes((prev) => {
          if (prev.some((n) => n.paragraphId === para.id && n.language === targetLang)) {
            return prev;
          }
          const newNote: SavedNote = {
            id: `note-${Date.now()}-${para.id}-${targetLang}`,
            paragraphId: para.id,
            pageNumber: para.pageNumber,
            subtopic: para.subtopicHeading,
            language: targetLang,
            paragraphSnippet: para.text,
            explanation: analysis.explanation,
            keyTerms: analysis.keyTerms,
            examNotes: analysis.examNotes,
            examQuestion: analysis.examQuestion,
            starred: false,
            createdAt: Date.now(),
          };
          return [newNote, ...prev];
        });

        // If auto-read explanation is enabled, speak it in the target language!
        if (settings.autoReadExplanation && analysis.explanation) {
          speechManager.speak(analysis.explanation, 170, undefined, targetLang);
        }

        // Prefetch next paragraph in background!
        const nextIndex = para.paragraphIndex + 1;
        if (nextIndex < paragraphs.length) {
          const nextPara = paragraphs[nextIndex];
          geminiService.prefetchParagraph(nextPara, analysis.explanation, targetLang);
        }

        // If auto-continue is enabled, resume after pause
        if (settings.autoContinue) {
          if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
          autoContinueTimerRef.current = setTimeout(() => {
            handleContinueReading();
          }, 3500);
        }
      } catch (err: any) {
        console.error('Error analyzing paragraph:', err);
        setAiError(err?.message || 'Failed to analyze paragraph with Gemini.');
      } finally {
        setIsAiLoading(false);
      }
    },
    [paragraphs, settings.autoContinue, settings.autoReadExplanation, settings.language]
  );

  // Play line helper
  const playCurrentLine = useCallback(
    (lineIdx: number) => {
      if (lineIdx < 0 || lineIdx >= lines.length) {
        setIsPlaying(false);
        return;
      }

      const line = lines[lineIdx];
      setCurrentLineIndex(lineIdx);
      setCurrentParagraphId(line.paragraphId);

      // Jump page if line is on another page
      if (line.pageNumber !== currentPage) {
        setCurrentPage(line.pageNumber);
      }

      // Check if this line is the end of the paragraph
      const currentPara = paragraphs.find((p) => p.id === line.paragraphId);
      const isEndOfPara =
        currentPara &&
        currentPara.lineIds[currentPara.lineIds.length - 1] === line.id;

      if (settings.readAloud && speechManager.hasSupport()) {
        speechManager.speak(line.lineText, settings.wpm, {
          onEnd: () => {
            if (!isPlaying) return;

            if (isEndOfPara) {
              // Paragraph completed! Pause reading and trigger AI explanation in target language
              setIsPlaying(false);
              setIsParagraphPaused(true);
              triggerParagraphAnalysis(currentPara, settings.language);
              // Switch mobile tab to notes so student immediately sees study guide
              if (window.innerWidth < 768) {
                setMobileActiveTab('notes');
              }
            } else {
              // Proceed to next line of paragraph after brief breather
              lineTimerRef.current = setTimeout(() => {
                playCurrentLine(lineIdx + 1);
              }, 120);
            }
          },
          onError: () => {
            // Speech error fallback: use duration timer
            handleTimerLineAdvance(line, isEndOfPara, currentPara, lineIdx);
          },
        });
      } else {
        // Visual-only reading mode: advance based on calculated reading speed
        handleTimerLineAdvance(line, isEndOfPara, currentPara, lineIdx);
      }
    },
    [lines, currentPage, settings, isPlaying, paragraphs, triggerParagraphAnalysis]
  );

  const handleTimerLineAdvance = (
    line: LineItem,
    isEndOfPara: boolean | undefined,
    currentPara: ParagraphItem | undefined,
    lineIdx: number
  ) => {
    const wordCount = Math.max(3, line.lineText.trim().split(/\s+/).length);
    const durationMs = Math.max(1200, (wordCount / (settings.wpm || 210)) * 60000);

    if (lineTimerRef.current) clearTimeout(lineTimerRef.current);
    lineTimerRef.current = setTimeout(() => {
      if (isEndOfPara && currentPara) {
        setIsPlaying(false);
        setIsParagraphPaused(true);
        triggerParagraphAnalysis(currentPara, settings.language);
        if (window.innerWidth < 768) {
          setMobileActiveTab('notes');
        }
      } else {
        playCurrentLine(lineIdx + 1);
      }
    }, durationMs);
  };

  // Start / Resume Reading
  const handleStartReading = () => {
    if (lines.length === 0) return;

    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);

    setIsParagraphPaused(false);
    setIsPlaying(true);

    const nextIndex = currentLineIndex < 0 ? 0 : currentLineIndex;
    playCurrentLine(nextIndex);
  };

  // Pause Reading
  const handlePauseReading = () => {
    setIsPlaying(false);
    speechManager.stop();
    if (lineTimerRef.current) clearTimeout(lineTimerRef.current);
    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
  };

  // Continue Reading after paragraph paused
  const handleContinueReading = () => {
    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);

    setIsParagraphPaused(false);

    // Find first line of the next paragraph
    const nextLineIdx = currentLineIndex + 1;
    if (nextLineIdx < lines.length) {
      setIsPlaying(true);
      playCurrentLine(nextLineIdx);
    } else {
      setIsPlaying(false);
    }
  };

  // Step Line controls
  const handleNextLine = () => {
    if (currentLineIndex + 1 < lines.length) {
      speechManager.stop();
      if (lineTimerRef.current) clearTimeout(lineTimerRef.current);
      playCurrentLine(currentLineIndex + 1);
    }
  };

  const handlePrevLine = () => {
    if (currentLineIndex > 0) {
      speechManager.stop();
      if (lineTimerRef.current) clearTimeout(lineTimerRef.current);
      playCurrentLine(currentLineIndex - 1);
    }
  };

  // User clicks a line directly
  const handleSelectLine = (lineId: string) => {
    const idx = lines.findIndex((l) => l.id === lineId);
    if (idx !== -1) {
      speechManager.stop();
      if (lineTimerRef.current) clearTimeout(lineTimerRef.current);
      setIsParagraphPaused(false);
      setCurrentLineIndex(idx);
      const line = lines[idx];
      setCurrentParagraphId(line.paragraphId);

      const para = paragraphs.find((p) => p.id === line.paragraphId);
      if (para) {
        // If already cached, show it, otherwise trigger
        const cached = geminiService.getCachedAnalysis(para.id, settings.language);
        if (cached) {
          setCurrentAnalysis(cached);
        } else {
          triggerParagraphAnalysis(para, settings.language);
        }
      }

      if (isPlaying) {
        playCurrentLine(idx);
      }
    }
  };

  // User clicks a paragraph directly: starts reading that paragraph with moving yellow line highlight,
  // and when the paragraph ends, STOPS and explains what is in the paragraph!
  const handleSelectParagraph = (
    paraId: string,
    pageNumber?: number,
    autoRead: boolean = true
  ) => {
    const para = paragraphs.find((p) => p.id === paraId);
    if (!para) return;

    speechManager.stop();
    if (lineTimerRef.current) clearTimeout(lineTimerRef.current);
    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);

    if (pageNumber && pageNumber !== currentPage) {
      setCurrentPage(pageNumber);
    } else if (para.pageNumber !== currentPage) {
      setCurrentPage(para.pageNumber);
    }

    setCurrentParagraphId(para.id);
    setIsParagraphPaused(false);

    // Focus first line of that paragraph
    const firstLineId = para.lineIds[0];
    const lineIdx = lines.findIndex((l) => l.id === firstLineId);
    if (lineIdx !== -1) {
      setCurrentLineIndex(lineIdx);
    }

    // Immediately fetch or display the explanation of what is in this paragraph
    const cached = geminiService.getCachedAnalysis(para.id, settings.language);
    if (cached) {
      setCurrentAnalysis(cached);
    } else {
      triggerParagraphAnalysis(para, settings.language);
    }

    // Start reading out the paragraph line by line with the moving yellow line highlight!
    if (autoRead && lineIdx !== -1) {
      setIsPlaying(true);
      playCurrentLine(lineIdx);
    }
  };

  // Language change handler
  const handleLanguageChange = (newLang: StudyLanguage) => {
    setSettings((s) => ({ ...s, language: newLang }));
    if (currentParagraph) {
      const cached = geminiService.getCachedAnalysis(currentParagraph.id, newLang);
      if (cached) {
        setCurrentAnalysis(cached);
      } else {
        triggerParagraphAnalysis(currentParagraph, newLang);
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input or modal is open with an active search
      if (
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName) ||
        isNotesModalOpen ||
        isSummaryModalOpen
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isParagraphPaused) {
          handleContinueReading();
        } else if (isPlaying) {
          handlePauseReading();
        } else {
          handleStartReading();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextLine();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevLine();
      } else if (e.key === 'm' || e.key === 'M') {
        setSettings((s) => ({ ...s, readAloud: !s.readAloud }));
      } else if (e.key === 'o' || e.key === 'O') {
        setIsOutlineOpen((o) => !o);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Calculate overall reading progress percentage
  const progressPercent = useMemo(() => {
    if (paragraphs.length === 0) return 0;
    const readCount = analyzedParagraphIds.size;
    return Math.round((readCount / paragraphs.length) * 100);
  }, [paragraphs, analyzedParagraphIds]);

  // Star Note toggles
  const handleToggleStar = (noteId: string) => {
    setSavedNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, starred: !n.starred } : n))
    );
  };

  const handleToggleCurrentStar = () => {
    if (!currentParagraph) return;
    const existing = savedNotes.find((n) => n.paragraphId === currentParagraph.id);
    if (existing) {
      handleToggleStar(existing.id);
    } else if (currentAnalysis) {
      const newNote: SavedNote = {
        id: `note-${Date.now()}-${currentParagraph.id}`,
        paragraphId: currentParagraph.id,
        pageNumber: currentParagraph.pageNumber,
        subtopic: currentParagraph.subtopicHeading,
        paragraphSnippet: currentParagraph.text,
        explanation: currentAnalysis.explanation,
        keyTerms: currentAnalysis.keyTerms,
        examNotes: currentAnalysis.examNotes,
        examQuestion: currentAnalysis.examQuestion,
        starred: true,
        createdAt: Date.now(),
      };
      setSavedNotes([newNote, ...savedNotes]);
    }
  };

  const isCurrentParagraphStarred = useMemo(() => {
    if (!currentParagraph) return false;
    const note = savedNotes.find((n) => n.paragraphId === currentParagraph.id);
    return Boolean(note?.starred);
  }, [currentParagraph, savedNotes]);

  const handleDeleteNote = (noteId: string) => {
    setSavedNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  // Summarize whole document handler
  const handleOpenWholeSummary = async () => {
    setIsSummaryModalOpen(true);
    if (!summaryData && fullText) {
      setIsSummaryLoading(true);
      setSummaryError(null);
      try {
        const result = await geminiService.summarizeDocument(
          fullText,
          fileName,
          settings.language
        );
        setSummaryData(result);
      } catch (err: any) {
        console.error('Failed to summarize document:', err);
        setSummaryError(err?.message || 'Could not summarize document.');
      } finally {
        setIsSummaryLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-amber-300 selection:text-slate-900">
      {/* Top Navbar */}
      <Header
        fileName={fileName}
        currentPage={currentPage}
        numPages={numPages}
        onPageChange={(page) => setCurrentPage(page)}
        progressPercent={progressPercent}
        savedNotesCount={savedNotes.length}
        isOutlineOpen={isOutlineOpen}
        onToggleOutline={() => setIsOutlineOpen(!isOutlineOpen)}
        onOpenNotes={() => setIsNotesModalOpen(true)}
        onOpenSummary={handleOpenWholeSummary}
        onUploadNew={() => setPdfDoc(null)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        hasDocument={Boolean(pdfDoc)}
        language={settings.language}
        onLanguageChange={handleLanguageChange}
      />

      {/* Main Workspace Area */}
      {!pdfDoc ? (
        <main className="flex-1 flex items-center justify-center">
          <FileUpload
            onFileSelect={handleFileSelect}
            onDemoSelect={handleDemoSelect}
            isLoading={isLoadingPdf}
            loadingMessage={loadingPdfMessage}
          />
        </main>
      ) : (
        <main className="flex-1 flex overflow-hidden relative">
          {/* Collapsible Outline Sidebar */}
          <OutlineSidebar
            isOpen={isOutlineOpen}
            onClose={() => setIsOutlineOpen(false)}
            subtopics={subtopics}
            paragraphs={paragraphs}
            currentParagraphId={currentParagraph?.id || null}
            onSelectSubtopic={(subtopic) => {
              handleSelectParagraph(subtopic.paragraphId, subtopic.pageNumber);
            }}
          />

          {/* Split Screen Workspace */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Mobile Tab Switcher */}
            <div className="md:hidden flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 gap-2">
              <button
                onClick={() => setMobileActiveTab('pdf')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  mobileActiveTab === 'pdf'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>PDF Document</span>
              </button>
              <button
                onClick={() => setMobileActiveTab('notes')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  mobileActiveTab === 'notes'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Study Guide</span>
              </button>
            </div>

            {/* Split Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 p-3 sm:p-4 min-h-0 overflow-hidden">
              {/* Left Column: PDF Viewer + Controls */}
              <div
                className={`md:col-span-7 lg:col-span-7 flex flex-col gap-3 min-h-0 ${
                  mobileActiveTab === 'pdf' ? 'flex' : 'hidden md:flex'
                }`}
              >
                {/* PDF Page Canvas */}
                <PdfViewer
                  pdfDoc={pdfDoc}
                  currentPage={currentPage}
                  lines={lines}
                  paragraphs={paragraphs}
                  currentLineId={currentLine?.id || null}
                  currentParagraphId={currentParagraph?.id || null}
                  onSelectParagraph={handleSelectParagraph}
                  onSelectLine={handleSelectLine}
                  isPlaying={isPlaying}
                />

                {/* Floating Bottom Reading Controls */}
                <ReadingControls
                  isPlaying={isPlaying}
                  onTogglePlay={isPlaying ? handlePauseReading : handleStartReading}
                  onNextLine={handleNextLine}
                  onPrevLine={handlePrevLine}
                  hasPrevLine={currentLineIndex > 0}
                  hasNextLine={currentLineIndex + 1 < lines.length}
                  settings={settings}
                  onUpdateSettings={(newSet) => setSettings((s) => ({ ...s, ...newSet }))}
                  isParagraphPaused={isParagraphPaused}
                  onContinueReading={handleContinueReading}
                  speechSupported={speechManager.hasSupport()}
                />
              </div>

              {/* Right Column: AI Study Panel */}
              <div
                className={`md:col-span-5 lg:col-span-5 flex flex-col min-h-0 ${
                  mobileActiveTab === 'notes' ? 'flex' : 'hidden md:flex'
                }`}
              >
                <AiStudyPanel
                  currentParagraph={currentParagraph}
                  analysis={currentAnalysis}
                  isLoading={isAiLoading}
                  error={aiError}
                  onRetry={() =>
                    currentParagraph &&
                    triggerParagraphAnalysis(currentParagraph, settings.language)
                  }
                  onContinueReading={handleContinueReading}
                  isPausedAtParagraph={isParagraphPaused}
                  onJumpToParagraph={(paraId, pageNum) =>
                    handleSelectParagraph(paraId, pageNum)
                  }
                  isStarred={isCurrentParagraphStarred}
                  onToggleStar={handleToggleCurrentStar}
                  autoContinue={settings.autoContinue}
                  onToggleAutoContinue={() =>
                    setSettings((s) => ({ ...s, autoContinue: !s.autoContinue }))
                  }
                  language={settings.language}
                  onLanguageChange={handleLanguageChange}
                  autoReadExplanation={settings.autoReadExplanation}
                  onToggleAutoReadExplanation={() =>
                    setSettings((s) => ({
                      ...s,
                      autoReadExplanation: !s.autoReadExplanation,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* "My Exam Notes" Modal */}
      <ExamNotesView
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        notes={savedNotes}
        documentTitle={fileName || 'Study Document'}
        onToggleStar={handleToggleStar}
        onDeleteNote={handleDeleteNote}
        onJumpToNote={(paraId, pageNum) => {
          handleSelectParagraph(paraId, pageNum);
          if (window.innerWidth < 768) {
            setMobileActiveTab('pdf');
          }
        }}
      />

      {/* Whole Document Summary Modal */}
      <DocumentSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summary={summaryData}
        isLoading={isSummaryLoading}
        error={summaryError}
        onRetry={handleOpenWholeSummary}
        documentTitle={fileName || 'Study Document'}
      />
    </div>
  );
}
