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
  startCall: (propertySlug?: string, propertyId?: number) => Promise<void>;
  toggleMute: () => void;
  endCall: () => Promise<void>;
  sendTextMessage: (text: string) => void;
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

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/projects/kyron-realty-ai";

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
      }
      if (clientRef.current) {
        clientRef.current.leave();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

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

  // Start Call
  const startCall = useCallback(
    async (propertySlug?: string, propertyId?: number) => {
      setErrorMessage(null);
      setCallState("connecting");

      try {
        // Step 1: Start Agora Agent Session on backend
        const sessionRes = await fetch(`${basePath}/api/agora/session/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertySlug, propertyId }),
        });

        const sessionData = await sessionRes.json();
        if (!sessionData.success) {
          throw new Error(sessionData.error || "Failed to initialize Agora Agent session.");
        }

        const { channelName, token, userUid, agentUid, sessionId, greeting } = sessionData;
        sessionIdRef.current = sessionId;
        channelNameRef.current = channelName;

        // Add greeting message to transcript
        if (greeting) {
          setTranscript([
            {
              id: `agent-greeting-${Date.now()}`,
              role: "assistant",
              text: greeting,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        }

        // Step 2: Dynamic import of Agora RTC SDK (Browser only)
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        AgoraRTC.setLogLevel(3); // Warnings & errors only

        const appId =
          process.env.NEXT_PUBLIC_AGORA_APP_ID ||
          sessionData.appId ||
          "demo-agora-app-id";

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
        localAudioTrackRef.current = localAudioTrack;

        // Step 4: Join RTC Channel and Publish Track
        await client.join(appId, channelName, token || null, userUid);
        await client.publish(localAudioTrack);

        // Start local visualizer
        const mediaStreamTrack = localAudioTrack.getMediaStreamTrack();
        startFrequencyVisualizer(mediaStreamTrack);

        setCallState("connected");
      } catch (err: any) {
        console.error("Agora voice agent error:", err);
        setErrorMessage(err.message || "Failed to establish real-time voice call.");
        setCallState("error");
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
    }
  }, [isMuted]);

  // End Call
  const endCall = useCallback(async () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current.close();
      localAudioTrackRef.current = null;
    }

    if (clientRef.current) {
      await clientRef.current.leave();
      clientRef.current = null;
    }

    if (sessionIdRef.current && channelNameRef.current) {
      try {
        await fetch(`${basePath}/api/agora/session/stop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            channelName: channelNameRef.current,
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
  }, [basePath]);

  // Send Text Message fallback in active session
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

    // Simulated conversational response if testing text mode
    setTimeout(() => {
      setTranscript((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          role: "assistant",
          text: "I can confirm that for you! Would you like me to schedule a viewing for you this week?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1000);
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
  };
}
