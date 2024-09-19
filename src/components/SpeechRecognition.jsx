import React, { useState } from "react";
import {
  FaMoon,
  FaSun,
  FaMicrophone,
  FaPause,
  FaClipboard,
  FaTrash,
} from "react-icons/fa";
import useSpeechRecognitionJs from "./useSpeechRecognition";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import languages from "../langauges-data/languages";

const languageOptions = [
  { label: "Cambodian", value: "km-KH" },
  { label: "Deutsch", value: "de-DE" },
  { label: "English", value: "en-AU" },
  { label: "Farsi", value: "fa-IR" },
  { label: "Français", value: "fr-FR" },
  { label: "Italiano", value: "it-IT" },
  { label: "普通话 (中国大陆) - Mandarin", value: "zh" },
  { label: "Portuguese", value: "pt-BR" },
  { label: "Español", value: "es-MX" },
  { label: "Svenska - Swedish", value: "sv-SE" },
];

const SpeechRecognition = () => {
  const [lang, setLang] = useState("en-AU");
  const [value, setValue] = useState();
  const [storedValue, setStoredValue] = useState([]);
  const [blocked, setBlocked] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const onEnd = () => {
    // You could do something here after listening has finished
  };

  const onResult = (result) => {
    if (result) {
      setValue(result);
    } else {
      console.log("object");
      setValue("");
    }
  };

  const changeLang = (event) => {
    setLang(event.target.value);
  };

  const onError = (event) => {
    if (event.error === "not-allowed") {
      setBlocked(true);
      toast.error(
        "Microphone access blocked. Please enable it in browser settings."
      );
    }
  };

  const { listen, listening, stop, supported } = useSpeechRecognitionJs({
    onResult,
    onEnd,
    onError,
  });

  const toggle = listening
    ? () => {
        stop();
        if (value) {
          setStoredValue((prev) => [...prev, value]);
          toast.success("Recording stopped");
        }
      }
    : () => {
        setBlocked(false);
        listen({ lang });
        toast.info("Recording started");
      };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const copyToClipboard = () => {
    const fullTranscript = storedValue.join() + " ";
    if (fullTranscript) {
      navigator.clipboard.writeText(fullTranscript).then(
        () => {
          toast.success("Copied to clipboard!");
        },
        (err) => {
          toast.error("Failed to copy to clipboard.");
        }
      );
    }
  };

  const removeTranscripts = () => {
    setStoredValue([]);
    setValue("");
    toast.success("Successfully Removed The Transcripts");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <form
        id="speech-recognition-form"
        className="space-y-6 p-6 max-w-xl w-full mx-auto bg-white dark:bg-gray-800 shadow-md rounded-md"
      >
        <div className="flex justify-between items-center mt-4">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 ">
            Speech Recognition
          </h2>

          {/* Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="text-gray-700 dark:text-gray-200 focus:outline-none "
          >
            {isDarkMode ? <FaSun size={24} /> : <FaMoon size={24} />}
          </button>
        </div>

        {!supported && (
          <p className="text-red-500">
            Oh no, it looks like your browser doesn&#39;t support Speech
            Recognition.
          </p>
        )}
        {supported && (
          <>
            <p className="text-gray-600 dark:text-gray-300">
              {`Click 'Record Icon' to start speaking. SpeechRecognition will provide a transcript of what you are saying.`}
            </p>
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="language"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                Language
              </label>
              <select
                form="speech-recognition-form"
                id="language"
                value={lang}
                onChange={changeLang}
                className="border rounded-md p-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:ring focus:ring-indigo-200 dark:focus:ring-indigo-500"
              >
                {languages.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="transcript"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                Transcript
              </label>
              <textarea
                id="transcript"
                name="transcript"
                placeholder="Waiting to take notes ..."
                value={value}
                rows={3}
                disabled
                className="border rounded-md p-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 focus:ring focus:ring-indigo-200 dark:focus:ring-indigo-500"
              />
            </div>

            {/* Scrollable Transcript List */}
            <div className="max-h-48 overflow-y-auto space-y-1 text-gray-700 dark:text-gray-300">
              <ul>
                {storedValue.map((value, index) => (
                  <li
                    key={index}
                    className="p-2 mt-2 bg-gray-100 dark:bg-gray-700 rounded-md"
                  >
                    {value}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recording and Pause Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex justify-start space-x-4 mt-4">
                <button
                  disabled={blocked}
                  type="button"
                  onClick={toggle}
                  className={`p-4 flex items-center justify-center text-white font-semibold rounded-xl ${
                    blocked
                      ? "bg-red-500 dark:bg-red-400 opacity-50 cursor-not-allowed"
                      : "bg-indigo-500 dark:bg-indigo-400"
                  }`}
                >
                  {listening ? (
                    <FaPause className="inline " />
                  ) : (
                    <FaMicrophone className="inline " />
                  )}
                </button>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className={
                    "p-4 flex items-center justify-center text-white font-semibold rounded-xl bg-indigo-500 dark:bg-indigo-400"
                  }
                >
                  <FaClipboard className="inline " />
                </button>
              </div>
              <div className="flex justify-start space-x-4 mt-4">
                <button
                  type="button"
                  onClick={removeTranscripts}
                  className={
                    "p-4 flex items-center justify-center text-white font-semibold rounded-xl bg-red-500 dark:bg-red-400"
                  }
                >
                  <FaTrash className="inline " />
                </button>
              </div>
            </div>

            {blocked && (
              <p className="mt-2 text-red-500 dark:text-red-400">
                The microphone is blocked for this site in your browser.
              </p>
            )}
          </>
        )}
      </form>
    </div>
  );
};

export default SpeechRecognition;
