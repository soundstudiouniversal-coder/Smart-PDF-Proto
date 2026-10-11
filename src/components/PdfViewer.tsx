import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { LineItem, ParagraphItem } from '../types';

interface PdfViewerProps {
  pdfDoc: any;
  currentPage: number;
  lines: LineItem[];
  paragraphs: ParagraphItem[];
  currentLineId: string | null;
  currentParagraphId: string | null;
  onSelectParagraph: (paraId: string) => void;
  onSelectLine: (lineId: string) => void;
  isPlaying: boolean;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfDoc,
  currentPage,
  lines,
  paragraphs,
  currentLineId,
  currentParagraphId,
  onSelectParagraph,
  onSelectLine,
  isPlaying,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState<number>(1.25);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({
    width: 600,
    height: 850,
  });
  const [isRendering, setIsRendering] = useState<boolean>(false);

  // Render PDF page on canvas
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      setIsRendering(true);
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      context.scale(dpr, dpr);

      setPageSize({
        width: viewport.width,
        height: viewport.height,
      });

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Error rendering page:', err);
    } finally {
      setIsRendering(false);
    }
  }, [pdfDoc, currentPage, scale]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Auto-scroll to active line
  useEffect(() => {
    if (!currentLineId || !containerRef.current || !activeLineRef.current) return;

    const container = containerRef.current;
    const activeEl = activeLineRef.current;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();

    // Check if line is outside comfort reading band (middle 60% of viewport)
    const isAbove = activeRect.top < containerRect.top + 80;
    const isBelow = activeRect.bottom > containerRect.bottom - 80;

    if (isAbove || isBelow) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLineId]);

  const pageLines = lines.filter((l) => l.pageNumber === currentPage);
  const pageParagraphs = paragraphs.filter((p) => p.pageNumber === currentPage);

  return (
    <div className="relative flex-1 flex flex-col h-full min-h-[500px] bg-slate-100 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner">
      {/* Zoom and Scale Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
        <button
          onClick={() => setScale((s) => Math.max(0.75, s - 0.15))}
          className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="w-10 text-center font-medium text-slate-700 dark:text-slate-200 select-none">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
          className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setScale(1.25)}
          className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 ml-1 border-l border-slate-200 dark:border-slate-700"
          title="Reset zoom"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Main PDF Scrollable Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start relative select-text"
      >
        <div
          className="relative bg-white shadow-xl rounded-lg transition-all"
          style={{
            width: pageSize.width,
            height: pageSize.height,
            minWidth: pageSize.width,
            minHeight: pageSize.height,
          }}
        >
          {/* Canvas Rendering */}
          <canvas ref={canvasRef} className="block rounded-lg" />

          {/* Interactive Highlight & Bounding Box Layer */}
          <div className="absolute inset-0 z-10 pointer-events-auto">
            {/* Paragraph highlights */}
            {pageParagraphs.map((para) => {
              const isCurrentPara = para.id === currentParagraphId;

              return (
                <div
                  key={para.id}
                  onClick={() => onSelectParagraph(para.id)}
                  title="Click to jump and study this paragraph"
                  className={`absolute cursor-pointer transition-all rounded duration-150 ${
                    isCurrentPara
                      ? 'bg-amber-500/10 dark:bg-amber-400/15 ring-2 ring-amber-400 dark:ring-amber-500'
                      : 'hover:bg-indigo-500/5 hover:ring-1 hover:ring-indigo-300/40'
                  }`}
                  style={{
                    left: `${para.box.leftPercent}%`,
                    top: `${para.box.topPercent}%`,
                    width: `${para.box.widthPercent}%`,
                    height: `${para.box.heightPercent}%`,
                  }}
                />
              );
            })}

            {/* Line highlights */}
            {pageLines.map((line) => {
              const isCurrentLine = line.id === currentLineId;

              return (
                <div
                  key={line.id}
                  ref={isCurrentLine ? activeLineRef : undefined}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLine(line.id);
                  }}
                  className={`absolute cursor-pointer transition-all duration-100 rounded-sm ${
                    isCurrentLine
                      ? 'bg-amber-300/50 dark:bg-amber-400/40 border-b-2 border-amber-500 shadow-sm backdrop-brightness-95 animate-pulse'
                      : 'hover:bg-amber-100/40'
                  }`}
                  style={{
                    left: `${line.box.leftPercent}%`,
                    top: `${line.box.topPercent}%`,
                    width: `${line.box.widthPercent}%`,
                    height: `${line.box.heightPercent}%`,
                  }}
                  title={line.lineText}
                >
                  {isCurrentLine && (
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white shadow" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Status pill at bottom left */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs text-slate-600 dark:text-slate-300">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-medium">
          {pageParagraphs.length} Paragraphs on Page {currentPage}
        </span>
        {currentLineId && isPlaying && (
          <span className="text-amber-600 dark:text-amber-400 font-semibold ml-1">
            • Reading Line {lines.find((l) => l.id === currentLineId)?.lineIndex! + 1}
          </span>
        )}
      </div>
    </div>
  );
};
