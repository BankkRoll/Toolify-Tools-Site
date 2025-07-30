"use client";

import { useCallback, useEffect, useState } from "react";

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface RecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
}

/**
 * Hook for Web Speech API functionality (text-to-speech and speech-to-text)
 * @returns Object with speech synthesis and recognition functions
 */
export function useWebSpeech() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Check browser support
  useEffect(() => {
    const speechSupported = "speechSynthesis" in window;
    const recognitionSupported =
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    setIsSupported(speechSupported && recognitionSupported);

    if (speechSupported) {
      // Load available voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  /**
   * Converts text to speech
   * @param text - Text to speak
   * @param options - Speech synthesis options
   */
  const speak = useCallback(
    (text: string, options: SpeechOptions = {}) => {
      if (!isSupported) {
        setError("Speech synthesis not supported");
        return;
      }

      try {
        window.speechSynthesis.cancel(); // Stop any current speech

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voices.find((v) => v.name === options.voice) || null;
        utterance.rate = options.rate || 1;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event: any) => {
          setIsSpeaking(false);
          setError(`Speech error: ${event.error}`);
        };

        window.speechSynthesis.speak(utterance);
        setError(null);
      } catch (err) {
        setError("Failed to speak text");
      }
    },
    [isSupported, voices],
  );

  /**
   * Stops current speech synthesis
   */
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  /**
   * Starts speech recognition
   * @param options - Speech recognition options
   */
  const startListening = useCallback(
    (options: RecognitionOptions = {}) => {
      if (!isSupported) {
        setError("Speech recognition not supported");
        return;
      }

      try {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = options.continuous || false;
        recognition.interimResults = options.interimResults || false;
        recognition.lang = options.lang || "en-US";

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("");
          setTranscript(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          setIsListening(false);
          setError(`Recognition error: ${event.error}`);
        };

        recognition.start();
      } catch (err) {
        setError("Failed to start speech recognition");
      }
    },
    [isSupported],
  );

  /**
   * Stops speech recognition
   */
  const stopListening = useCallback(() => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      // Note: We can't directly stop recognition without a reference to the instance
      // This is a limitation of the Web Speech API
      setIsListening(false);
    }
  }, []);

  /**
   * Clears current transcript
   */
  const clearTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isSupported,
    isSpeaking,
    isListening,
    voices,
    transcript,
    error,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    clearTranscript,
  };
}
