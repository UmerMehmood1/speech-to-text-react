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
                <i className="fas fa-waveform circle-wave"></i>
            </div>
            <div className="transcript">
                <p>{transcript || "Say something..."}</p>
            </div>
            <button className={`mic-button ${isListening ? 'listening' : ''}`} onClick={toggleListening}>
                <i className={`fas fa-microphone ${isListening ? 'listening' : ''}`}></i>
            </button>
        </div>
    );
};

export default MicrophoneVisualizer;
