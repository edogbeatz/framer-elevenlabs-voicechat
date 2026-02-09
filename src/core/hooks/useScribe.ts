import { useState, useRef, useCallback, useEffect } from "react"

export interface SpeechInputData {
    transcript: string
    isFinal?: boolean
}

export interface UseScribeProps {
    agentId?: string // New Primary Auth
    getToken?: () => Promise<string>
    apiKey?: string
    onStart?: () => void
    onStop?: () => void
    onChange?: (data: SpeechInputData) => void
    onError?: (error: Error) => void
    modelId?: string
    languageCode?: string
}

export function useScribe({
    agentId,
    getToken,
    apiKey,
    onStart,
    onStop,
    onChange,
    onError,
    modelId = "scribe_v2_realtime", // Only used for Scribe fallback
}: UseScribeProps) {
    const [isConnecting, setIsConnecting] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [transcript, setTranscript] = useState("")

    const socketRef = useRef<WebSocket | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const stopRecording = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close()
            socketRef.current = null
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop()
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }

        setIsConnected(false)
        setIsConnecting(false)
        onStop?.()
    }, [onStop])

    const startRecording = useCallback(async () => {
        try {
            setIsConnecting(true)

            // 2. Setup Audio
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            let wsUrl: URL

            if (agentId) {
                // --- AGENT MODE ---
                // Connect to Conversational Agent API
                wsUrl = new URL(`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`)
            } else {
                // --- SCRIBE MODE ---
                let token = ""
                if (getToken) {
                    token = await getToken()
                } else if (!apiKey) {
                    throw new Error("No authentication provided (agentId, getToken, or apiKey)")
                }

                wsUrl = new URL(`wss://api.elevenlabs.io/v1/speech-to-text/stream`)
                if (token) wsUrl.searchParams.append("token", token)
                else if (apiKey) wsUrl.searchParams.append("xi-api-key", apiKey)

                wsUrl.searchParams.append("model_id", modelId)
            }

            const socket = new WebSocket(wsUrl.toString())
            socketRef.current = socket

            socket.onopen = () => {
                setIsConnecting(false)
                setIsConnected(true)
                onStart?.()

                // Start MediaRecorder
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: "audio/webm;codecs=opus",
                })
                mediaRecorderRef.current = mediaRecorder

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
                        // Protocol difference: Agent might expect JSON wrapping or binary
                        // ConvAI usually accepts binary audio chunks directly for user input.
                        if (socket.readyState === WebSocket.OPEN) {

                            // For Agent, we often send a specific initial "start" frame, but strictly speaking 
                            // binary chunks often auto-start the session or are accepted.
                            // However, let's just send binary for both for simplicity unless protocol differs.
                            // Scribe: Binary OK.
                            // Agent: Binary OK (user audio).

                            socket.send(event.data)
                        }
                    }
                }

                mediaRecorder.start(100) // 100ms chunks
            }

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)

                    if (agentId) {
                        // --- AGENT RESPONSE HANDLING ---
                        // We are looking for user_transcription events
                        if (data.type === "user_transcription") {
                            const text = data.user_transcription_event?.user_transcription
                            // Also look for "is_final" logic if available, usually implicitly final in some events
                            // but partials can come too.
                            if (text) {
                                setTranscript(text)
                                onChange?.({ transcript: text, isFinal: false }) // Agent usually sends accumulating partials?
                            }
                        }
                        // Ignore agent_response (audio) - we are just inputting.
                        // Ideally we would send a configuration to mute the agent, 
                        // but if we just don't play the audio blob, it works for this "Input" component use case.
                    } else {
                        // --- SCRIBE RESPONSE HANDLING ---
                        if (data.type === "transcription" || data.text) {
                            const text = data.text || data.transcription
                            if (text) {
                                setTranscript(prev => {
                                    onChange?.({ transcript: text, isFinal: data.is_final })
                                    return text
                                })
                            }
                        }
                    }
                } catch (e) {
                    // Ignore non-JSON
                }
            }

            socket.onerror = (event) => {
                console.error("WebSocket Error", event)
                onError?.(new Error("WebSocket connection error"))
                stopRecording()
            }

            socket.onclose = () => {
                stopRecording()
            }

        } catch (err: any) {
            console.error("Connection Failed", err)
            setIsConnecting(false)
            setIsConnected(false)
            onError?.(err)
        }
    }, [agentId, apiKey, getToken, modelId, onStart, onChange, onError, stopRecording])

    // Cleanup
    useEffect(() => {
        return () => {
            stopRecording()
        }
    }, [])

    return {
        isConnecting,
        isConnected,
        start: startRecording,
        stop: stopRecording,
        transcript,
        cancel: () => {
            setTranscript("")
            stopRecording()
        }
    }
}
