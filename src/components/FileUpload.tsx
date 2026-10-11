import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Sparkles, BookOpen, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DEMO_DOCS, DemoDocOption } from '../utils/demoDocs';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onDemoSelect: (demo: DemoDocOption) => void;
  isLoading: boolean;
  loadingMessage?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onDemoSelect,
  isLoading,
  loadingMessage = 'Processing PDF and structuring text...',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      onFileSelect(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
      {/* Hero Badge & Heading */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-4">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        <span>AI-Guided Line-by-Line Study Companion</span>
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white text-center tracking-tight max-w-2xl">
        Study any PDF <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-indigo-600">line by line</span> with an AI Tutor
      </h1>

      <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 text-center max-w-xl">
        Highlighting follows your reading pace. Automatically pause after each paragraph to get clear explanations, key terms, exam revision notes, and questions powered by Gemini 2.5 Flash.
      </p>

      {/* Upload Box */}
      <div className="w-full mt-8">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800'
          } shadow-sm`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            className="hidden"
            disabled={isLoading}
          />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                Analyzing PDF structure
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                {loadingMessage}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-inner">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Drag & drop your PDF file here
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                or click to browse from your computer
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm transition-colors shadow-md shadow-indigo-600/20"
              >
                Choose PDF File
              </button>
            </div>
          )}
        </div>

        {/* Notice Requirement */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Works best with text-based PDFs. Scanned PDFs are not supported yet.</span>
        </div>
      </div>

      {/* Or Try with Demo Study Material */}
      <div className="w-full mt-10">
        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Or try with instant demo study materials
          </span>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {DEMO_DOCS.map((demo) => (
            <div
              key={demo.id}
              onClick={() => !isLoading && onDemoSelect(demo)}
              className="group p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {demo.subject}
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Start Demo <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {demo.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {demo.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Complete text layer
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> 8 Study paragraphs
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
