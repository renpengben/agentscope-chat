import type { FileUIPart } from "ai";

export type ToolCallItem = {
  callId: string;
  name: string;
  state:
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error";
  input: string; // JSON string
  output?: string; // JSON string
  error?: string;
};

export type ChatItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
  reasoning?: string;
  isReasoningStreaming?: boolean;
  toolCalls?: ToolCallItem[];
  attachments?: FileUIPart[];
};

export type Session = {
  id: string;
  title: string;
  createdAt: number;
};
