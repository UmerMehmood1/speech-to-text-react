import React, { useState, useEffect, useRef } from "react";
import "./MicrophoneVisualizer.css";
import LanguageDropdown from "./LanguageDropdown";
import Toast from "./Toast";

const MicrophoneVisualizer = () => {
  const [isListening, setIsListening] = useState(false);
  const [radius, setRadius] = useState(50);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("en-US");
  const [toastMessage, setToastMessage] = useState("");
  const [storedTranscript, setStoredTranscript] = useState("");

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const ringtoneDetectionRef = useRef(null);

  const SILENCE_THRESHOLD = 30;
  const SILENCE_TIMEOUT = 3000;

  useEffect(() => {
    return () => {
      stopListening(true);
    };
  }, []);

  const detectRingtone = (dataArray) => {
    if (!audioContextRef.current) {
      return false;
    }

    const ringtoneFrequencyRanges = [
      { min: 400, max: 450 }, // Adjust these ranges based on known ringtone frequencies
    ];

    const sampleRate = audioContextRef.current.sampleRate;
    for (let i = 0; i < dataArray.length; i++) {
      const frequency = i * (sampleRate / analyserRef.current.fftSize);
      const amplitude = dataArray[i];
      if (
        ringtoneFrequencyRanges.some(
          (range) =>
            frequency >= range.min &&
            frequency <= range.max &&
            amplitude > SILENCE_THRESHOLD
        )
      ) {
        return true;
      }
    }
    return false;
  };

  const startListening = async () => {
    if (isListening) return;
    setTranscript("");
    try {
      if (!navigator.onLine) {
        showToast("No internet connection!");
        return;
      }

      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(stream);

      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 512;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateCircleSize = () => {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setRadius(50 + average / 4);

        if (detectRingtone(dataArray)) {
          showToast("Ringtone detected. Stopping listening.");
          stopListening(true);
          return;
        }

        if (average < SILENCE_THRESHOLD) {
          if (!silenceTimeoutRef.current) {
            silenceTimeoutRef.current = setTimeout(() => {
              stopListening();
            }, SILENCE_TIMEOUT);
          }
        } else {
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
        }
        requestAnimationFrame(updateCircleSize);
      };
      updateCircleSize();

      const recognition = new (window.SpeechRecognition ||
        window.webkitSpeechRecognition)();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        Array.from(event.results).forEach((result) => {
          if (result.isFinal) {
            finalTranscript += result[0].transcript + " ";
          } else {
            interimTranscript += result[0].transcript + " ";
          }
        });

        setTranscript(finalTranscript.trim() + interimTranscript.trim());
        console.log(transcript);
      };

      recognition.onerror = (event) => {
        showToast("Speech recognition error: " + event.error);
        stopListening(true);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (error) {
      console.error(
        "Error accessing microphone or starting speech recognition",
        error
      );
      showToast("Error accessing microphone or starting speech recognition");
    }
  };

  const stopListening = (immediate = false) => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    setIsListening(false);

    if (immediate) {
      setTranscript("");
    }
  };

  const toggleListening = () => {
    if (!isListening) {
      startListening();
    } else {
      setStoredTranscript(
        (prevTranscript) => prevTranscript + " " + transcript
      );
      setTranscript("");
      stopListening();
    }
  };

  const handleLanguageChange = (code) => {
    setLanguage(code);
    if (isListening) {
      stopListening(true);
      startListening();
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const copyToClipboard = () => {
    if (storedTranscript) {
      navigator.clipboard
        .writeText(storedTranscript)
        .then(() => showToast("Transcript copied to clipboard!"))
        .catch((err) => showToast("Failed to copy transcript."));
    }
  };

  const removeTranscript = () => {
    setStoredTranscript("");
  };

  return (
    <div className="visualizer-container">
      {toastMessage && <Toast message={toastMessage} />}
      <div className="language-dropdown-container">
        <LanguageDropdown
          selectedLanguage={language}
          onSelectLanguage={handleLanguageChange}
        />
      </div>

      <button
        className={`mic-btn ${isListening ? "listening" : ""}`}
        onClick={toggleListening}
      >
        {isListening ? (
          <i class="fa fa-pause" aria-hidden="true"></i>
        ) : (
          <i className={`fas fa-microphone `} />
        )}
      </button>
      {isListening ? (
        <div className="transcript">
          <p>{storedTranscript + transcript}</p>
        </div>
      ) : (
        <div className="transcript">
          <p>
            {storedTranscript.length !== 0
              ? storedTranscript
              : "Say something..."}
          </p>
        </div>
      )}

      <div className="btns">
        <button onClick={copyToClipboard} className="copy-btn">
          Copy to Clipboard
        </button>
        <button onClick={removeTranscript} className="copy-btn">
          Clear Transcript
        </button>
      </div>
    </div>
  );
};

export default MicrophoneVisualizer;
