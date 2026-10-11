import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Star,
  Trash2,
  ExternalLink,
  Search,
  BookmarkCheck,
  Sparkles,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { SavedNote } from '../types';
import { exportNotesToPdf, copyNotesAsMarkdown } from '../utils/pdfExport';

interface ExamNotesViewProps {
  isOpen: boolean;
  onClose: () => void;
  notes: SavedNote[];
  documentTitle: string;
  onToggleStar: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onJumpToNote: (paraId: string, pageNumber: number) => void;
}

export const ExamNotesView: React.FC<ExamNotesViewProps> = ({
  isOpen,
  onClose,
  notes,
  documentTitle,
  onToggleStar,
  onDeleteNote,
  onJumpToNote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [starredOnly, setStarredOnly] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (starredOnly && !n.starred) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const inSubtopic = n.subtopic.toLowerCase().includes(query);
    const inExpl = n.explanation.toLowerCase().includes(query);
    const inTerms = n.keyTerms.some(
      (k) => k.term.toLowerCase().includes(query) || k.meaning.toLowerCase().includes(query)
    );
    const inBullets = n.examNotes.some((b) => b.toLowerCase().includes(query));
    const inQuestion =
      n.examQuestion.question.toLowerCase().includes(query) ||
      n.examQuestion.answer.toLowerCase().includes(query);

    return inSubtopic || inExpl || inTerms || inBullets || inQuestion;
  });

  const handleCopyMarkdown = async () => {
    const md = copyNotesAsMarkdown(notes, documentTitle);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  const handleDownloadPdf = () => {
    exportNotesToPdf(notes, documentTitle);
  };

  // Group filtered notes by subtopic
  const grouped = new Map<string, SavedNote[]>();
  for (const n of filteredNotes) {
    const groupKey = n.subtopic || 'General Topic';
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }
    grouped.get(groupKey)!.push(n);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                My Exam Notes & Study Guide
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {notes.length} total saved sections • {notes.filter((n) => n.starred).length} high-yield starred
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              disabled={notes.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-40"
              title="Copy all notes formatted as Markdown"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={notes.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors disabled:opacity-40"
              title="Download formatted PDF revision guide"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts, terms, notes..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStarredOnly(!starredOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                starredOnly
                  ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${starredOnly ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
              <span>Starred Priority Only</span>
            </button>
          </div>
        </div>

        {/* Scrollable Notes List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {notes.length === 0 ? (
            <div className="py-16 text-center max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                No exam notes yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                As you read through paragraphs, notes are automatically generated and can be starred here for quick revision and PDF export.
              </p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No notes match your search filters.
            </div>
          ) : (
            Array.from(grouped.entries()).map(([subtopic, groupNotes]) => (
              <div key={subtopic} className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-extrabold text-indigo-700 dark:text-indigo-400 text-sm">
                    {subtopic}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold">
                    {groupNotes.length}
                  </span>
                </div>

                <div className="space-y-4">
                  {groupNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      {/* Top Bar of Note */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                            Page {note.pageNumber}
                          </span>
                          {note.starred && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold text-[10px]">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                              High-Yield Priority
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              onJumpToNote(note.paragraphId, note.pageNumber);
                              onClose();
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Jump to source paragraph in PDF"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleStar(note.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              note.starred
                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            title={note.starred ? 'Unstar' : 'Star for exam revision'}
                          >
                            <Star className={`w-3.5 h-3.5 ${note.starred ? 'fill-amber-400' : ''}`} />
                          </button>
                          <button
                            onClick={() => onDeleteNote(note.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Simple Explanation
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                          {note.explanation}
                        </p>
                      </div>

                      {/* Key Terms */}
                      {note.keyTerms.length > 0 && (
                        <div className="pt-1">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1.5">
                            Key Terms
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {note.keyTerms.map((t, idx) => (
                              <div
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 text-xs text-slate-700 dark:text-slate-300"
                              >
                                <span className="font-bold text-teal-800 dark:text-teal-300 mr-1">
                                  {t.term}:
                                </span>
                                <span>{t.meaning}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Exam Notes */}
                      {note.examNotes.length > 0 && (
                        <div className="pt-1">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                            High-Yield Exam Points
                          </h4>
                          <ul className="space-y-1">
                            {note.examNotes.map((bullet, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-200"
                              >
                                <span className="text-amber-500 font-bold">•</span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Exam Question */}
                      {note.examQuestion?.question && (
                        <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-xs space-y-1">
                          <div className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                            <span>Q: {note.examQuestion.question}</span>
                          </div>
                          <div className="text-slate-600 dark:text-slate-300 pl-4">
                            <span className="font-semibold text-purple-700 dark:text-purple-400">Answer:</span> {note.examQuestion.answer}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
