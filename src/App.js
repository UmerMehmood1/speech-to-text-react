// src/App.js

import React from "react";
import SpeechRecognition from "./components/SpeechRecognition";
import { ToastContainer } from "react-toastify";
export default function App() {
  return (
    <div>
      <ToastContainer />
      <SpeechRecognition />
    </div>
  );
}
