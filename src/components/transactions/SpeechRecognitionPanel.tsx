import React, { useState, useEffect, useRef } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X, Mic, Square, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";

// Type definitions for Speech Recognition API
// @ts-ignore
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

interface SpeechRecognitionPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (audioBlob: Blob, text: string, base64Audio: string | null) => void;
}

export const SpeechRecognitionPanel: React.FC<SpeechRecognitionPanelProps> = ({ isOpen, onClose, onConfirm }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize Speech Recognition if supported
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "es-ES"; // default to Spanish

            recognition.onresult = (event: any) => {
                let finalTranscript = "";
                let interimTranscript = "";

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // Use functional state update to preserve previous final transcripts if needed
                // Here we just accumulate the raw result
                const currentTranscript = Array.from(event.results)
                    .map((res: any) => res[0].transcript)
                    .join("");

                setTranscript(currentTranscript);
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                if (event.error === 'not-allowed') {
                    toast.error("Permiso de micrófono denegado.");
                    stopRecording();
                }
            };

            recognitionRef.current = recognition;
        }
    }, []);

    // Use an effect to reset state when the panel opens
    useEffect(() => {
        if (isOpen) {
            setTranscript("");
            setAudioBlob(null);
            setIsRecording(false);
            audioChunksRef.current = [];
        } else {
            // Force stop if closed while recording
            if (isRecording) {
                stopRecording();
            }
        }
    }, [isOpen]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(audioBlob);

                // Stop all tracks to release the microphone
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();

            if (recognitionRef.current) {
                setTranscript(""); // clear previous
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    console.error("Recognition already started", e);
                }
            }

            setIsRecording(true);
            toast.info("Escuchando...");
        } catch (err) {
            console.error("Microphone access error:", err);
            toast.error("No se pudo acceder al micrófono.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error("Recognition stop error", e);
            }
        }

        setIsRecording(false);
    };

    const MAX_INLINE_BYTES = 20 * 1024 * 1024; // 20 MB — Gemini inline audio limit

    const handleConfirm = () => {
        if (audioBlob) {
            if (audioBlob.size <= MAX_INLINE_BYTES) {
                // Within limit: convert to base64 and send alongside text
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const dataUrl = reader.result as string;
                    const base64Audio = dataUrl.split(',')[1];
                    onConfirm(audioBlob, transcript, base64Audio);
                };
            } else {
                // Too large: fall back to text-only
                onConfirm(audioBlob, transcript, null);
            }
            onClose();
        }
    };

    const hasRecorded = audioBlob !== null && !isRecording;

    return (
        <Drawer open={isOpen} onOpenChange={onClose}>
            <DrawerContent className="h-auto max-h-[90vh] flex flex-col items-center p-4 pb-8 sm:p-6 sm:pb-8">
                <DrawerClose className="absolute right-3 top-3 z-10">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
                        <X className="h-4 w-4" />
                    </Button>
                </DrawerClose>
                <DrawerHeader className="w-full mt-4">
                    <DrawerTitle className="text-center text-[#2d509e] flex flex-col gap-1">
                        <span className="text-xl sm:text-2xl font-bold leading-tight">¿A dónde se fueron tus Biyuyos?</span>
                        <span className="text-base sm:text-lg font-medium opacity-90">¡Te escuchamos!</span>
                    </DrawerTitle>
                </DrawerHeader>

                <div className="w-full max-w-md mt-2 flex flex-col items-center gap-6">

                    <div className="w-full min-h-[100px] max-h-[20vh] overflow-y-auto p-4 bg-muted rounded-md text-center flex items-center justify-center">
                        {transcript ? (
                            <p className="text-sm italic">{transcript}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                Aun no hemos escuchado nada...
                            </p>
                        )}
                    </div>

                    <div className="w-full flex flex-col xs:flex-row justify-center gap-3 sm:gap-4">
                        {!hasRecorded ? (
                            <Button
                                size="lg"
                                className={`w-full max-w-[200px] mx-auto gap-2 rounded-full h-14 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary'}`}
                                onClick={isRecording ? stopRecording : startRecording}
                            >
                                {isRecording ? (
                                    <>
                                        <Square className="h-5 w-5 fill-current" /> Detener
                                    </>
                                ) : (
                                    <>
                                        <Mic className="h-5 w-5" /> Iniciar
                                    </>
                                )}
                            </Button>
                        ) : (
                            <div className="w-full flex flex-col sm:flex-row gap-3">
                                <Button variant="outline" size="lg" className="w-full sm:flex-1 gap-2" onClick={startRecording}>
                                    <RotateCcw className="h-5 w-5" /> Grabar de nuevo
                                </Button>
                                <Button size="lg" className="w-full sm:flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirm}>
                                    <Check className="h-5 w-5" /> Confirmar
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};
