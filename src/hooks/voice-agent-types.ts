/** Public types of the Agora voice-agent hook. */

export type CallState =
  | "idle"
  | "connecting"
  | "connected"
  | "user_speaking"
  | "agent_speaking"
  | "error";

/** Who the agent is talking to; selects the persona and the auth rules on the server. */
export type CallerType = "buyer_inquiry" | "owner_onboarding";

export interface VoiceMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
}

export interface UseAgoraVoiceAgentReturn {
  callState: CallState;
  /** True from the moment a call starts connecting until it ends or errors. */
  isCallActive: boolean;
  isMuted: boolean;
  isAgentSpeaking: boolean;
  audioFrequencies: number[];
  transcript: VoiceMessage[];
  errorMessage: string | null;
  startCall: (
    propertySlug?: string,
    propertyId?: number,
    callerType?: CallerType
  ) => Promise<void>;
  toggleMute: () => void;
  endCall: () => Promise<void>;
  sendTextMessage: (text: string) => void;
}

export type UIAction = "open_review_modal" | "close_review_modal";

export interface UseAgoraVoiceAgentOptions {
  onCallEnd?: (transcript: VoiceMessage[]) => void;
  onAgentTurnComplete?: (transcript: VoiceMessage[]) => void;
  onUIAction?: (action: UIAction) => void;
}
