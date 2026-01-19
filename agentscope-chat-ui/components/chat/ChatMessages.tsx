import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatItem } from "./types";

export function ChatMessages({ messages }: { messages: ChatItem[] }) {
  return (
    <Conversation className="overflow-y-auto">
      <ConversationContent>
        {messages.length === 0 ? (
          <ConversationEmptyState
            title="开始对话"
            description="在下方输入消息，或拖拽文件进行提问"
          />
        ) : (
          messages.map((m) => <ChatMessageItem key={m.id} message={m} />)
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
