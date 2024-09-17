import React, { useState, useEffect, useRef } from 'react';
import './MicrophoneVisualizer.css';
import LanguageDropdown from './LanguageDropdown';
import Toast from './Toast'; // A new Toast component for notifications

const MicrophoneVisualizer = () => {
    const [isListening, setIsListening] = useState(false);
    const [radius, setRadius] = useState(50);
    const [transcript, setTranscript] = useState('');
    const [language, setLanguage] = useState('en-US'); // Default language
    const [toastMessage, setToastMessage] = useState('');
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const recognitionRef = useRef(null);
    const silenceTimeoutRef = useRef(null);
    const SILENCE_THRESHOLD = 30; // Increased threshold for better responsiveness
    const SILENCE_TIMEOUT = 3000; // Time in milliseconds to wait before stopping

    useEffect(() => {
        return () => {
            stopListening(true); // Ensure cleanup
        };
    }, []);

    const startListening = async () => {
        if (isListening) return; // Prevent starting multiple times
        setTranscript(""); // Reset transcript when starting
        try {
            if (!navigator.onLine) {
                showToast('No internet connection!');
                return;
            }

            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioContextRef.current.createMediaStreamSource(stream);

            analyserRef.current = audioContextRef.current.createAnalyser();
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 512; // Increase FFT size for better frequency resolution
            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateCircleSize = () => {
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setRadius(50 + average / 4); // Adjust the radius scaling for better responsiveness

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

            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = language;

            recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                Array.from(event.results).forEach(result => {
                    if (result.isFinal) {
                        finalTranscript += result[0].transcript + ' ';
                    } else {
                        interimTranscript += result[0].transcript + ' ';
                    }
                });

                setTranscript(finalTranscript.trim() + interimTranscript.trim());
            };

            recognition.onerror = (event) => {
                showToast('Speech recognition error: ' + event.error);
                stopListening(true); // Pass true to ensure immediate stop
            };

            recognition.start();
            recognitionRef.current = recognition;
            setIsListening(true);

        } catch (error) {
            console.error('Error accessing microphone or starting speech recognition', error);
            showToast('Error accessing microphone or starting speech recognition');
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
            setTranscript(''); // Clear transcript if stopped immediately
        }
    };

    const toggleListening = () => {
        if (!isListening) {
            startListening();
        } else {
            stopListening(); // Remove immediate parameter to retain previous text
        }
    };

    const handleLanguageChange = (code) => {
        setLanguage(code);
        if (isListening) {
            stopListening(true);  // Stop first before restarting with new language
            startListening();
        }
    };

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => {
            setToastMessage('');
        }, 3000);
    };

    return (
        <div className="visualizer-container">
            {toastMessage && <Toast message={toastMessage} />}
            <div className="language-dropdown-container">
                <LanguageDropdown selectedLanguage={language} onSelectLanguage={handleLanguageChange} />
            </div>
            <div
                className="circle"
                style={{ width: radius * 2, height: radius * 2, borderRadius: radius, transition: 'all 0.3s ease-out' }}
            >
                <svg className="microphone-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 14c1.104 0 2-.896 2-2V8c0-1.104-.896-2-2-2s-2 .896-2 2v4c0 1.104.896 2 2 2zm0 2c-2.209 0-4 1.791-4 4h8c0-2.209-1.791-4-4-4zm6-4v-2c0-3.313-2.687-6-6-6s-6 2.687-6 6v2c0 .553.447 1 1 1h10c.553 0 1-.447 1-1zm2 2h-2v-2c0-4.418-3.582-8-8-8s-8 3.582-8 8v2H4c-1.104 0-2 .896-2 2v1c0 1.104.896 2 2 2h2v1.586c0 .665.419 1.283 1.054 1.511.683.285 1.473.266 2.095-.037 1.057-.511 2.033-1.203 2.875-2.025 1.65-1.576 2.975-3.527 3.975-5.519.234-.462.356-.955.356-1.458V16c0 1.104.896 2 2 2h2c1.104 0 2-.896 2-2v-1c0-1.104-.896-2-2-2z" fill="#fff" />
                </svg>
            </div>
            <div className="transcript">
                <p>{transcript || "Say something..."}</p>
            </div>
            <button className={`mic-button ${isListening ? 'listening' : ''}`} onClick={toggleListening}>
                <svg className="microphone-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 14c1.104 0 2-.896 2-2V8c0-1.104-.896-2-2-2s-2 .896-2 2v4c0 1.104.896 2 2 2zm0 2c-2.209 0-4 1.791-4 4h8c0-2.209-1.791-4-4-4zm6-4v-2c0-3.313-2.687-6-6-6s-6 2.687-6 6v2c0 .553.447 1 1 1h10c.553 0 1-.447 1-1zm2 2h-2v-2c0-4.418-3.582-8-8-8s-8 3.582-8 8v2H4c-1.104 0-2 .896-2 2v1c0 1.104.896 2 2 2h2v1.586c0 .665.419 1.283 1.054 1.511.683.285 1.473.266 2.095-.037 1.057-.511 2.033-1.203 2.875-2.025 1.65-1.576 2.975-3.527 3.975-5.519.234-.462.356-.955.356-1.458V16c0 1.104.896 2 2 2h2c1.104 0 2-.896 2-2v-1c0-1.104-.896-2-2-2z" fill="#fff" />
                </svg>
            </button>
        </div>
    );
};

export default MicrophoneVisualizer;
