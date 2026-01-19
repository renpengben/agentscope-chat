import { useCallback, useEffect, useRef, useState } from "react";
import type { FileUIPart } from "ai";
import {
  type SSEMessageEndPayload,
  type SSEPlanUpdatePayload,
  type SSEQueueUpdatePayload,
  type SSEWebPreviewPayload,
} from "@/lib/sse";
import { chatConfig } from "@/lib/config";
import type { ChatItem, ToolCallItem, Session } from "./types";

function mergeAttachments(
  existing: FileUIPart[] | undefined,
  parts: SSEMessageEndPayload["parts"] | undefined
): FileUIPart[] | undefined {
  const next = [...(existing ?? [])];
  if (parts && parts.length > 0) {
    for (const p of parts) {
      if (p.type === "file" || p.type === "image") {
        next.push({
          type: "file",
          url: p.url,
          mediaType: p.mediaType,
          filename: p.filename,
        });
      }
    }
  }
  return next.length ? next : existing;
}

export function useChat() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [messagesBySession, setMessagesBySession] = useState<
    Record<string, ChatItem[]>
  >({});
  const [webPreview, setWebPreview] = useState<SSEWebPreviewPayload | null>(
    null
  );
  const [plan, setPlan] = useState<SSEPlanUpdatePayload | null>(null);
  const [queue, setQueue] = useState<SSEQueueUpdatePayload | null>(null);
  const [streamingSessionIds, setStreamingSessionIds] = useState<Set<string>>(new Set());

  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Generate User ID on mount or use config
  useEffect(() => {
    setUserId(chatConfig.userId || crypto.randomUUID());
  }, []);

  const ensureSession = useCallback(() => {
    if (currentSessionId) {
      return currentSessionId;
    }
    const newId = crypto.randomUUID();
    setSessions((prev: Session[]) =>
      [{
        id: newId,
        title: "未命名对话",
        createdAt: Date.now(),
      }].concat(prev)
    );
    setMessagesBySession((prev: Record<string, ChatItem[]>) => ({ ...prev, [newId]: [] }));
    setCurrentSessionId(newId);
    return newId;
  }, [currentSessionId]);

  const appendUser = useCallback(
    (text: string, files: FileUIPart[]) => {
      const sessionId = ensureSession();
      const id = crypto.randomUUID();
      setMessagesBySession((prev: Record<string, ChatItem[]>) => {
        const msgs = prev[sessionId] ?? [];
        return {
          ...prev,
          [sessionId]: msgs.concat({
            id,
            role: "user",
            text,
            attachments: files,
          }),
        };
      });
      setSessions((prev: Session[]) =>
        prev.map((s) =>
          s.id === sessionId && s.title === "未命名对话"
            ? { ...s, title: text.slice(0, 30) }
            : s
        )
      );
      return sessionId;
    },
    [ensureSession]
  );

  const handleEvent = useCallback((eventName: string, dataStr: string, sessionId: string) => {
    try {
      const data = JSON.parse(dataStr);

      switch (eventName) {
        case "message/start":
          setMessagesBySession((prev: Record<string, ChatItem[]>) => {
            const msgs = prev[sessionId] ?? [];
            return {
              ...prev,
              [sessionId]: msgs.concat({
                id: data.id,
                role: "assistant",
                text: "",
              }),
            };
          });
          break;
        case "message/delta":
          setMessagesBySession((prev: Record<string, ChatItem[]>) => {
            const msgs = (prev[sessionId] ?? []).map((m) => {
              if (m.id !== data.id || m.role !== "assistant") return m;

              if (data.delta.type === "reasoning") {
                return {
                  ...m,
                  reasoning: (m.reasoning || "") + data.delta.text,
                  isReasoningStreaming: true,
                };
              }
              if (data.delta.type === "text") {
                return {
                  ...m,
                  text: m.text + data.delta.text,
                  isReasoningStreaming: false,
                };
              }
              return m;
            });
            return { ...prev, [sessionId]: msgs };
          });
          break;
        case "message/end":
          setMessagesBySession((prev: Record<string, ChatItem[]>) => {
            const msgs = (prev[sessionId] ?? []).map((m) =>
              m.id === data.id && m.role === "assistant"
                ? {
                  ...m,
                  attachments: mergeAttachments(m.attachments, data.parts),
                  isReasoningStreaming: false,
                }
                : m
            );
            return { ...prev, [sessionId]: msgs };
          });
          break;
        case "tool/start":
          setMessagesBySession((prev: Record<string, ChatItem[]>) => {
            const msgs = [...(prev[sessionId] ?? [])];
            const lastMsgIndex = msgs.findLastIndex((m) => m.role === "assistant");
            if (lastMsgIndex === -1) return prev;

            const lastMsg = msgs[lastMsgIndex];
            const newTool: ToolCallItem = {
              callId: data.callId,
              name: data.name,
              state: "input-available",
              input: JSON.stringify(data.input),
            };

            const newMsg = {
              ...lastMsg,
              toolCalls: [...(lastMsg.toolCalls ?? []), newTool],
            };
            msgs[lastMsgIndex] = newMsg;
            return { ...prev, [sessionId]: msgs };
          });
          break;
        case "tool/end":
          setMessagesBySession((prev: Record<string, ChatItem[]>) => {
            const msgs = [...(prev[sessionId] ?? [])];
            const lastMsgIndex = msgs.findLastIndex((m) => m.role === "assistant");
            if (lastMsgIndex === -1) return prev;

            const lastMsg = msgs[lastMsgIndex];
            const newToolCalls = (lastMsg.toolCalls ?? []).map((t) =>
              t.callId === data.callId
                ? {
                  ...t,
                  state: "output-available" as const,
                  output: JSON.stringify(data.output),
                }
                : t
            );

            msgs[lastMsgIndex] = { ...lastMsg, toolCalls: newToolCalls };
            return { ...prev, [sessionId]: msgs };
          });
          break;
        case "plan/update":
          setPlan(data);
          break;
        case "queue/update":
          setQueue(data);
          break;
        case "web/preview":
          setWebPreview(data);
          break;
      }
    } catch (e) {
      console.error("Failed to parse SSE data", e);
    }
  }, []);

  const connectSSE = useCallback(
    async (sessionId: string, message: string, uid: string, files: FileUIPart[]) => {
      // Abort previous connection for THIS session if exists
      if (abortControllersRef.current.has(sessionId)) {
        abortControllersRef.current.get(sessionId)?.abort();
      }

      const abortController = new AbortController();
      abortControllersRef.current.set(sessionId, abortController);

      setStreamingSessionIds(prev => {
        const next = new Set(prev);
        next.add(sessionId);
        return next;
      });

      try {
        // Convert files to Base64
        const filePayloads = await Promise.all(files.map(async (f) => {
          if (f.url) { // Check if url exists
            try {
              const blob = await fetch(f.url).then(r => r.blob());
              return new Promise<{ type: string, mediaType?: string, filename?: string, base64?: string }>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64String = (reader.result as string).split(',')[1];
                  resolve({
                    type: f.type,
                    mediaType: f.mediaType,
                    filename: f.filename,
                    base64: base64String
                  });
                };
                reader.readAsDataURL(blob);
              });
            } catch (e) {
              console.error("Failed to convert blob to base64", e);
            }
          }
          return {
            type: f.type,
            mediaType: f.mediaType,
            filename: f.filename,
            base64: "" // Ensure base64 field is present even if empty
          };
        }));

        const url = chatConfig.apiEndpoint.startsWith("http")
          ? chatConfig.apiEndpoint
          : chatConfig.backendUrl; // Use backendUrl directly for static export

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: sessionId,
            message,
            userId: uid,
            agentName: chatConfig.agentName,
            files: filePayloads
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          console.error("SSE Connection failed with status:", response.status);
          throw new Error(`Failed to connect: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        console.log("SSE Connection established for session:", sessionId);

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("SSE Stream complete");
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            const lines = part.split("\n");
            let eventName = "";
            let data = "";
            for (const line of lines) {
              if (line.startsWith("event:")) eventName = line.slice(6).trim();
              else if (line.startsWith("data:")) data = line.slice(5).trim();
            }
            if (eventName && data) {
              handleEvent(eventName, data, sessionId);
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log("SSE Connection aborted by user");
        } else {
          console.error("SSE Connection Error:", err);
        }
      } finally {
        setStreamingSessionIds(prev => {
          const next = new Set(prev);
          next.delete(sessionId);
          return next;
        });
        abortControllersRef.current.delete(sessionId);
      }
    },
    [handleEvent]
  );

  const stop = useCallback(() => {
    if (currentSessionId && abortControllersRef.current.has(currentSessionId)) {
      abortControllersRef.current.get(currentSessionId)?.abort();
      abortControllersRef.current.delete(currentSessionId);
      setStreamingSessionIds(prev => {
        const next = new Set(prev);
        next.delete(currentSessionId);
        return next;
      });
    }
  }, [currentSessionId]);

  const handleSubmit = useCallback(
    ({ text, files }: { text: string; files: FileUIPart[] }) => {
      const sessionId = appendUser(text, files);
      connectSSE(sessionId, text, userId, files);
    },
    [appendUser, connectSSE, userId]
  );

  const newSession = useCallback(() => {
    const newId = crypto.randomUUID();
    setSessions((prev: Session[]) =>
      [{
        id: newId,
        title: "未命名对话",
        createdAt: Date.now(),
      }].concat(prev)
    );
    setMessagesBySession((prev: Record<string, ChatItem[]>) => ({ ...prev, [newId]: [] }));
    setCurrentSessionId(newId);
  }, []);

  const messages = currentSessionId
    ? messagesBySession[currentSessionId] ?? []
    : [];

  const isStreaming = currentSessionId ? streamingSessionIds.has(currentSessionId) : false;

  return {
    messages,
    handleSubmit,
    webPreview,
    plan,
    queue,
    sessions,
    currentSessionId,
    setCurrentSessionId,
    isStreaming,
    stop,
    newSession,
  };
}
