import { useRef, useEffect, useState, useCallback } from "react";

const useEventCallback = (fn, dependencies) => {
  const ref = useRef(() => {
    throw new Error("Cannot call an event handler while rendering.");
  });

  useEffect(() => {
    ref.current = fn;
  }, [fn, ...dependencies]);

  return useCallback(
    (args) => {
      const fn = ref.current;
      return fn(args);
    },
    [ref]
  );
};

const useSpeechRecognitionJs = (props = {}) => {
  const { onEnd = () => {}, onResult = () => {}, onError = () => {} } = props;
  const recognition = useRef(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);

  const processResult = (event) => {
    // Iterate through the speech results
    let transcript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      transcript += result[0].transcript;

      // Only append if the result is final (complete)
      if (result.isFinal) {
        onResult(transcript); // Send final result
      }
    }

    // Optionally, handle interim results (if you want real-time updates)
    if (!event.results[event.resultIndex].isFinal) {
      onResult(transcript); // Interim results
    }
  };

  const handleError = (event) => {
    if (event.error === "not-allowed") {
      recognition.current.onend = () => {};
      setListening(false);
    }
    onError(event);
  };

  const listen = useEventCallback(
    (args = {}) => {
      if (listening || !supported) return;
      const {
        lang = "",
        interimResults = true,
        continuous = false,
        maxAlternatives = 1,
        grammars,
      } = args;
      setListening(true);
      recognition.current.lang = lang;
      recognition.current.interimResults = interimResults;
      recognition.current.onresult = processResult;
      recognition.current.onerror = handleError;
      recognition.current.continuous = continuous;
      recognition.current.maxAlternatives = maxAlternatives;
      if (grammars) {
        recognition.current.grammars = grammars;
      }
      // SpeechRecognition stops automatically after inactivity
      // We want it to keep going until we tell it to stop
      recognition.current.onend = () => recognition.current.start();
      recognition.current.start();
    },
    [listening, supported, recognition]
  );

  const stop = useEventCallback(() => {
    if (!listening || !supported) return;
    recognition.current.onresult = () => {};
    recognition.current.onend = () => {};
    recognition.current.onerror = () => {};
    setListening(false);
    recognition.current.stop();
    onEnd();
  }, [listening, supported, recognition, onEnd]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (window.SpeechRecognition) {
      setSupported(true);
      recognition.current = new window.SpeechRecognition();
    }
  }, []);

  return {
    listen,
    listening,
    stop,
    supported,
  };
};

export default useSpeechRecognitionJs;
