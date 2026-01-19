export type SSEEvent =
  | "chat/status"
  | "message/start"
  | "message/delta"
  | "message/end"
  | "tool/start"
  | "tool/delta"
  | "tool/end"
  | "plan/update"
  | "queue/update"
  | "context/usage"
  | "web/preview"
  | "error";

export type ChatStatus = "started" | "streaming" | "completed" | "error";

export type SSEMessagePart =
  | { type: "text"; text: string }
  | {
      type: "file";
      url: string;
      mediaType: string;
      filename?: string;
    }
  | {
      type: "image";
      url: string;
      mediaType: string;
      filename?: string;
    }
  | {
      type: "tool-call";
      name: string;
      input: unknown;
    }
  | {
      type: "tool-result";
      name: string;
      output: unknown;
    };

export type SSEMessageStartPayload = {
  id: string;
  role: "assistant" | "system";
  meta?: Record<string, unknown>;
};

export type SSEMessageDeltaPayload = {
  id: string;
  delta:
    | { type: "text"; text: string }
    | { type: "reasoning"; text: string }
    | { type: "tool-result"; name: string; output: unknown };
};

export type SSEMessageEndPayload = {
  id: string;
  parts?: SSEMessagePart[];
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    reasoningTokens?: number;
    cachedInputTokens?: number;
  };
};

export type SSEToolStartPayload = {
  callId: string;
  name: string;
  input: unknown;
};

export type SSEToolDeltaPayload = {
  callId: string;
  delta: unknown;
};

export type SSEToolEndPayload = {
  callId: string;
  output: unknown;
};

export type SSEPlanUpdatePayload = {
  isStreaming?: boolean;
  steps: Array<{
    id: string;
    title: string;
    description?: string;
    status?: "pending" | "completed";
  }>;
};

export type SSEQueueUpdatePayload = {
  todos?: Array<{
    id: string;
    title: string;
    description?: string;
    status?: "pending" | "completed";
  }>;
  messages?: Array<{
    id: string;
    parts: Array<{
      type: string;
      text?: string;
      url?: string;
      filename?: string;
      mediaType?: string;
    }>;
  }>;
};

export type SSEContextUsagePayload = {
  usedTokens: number;
  maxTokens: number;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    reasoningTokens?: number;
    cachedInputTokens?: number;
  };
  modelId?: string;
};

export type SSEWebPreviewPayload = {
  url: string;
  consoleOpen?: boolean;
};

export type SSEErrorPayload = {
  id?: string;
  code: string;
  message: string;
  details?: unknown;
};

export type SSEPayload =
  | { event: "chat/status"; data: { status: ChatStatus } }
  | { event: "message/start"; data: SSEMessageStartPayload }
  | { event: "message/delta"; data: SSEMessageDeltaPayload }
  | { event: "message/end"; data: SSEMessageEndPayload }
  | { event: "tool/start"; data: SSEToolStartPayload }
  | { event: "tool/delta"; data: SSEToolDeltaPayload }
  | { event: "tool/end"; data: SSEToolEndPayload }
  | { event: "plan/update"; data: SSEPlanUpdatePayload }
  | { event: "queue/update"; data: SSEQueueUpdatePayload }
  | { event: "context/usage"; data: SSEContextUsagePayload }
  | { event: "web/preview"; data: SSEWebPreviewPayload }
  | { event: "error"; data: SSEErrorPayload };

