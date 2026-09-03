"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export type CallState =
  | "idle"
  | "connecting"
  | "connected"
  | "user_speaking"
  | "agent_speaking"
  | "error";

export interface VoiceMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
}

export interface UseAgoraVoiceAgentReturn {
  callState: CallState;
  isMuted: boolean;
  isAgentSpeaking: boolean;
  userVolume: number;
  agentVolume: number;
  audioFrequencies: number[];
  transcript: VoiceMessage[];
  errorMessage: string | null;
  startCall: (
    propertySlug?: string,
    propertyId?: number,
    callerType?: "buyer_inquiry" | "owner_onboarding",
    onSpeechDetected?: (text: string) => void
  ) => Promise<void>;
  toggleMute: () => void;
  endCall: () => Promise<void>;
  sendTextMessage: (text: string) => void;
  addAssistantResponse: (text: string) => void;
}

export function useAgoraVoiceAgent(): UseAgoraVoiceAgentReturn {
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [userVolume, setUserVolume] = useState(0);
  const [agentVolume, setAgentVolume] = useState(0);
  const [audioFrequencies, setAudioFrequencies] = useState<number[]>(new Array(16).fill(10));
  const [transcript, setTranscript] = useState<VoiceMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clientRef = useRef<any>(null);
  const localAudioTrackRef = useRef<any>(null);
  const sessionIdRef = useRef<string | null>(null);
  const channelNameRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const callActiveRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const onSpeechDetectedRef = useRef<((text: string) => void) | undefined>(undefined);
  const speechRecognitionRef = useRef<any>(null);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/projects/kyron-realty-ai";

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      callActiveRef.current = false;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isStartingRef.current = false;

      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
        speechRecognitionRef.current = null;
      }

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.leave().catch(() => {});
        clientRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }

      // If a session was active or initialized, tell server to stop it
      if (sessionIdRef.current && channelNameRef.current) {
        const sid = sessionIdRef.current;
        const cname = channelNameRef.current;
        sessionIdRef.current = null;
        channelNameRef.current = null;
        try {
          fetch(`${basePath}/api/agora/session/stop`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sid, channelName: cname }),
            keepalive: true,
          }).catch(() => {});
        } catch {
          // ignore background teardown error
        }
      }
    };
  }, [basePath]);

  // Real-time Audio Frequency Visualizer Loop
  const startFrequencyVisualizer = (mediaStreamTrack?: MediaStreamTrack) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      if (mediaStreamTrack) {
        const stream = new MediaStream([mediaStreamTrack]);
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const render = () => {
        analyser.getByteFrequencyData(dataArray);
        const sampled: number[] = [];
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * 2] || 0;
          sampled.push(Math.max(12, Math.min(100, Math.round((val / 255) * 100))));
        }
        setAudioFrequencies(sampled);
        animFrameRef.current = requestAnimationFrame(render);
      };

      render();
    } catch (e) {
      console.warn("Could not start Web Audio visualizer:", e);
    }
  };

  // Start Call (Single-flight protected)
  const startCall = useCallback(
    async (
      propertySlug?: string,
      propertyId?: number,
      callerType: "buyer_inquiry" | "owner_onboarding" = "buyer_inquiry",
      onSpeechDetected?: (text: string) => void
    ) => {
      // Prevent duplicate or overlapping starts
      if (isStartingRef.current || callActiveRef.current) {
        console.warn("[Agora Voice Agent] Call is already active or starting, ignoring request.");
        return;
      }
      isStartingRef.current = true;
      onSpeechDetectedRef.current = onSpeechDetected;

      // Create new abort controller for this call attempt
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setErrorMessage(null);
      setCallState("connecting");

      try {
        // Step 1: Start Agora Agent Session on backend
        const sessionRes = await fetch(`${basePath}/api/agora/session/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertySlug, propertyId, callerType }),
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) return;

        const sessionData = await sessionRes.json();
        if (!sessionData.success) {
          throw new Error(sessionData.error || "Failed to initialize Agora Agent session.");
        }

        if (abortController.signal.aborted) {
          // If aborted while fetching, stop the created remote session
          if (sessionData.sessionId && sessionData.channelName) {
            fetch(`${basePath}/api/agora/session/stop`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: sessionData.sessionId,
                channelName: sessionData.channelName,
              }),
            }).catch(() => {});
          }
          return;
        }

        const { channelName, token, userUid, agentUid, sessionId, greeting } = sessionData;
        sessionIdRef.current = sessionId;
        channelNameRef.current = channelName;

        // Add greeting message to transcript and speak out loud
        if (greeting) {
          setTranscript([
            {
              id: `agent-greeting-${Date.now()}`,
              role: "assistant",
              text: greeting,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);

          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            try {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(greeting);
              utterance.rate = 1.0;
              utterance.pitch = 1.0;
              utterance.onstart = () => {
                setIsAgentSpeaking(true);
                setCallState("agent_speaking");
              };
              utterance.onend = () => {
                setIsAgentSpeaking(false);
                setCallState("connected");
              };
              window.speechSynthesis.speak(utterance);
            } catch (e) {
              console.warn("Speech synthesis error for greeting:", e);
            }
          }
        }

        // Step 2: Dynamic import of Agora RTC SDK (Browser only)
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        AgoraRTC.setLogLevel(3); // Warnings & errors only

        if (abortController.signal.aborted) return;

        const appId = (
          sessionData.appId ||
          process.env.NEXT_PUBLIC_AGORA_APP_ID ||
          ""
        ).trim();

        if (!appId || appId === "demo-agora-app-id" || appId === "your_agora_app_id_here" || appId.length < 10) {
          throw new Error(
            "Invalid Agora App ID received. Please verify AGORA_APP_ID in .env."
          );
        }

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        // Enable volume indicators for VAD turn detection
        client.enableAudioVolumeIndicator();
        client.on("volume-indicator", (volumes) => {
          for (const volume of volumes) {
            if (volume.uid === 0 || volume.uid === userUid) {
              setUserVolume(volume.level);
              if (volume.level > 15) {
                setCallState("user_speaking");
                setIsAgentSpeaking(false);
              }
            } else if (volume.uid === agentUid) {
              setAgentVolume(volume.level);
              if (volume.level > 10) {
                setCallState("agent_speaking");
                setIsAgentSpeaking(true);
              }
            }
          }
        });

        // Handle remote agent audio subscription
        client.on("user-published", async (user, mediaType) => {
          if (mediaType === "audio") {
            await client.subscribe(user, mediaType);
            user.audioTrack?.play();
            setIsAgentSpeaking(true);
            setCallState("agent_speaking");
          }
        });

        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "audio") {
            setIsAgentSpeaking(false);
            setCallState("connected");
          }
        });

        // Step 3: Capture local microphone
        const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          AEC: true, // Acoustic Echo Cancellation
          ANS: true, // Automatic Noise Suppression
          AGC: true, // Automatic Gain Control
        });

        if (abortController.signal.aborted) {
          localAudioTrack.stop();
          localAudioTrack.close();
          return;
        }

        localAudioTrackRef.current = localAudioTrack;

        // Step 4: Join RTC Channel and Publish Track
        await client.join(appId, channelName, token || null, userUid);
        if (abortController.signal.aborted) {
          await client.leave();
          return;
        }

        await client.publish(localAudioTrack);

        // Start local visualizer
        const mediaStreamTrack = localAudioTrack.getMediaStreamTrack();
        startFrequencyVisualizer(mediaStreamTrack);

        callActiveRef.current = true;
        setCallState("connected");

        // Step 5: Continuous hands-free speech recognition for owner onboarding
        if (typeof window !== "undefined") {
          const SpeechRec =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRec) {
            try {
              const recognition = new SpeechRec();
              recognition.continuous = true;
              recognition.interimResults = false;
              recognition.lang = "en-US";

              recognition.onresult = (event: any) => {
                const results = event.results;
                const lastResult = results[results.length - 1];
                if (lastResult && lastResult[0]) {
                  const spokenText = lastResult[0].transcript.trim();
                  if (spokenText) {
                    const now = new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    setTranscript((prev) => [
                      ...prev,
                      {
                        id: `user-speech-${Date.now()}`,
                        role: "user",
                        text: spokenText,
                        timestamp: now,
                      },
                    ]);
                    if (onSpeechDetectedRef.current) {
                      onSpeechDetectedRef.current(spokenText);
                    }
                  }
                }
              };

              recognition.onend = () => {
                // Auto-restart if call is still active and not muted
                if (callActiveRef.current && !isMutedRef.current && speechRecognitionRef.current) {
                  try {
                    recognition.start();
                  } catch {}
                }
              };

              recognition.onerror = (e: any) => {
                console.warn("[Agora Voice Agent] Speech recognition notice:", e.error);
              };

              recognition.start();
              speechRecognitionRef.current = recognition;
            } catch (err) {
              console.warn("Could not start continuous speech recognition:", err);
            }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError" || abortController.signal.aborted) {
          console.log("[Agora Voice Agent] Call startup aborted.");
          return;
        }
        console.error("Agora voice agent error:", err);
        setErrorMessage(err.message || "Failed to establish real-time voice call.");
        setCallState("error");
      } finally {
        isStartingRef.current = false;
      }
    },
    [basePath]
  );

  // Toggle Mute
  const toggleMute = useCallback(() => {
    if (localAudioTrackRef.current) {
      const nextMuted = !isMuted;
      localAudioTrackRef.current.setEnabled(!nextMuted);
      setIsMuted(nextMuted);
      isMutedRef.current = nextMuted;

      if (nextMuted && speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      } else if (!nextMuted && speechRecognitionRef.current && callActiveRef.current) {
        try {
          speechRecognitionRef.current.start();
        } catch {}
      }
    }
  }, [isMuted]);

  // End Call
  const endCall = useCallback(async () => {
    callActiveRef.current = false;
    isStartingRef.current = false;

    // Abort any in-progress startCall
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current.close();
      localAudioTrackRef.current = null;
    }

    if (clientRef.current) {
      try {
        await clientRef.current.leave();
      } catch (e) {
        console.warn("Error leaving Agora client:", e);
      }
      clientRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        await audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }

    const currentSessionId = sessionIdRef.current;
    const currentChannelName = channelNameRef.current;
    sessionIdRef.current = null;
    channelNameRef.current = null;

    if (currentSessionId && currentChannelName) {
      try {
        await fetch(`${basePath}/api/agora/session/stop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: currentSessionId,
            channelName: currentChannelName,
          }),
        });
      } catch (e) {
        console.warn("Could not notify server of session stop:", e);
      }
    }

    setCallState("idle");
    setIsAgentSpeaking(false);
    setUserVolume(0);
    setAgentVolume(0);
    setAudioFrequencies(new Array(16).fill(10));
  }, [basePath]);

  // Send Text Message in active session
  const sendTextMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setTranscript((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: text.trim(),
        timestamp: now,
      },
    ]);
  }, []);

  // Add Assistant Response (and speak aloud)
  const addAssistantResponse = useCallback((text: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setTranscript((prev) => [
      ...prev,
      {
        id: `agent-${Date.now()}`,
        role: "assistant",
        text: text.trim(),
        timestamp: now,
      },
    ]);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text.trim());
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onstart = () => {
          setIsAgentSpeaking(true);
          setCallState("agent_speaking");
        };
        utterance.onend = () => {
          setIsAgentSpeaking(false);
          setCallState("connected");
        };
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("Speech synthesis error:", e);
      }
    }
  }, []);

  return {
    callState,
    isMuted,
    isAgentSpeaking,
    userVolume,
    agentVolume,
    audioFrequencies,
    transcript,
    errorMessage,
    startCall,
    toggleMute,
    endCall,
    sendTextMessage,
    addAssistantResponse,
  };
}
