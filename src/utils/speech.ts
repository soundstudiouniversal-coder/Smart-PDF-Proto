export class SpeechManager {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isAvailable: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.isAvailable = true;
      this.loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public hasSupport(): boolean {
    return this.isAvailable;
  }

  public speak(
    text: string,
    wpm: number = 200,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    },
    language: 'English' | 'Tamil' | 'Telugu' = 'English'
  ): void {
    if (!this.synth) {
      callbacks?.onEnd?.();
      return;
    }

    this.stop();

    const cleanedText = text
      .replace(/[•*\-–—]/g, ' ')
      .replace(/->/g, 'yields')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanedText) {
      callbacks?.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanedText);

    // Map WPM (typically 120 - 320) to speech rate (0.7 to 1.7)
    const rate = Math.min(2.0, Math.max(0.6, wpm / 175));
    utterance.rate = rate;
    utterance.pitch = 1.0;

    let targetLangCode = 'en-US';
    let preferredVoice: SpeechSynthesisVoice | undefined;

    if (language === 'Tamil') {
      targetLangCode = 'ta-IN';
      utterance.lang = 'ta-IN';
      preferredVoice =
        this.voices.find((v) => v.lang.toLowerCase().startsWith('ta')) ||
        this.voices.find((v) => v.lang.toLowerCase().includes('ta-in'));
    } else if (language === 'Telugu') {
      targetLangCode = 'te-IN';
      utterance.lang = 'te-IN';
      preferredVoice =
        this.voices.find((v) => v.lang.toLowerCase().startsWith('te')) ||
        this.voices.find((v) => v.lang.toLowerCase().includes('te-in'));
    } else {
      targetLangCode = 'en-US';
      utterance.lang = 'en-US';
      preferredVoice =
        this.voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('India'))
        ) || this.voices.find((v) => v.lang.startsWith('en'));
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    } else {
      utterance.lang = targetLangCode;
    }

    utterance.onstart = () => {
      callbacks?.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      // 'interrupted' or 'canceled' are expected when user skips or pauses
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        callbacks?.onError?.(e);
      } else {
        callbacks?.onEnd?.();
      }
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public pause(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }
}

export const speechManager = new SpeechManager();
