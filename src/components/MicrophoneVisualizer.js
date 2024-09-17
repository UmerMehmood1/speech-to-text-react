import React, { useState, useEffect, useRef } from 'react';
import './MicrophoneVisualizer.css';
import LanguageDropdown from './LanguageDropdown';

const MicrophoneVisualizer = () => {
    const [isListening, setIsListening] = useState(false);
    const [radius, setRadius] = useState(50);
    const [transcript, setTranscript] = useState('');
    const [language, setLanguage] = useState('en-US'); // Default language
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const recognitionRef = useRef(null);
    const silenceTimeoutRef = useRef(null);
    const SILENCE_THRESHOLD = 100; // Adjust this threshold as needed
    const SILENCE_TIMEOUT = 1000; // Time in milliseconds to wait before stopping

    useEffect(() => {
        // Clean up function to stop listening when the component is unmounted
        return () => {
            stopListening();
        };
    }, []);

    const startListening = async () => {
        if (isListening) return; // Prevent starting multiple times

        try {
            // Set up the Web Audio API
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioContextRef.current.createMediaStreamSource(stream);
            
            // Create analyser node
            analyserRef.current = audioContextRef.current.createAnalyser();
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;
            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            // Function to update the circle size and detect silence
            const updateCircleSize = () => {
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setRadius(50 + average / 2); // Adjust the radius scaling as needed

                if (average < SILENCE_THRESHOLD) {
                    // If audio level is below the threshold, set a timeout to stop listening
                    if (!silenceTimeoutRef.current) {
                        silenceTimeoutRef.current = setTimeout(() => {
                            stopListening();
                        }, SILENCE_TIMEOUT);
                    }
                } else {
                    // Reset the timeout if audio is detected
                    if (silenceTimeoutRef.current) {
                        clearTimeout(silenceTimeoutRef.current);
                        silenceTimeoutRef.current = null;
                    }
                }
                requestAnimationFrame(updateCircleSize);
            };
            updateCircleSize();

            // Set up the Web Speech API
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = language;

            recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = transcript; // Initialize with the previous transcript
            
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        // Append final result to the transcript
                        finalTranscript += ' ' + result[0].transcript;
                    } else {
                        // Capture interim result for real-time display
                        interimTranscript += ' ' + result[0].transcript;
                    }
                }
            
                // Update the live transcript with both final and interim results
                setTranscript(finalTranscript + interimTranscript);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error detected:', event.error);
            };

            recognition.start();
            recognitionRef.current = recognition;
            setIsListening(true); // Update state to reflect that listening has started

        } catch (error) {
            console.error('Error accessing microphone or starting speech recognition', error);
        }
    };

    const stopListening = () => {
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
        setIsListening(false); // Update state to reflect that listening has stopped

        // Clear the transcript when completely stopped
        setTranscript('');
    };

    const toggleListening = () => {
        if (!isListening) {
            startListening();
        } else {
            stopListening();
        }
    };

    const handleLanguageChange = (code) => {
        setLanguage(code);
        if (isListening) {
            stopListening();  // Stop first before restarting with new language
            startListening();
        }
    };

    return (
        <div className="visualizer-container">
            <div className="language-dropdown-container">
                <LanguageDropdown selectedLanguage={language} onSelectLanguage={handleLanguageChange} />
            </div>
            <div
                className="circle"
                style={{ width: radius * 2, height: radius * 2, borderRadius: radius }}
            >
                <svg className="microphone-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 14c1.104 0 2-.896 2-2V8c0-1.104-.896-2-2-2s-2 .896-2 2v4c0 1.104.896 2 2 2zm0 2c-2.209 0-4 1.791-4 4h8c0-2.209-1.791-4-4-4zm6-4v-2c0-3.313-2.687-6-6-6s-6 2.687-6 6v2c0 .553.447 1 1 1h10c.553 0 1-.447 1-1zm2 2h-2v-2c0-4.418-3.582-8-8-8s-8 3.582-8 8v2H4c-1.104 0-2 .896-2 2v1c0 1.104.896 2 2 2h2v1.586c0 .665.419 1.283 1.054 1.511.683.285 1.473.266 2.095-.037 1.057-.511 2.033-1.203 2.875-2.025 1.65-1.576 2.975-3.527 3.975-5.519.234-.462.356-.955.356-1.458V16c0 1.104.896 2 2 2h2c1.104 0 2-.896 2-2v-1c0-1.104-.896-2-2-2z" fill="#fff"/>
                </svg>
            </div>
            <div className="transcript">
                <p>{transcript || "Say something..."}</p>
            </div>
            <button onClick={toggleListening}>
                {isListening ? 'Stop Listening' : 'Start Listening'}
            </button>
        </div>
    );
};

export default MicrophoneVisualizer;
