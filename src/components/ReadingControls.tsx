import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Gauge,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Repeat,
} from 'lucide-react';
import { ReadingSettings } from '../types';

interface ReadingControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextLine: () => void;
  onPrevLine: () => void;
  hasPrevLine: boolean;
  hasNextLine: boolean;
  settings: ReadingSettings;
  onUpdateSettings: (newSettings: Partial<ReadingSettings>) => void;
  isParagraphPaused: boolean;
  onContinueReading: () => void;
  speechSupported: boolean;
}

export const ReadingControls: React.FC<ReadingControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onNextLine,
  onPrevLine,
  hasPrevLine,
  hasNextLine,
  settings,
  onUpdateSettings,
  isParagraphPaused,
  onContinueReading,
  speechSupported,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
      {/* Left: Playback Controls */}
      <div className="flex items-center gap-2">
        {isParagraphPaused ? (
          <button
            onClick={onContinueReading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all scale-100 hover:scale-[1.02] active:scale-[0.98]"
            title="Continue reading next paragraph (Space)"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Continue Reading</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-black/20 rounded font-mono">
              Space
            </kbd>
          </button>
        ) : (
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all scale-100 hover:scale-[1.02] active:scale-[0.98] ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
            }`}
            title={isPlaying ? 'Pause reading (Space)' : 'Start reading (Space)'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start Reading</span>
              </>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-black/20 rounded font-mono">
              Space
            </kbd>
          </button>
        )}

        {/* Step Prev & Next */}
        <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
          <button
            disabled={!hasPrevLine}
            onClick={onPrevLine}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Previous line (Left Arrow)"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            disabled={!hasNextLine}
            onClick={onNextLine}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Next line (Right Arrow)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Reading Speed Presets & Slider */}
      <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <Gauge className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
          Speed:
        </span>

        {/* Speed presets */}
        <div className="flex items-center gap-1">
          {[
            { label: 'Slow', wpm: 140 },
            { label: 'Med', wpm: 210 },
            { label: 'Fast', wpm: 300 },
          ].map((preset) => {
            const isActive = Math.abs(settings.wpm - preset.wpm) < 35;
            return (
              <button
                key={preset.label}
                onClick={() => onUpdateSettings({ wpm: preset.wpm })}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 min-w-[50px] text-right">
          {settings.wpm} wpm
        </span>
      </div>

      {/* Right: Audio Read Aloud & Auto-Continue toggles */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Read aloud toggle */}
        {speechSupported && (
          <button
            onClick={() => onUpdateSettings({ readAloud: !settings.readAloud })}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
              settings.readAloud
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="Read lines aloud with voice speech (M)"
          >
            {settings.readAloud ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Voice</span>
          </button>
        )}

        {/* Auto Continue toggle */}
        <button
          onClick={() => onUpdateSettings({ autoContinue: !settings.autoContinue })}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
            settings.autoContinue
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300'
              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          title="Automatically resume reading after notes load"
        >
          <Repeat className={`w-3.5 h-3.5 ${settings.autoContinue ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
          <span className="hidden md:inline">Auto-continue</span>
        </button>
      </div>
    </div>
  );
};
