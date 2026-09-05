"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BASE_PATH } from "@/lib/base-path";
import type {
  CallerType,
  CallState,
  UIAction,
  UseAgoraVoiceAgentOptions,
  UseAgoraVoiceAgentReturn,
  VoiceMessage,
} from "./voice-agent-types";
import { formatTimestamp, isUserTranscriptionItem, mapTranscriptionsToMessages } from "./voice-transcript";
import { startFrequencyVisualizer } from "./audio-visualizer";
import { detectAssistantModalIntent, detectUserModalIntent } from "./voice-intents";

export function useAgoraVoiceAgent(options?: UseAgoraVoiceAgentOptions): UseAgoraVoiceAgentReturn {
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [audioFrequencies, setAudioFrequencies] = useState<number[]>(new Array(16).fill(10));
  const [transcript, setTranscript] = useState<VoiceMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clientRef = useRef<any>(null);
  const localAudioTrackRef = useRef<any>(null);
  const sessionIdRef = useRef<string | null>(null);
  const channelNameRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const callActiveRef = useRef<boolean>(false);
  const onCallEndRef = useRef<((transcript: VoiceMessage[]) => void) | undefined>(options?.onCallEnd);
  const onAgentTurnCompleteRef = useRef<((transcript: VoiceMessage[]) => void) | undefined>(options?.onAgentTurnComplete);
  const onUIActionRef = useRef<((action: UIAction) => void) | undefined>(options?.onUIAction);
  // Keep the latest callbacks reachable from long-lived SDK listeners without re-subscribing
  useEffect(() => {
    onCallEndRef.current = options?.onCallEnd;
    onAgentTurnCompleteRef.current = options?.onAgentTurnComplete;
    onUIActionRef.current = options?.onUIAction;
  });
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
        await fetch(`${BASE_PATH}/api/agora/session/stop`, {
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
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      teardownResources();
    };
  }, [teardownResources]);

  // Turn Extraction Dispatcher with Deduplication & Sliding Window
  const triggerTurnExtraction = useCallback(() => {
    const fullTranscript = transcriptRef.current;
    if (!fullTranscript || fullTranscript.length === 0) return;

    const hasUser = fullTranscript.some((m) => m.role === "user" && m.text?.trim().length > 0);
    if (!hasUser) return;

    const lastMsg = fullTranscript[fullTranscript.length - 1];
    if (!lastMsg || !lastMsg.text?.trim()) return;

    const turnKey = `${fullTranscript.length}_${lastMsg.role}_${lastMsg.text.trim().toLowerCase()}`;
    if (turnKey === lastExtractedAssistantTextRef.current) return;
    lastExtractedAssistantTextRef.current = turnKey;

    onAgentTurnCompleteRef.current?.(fullTranscript);
  }, []);

  // Start Call (Single-flight protected)
  const startCall = useCallback(
    async (
      propertySlug?: string,
      propertyId?: number,
      callerType: CallerType = "buyer_inquiry"
    ) => {
      // Prevent duplicate or overlapping starts
      if (isStartingRef.current || callActiveRef.current) {
        console.warn("[Agora Voice Agent] Call is already active or starting, ignoring request.");
        return;
      }
      isStartingRef.current = true;

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
        const sessionRes = await fetch(`${BASE_PATH}/api/agora/session/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertySlug,
            propertyId,
            callerType,
          }),
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
            fetch(`${BASE_PATH}/api/agora/session/stop`, {
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
        const { AgoraVoiceAI, AgoraVoiceAIEvents, TranscriptHelperMode } = await import(
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
          enableLog: process.env.NODE_ENV !== "production",
          enableRenderModeFallback: true,
        });
        voiceAiRef.current = ai;

        // Render initial greeting if provided
        if (sessionData.greeting) {
          const greetingMsg: VoiceMessage = {
            id: `greeting-${Date.now()}`,
            role: "assistant",
            text: sessionData.greeting,
            timestamp: formatTimestamp(),
          };
          mappedRemoteRef.current = [greetingMsg];
          setTranscript([greetingMsg]);
        }

        const isUserTranscription = (item: any) =>
          isUserTranscriptionItem(item, [stringUserUid, String(userUidRef.current)]);

        // Attach live transcript updates
        ai.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (transcriptions: any[]) => {
          if (!transcriptions || !Array.isArray(transcriptions)) return;

          const mapped = mapTranscriptionsToMessages(transcriptions, isUserTranscription);

          mappedRemoteRef.current = mapped;
          // Reconcile and keep pending local typed messages until confirmed in remote transcript
          localMessagesRef.current = localMessagesRef.current.filter(
            (local) => !mapped.some((remote) => remote.role === "user" && remote.text.toLowerCase() === local.text.toLowerCase())
          );

          // Preserve initial greeting if remote transcript doesn't repeat it yet
          const fullList = sessionData.greeting && !mapped.some((m) => m.role === "assistant")
            ? [{ id: "init-greeting", role: "assistant" as const, text: sessionData.greeting, timestamp: formatTimestamp() }, ...mapped, ...localMessagesRef.current]
            : [...mapped, ...localMessagesRef.current];

          transcriptRef.current = fullList;
          setTranscript(fullList);

          // Deduplicated checklist extraction for user turns
          for (const item of transcriptions) {
            const isUser = isUserTranscription(item);

            const spokenText = (item.text || "").trim();
            if (isUser && spokenText.length > 0) {
              const isFinished =
                item.final === true ||
                item.metadata?.final === true;

              const turnKey = `${item.turn_id ?? "turn"}_${spokenText.toLowerCase()}`;
              if (isFinished && !processedTurnIdsRef.current.has(turnKey as any)) {
                processedTurnIdsRef.current.add(turnKey as any);
                // Fast verbal UI modal intent matching
                const intent = detectUserModalIntent(spokenText);
                if (intent) onUIActionRef.current?.(intent);

                // Immediate parallel extraction: Run Gemini while Elena begins speaking
                setTimeout(() => {
                  triggerTurnExtraction();
                }, 100);
              }
            } else if (!isUser && spokenText.length > 0) {
              // Assistant speech confirming modal action
              const intent = detectAssistantModalIntent(spokenText);
              if (intent) onUIActionRef.current?.(intent);
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
          setIsAgentSpeaking(isSpeaking);
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
            setIsAgentSpeaking(true);
            setCallState("agent_speaking");
            hasAgentSpokenInTurnRef.current = true;
          } else if (
            newState === "listening" ||
            newState === "thinking" ||
            newState === "idle"
          ) {
            setIsAgentSpeaking(false);
            setCallState("connected");

            if (prevState === "speaking" && (newState === "listening" || newState === "idle")) {
              triggerTurnExtraction();
            }
          }
        });

        // Cloud Gateway Pipeline Error Handler
        ai.on(AgoraVoiceAIEvents.AGENT_ERROR, (agentUserId: string, error: any) => {
          console.warn(`[AgoraVoiceAI Agent Error] (${agentUserId}):`, error);
          if (error?.code && error.code >= 500) {
            setErrorMessage(`Voice AI service error: ${error?.message || "Internal gateway issue"}`);
          }
        });

        // Enable volume indicators for VAD turn detection
        client.enableAudioVolumeIndicator();
        client.on("volume-indicator", (volumes) => {
          for (const volume of volumes) {
            if (volume.uid === 0 || volume.uid === userUid) {
              if (volume.level > 15) {
                setCallState("user_speaking");
                setIsAgentSpeaking(false);
              }
            } else if (volume.uid === agentUid) {
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

        client.on("user-unpublished", (_user, mediaType) => {
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
        const audioCtx = startFrequencyVisualizer(localAudioTrack.getMediaStreamTrack(), setAudioFrequencies, (id) => {
          animFrameRef.current = id;
        });
        if (audioCtx) audioContextRef.current = audioCtx;

        callActiveRef.current = true;
        setCallState("connected");
      } catch (err: any) {
        if (err.name === "AbortError" || abortController.signal.aborted) {
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
    [teardownResources, triggerTurnExtraction]
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
    const finalTranscript = [...mappedRemoteRef.current, ...localMessagesRef.current];
    await teardownResources();
    setCallState("idle");
    setIsAgentSpeaking(false);
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

    // Render the pending local message until the remote transcript confirms it
    const localMsgId = `local-text-${Date.now()}`;
    const localMsg: VoiceMessage = {
      id: localMsgId,
      role: "user",
      text: trimmed,
      timestamp: formatTimestamp(),
    };
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
      localMessagesRef.current = localMessagesRef.current.filter((msg) => msg.id !== localMsgId);
      setTranscript([...mappedRemoteRef.current, ...localMessagesRef.current]);
      setErrorMessage(
        `Failed to deliver message to voice agent: ${sendErr?.message || "RTM communication failure"}`
      );
    }
  }, []);

  return {
    callState,
    isCallActive:
      callState === "connecting" ||
      callState === "connected" ||
      callState === "user_speaking" ||
      callState === "agent_speaking",
    isMuted,
    isAgentSpeaking,
    audioFrequencies,
    transcript,
    errorMessage,
    startCall,
    toggleMute,
    endCall,
    sendTextMessage,
  };
}
