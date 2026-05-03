import { useEffect, useRef, useState } from "react";

const getSpeechRecognition = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const EARLY_END_GRACE_MS = 1500;
const SILENCE_TIMEOUT_MS = 8000;
const RESTART_DELAY_MS = 120;

const VoiceChatComposer = ({
  disabled,
  isSending,
  onSubmit,
  onValueChange,
  placeholder = "Ask something about this PDF...",
  submitLabel = "Send",
  value,
}) => {
  const recognitionRef = useRef(null);
  const baseTranscriptRef = useRef("");
  const capturedSpeechRef = useRef(false);
  const manualStopRef = useRef(false);
  const sessionStartedAtRef = useRef(0);
  const silenceTimerRef = useRef(null);
  const restartTimerRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [supportsVoice, setSupportsVoice] = useState(() => Boolean(getSpeechRecognition()));

  useEffect(() => {
    setSupportsVoice(Boolean(getSpeechRecognition()));

    return () => {
      window.clearTimeout(silenceTimerRef.current);
      window.clearTimeout(restartTimerRef.current);
      recognitionRef.current?.abort();
    };
  }, []);

  const clearVoiceTimers = () => {
    window.clearTimeout(silenceTimerRef.current);
    window.clearTimeout(restartTimerRef.current);
  };

  const scheduleSilenceTimeout = () => {
    window.clearTimeout(silenceTimerRef.current);

    const elapsed = Date.now() - sessionStartedAtRef.current;
    const remainingTime = Math.max(SILENCE_TIMEOUT_MS - elapsed, 0);

    silenceTimerRef.current = window.setTimeout(() => {
      if (!capturedSpeechRef.current && recognitionRef.current) {
        setVoiceError("Voice input timed out because no speech was detected. Please try again or type your question.");
        manualStopRef.current = true;
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }, remainingTime);
  };

  const stopListening = () => {
    manualStopRef.current = true;
    clearVoiceTimers();
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const startRecognitionSession = (SpeechRecognition) => {
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceError("");
      setIsListening(true);
      scheduleSilenceTimeout();
    };

    recognition.onspeechstart = () => {
      capturedSpeechRef.current = true;
      window.clearTimeout(silenceTimerRef.current);
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }

      if (transcript.trim()) {
        capturedSpeechRef.current = true;
      }

      const nextValue = [baseTranscriptRef.current, transcript].filter(Boolean).join(" ").trim();
      onValueChange(nextValue);
    };

    recognition.onspeechend = () => {
      recognition.stop();
    };

    recognition.onerror = (event) => {
      const permissionErrors = ["not-allowed", "service-not-allowed"];

      if (permissionErrors.includes(event.error)) {
        clearVoiceTimers();
        setVoiceError("Microphone access was blocked. Allow microphone permission or type your question.");
        setIsListening(false);
        return;
      }

      if (event.error === "aborted" && manualStopRef.current) {
        return;
      }

      const elapsed = Date.now() - sessionStartedAtRef.current;

      if (!capturedSpeechRef.current && elapsed < EARLY_END_GRACE_MS) {
        return;
      }

      if (!capturedSpeechRef.current && elapsed >= SILENCE_TIMEOUT_MS) {
        setVoiceError("Voice input timed out because no speech was detected. Please try again or type your question.");
      }
    };

    recognition.onend = () => {
      const elapsed = Date.now() - sessionStartedAtRef.current;

      if (manualStopRef.current || capturedSpeechRef.current) {
        clearVoiceTimers();
        setIsListening(false);
        return;
      }

      if (elapsed < SILENCE_TIMEOUT_MS) {
        setIsListening(true);
        restartTimerRef.current = window.setTimeout(() => {
          startRecognitionSession(SpeechRecognition);
        }, Math.max(RESTART_DELAY_MS, EARLY_END_GRACE_MS - elapsed));
        return;
      }

      clearVoiceTimers();
      setVoiceError("Voice input timed out because no speech was detected. Please try again or type your question.");
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch {
      clearVoiceTimers();
      setVoiceError("Voice input could not start. Please try again or type your question.");
      setIsListening(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setVoiceError("Voice input is not supported in this browser. You can still type your question.");
      setSupportsVoice(false);
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    clearVoiceTimers();
    baseTranscriptRef.current = value.trim();
    capturedSpeechRef.current = false;
    manualStopRef.current = false;
    sessionStartedAtRef.current = Date.now();
    setVoiceError("");
    setIsListening(true);
    startRecognitionSession(SpeechRecognition);
  };

  return (
    <>
      <form className="chat-composer" onSubmit={onSubmit}>
        <label className="chat-input-wrap">
          <span className="sr-only">Ask a question</span>
          <input
            type="text"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />
        </label>

        <button
          className={`voice-button${isListening ? " listening" : ""}`}
          type="button"
          onClick={startListening}
          disabled={disabled || isSending}
          aria-pressed={isListening}
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
          title={supportsVoice ? "Ask with voice" : "Voice input is not supported"}
        >
          <span className="voice-button-dot" aria-hidden="true" />
          <span>{isListening ? "Listening" : "Mic"}</span>
        </button>

        <button className="primary-button" type="submit" disabled={isSending || !value.trim()}>
          {isSending ? "Sending..." : submitLabel}
        </button>
      </form>

      {voiceError ? <div className="status-alert voice-alert">{voiceError}</div> : null}
    </>
  );
};

export default VoiceChatComposer;
