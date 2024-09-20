import React, { useState } from "react";
import Select from "react-select";
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
      setValue("");
    }
  };

  const changeLang = (selectedOption) => {
    setLang(selectedOption.value);
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

  // Convert languages array to options for react-select
  const languageOptions = languages.map((language) => ({
    value: language.code,
    label: language.name,
  }));

  // Custom styles for react-select
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused
        ? "rgba(99, 102, 241, 0.5)"
        : "rgba(156, 163, 175, 0.5)",
      boxShadow: state.isFocused ? "0 0 0 1px rgba(99, 102, 241, 0.5)" : "none",
      backgroundColor: isDarkMode ? "#374151" : "#f3f4f6", // dark mode background color
      color: "#ffffff",

      "&:hover": {
        borderColor: "rgba(99, 102, 241, 0.5)",
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: isDarkMode ? "#374151" : "#f3f4f6", // dark mode background color
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#dbeafe"
        : isDarkMode
        ? "#4b5563"
        : "#f3f4f6", // dark mode background color
      color: state.isSelected ? "#1d4ed8" : isDarkMode ? "#ffffff" : "#4a4a4a",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "#cbd5e1",
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isDarkMode ? "#ffffff" : "#4a4a4a",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: isDarkMode ? "#ffffff" : "#4a4a4a",
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: isDarkMode ? "#ffffff" : "#4a4a4a",
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      backgroundColor: isDarkMode ? "#ffffff" : "#4a4a4a",
    }),
  };

  return (
    <div className="min-h-screen flex items-center justify-center  dark:bg-gray-900">
      <form
        id="speech-recognition-form"
        className="space-y-6 p-6 max-w-xl w-full mx-auto bg-white dark:bg-gray-800  rounded-md shadow-[0px_-4px_6px_rgba(0,0,0,0.1),0px_4px_6px_rgba(0,0,0,0.1)]"
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

            {/* Searchable Dropdown for Languages */}
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="language"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                Language
              </label>
              <Select
                id="language"
                options={languageOptions}
                value={languageOptions.find((option) => option.value === lang)}
                onChange={changeLang}
                className="basic-single"
                classNamePrefix="select"
                styles={customStyles}
              />
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
