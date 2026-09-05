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
}

export interface UseAgoraVoiceAgentOptions {
  onCallEnd?: (transcript: VoiceMessage[]) => void;
  onAgentTurnComplete?: (transcript: VoiceMessage[]) => void;
  onAgentSpeakingChanged?: (isSpeaking: boolean) => void;
  onUIAction?: (action: "open_review_modal" | "close_review_modal") => void;
}

export function useAgoraVoiceAgent(options?: UseAgoraVoiceAgentOptions): UseAgoraVoiceAgentReturn {
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
  const onCallEndRef = useRef<((transcript: VoiceMessage[]) => void) | undefined>(options?.onCallEnd);
  onCallEndRef.current = options?.onCallEnd;
  const onAgentTurnCompleteRef = useRef<((transcript: VoiceMessage[]) => void) | undefined>(options?.onAgentTurnComplete);
  onAgentTurnCompleteRef.current = options?.onAgentTurnComplete;
  const onAgentSpeakingChangedRef = useRef<((isSpeaking: boolean) => void) | undefined>(options?.onAgentSpeakingChanged);
  onAgentSpeakingChangedRef.current = options?.onAgentSpeakingChanged;
  const onUIActionRef = useRef<((action: "open_review_modal" | "close_review_modal") => void) | undefined>(options?.onUIAction);
  onUIActionRef.current = options?.onUIAction;
  const transcriptRef = useRef<VoiceMessage[]>([]);
  const prevAgentStateRef = useRef<string | null>(null);
  const rtmClientRef = useRef<any>(null);
  const voiceAiRef = useRef<any>(null);
  const agentUidRef = useRef<number>(999001);
  const userUidRef = useRef<number>(1001);
  const processedTurnIdsRef = useRef<Set<number>>(new Set());
  const localMessagesRef = useRef<VoiceMessage[]>([]);
  const mappedRemoteRef = useRef<VoiceMessage[]>([]);
  const lastExtractedAssistantTextRef = useRef<string>("");
  const hasAgentSpokenInTurnRef = useRef<boolean>(false);
  const transcriptDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/projects/kyron-realty-ai";

  const updateAgentSpeaking = useCallback((isSpeaking: boolean) => {
    setIsAgentSpeaking(isSpeaking);
    onAgentSpeakingChangedRef.current?.(isSpeaking);
  }, []);

  // Centralized Resource Teardown
  const teardownResources = useCallback(async () => {
    callActiveRef.current = false;
    isStartingRef.current = false;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (channelNameRef.current && rtmClientRef.current) {
      try {
        await rtmClientRef.current.unsubscribe(channelNameRef.current);
      } catch {}
    }

    if (voiceAiRef.current) {
      try {
        voiceAiRef.current.destroy();
      } catch {}
      voiceAiRef.current = null;
    }

    if (rtmClientRef.current) {
      try {
        await rtmClientRef.current.logout();
      } catch {}
      rtmClientRef.current = null;
    }

    if (transcriptDebounceTimerRef.current) {
      clearTimeout(transcriptDebounceTimerRef.current);
      transcriptDebounceTimerRef.current = null;
    }
    lastExtractedAssistantTextRef.current = "";
    hasAgentSpokenInTurnRef.current = false;

    localMessagesRef.current = [];
    mappedRemoteRef.current = [];
    processedTurnIdsRef.current.clear();

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
      } catch {}
      clientRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        await audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    // Stop remote session on backend if active
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
      } catch {
        // Ignore background teardown error
      }
    }
  }, [basePath]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      teardownResources();
    };
  }, [teardownResources]);

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

  // Turn Extraction Dispatcher with Deduplication & Sliding Window
  const triggerTurnExtraction = useCallback(() => {
    const fullTranscript = transcriptRef.current;
    if (!fullTranscript || fullTranscript.length === 0) return;

    // Must have at least one user utterance
    const hasUserMessage = fullTranscript.some(
      (m) => m.role === "user" && m.text && m.text.trim().length > 0
    );
    if (!hasUserMessage) return;

    // Find the latest assistant message
    const assistantMessages = fullTranscript.filter(
      (m) => m.role === "assistant" && m.text && m.text.trim().length > 0
    );
    if (assistantMessages.length === 0) return;
    const latestAssistant = assistantMessages[assistantMessages.length - 1];

    // Deduplicate: Don't extract again for the exact same assistant turn text
    if (latestAssistant.text.trim() === lastExtractedAssistantTextRef.current) {
      return;
    }
    lastExtractedAssistantTextRef.current = latestAssistant.text.trim();

    console.log(
      "[Agora Voice Agent] Firing live turn extraction for assistant turn:",
      latestAssistant.text.slice(0, 50)
    );
    if (onAgentTurnCompleteRef.current) {
      onAgentTurnCompleteRef.current(fullTranscript);
    }
  }, []);

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

        const { channelName, token, rtmToken, userUid, agentUid, sessionId } = sessionData;
        sessionIdRef.current = sessionId;
        channelNameRef.current = channelName;
        agentUidRef.current = Number(agentUid) || 999001;
        userUidRef.current = Number(userUid) || 1001;
        processedTurnIdsRef.current.clear();
        localMessagesRef.current = [];
        mappedRemoteRef.current = [];

        if (!rtmToken || rtmToken.trim() === "") {
          throw new Error("Missing RTM token from Agora session response. Please verify AGORA_APP_CERTIFICATE.");
        }

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

        // Step 2: Initialize Agora RTM and log in BEFORE RTC join
        const AgoraRTM = (await import("agora-rtm")).default;
        const { AgoraVoiceAI, AgoraVoiceAIEvents, TurnStatus, TranscriptHelperMode } = await import(
          "agora-agent-client-toolkit"
        );

        const stringUserUid = String(userUid);
        const rtmClient = new AgoraRTM.RTM(appId, stringUserUid);
        rtmClientRef.current = rtmClient;

        await rtmClient.login({ token: rtmToken });

        // Step 3: Initialize Agora RTC client and AgoraVoiceAI Toolkit
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        AgoraRTC.setLogLevel(3); // Warnings & errors only
        (AgoraRTC as any).setParameter?.("ENABLE_AUDIO_PTS_METADATA", true);

        if (abortController.signal.aborted) return;

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        const ai = await AgoraVoiceAI.init({
          rtcEngine: client,
          rtmEngine: rtmClient,
          renderMode: TranscriptHelperMode.TEXT,
          enableLog: true,
          enableRenderModeFallback: true,
        });
        voiceAiRef.current = ai;

        // Render initial greeting if provided
        if (sessionData.greeting) {
          const greetingMsg: VoiceMessage = {
            id: `greeting-${Date.now()}`,
            role: "assistant",
            text: sessionData.greeting,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          mappedRemoteRef.current = [greetingMsg];
          setTranscript([greetingMsg]);
        }

        // Attach live transcript updates
        ai.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (transcriptions: any[]) => {
          if (!transcriptions || !Array.isArray(transcriptions)) return;

          const mapped: VoiceMessage[] = transcriptions
            .filter((item: any) => (item.text || "").trim().length > 0)
            .map((item: any, idx: number) => {
              const uidStr = String(item.uid ?? "");
              const isUser =
                uidStr === "0" ||
                uidStr === stringUserUid ||
                uidStr === String(userUidRef.current) ||
                item.metadata?.object === "user.transcription" ||
                item.object === "user.transcription";

              return {
                id: `turn-${item.turn_id ?? idx}-${isUser ? "user" : "agent"}`,
                role: isUser ? "user" : "assistant",
                text: (item.text || "").trim(),
                timestamp: new Date(item._time || Date.now()).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              };
            });

          mappedRemoteRef.current = mapped;
          // Reconcile and keep pending local typed messages until confirmed in remote transcript
          localMessagesRef.current = localMessagesRef.current.filter(
            (local) => !mapped.some((remote) => remote.role === "user" && remote.text.toLowerCase() === local.text.toLowerCase())
          );

          // Preserve initial greeting if remote transcript doesn't repeat it yet
          const fullList = sessionData.greeting && !mapped.some((m) => m.role === "assistant")
            ? [{ id: "init-greeting", role: "assistant" as const, text: sessionData.greeting, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...mapped, ...localMessagesRef.current]
            : [...mapped, ...localMessagesRef.current];

          transcriptRef.current = fullList;
          setTranscript(fullList);

          // Deduplicated checklist extraction for user turns
          for (const item of transcriptions) {
            const uidStr = String(item.uid ?? "");
            const isUser =
              uidStr === "0" ||
              uidStr === stringUserUid ||
              uidStr === String(userUidRef.current) ||
              item.metadata?.object === "user.transcription" ||
              item.object === "user.transcription";

            const spokenText = (item.text || "").trim();
            if (isUser && spokenText.length > 0) {
              const isFinished =
                item.final === true ||
                item.metadata?.final === true;

              const turnKey = `${item.turn_id ?? "turn"}_${spokenText.toLowerCase()}`;
              if (isFinished && !processedTurnIdsRef.current.has(turnKey as any)) {
                processedTurnIdsRef.current.add(turnKey as any);
                console.log("[Agora Voice Agent] Verified user speech turn:", spokenText);
                if (onSpeechDetectedRef.current) {
                  onSpeechDetectedRef.current(spokenText);
                }

                // Fast verbal UI modal intent matching
                const OPEN_MODAL_REGEX = /(pull|bring|open|show|display|pop|bring back|pull back|pull it back|bring it back).*(card|modal|pop[- ]?up|review|summary|details|specs)/i;
                const CLOSE_MODAL_REGEX = /(close|hide|dismiss|minimize|shut).*(card|modal|pop[- ]?up|review|summary)/i;

                if (OPEN_MODAL_REGEX.test(spokenText)) {
                  console.log("[Agora Voice Agent] Verbal UI open command detected:", spokenText);
                  onUIActionRef.current?.("open_review_modal");
                } else if (CLOSE_MODAL_REGEX.test(spokenText)) {
                  console.log("[Agora Voice Agent] Verbal UI close command detected:", spokenText);
                  onUIActionRef.current?.("close_review_modal");
                }
              }
            } else if (!isUser && spokenText.length > 0) {
              // Assistant speech confirming modal action
              if (/(pull|bring|open|show|display).*(card|modal|pop[- ]?up|review).*(screen|for you|back up|take a look)/i.test(spokenText)) {
                onUIActionRef.current?.("open_review_modal");
              } else if (/(close|hide|dismiss|minimiz).*(card|modal|pop[- ]?up|review)/i.test(spokenText)) {
                onUIActionRef.current?.("close_review_modal");
              }
            }
          }

          // Fallback debounce: When an assistant turn settles for 800ms, trigger extraction
          if (transcriptDebounceTimerRef.current) {
            clearTimeout(transcriptDebounceTimerRef.current);
            transcriptDebounceTimerRef.current = null;
          }
          const lastMsg = fullList[fullList.length - 1];
          if (lastMsg && lastMsg.role === "assistant" && lastMsg.text.trim().length > 0) {
            transcriptDebounceTimerRef.current = setTimeout(() => {
              triggerTurnExtraction();
            }, 800);
          }
        });

        // Dual-Signal 1: Agent speaking state changed (Cloud Gateway activity stream)
        ai.on(AgoraVoiceAIEvents.AGENT_SPEAKING_CHANGED, (_agentUserId: string, isSpeaking: boolean) => {
          updateAgentSpeaking(isSpeaking);
          if (isSpeaking) {
            setCallState("agent_speaking");
            hasAgentSpokenInTurnRef.current = true;
          } else {
            setCallState("connected");
            if (hasAgentSpokenInTurnRef.current) {
              hasAgentSpokenInTurnRef.current = false;
              // Elena finished speaking. Give 200ms for final ASR transcript to settle, then extract
              setTimeout(() => {
                triggerTurnExtraction();
              }, 200);
            }
          }
        });

        // Dual-Signal 2: Agent listening state changed
        ai.on(AgoraVoiceAIEvents.AGENT_LISTENING_CHANGED, (_agentUserId: string, isListening: boolean) => {
          if (isListening && hasAgentSpokenInTurnRef.current) {
            hasAgentSpokenInTurnRef.current = false;
            setTimeout(() => {
              triggerTurnExtraction();
            }, 200);
          }
        });

        // Auxiliary Fallback: Legacy/Alternate Agent state change
        ai.on(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, (_agentUserId: string, event: any) => {
          const newState = event?.state;
          const prevState = prevAgentStateRef.current;
          prevAgentStateRef.current = newState;

          if (newState === "speaking") {
            updateAgentSpeaking(true);
            setCallState("agent_speaking");
            hasAgentSpokenInTurnRef.current = true;
          } else if (
            newState === "listening" ||
            newState === "thinking" ||
            newState === "idle"
          ) {
            updateAgentSpeaking(false);
            setCallState("connected");

            if (prevState === "speaking" && (newState === "listening" || newState === "idle")) {
              triggerTurnExtraction();
            }
          }
        });

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

        // Step 4: Capture local microphone
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

        // Step 5: Join RTC Channel and Publish Track FIRST
        await client.join(appId, channelName, token || null, userUid);
        if (abortController.signal.aborted) {
          await client.leave();
          return;
        }

        await client.publish(localAudioTrack);

        // Step 6: Subscribe to messages in channel (after joining RTC channel per toolkit spec)
        ai.subscribeMessage(channelName);
        await rtmClient.subscribe(channelName, {
          withMessage: true,
          withPresence: true,
        });

        // Start local visualizer
        const mediaStreamTrack = localAudioTrack.getMediaStreamTrack();
        startFrequencyVisualizer(mediaStreamTrack);

        callActiveRef.current = true;
        setCallState("connected");
      } catch (err: any) {
        if (err.name === "AbortError" || abortController.signal.aborted) {
          console.log("[Agora Voice Agent] Call startup aborted.");
          await teardownResources();
          return;
        }
        console.error("Agora voice agent error:", err);
        await teardownResources();
        setErrorMessage(err.message || "Failed to establish real-time voice call.");
        setCallState("error");
      } finally {
        isStartingRef.current = false;
      }
    },
    [basePath, teardownResources]
  );

  // Toggle Mute
  const toggleMute = useCallback(() => {
    if (localAudioTrackRef.current) {
      const nextMuted = !isMuted;
      localAudioTrackRef.current.setEnabled(!nextMuted);
      setIsMuted(nextMuted);
      isMutedRef.current = nextMuted;
    }
  }, [isMuted]);

  // End Call
  const endCall = useCallback(async () => {
    const finalTranscript = [...mappedRemoteRef.current, ...localMessagesRef.current];
    await teardownResources();
    setCallState("idle");
    setIsAgentSpeaking(false);
    setUserVolume(0);
    setAgentVolume(0);
    setAudioFrequencies(new Array(16).fill(10));

    if (onCallEndRef.current && finalTranscript.some((m) => m.role === "user")) {
      onCallEndRef.current(finalTranscript);
    }
  }, [teardownResources]);

  // Send Text Message in active session (routed via RTM to Agora agent)
  const sendTextMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!voiceAiRef.current || !callActiveRef.current) {
      setErrorMessage("Voice agent is not connected. Connect to the session to send messages.");
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const localMsg: VoiceMessage = {
      id: `local-text-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: now,
    };

    // Optimistically render pending local message
    localMessagesRef.current = [...localMessagesRef.current, localMsg];
    setTranscript([...mappedRemoteRef.current, ...localMessagesRef.current]);

    try {
      const { ChatMessageType, ChatMessagePriority } = await import(
        "agora-agent-client-toolkit"
      );
      await voiceAiRef.current.sendText(String(agentUidRef.current), {
        messageType: ChatMessageType.TEXT,
        priority: ChatMessagePriority.INTERRUPTED,
        responseInterruptable: true,
        text: trimmed,
      });
    } catch (sendErr: any) {
      console.error("[Agora Voice Agent] Could not send text message over RTM:", sendErr);
      // Remove local message from UI to prevent fake success
      localMessagesRef.current = localMessagesRef.current.filter((msg) => msg.id !== localMsg.id);
      setTranscript([...mappedRemoteRef.current, ...localMessagesRef.current]);
      setErrorMessage(
        `Failed to deliver message to voice agent: ${sendErr?.message || "RTM communication failure"}`
      );
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
  };
}
