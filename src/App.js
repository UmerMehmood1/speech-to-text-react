// src/App.js
import "@fortawesome/fontawesome-free/css/all.min.css";

import React from "react";
import "./App.css";
import MicrophoneVisualizer from "./components/MicrophoneVisualizer";

function App() {
  return (
    <div className="App">
      <MicrophoneVisualizer />
    </div>
  );
}

export default App;
