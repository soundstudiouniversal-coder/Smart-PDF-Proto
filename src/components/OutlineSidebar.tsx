import React from 'react';
import { SubtopicHeading, ParagraphItem } from '../types';
import { X, BookMarked, ChevronRight, Hash } from 'lucide-react';

interface OutlineSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  subtopics: SubtopicHeading[];
  paragraphs: ParagraphItem[];
  currentParagraphId: string | null;
  onSelectSubtopic: (subtopic: SubtopicHeading) => void;
}

export const OutlineSidebar: React.FC<OutlineSidebarProps> = ({
  isOpen,
  onClose,
  subtopics,
  paragraphs,
  currentParagraphId,
  onSelectSubtopic,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-72 sm:w-80 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur flex flex-col h-full z-20 transition-all flex-shrink-0">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Document Outline
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close Outline"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-850">
        Click any subtopic to jump to that section and focus reading.
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {subtopics.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 italic">
            No subtopics detected yet.
          </div>
        ) : (
          subtopics.map((item, index) => {
            const isCurrent =
              item.paragraphId === currentParagraphId ||
              paragraphs.find((p) => p.id === currentParagraphId)?.subtopicHeading === item.title;

            // Count paragraphs under this heading
            const paraCount = paragraphs.filter((p) => p.subtopicHeading === item.title).length;

            return (
              <button
                key={item.id || index}
                onClick={() => onSelectSubtopic(item)}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 text-xs group ${
                  isCurrent
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                      Page {item.pageNumber}
                    </span>
                    {paraCount > 0 && (
                      <span className="text-[10px] text-slate-400">
                        {paraCount} {paraCount === 1 ? 'paragraph' : 'paragraphs'}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 leading-relaxed">
                    {item.title}
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 mt-1 text-slate-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
