/** Public types of the Agora voice-agent hook. */

export type CallState =
  | "idle"
  | "connecting"
  | "connected"
  | "user_speaking"
  | "agent_speaking"
  | "error";

/** Who the agent is talking to; selects the persona and the auth rules on the server. */
export type CallerType = "buyer_inquiry" | "owner_onboarding" | "sales_agent";

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
  voiceSessionId?: number | null;
  startCall: (
    propertySlug?: string,
    propertyId?: number,
    callerType?: CallerType
  ) => Promise<void>;
  toggleMute: () => void;
  endCall: () => Promise<void>;
  /**
   * Sends a text message to the agent over RTM. Defaults to `interrupted` priority, which
   * stops the agent mid-sentence to answer. Pass `append` for background cues the agent
   * should announce only after it finishes its current interaction.
   */
  sendTextMessage: (
    text: string,
    options?: { priority?: "interrupted" | "append" }
  ) => void;
}

export type UIAction =
  | "open_core_modal"
  | "open_final_modal"
  | "close_review_modal"
  | "open_review_modal"
  | "open_upload_modal"
  | "close_upload_modal"
  | "open_hyper_local"
  | "close_hyper_local"
  | "open_search_hub"
  | "close_search_hub"
  /** Elena winding up an off-topic call. Terminal - the studio hangs up on it. */
  | "end_call"
  /** Elena delivering her closing remarks after deploy. Studio hangs up gracefully on it. */
  | "close_call"
  /** Elena initiating property publish and agent deployment. */
  | "trigger_deploy";

export interface ParsedSearchTag {
  city?: string;
  pets?: boolean;
  bedrooms?: number;
  listingType?: "rent" | "sale";
  minPrice?: number;
  maxPrice?: number;
  reset?: "filters" | "all";
  query?: string;
}

export interface UseAgoraVoiceAgentOptions {
  onCallEnd?: (transcript: VoiceMessage[]) => void;
  onAgentTurnComplete?: (transcript: VoiceMessage[]) => void;
  onUIAction?: (action: UIAction) => void;
  onSearchRequest?: (params: ParsedSearchTag) => void;
  /** Sarah asking for the Nth on-screen search result to be opened (1-based). */
  onOpenPropertyRequest?: (index: number) => void;
  onLogEvent?: (category: "AGORA" | "INTENT", title: string, details?: any) => void;
}
