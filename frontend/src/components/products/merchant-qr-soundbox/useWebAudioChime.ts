'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface RegionalSpeechItem {
  code: string;
  label: string;
  nativeText: string;
  phoneticText: string;
  langTag: string;
}

export const REGIONAL_LANGUAGES: RegionalSpeechItem[] = [
  {
    code: 'en',
    label: 'English',
    nativeText: 'Payment of ₹500 received on Adyapan Pay',
    phoneticText: 'Payment of five hundred rupees received on Adyapan Pay',
    langTag: 'en-IN',
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeText: '₹500 प्राप्त हुए',
    phoneticText: 'Adyapan Pay par paanch sau rupaye praapt hue',
    langTag: 'hi-IN',
  },
  {
    code: 'ta',
    label: 'Tamil',
    nativeText: '₹500 பெறப்பட்டது',
    phoneticText: 'Adyapan Pay-il ainnooru roobai perappattadhu',
    langTag: 'ta-IN',
  },
  {
    code: 'te',
    label: 'Telugu',
    nativeText: '₹500 స్వీకరించబడింది',
    phoneticText: 'Adyapan Pay lo aidhu vandhala roopaayalu sweekarincha badindhi',
    langTag: 'te-IN',
  },
  {
    code: 'bn',
    label: 'Bengali',
    nativeText: '₹500 গ্রহণ করা হয়েছে',
    phoneticText: 'Adyapan Pay-te paanch sho taka grohon kora hoyeche',
    langTag: 'bn-IN',
  },
  {
    code: 'mr',
    label: 'Marathi',
    nativeText: '₹500 प्राप्त झाले',
    phoneticText: 'Adyapan Pay var paachshe rupaye praapt jhaale',
    langTag: 'mr-IN',
  },
  {
    code: 'kn',
    label: 'Kannada',
    nativeText: '₹500 ಸ್ವೀಕರಿಸಲಾಗಿದೆ',
    phoneticText: 'Adyapan Pay nalli aidhu nooru roopaayi sweekarisalaagidhe',
    langTag: 'kn-IN',
  },
  {
    code: 'gu',
    label: 'Gujarati',
    nativeText: '₹500 મળ્યા',
    phoneticText: 'Adyapan Pay par paanchso rupiya malya',
    langTag: 'gu-IN',
  },
];

export function useWebAudioChime() {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Initialize and load speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      try {
        const list = window.speechSynthesis.getVoices();
        if (list && list.length > 0) {
          voicesRef.current = list;
        }
      } catch {
        // Safe fallback
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  const playChime = useCallback(
    (volumeFraction: number = 0.8) => {
      if (isAudioMuted || volumeFraction <= 0) return;

      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        const effectiveVol = Math.min(1, Math.max(0.2, volumeFraction * 0.75));
        masterGain.gain.setValueAtTime(effectiveVol, now);
        masterGain.connect(ctx.destination);

        // Soundbox prompt sequence: Three clean harmonic resonant tones
        // Tone 1: 587.33 Hz (D5) - 0.14s
        // Tone 2: 880.00 Hz (A5) - 0.14s
        // Tone 3: 1174.66 Hz (D6) - 0.40s
        const notes = [
          { freq: 587.33, time: now, duration: 0.14 },
          { freq: 880.00, time: now + 0.11, duration: 0.14 },
          { freq: 1174.66, time: now + 0.22, duration: 0.40 },
        ];

        notes.forEach(({ freq, time, duration }) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);

          noteGain.gain.setValueAtTime(0.001, time);
          noteGain.gain.exponentialRampToValueAtTime(0.45, time + 0.02);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

          osc.connect(noteGain);
          noteGain.connect(masterGain);

          osc.start(time);
          osc.stop(time + duration + 0.05);
        });
      } catch {
        // Fallback gracefully
      }
    },
    [isAudioMuted, getAudioContext]
  );

  /**
   * Universal Speech Synthesizer:
   * 1. If user OS has a native voice for the language (e.g. Tamil on Tamil Windows), speak native script.
   * 2. If OS lacks the native voice (most Windows PCs only have English/Hindi), speak phonetic transliteration
   *    using Indian English or default voice so the user ACTUALLY HEARS the sentence spoken aloud instead of silence!
   */
  const speakLanguage = useCallback(
    (langCode: string, volumeFraction: number = 0.8) => {
      if (isAudioMuted || volumeFraction <= 0) return;
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.cancel();

        const langData =
          REGIONAL_LANGUAGES.find((l) => l.code === langCode) || REGIONAL_LANGUAGES[0];

        // Refresh available voices
        const availableVoices =
          voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();

        // 1. Check if an exact native voice exists for this language
        const nativeVoice = availableVoices.find(
          (v) =>
            v.lang.toLowerCase().startsWith(langCode) ||
            v.lang.toLowerCase().replace('_', '-').startsWith(langData.langTag.toLowerCase())
        );

        let textToSpeak = '';
        let selectedVoice: SpeechSynthesisVoice | null = null;
        let selectedLangTag = 'en-IN';

        if (nativeVoice && langCode !== 'en') {
          // Native voice exists! Speak native script
          textToSpeak = langData.nativeText;
          selectedVoice = nativeVoice;
          selectedLangTag = nativeVoice.lang;
        } else {
          // Fallback to Indian English or standard voice with authentic phonetic transliteration
          textToSpeak = langData.phoneticText;

          // Find Indian English voice if available (e.g. Microsoft Heera, Google en-IN), or default English
          const indianEnglish = availableVoices.find((v) => v.lang.toLowerCase().includes('en-in'));
          const anyEnglish = availableVoices.find((v) => v.lang.toLowerCase().startsWith('en'));
          selectedVoice = indianEnglish || anyEnglish || availableVoices[0] || null;
          selectedLangTag = selectedVoice?.lang || 'en-IN';
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        utterance.lang = selectedLangTag;
        utterance.volume = Math.min(1, Math.max(0.2, volumeFraction));
        utterance.rate = 0.95; // Crisp, clear announcement speed
        utterance.pitch = 1.05; // Friendly, clear counter tone

        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback gracefully
      }
    },
    [isAudioMuted]
  );

  const playVoiceConfirmation = useCallback(
    (langCode: string = 'en', volumeFraction: number = 0.8) => {
      // 1. Instant soundbox harmonic chime
      playChime(volumeFraction);
      // 2. Clear vocal announcement right after the chime
      setTimeout(() => {
        speakLanguage(langCode, volumeFraction);
      }, 360);
    },
    [playChime, speakLanguage]
  );

  const toggleMute = useCallback(() => {
    setIsAudioMuted((prev) => {
      const next = !prev;
      if (!next) {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume();
        }
      }
      return next;
    });
  }, [getAudioContext]);

  return {
    isAudioMuted,
    toggleMute,
    playChime,
    speakLanguage,
    playVoiceConfirmation,
  };
}
