"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BASE_PATH } from "@/lib/base-path";
import type {
  CallerType,
  CallState,
  RetargetInput,
  RetargetResult,
  UIAction,
  UseAgoraVoiceAgentOptions,
  UseAgoraVoiceAgentReturn,
  VoiceMessage,
  ParsedSearchTag,
  ParsedBookTourTag,
  ParsedCallManagerTag,
} from "./voice-agent-types";
import { formatTimestamp, isUserTranscriptionItem, mapTranscriptionsToMessages } from "./voice-transcript";
import { startFrequencyVisualizer } from "./audio-visualizer";
import {
  detectAssistantModalIntent,
  detectAssistantSearchIntent,
  detectUserModalIntent,
  parseOpenPropertyTag,
  parseCalendarSelectDateTag,
  parseBookTourTag,
  parseCallManagerTag,
} from "./voice-intents";

export function useAgoraVoiceAgent(options?: UseAgoraVoiceAgentOptions): UseAgoraVoiceAgentReturn {
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isManagerConnected, setIsManagerConnected] = useState(false);
  const [isManagerSpeaking, setIsManagerSpeaking] = useState(false);
  const [managerCallStatus, setManagerCallStatus] = useState<"idle" | "dialing" | "connected" | "declined" | "no_answer">("idle");
  const [channelName, setChannelName] = useState<string>("");
  const [audioFrequencies, setAudioFrequencies] = useState<number[]>(new Array(16).fill(10));
  const [transcript, setTranscript] = useState<VoiceMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voiceSessionId, setVoiceSessionId] = useState<number | null>(null);
  const voiceSessionIdRef = useRef<number | null>(null);

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
  const onSearchRequestRef = useRef<((params: ParsedSearchTag) => void) | undefined>(options?.onSearchRequest);
  const onOpenPropertyRequestRef = useRef<((index: number) => void) | undefined>(options?.onOpenPropertyRequest);
  const onCalendarSelectDateRef = useRef<((date: string) => void) | undefined>(options?.onCalendarSelectDate);
  const onBookTourRequestRef = useRef<((booking: ParsedBookTourTag) => void) | undefined>(options?.onBookTourRequest);
  const onCallManagerRequestRef = useRef<((data: ParsedCallManagerTag) => void) | undefined>(options?.onCallManagerRequest);
  const onLogEventRef = useRef<((category: "AGORA" | "INTENT", title: string, details?: Record<string, unknown> | null) => void) | undefined>(options?.onLogEvent);
  // Keep the latest callbacks reachable from long-lived SDK listeners without re-subscribing
  useEffect(() => {
    onCallEndRef.current = options?.onCallEnd;
    onAgentTurnCompleteRef.current = options?.onAgentTurnComplete;
    onUIActionRef.current = options?.onUIAction;
    onSearchRequestRef.current = options?.onSearchRequest;
    onOpenPropertyRequestRef.current = options?.onOpenPropertyRequest;
    onCalendarSelectDateRef.current = options?.onCalendarSelectDate;
    onBookTourRequestRef.current = options?.onBookTourRequest;
    onCallManagerRequestRef.current = options?.onCallManagerRequest;
    onLogEventRef.current = options?.onLogEvent;
  });
  const transcriptRef = useRef<VoiceMessage[]>([]);
  const rtmClientRef = useRef<any>(null);
  const voiceAiRef = useRef<any>(null);
  const agentUidRef = useRef<number>(999001);
  const userUidRef = useRef<number>(1001);
  const processedTurnIdsRef = useRef<Set<string>>(new Set());
  const processedAssistantTurnIntentsRef = useRef<Set<string>>(new Set());
  const localMessagesRef = useRef<VoiceMessage[]>([]);
  const mappedRemoteRef = useRef<VoiceMessage[]>([]);
  const managerMessagesRef = useRef<VoiceMessage[]>([]);
  const seenManagerMsgIdsRef = useRef<Set<string>>(new Set());
  const lastExtractedAssistantTextRef = useRef<string>("");

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

    lastExtractedAssistantTextRef.current = "";

    localMessagesRef.current = [];
    mappedRemoteRef.current = [];
    managerMessagesRef.current = [];
    seenManagerMsgIdsRef.current.clear();
    processedTurnIdsRef.current.clear();
    processedAssistantTurnIntentsRef.current.clear();

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
    setChannelName("");

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

  // Cleanup on unmount & window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callActiveRef.current) {
        rtmClientRef.current?.logout().catch(() => {});
        localAudioTrackRef.current?.stop();
        localAudioTrackRef.current?.close();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
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

    onLogEventRef.current?.("AGORA", `Dispatched turn extraction (${fullTranscript.length} messages, last: ${lastMsg.role})`, {
      lastMessage: lastMsg.text,
      totalTurns: fullTranscript.length,
    });

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

      processedTurnIdsRef.current.clear();
      processedAssistantTurnIntentsRef.current.clear();
      localMessagesRef.current = [];
      mappedRemoteRef.current = [];
      setIsManagerConnected(false);
      setIsManagerSpeaking(false);
      setManagerCallStatus("idle");
      setTranscript([]);
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

        const { channelName, token, rtmToken, userUid, agentUid, sessionId, voiceSessionId: resVoiceSessionId } = sessionData;
        sessionIdRef.current = sessionId;
        channelNameRef.current = channelName;
        setChannelName(channelName);
        voiceSessionIdRef.current = resVoiceSessionId ?? null;
        setVoiceSessionId(resVoiceSessionId ?? null);
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

        rtmClient.addEventListener("linkState", (event: any) => {
          if (event.currentState === "FAILED" || event.currentState === "DISCONNECTED") {
            if (event.reasonCode === "SAME_UID_LOGIN") {
              console.warn("[Agora RTM] Disconnected: another session connected with the same UID.");
              setErrorMessage("Voice session disconnected: another session connected.");
              teardownResources();
            }
          }
        });

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

          const fullList = [...mapped, ...localMessagesRef.current, ...managerMessagesRef.current].sort(
            (a, b) => (a.createdAt || 0) - (b.createdAt || 0)
          );

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

              const turnId = item.turn_id !== undefined ? String(item.turn_id) : spokenText.toLowerCase();
              const turnKey = `user_turn_${turnId}`;
              if (isFinished && !processedTurnIdsRef.current.has(turnKey as any)) {
                processedTurnIdsRef.current.add(turnKey as any);

                // Synthetic system control cues (e.g. [DEPLOY_CONFIRMED]) transmitted to agent
                // are echoed by Agora RTC as user turns; ignore them so they never trigger intents or extractions.
                if (spokenText.trim().startsWith("[")) {
                  return;
                }

                onLogEventRef.current?.("AGORA", `User speech finalized (Turn #${item.turn_id ?? "turn"})`, {
                  text: spokenText,
                  final: true,
                });

                // Fast verbal UI modal intent matching
                const intent = detectUserModalIntent(spokenText);
                if (intent) {
                  onLogEventRef.current?.("INTENT", `Detected User Intent: ${intent}`, { text: spokenText });
                  onUIActionRef.current?.(intent);
                }

                // Immediate parallel extraction: Run Gemini while Elena begins speaking
                setTimeout(() => {
                  triggerTurnExtraction();
                }, 50);
              }
            } else if (!isUser && spokenText.length > 0) {
              // Assistant screen action: its [UI:] tag, or the spoken-language fallback (strictly deduplicated per turn)
              const intent = detectAssistantModalIntent(spokenText);
              if (intent) {
                const turnId = item.turn_id !== undefined ? String(item.turn_id) : spokenText.slice(0, 40).toLowerCase();
                // Proof the tag survived transport, logged once per turn on its own key: the same sentence
                // may arrive first without its tag (filtered during TTS playback) and already have
                // dispatched the action, so the dispatch log alone cannot show whether tags work.
                if (intent.source === "tag") {
                  const tagKey = `assistant_${turnId}_tag`;
                  if (!processedAssistantTurnIntentsRef.current.has(tagKey)) {
                    processedAssistantTurnIntentsRef.current.add(tagKey);
                    onLogEventRef.current?.("INTENT", `Tag observed in transcript: ${intent.action}`, { text: spokenText });
                  }
                }
                const intentKey = `assistant_${turnId}_${intent.action}`;
                if (!processedAssistantTurnIntentsRef.current.has(intentKey)) {
                  processedAssistantTurnIntentsRef.current.add(intentKey);
                  const via = intent.source === "tag" ? "tag" : intent.action === "end_call" ? "sign-off" : "spoken-language pattern";
                  onLogEventRef.current?.("INTENT", `Detected Assistant Intent: ${intent.action} (${via})`, { text: spokenText });
                  onUIActionRef.current?.(intent.action);
                }
              }

              // Assistant search action: silent [SEARCH:...] tag or spoken natural language fallback
              const searchIntent = detectAssistantSearchIntent(spokenText);
              if (searchIntent) {
                const turnId = item.turn_id !== undefined ? String(item.turn_id) : spokenText.slice(0, 40).toLowerCase();
                const intentSig = `${searchIntent.city || ""}_${searchIntent.pets}_${searchIntent.bedrooms}_${searchIntent.listingType || ""}_${searchIntent.reset || ""}`;
                const searchKey = `assistant_search_${turnId}_${intentSig}`;
                if (!processedAssistantTurnIntentsRef.current.has(searchKey)) {
                  processedAssistantTurnIntentsRef.current.add(searchKey);
                  onLogEventRef.current?.("INTENT", `Detected Search Intent: ${intentSig}`, { text: spokenText, searchIntent });
                  onSearchRequestRef.current?.(searchIntent);
                }
              }

              // Assistant open-listing action: silent [OPEN_PROPERTY:index=N] tag only, never spoken language
              const openIndex = parseOpenPropertyTag(spokenText);
              if (openIndex !== null) {
                const turnId = item.turn_id !== undefined ? String(item.turn_id) : spokenText.slice(0, 40).toLowerCase();
                const openKey = `assistant_open_property_${turnId}_${openIndex}`;
                if (!processedAssistantTurnIntentsRef.current.has(openKey)) {
                  processedAssistantTurnIntentsRef.current.add(openKey);
                  onLogEventRef.current?.("INTENT", `Detected Open Property Intent: result ${openIndex}`, { text: spokenText });
                  onOpenPropertyRequestRef.current?.(openIndex);
                }
              }

              // Assistant calendar date selection: silent [CALENDAR_SELECT_DATE:YYYY-MM-DD] tag
              const selectedDate = parseCalendarSelectDateTag(spokenText);
              if (selectedDate) {
                const turnId = item.turn_id !== undefined ? String(item.turn_id) : spokenText.slice(0, 40).toLowerCase();
                const dateKey = `assistant_calendar_date_${turnId}_${selectedDate}`;
                if (!processedAssistantTurnIntentsRef.current.has(dateKey)) {
                  processedAssistantTurnIntentsRef.current.add(dateKey);
                  onLogEventRef.current?.("INTENT", `Detected Calendar Date Intent: ${selectedDate}`, { text: spokenText });
                  onCalendarSelectDateRef.current?.(selectedDate);
                }
              }

              // Assistant book tour action: silent [BOOK_TOUR:date=...,time=...,name=...,phone=...] tag
              const bookTour = parseBookTourTag(spokenText);
              if (bookTour) {
                const turnId = item.turn_id !== undefined ? String(item.turn_id) : spokenText.slice(0, 40).toLowerCase();
                const bookKey = `assistant_book_tour_${turnId}_${bookTour.date}_${bookTour.time}`;
                if (!processedAssistantTurnIntentsRef.current.has(bookKey)) {
                  processedAssistantTurnIntentsRef.current.add(bookKey);
                  onLogEventRef.current?.("INTENT", `Detected Book Tour Intent: ${bookTour.date} ${bookTour.time}`, { text: spokenText, bookTour });
                  onBookTourRequestRef.current?.(bookTour);
                }
              }

              // Assistant call manager action: silent [CALL_MANAGER:property_id=...,prospect_name=...] tag
              const callManager = parseCallManagerTag(spokenText);
              if (callManager) {
                const turnId = item.turn_id !== undefined ? String(item.turn_id) : spokenText.slice(0, 40).toLowerCase();
                const managerKey = `assistant_call_manager_${turnId}_${callManager.propertyId || ""}`;
                if (!processedAssistantTurnIntentsRef.current.has(managerKey)) {
                  processedAssistantTurnIntentsRef.current.add(managerKey);
                  onLogEventRef.current?.("INTENT", `Detected Call Manager Intent: property ${callManager.propertyId}`, { text: spokenText, callManager });
                  setManagerCallStatus("dialing");
                  onCallManagerRequestRef.current?.(callManager);
                }
              }

              // Notify turn listeners when assistant turn finishes
              const isFinished = item.final === true || item.metadata?.final === true;
              if (isFinished) {
                setTimeout(() => {
                  onAgentTurnCompleteRef.current?.(transcriptRef.current);
                }, 50);
              }
            }
          }
        });

        // Dual-Signal 1: Agent speaking state changed (Cloud Gateway activity stream)
        ai.on(AgoraVoiceAIEvents.AGENT_SPEAKING_CHANGED, (_agentUserId: string, isSpeaking: boolean) => {
          setIsAgentSpeaking(isSpeaking);
          if (isSpeaking) {
            setCallState("agent_speaking");
          } else {
            setCallState("connected");
          }
        });

        // Dual-Signal 2: Agent listening state changed
        ai.on(AgoraVoiceAIEvents.AGENT_LISTENING_CHANGED, (_agentUserId: string, isListening: boolean) => {
          if (isListening) {
            setIsAgentSpeaking(false);
            setCallState("connected");
            onAgentTurnCompleteRef.current?.(transcriptRef.current);
          }
        });

        // Auxiliary Fallback: Legacy/Alternate Agent state change
        ai.on(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, (_agentUserId: string, event: any) => {
          const newState = event?.state;

          if (newState === "speaking") {
            setIsAgentSpeaking(true);
            setCallState("agent_speaking");
          } else if (
            newState === "listening" ||
            newState === "thinking" ||
            newState === "idle"
          ) {
            setIsAgentSpeaking(false);
            setCallState("connected");
          }
        });

        // Every time the gateway cuts the agent off mid-turn, whatever the cause (caller
        // barge-in or an INTERRUPTED-priority message we sent). The only direct evidence of
        // an unwanted interruption - without it, a clipped sentence is indistinguishable
        // from the agent simply finishing early.
        // Logged to the console as well as the HUD: the sales agent does not pass onLogEvent,
        // and this is the surface where an unwanted interruption has to be diagnosable.
        ai.on(AgoraVoiceAIEvents.AGENT_INTERRUPTED, (_agentUserId: string, event: any) => {
          console.warn("[Agora Voice Agent] Agent interrupted mid-turn:", event);
          onLogEventRef.current?.("AGORA", "Agent interrupted mid-turn", event);
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
            } else if (Number(volume.uid) === 888) {
              setIsManagerSpeaking(volume.level > 10);
            }
          }
        });

        // Handle remote agent audio subscription
        client.on("user-published", async (user, mediaType) => {
          if (mediaType === "audio") {
            await client.subscribe(user, mediaType);
            user.audioTrack?.play();
            if (Number(user.uid) === 888) {
              setIsManagerConnected(true);
              setManagerCallStatus("connected");
            } else {
              setIsAgentSpeaking(true);
              setCallState("agent_speaking");
            }
          }
        });

        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "audio") {
            if (Number(user.uid) === 888) {
              setIsManagerConnected(false);
              setIsManagerSpeaking(false);
              setManagerCallStatus("idle");
            } else {
              setIsAgentSpeaking(false);
              setCallState("connected");
            }
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
    const finalTranscript = [...mappedRemoteRef.current, ...localMessagesRef.current, ...managerMessagesRef.current];
    await teardownResources();
    setCallState("idle");
    setIsAgentSpeaking(false);
    setIsManagerConnected(false);
    setIsManagerSpeaking(false);
    setManagerCallStatus("idle");
    setAudioFrequencies(new Array(16).fill(10));

    if (onCallEndRef.current && finalTranscript.some((m) => m.role === "user")) {
      onCallEndRef.current(finalTranscript);
    }
  }, [teardownResources]);

  // Send Text Message in active session (routed via RTM to Agora agent)
  const sendTextMessage = useCallback(async (
    text: string,
    options?: { priority?: "interrupted" | "append" }
  ) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!voiceAiRef.current || !callActiveRef.current) {
      setErrorMessage("Voice agent is not connected. Connect to the session to send messages.");
      return;
    }

    // Render the pending local message until remote transcript confirms it (skip synthetic system control cues like [DEPLOY_CONFIRMED])
    const isSystemCue = trimmed.startsWith("[");
    const now = Date.now();
    const localMsgId = `local-text-${now}`;
    if (!isSystemCue) {
      const localMsg: VoiceMessage = {
        id: localMsgId,
        role: "user",
        text: trimmed,
        timestamp: formatTimestamp(),
        createdAt: now,
      };
      localMessagesRef.current = [...localMessagesRef.current, localMsg];
      const fullList = [...mappedRemoteRef.current, ...localMessagesRef.current, ...managerMessagesRef.current].sort(
        (a, b) => (a.createdAt || 0) - (b.createdAt || 0)
      );
      transcriptRef.current = fullList;
      setTranscript(fullList);
    }

    try {
      const { ChatMessageType, ChatMessagePriority } = await import(
        "agora-agent-client-toolkit"
      );

      // INTERRUPTED tells the Cloud Gateway to abandon the agent's current interaction and
      // answer this message now - correct for a cue the caller is waiting on, wrong for a
      // background result that arrives while the agent is mid-sentence. APPEND makes the
      // gateway hold the message until the current interaction ends. See the priority table
      // in https://docs.agora.io/en/conversational-ai/rest-api/agent/speak.
      await voiceAiRef.current.sendText(String(agentUidRef.current), {
        messageType: ChatMessageType.TEXT,
        priority:
          options?.priority === "append"
            ? ChatMessagePriority.APPEND
            : ChatMessagePriority.INTERRUPTED,
        responseInterruptable: true,
        text: trimmed,
      });
    } catch (sendErr: any) {
      console.error("[Agora Voice Agent] Could not send text message over RTM:", sendErr);
      if (!isSystemCue) {
        localMessagesRef.current = localMessagesRef.current.filter((msg) => msg.id !== localMsgId);
        setTranscript([...mappedRemoteRef.current, ...localMessagesRef.current, ...managerMessagesRef.current].sort(
          (a, b) => (a.createdAt || 0) - (b.createdAt || 0)
        ));
      }
      setErrorMessage(
        `Failed to deliver message to voice agent: ${sendErr?.message || "RTM communication failure"}`
      );
    }
  }, []);

  /**
   * Hands the running agent a property's knowledge base. The journey update and the prompt
   * swap travel in one request so they cannot land out of order: a single navigation fires
   * both, and the notes for the home being left must be folded in before the prompt for the
   * home being opened is built from them.
   */
  const retargetAgent = useCallback(async (input: RetargetInput): Promise<RetargetResult | null> => {
    const sessionId = sessionIdRef.current;
    const channelName = channelNameRef.current;
    if (!sessionId || !channelName || !callActiveRef.current) return null;

    const turns = transcriptRef.current.slice(Math.max(0, input.fromTurnIndex)).map((m) => ({
      role: m.role,
      text: m.text,
    }));

    try {
      const res = await fetch(`${BASE_PATH}/api/agora/session/retarget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          channelName,
          slug: input.slug,
          previousSlug: input.previousSlug,
          journey: input.journey,
          turns,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        // Fail loud: a silently unswapped prompt leaves Sarah discussing the wrong home.
        setErrorMessage(
          `Could not hand the call over to this property: ${data.error || "the voice gateway rejected the update"}`
        );
        onLogEventRef.current?.("AGORA", "Agent retarget failed", data);
        return { success: false, retargeted: false, journey: input.journey, error: data.error };
      }

      onLogEventRef.current?.(
        "AGORA",
        data.retargeted ? `Agent retargeted to ${data.title}` : "Journey memory updated",
        { verdict: data.verdict }
      );
      return data as RetargetResult;
    } catch (err: any) {
      setErrorMessage(
        `Could not hand the call over to this property: ${err?.message || "network failure"}`
      );
      return { success: false, retargeted: false, journey: input.journey, error: String(err?.message || err) };
    }
  }, []);

  // Poll for Property Manager speech turns while manager is connected
  useEffect(() => {
    if (!isManagerConnected || !channelNameRef.current) {
      return;
    }

    const channel = channelNameRef.current;
    let isCancelled = false;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `${BASE_PATH}/api/agora/telephony/status?channelName=${encodeURIComponent(channel)}`
        );
        if (!res.ok || isCancelled) return;
        const data = await res.json();
        const incoming: Array<{ id: string; text: string; timestamp: string }> = data?.transcripts || [];

        let added = false;
        for (const item of incoming) {
          if (!seenManagerMsgIdsRef.current.has(item.id)) {
            seenManagerMsgIdsRef.current.add(item.id);
            const rawTs = item.id.startsWith("mgr-") ? Number(item.id.split("-")[1]) : NaN;
            const createdAt = !isNaN(rawTs) && rawTs > 0 ? rawTs : Date.now();
            const msg: VoiceMessage = {
              id: item.id,
              role: "manager",
              text: item.text,
              timestamp: item.timestamp,
              createdAt,
            };
            managerMessagesRef.current = [...managerMessagesRef.current, msg];
            added = true;
          }
        }

        if (added) {
          const fullList = [...mappedRemoteRef.current, ...localMessagesRef.current, ...managerMessagesRef.current].sort(
            (a, b) => (a.createdAt || 0) - (b.createdAt || 0)
          );
          transcriptRef.current = fullList;
          setTranscript(fullList);
        }
      } catch {
        // Non-fatal polling error
      }
    }, 800);

    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
    };
  }, [isManagerConnected]);

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
    voiceSessionId,
    startCall,
    toggleMute,
    endCall,
    sendTextMessage,
    retargetAgent,
    channelName,
    isManagerConnected,
    isManagerSpeaking,
    managerCallStatus,
  };
}
