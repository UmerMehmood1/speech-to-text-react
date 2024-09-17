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

        let finalTranscript = ''; // To store the full transcript

        recognition.onresult = (event) => {
            let interimTranscript = '';

            // Iterate through all results and build the interim transcript
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript; // Add final transcript
                } else {
                    interimTranscript += event.results[i][0].transcript; // Add interim transcript
                }
            }

            // Only set the updated transcript with new detected text
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
