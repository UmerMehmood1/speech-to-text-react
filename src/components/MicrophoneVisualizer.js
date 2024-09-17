import React, { useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import "./MicrophoneVisualizer.css";
import LanguageDropdown from "./LanguageDropdown";
import Toast from "./Toast";

const MicrophoneVisualizer = () => {
  const [language, setLanguage] = useState("en-US");
  const [toastMessage, setToastMessage] = useState("");
  const [accumulatedTranscript, setAccumulatedTranscript] = useState(""); // State for accumulated transcript

  const {
    transcript,
    resetTranscript,
    listening,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const handleLanguageChange = (code) => {
    setLanguage(code);
    if (listening) {
      SpeechRecognition.stopListening();
      SpeechRecognition.startListening({ continuous: true, language: code });
    }
  };

  const toggleListening = () => {
    if (listening) {
      // Accumulate the final transcript and reset the current transcript
      setAccumulatedTranscript((prev) => prev + " " + transcript);
      SpeechRecognition.stopListening();
      resetTranscript();
    } else {
      // Start listening
      SpeechRecognition.startListening({ continuous: true, language });
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const copyToClipboard = () => {
    const fullTranscript = accumulatedTranscript + " " + transcript;
    if (fullTranscript) {
      navigator.clipboard
        .writeText(fullTranscript)
        .then(() => showToast("Transcript copied to clipboard!"))
        .catch(() => showToast("Failed to copy transcript."));
    }
  };

  const removeTranscript = () => {
    setAccumulatedTranscript(""); // Clear accumulated transcript
    resetTranscript(); // Clear current transcript
  };

  if (!browserSupportsSpeechRecognition) {
    return <div>Browser does not support speech recognition.</div>;
  }

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
        className={`mic-btn ${listening ? "listening" : ""}`}
        onClick={toggleListening}
      >
        {listening ? (
          <i className="fa fa-pause" aria-hidden="true"></i>
        ) : (
          <i className="fas fa-microphone" />
        )}
      </button>

      <div className="transcript">
        <p>{accumulatedTranscript + " " + transcript || "Say something..."}</p>
      </div>

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
