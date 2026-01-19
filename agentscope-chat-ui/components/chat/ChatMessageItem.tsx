import {
  Message,
  MessageContent,
  MessageResponse,
  MessageAttachment,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { ChatItem } from "./types";

export function ChatMessageItem({ message }: { message: ChatItem }) {
  return (
    <Message from={message.role}>
      <MessageContent>
        {/* Reasoning Section */}
        {message.reasoning && (
          <Reasoning
            isStreaming={message.isReasoningStreaming}
            defaultOpen={false}
          >
            <ReasoningTrigger />
            <ReasoningContent>{message.reasoning}</ReasoningContent>
          </Reasoning>
        )}

        {/* Tool Calls Section */}
        {message.toolCalls?.map((tool) => (
          <Tool key={tool.callId} defaultOpen={false}>
            <ToolHeader
              type="tool-call"
              title={tool.name}
              state={tool.state}
            />
            <ToolContent>
              <ToolInput input={JSON.parse(tool.input)} />
              {tool.output && (
                <ToolOutput
                  output={JSON.parse(tool.output)}
                  errorText={tool.error}
                />
              )}
            </ToolContent>
          </Tool>
        ))}

        {/* Main Text Content */}
        {message.text && <MessageResponse>{message.text}</MessageResponse>}

        {/* Attachments */}
        {message.attachments?.map((a, i) => (
          <MessageAttachment key={i} data={a} />
        ))}
      </MessageContent>
    </Message>
  );
}
