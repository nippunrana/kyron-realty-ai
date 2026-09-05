/** Public types of the Agora voice-agent hook. */

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

export interface OwnerContext {
  name?: string | null;
  email?: string | null;
  userId?: string | null;
}

export interface UseAgoraVoiceAgentReturn {
  callState: CallState;
  isMuted: boolean;
  isAgentSpeaking: boolean;
  audioFrequencies: number[];
  transcript: VoiceMessage[];
  errorMessage: string | null;
  startCall: (
    propertySlug?: string,
    propertyId?: number,
    callerType?: "buyer_inquiry" | "owner_onboarding",
    ownerContext?: OwnerContext
  ) => Promise<void>;
  toggleMute: () => void;
  endCall: () => Promise<void>;
  sendTextMessage: (text: string, priority?: "INTERRUPTED" | "APPEND") => void;
}

export type UIAction = "open_review_modal" | "close_review_modal";

export interface UseAgoraVoiceAgentOptions {
  onCallEnd?: (transcript: VoiceMessage[]) => void;
  onAgentTurnComplete?: (transcript: VoiceMessage[]) => void;
  onAgentSpeakingChanged?: (isSpeaking: boolean) => void;
  onUIAction?: (action: UIAction) => void;
}
