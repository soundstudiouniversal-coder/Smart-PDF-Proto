import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Bookmark,
  ExternalLink,
  Play,
  RotateCw,
  AlertCircle,
  Eye,
  EyeOff,
  Star,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Languages,
} from 'lucide-react';
import { ParagraphAnalysis, ParagraphItem, StudyLanguage } from '../types';
import { speechManager } from '../utils/speech';

interface AiStudyPanelProps {
  currentParagraph: ParagraphItem | null;
  analysis: ParagraphAnalysis | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onContinueReading: () => void;
  isPausedAtParagraph: boolean;
  onJumpToParagraph: (paraId: string, pageNumber: number) => void;
  isStarred: boolean;
  onToggleStar: () => void;
  autoContinue: boolean;
  onToggleAutoContinue: () => void;
  language: StudyLanguage;
  onLanguageChange: (lang: StudyLanguage) => void;
  autoReadExplanation: boolean;
  onToggleAutoReadExplanation: () => void;
}

export const AiStudyPanel: React.FC<AiStudyPanelProps> = ({
  currentParagraph,
  analysis,
  isLoading,
  error,
  onRetry,
  onContinueReading,
  isPausedAtParagraph,
  onJumpToParagraph,
  isStarred,
  onToggleStar,
  autoContinue,
  onToggleAutoContinue,
  language,
  onLanguageChange,
  autoReadExplanation,
  onToggleAutoReadExplanation,
}) => {
  const [showModelAnswer, setShowModelAnswer] = useState<boolean>(true);
  const [showOriginalSnippet, setShowOriginalSnippet] = useState<boolean>(false);
  const [isSpeakingExplanation, setIsSpeakingExplanation] = useState<boolean>(false);

  // Stop speech when paragraph changes or unmounts
  useEffect(() => {
    setIsSpeakingExplanation(false);
  }, [currentParagraph?.id, language]);

  // Pronounce a key term or question in target language
  const handlePronounce = (text: string) => {
    speechManager.speak(text, 175, undefined, language);
  };

  // Toggle reading explanation aloud
  const handleToggleSpeakExplanation = () => {
    if (!analysis?.explanation) return;

    if (isSpeakingExplanation) {
      speechManager.stop();
      setIsSpeakingExplanation(false);
    } else {
      setIsSpeakingExplanation(true);
      speechManager.speak(
        analysis.explanation,
        170,
        {
          onEnd: () => setIsSpeakingExplanation(false),
          onError: () => setIsSpeakingExplanation(false),
        },
        language
      );
    }
  };

  // Localized section titles
  const titles = {
    explanation:
      language === 'Tamil'
        ? 'எளிய விளக்கம் (Simple Explanation)'
        : language === 'Telugu'
        ? 'సులభమైన వివరణ (Simple Explanation)'
        : 'Simple Explanation',
    keyTerms:
      language === 'Tamil'
        ? 'முக்கிய சொற்கள் (Key Terms)'
        : language === 'Telugu'
        ? 'ముఖ్యమైన పదాలు (Key Terms)'
        : 'Key Terms & Definitions',
    examNotes:
      language === 'Tamil'
        ? 'தேர்வு குறிப்புகள் (Exam Notes)'
        : language === 'Telugu'
        ? 'పరీక్ష నోట్స్ (Exam Notes)'
        : 'Exam Revision Notes',
    examQuestion:
      language === 'Tamil'
        ? 'தேர்வு வினா-விடை (Likely Exam Q&A)'
        : language === 'Telugu'
        ? 'పరీక్ష ప్రశ్న-సమాధానం (Likely Exam Q&A)'
        : 'Likely Exam Question',
  };

  if (!currentParagraph) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[500px]">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-inner">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          AI Study Companion Ready
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
          Tap any paragraph on the PDF canvas to read it out line-by-line and get full explanations in English, தமிழ், or తెలుగు!
        </p>

        {/* Language selector in empty state */}
        <div className="mt-5 flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Languages className="w-3.5 h-3.5 text-indigo-500 ml-1.5" />
          <button
            onClick={() => onLanguageChange('English')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              language === 'English'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            English
          </button>
          <button
            onClick={() => onLanguageChange('Tamil')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              language === 'Tamil'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            தமிழ் (Tamil)
          </button>
          <button
            onClick={() => onLanguageChange('Telugu')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              language === 'Telugu'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            తెలుగు (Telugu)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px]">
      {/* Top Header of Study Panel */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 backdrop-blur flex flex-wrap items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              AI Study Guide
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Para #{currentParagraph.paragraphIndex + 1}
            </span>
          </div>
          <h3
            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5"
            title={currentParagraph.subtopicHeading}
          >
            {currentParagraph.subtopicHeading || 'General Section'}
          </h3>
        </div>

        {/* Language Pills & Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Quick Language switcher inside panel */}
          <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
            <button
              onClick={() => onLanguageChange('English')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                language === 'English'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('Tamil')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                language === 'Tamil'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              தமிழ்
            </button>
            <button
              onClick={() => onLanguageChange('Telugu')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                language === 'Telugu'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              తెలుగు
            </button>
          </div>

          {/* Star bookmark button */}
          <button
            onClick={onToggleStar}
            title={isStarred ? 'Remove from My Exam Notes' : 'Star & Save to My Exam Notes'}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              isStarred
                ? 'bg-amber-50 border-amber-200 text-amber-500 dark:bg-amber-950/60 dark:border-amber-800'
                : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>

          {/* Jump to Source button */}
          <button
            onClick={() => onJumpToParagraph(currentParagraph.id, currentParagraph.pageNumber)}
            title="Highlight source paragraph on PDF"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">P.{currentParagraph.pageNumber}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {/* Expandable Original Paragraph Preview */}
        <div className="bg-slate-50 dark:bg-slate-850/50 rounded-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden text-xs">
          <button
            onClick={() => setShowOriginalSnippet(!showOriginalSnippet)}
            className="w-full px-3 py-2 flex items-center justify-between text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors font-medium"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              Source Text (Page {currentParagraph.pageNumber}, Para {currentParagraph.paragraphIndex + 1})
            </span>
            {showOriginalSnippet ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          {showOriginalSnippet && (
            <div className="p-3 pt-0 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 italic leading-relaxed bg-white/50 dark:bg-slate-900/40">
              &quot;{currentParagraph.text}&quot;
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4 animate-pulse py-2">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
              <div className="h-4 bg-indigo-200 dark:bg-indigo-900/40 rounded w-1/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
              <div className="h-4 bg-emerald-200 dark:bg-emerald-900/40 rounded w-1/4" />
              <div className="flex gap-2">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24" />
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-28" />
              </div>
            </div>

            <div className="text-center text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center justify-center gap-2 pt-2">
              <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
              <span>Explaining paragraph in {language}...</span>
            </div>
          </div>
        )}

        {/* Error State with Retry Button */}
        {error && !isLoading && (
          <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-xs sm:text-sm">Unable to analyze paragraph</h4>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry Analysis</span>
            </button>
          </div>
        )}

        {/* Analysis Content */}
        {analysis && !isLoading && (
          <>
            {/* 1. Simple Explanation Card with Voice Playback */}
            <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{titles.explanation}</span>
                </div>

                {/* Read Explanation Aloud Button */}
                <button
                  onClick={handleToggleSpeakExplanation}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isSpeakingExplanation
                      ? 'bg-amber-500 text-white shadow-xs animate-pulse'
                      : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  }`}
                  title={isSpeakingExplanation ? 'Stop speaking' : `Read explanation aloud in ${language}`}
                >
                  {isSpeakingExplanation ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen ({language})</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-normal">
                {analysis.explanation}
              </p>
            </div>

            {/* 2. Key Terms */}
            {analysis.keyTerms && analysis.keyTerms.length > 0 && (
              <div className="p-4 rounded-xl border border-teal-100 dark:border-teal-900/40 bg-gradient-to-br from-teal-50/40 to-white dark:from-teal-950/20 dark:to-slate-900 shadow-xs">
                <div className="flex items-center gap-2 text-teal-800 dark:text-teal-400 font-bold text-xs sm:text-sm mb-3">
                  <Bookmark className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>{titles.keyTerms}</span>
                </div>
                <div className="space-y-2">
                  {analysis.keyTerms.map((term, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-teal-100/80 dark:border-teal-900/40 flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 dark:text-white mr-1.5 text-teal-900 dark:text-teal-300">
                          {term.term}:
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {term.meaning}
                        </span>
                      </div>
                      <button
                        onClick={() => handlePronounce(`${term.term}. ${term.meaning}`)}
                        className="p-1 rounded text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition-colors flex-shrink-0"
                        title="Pronounce term"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Exam Notes */}
            {analysis.examNotes && analysis.examNotes.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/40 to-white dark:from-amber-950/20 dark:to-slate-900 shadow-xs">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-400 font-bold text-xs sm:text-sm mb-2.5">
                  <CheckCircle className="w-4 h-4 text-amber-500" />
                  <span>{titles.examNotes}</span>
                </div>
                <ul className="space-y-2">
                  {analysis.examNotes.map((note, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 4. Likely Exam Question & Model Answer */}
            {analysis.examQuestion?.question && (
              <div className="p-4 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-gradient-to-br from-purple-50/40 to-white dark:from-purple-950/20 dark:to-slate-900 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-purple-900 dark:text-purple-400 font-bold text-xs sm:text-sm">
                    <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>{titles.examQuestion}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handlePronounce(
                          `Question: ${analysis.examQuestion.question}. Model Answer: ${analysis.examQuestion.answer}`
                        )
                      }
                      className="p-1 rounded text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                      title="Listen to Question and Answer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowModelAnswer(!showModelAnswer)}
                      className="flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      {showModelAnswer ? (
                        <>
                          <EyeOff className="w-3 h-3" /> Hide Answer
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" /> Reveal Answer
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                  Q: {analysis.examQuestion.question}
                </div>

                {showModelAnswer && (
                  <div className="mt-2.5 p-3 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-purple-100 dark:border-purple-900/40 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    <span className="font-bold text-purple-700 dark:text-purple-300 mr-1">
                      Model Answer:
                    </span>
                    {analysis.examQuestion.answer}
                  </div>
                )}
              </div>
            )}

            {/* Source Citation badge at bottom */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <button
                onClick={() => onJumpToParagraph(currentParagraph.id, currentParagraph.pageNumber)}
                className="hover:underline flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium"
              >
                <span>Source: Page {currentParagraph.pageNumber}, Paragraph {currentParagraph.paragraphIndex + 1}</span>
                <ExternalLink className="w-3 h-3" />
              </button>

              <span>
                {analysis.language || 'English'} • {analysis.cachedAt ? '⚡ Cached' : 'Live generated'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      {isPausedAtParagraph && (
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoContinue}
                onChange={onToggleAutoContinue}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Auto-continue next</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoReadExplanation}
                onChange={onToggleAutoReadExplanation}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Auto-voice explanation</span>
            </label>
          </div>

          <button
            onClick={onContinueReading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all scale-100 hover:scale-[1.02] active:scale-[0.98]"
            title="Continue reading next paragraph (Space)"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Continue Next Para</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-black/20 rounded font-mono">
              Space
            </kbd>
          </button>
        </div>
      )}
    </div>
  );
};
