import React from 'react';
import {
  Book,
  BookOpen,
  FileText,
  Moon,
  Sun,
  List,
  BookmarkCheck,
  Sparkles,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { StudyLanguage } from '../types';

interface HeaderProps {
  fileName?: string;
  currentPage: number;
  numPages: number;
  onPageChange: (page: number) => void;
  progressPercent: number; // 0 to 100
  savedNotesCount: number;
  isOutlineOpen: boolean;
  onToggleOutline: () => void;
  onOpenNotes: () => void;
  onOpenSummary: () => void;
  onUploadNew: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  hasDocument: boolean;
  language: StudyLanguage;
  onLanguageChange: (lang: StudyLanguage) => void;
}

export const Header: React.FC<HeaderProps> = ({
  fileName,
  currentPage,
  numPages,
  onPageChange,
  progressPercent,
  savedNotesCount,
  isOutlineOpen,
  onToggleOutline,
  onOpenNotes,
  onOpenSummary,
  onUploadNew,
  darkMode,
  onToggleDarkMode,
  hasDocument,
  language,
  onLanguageChange,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Branding & Outline Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {hasDocument && (
            <button
              onClick={onToggleOutline}
              title={isOutlineOpen ? 'Close Outline' : 'Open Outline'}
              className={`p-2 rounded-lg border text-sm transition-all flex items-center justify-center ${
                isOutlineOpen
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={onUploadNew}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white flex-shrink-0">
              <Book className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight truncate">
                  Smart PDF
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                  Prototype
                </span>
              </div>
              {hasDocument && fileName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                  {fileName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Center: Page Navigation & Reading Progress */}
        {hasDocument && (
          <div className="hidden lg:flex items-center gap-4 flex-1 max-w-md px-4">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="p-1 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-medium text-slate-700 dark:text-slate-200 px-1">
                {currentPage} / {numPages}
              </span>
              <button
                disabled={currentPage >= numPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="p-1 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Reading Progress</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => onLanguageChange('English')}
              className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                language === 'English'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="English Study Notes"
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('Tamil')}
              className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                language === 'Tamil'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="தமிழ் (Tamil) Study Notes"
            >
              தமிழ்
            </button>
            <button
              onClick={() => onLanguageChange('Telugu')}
              className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                language === 'Telugu'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="తెలుగు (Telugu) Study Notes"
            >
              తెలుగు
            </button>
          </div>

          {hasDocument ? (
            <>
              <button
                onClick={onOpenSummary}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                title="Summarize Whole Document"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="hidden sm:inline">Doc Summary</span>
              </button>

              <button
                onClick={onOpenNotes}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors relative"
                title="View My Exam Notes"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Exam Notes</span>
                {savedNotesCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    {savedNotesCount}
                  </span>
                )}
              </button>

              <button
                onClick={onUploadNew}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
                title="Open another PDF"
              >
                <Upload className="w-4 h-4" />
              </button>
            </>
          ) : null}

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
