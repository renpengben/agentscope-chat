import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputAttachments,
  usePromptInputAttachments,
  PromptInputAttachment,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { PaperclipIcon } from "lucide-react";
import type { FileUIPart } from "ai";

function UploadButton() {
  const { openFileDialog } = usePromptInputAttachments();
  return (
    <Button
      size="icon"
      variant="ghost"
      type="button"
      onClick={openFileDialog}
    >
      <PaperclipIcon className="size-4" />
    </Button>
  );
}

export function ChatInput({
  onSubmit,
  isLoading,
  onStop,
}: {
  onSubmit: (data: { text: string; files: FileUIPart[] }) => void;
  isLoading?: boolean;
  onStop?: () => void;
}) {
  return (
    <PromptInput onSubmit={onSubmit}>
      <PromptInputBody>
        <PromptInputAttachments>
          {(file) => <PromptInputAttachment key={file.id} data={file} />}
        </PromptInputAttachments>
        <PromptInputTextarea placeholder="输入消息，按 Enter 发送，Shift+Enter 换行" />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <UploadButton />
        </PromptInputTools>
        <PromptInputSubmit
          status={isLoading ? "streaming" : undefined}
          onClick={(e) => {
            if (isLoading && onStop) {
              e.preventDefault();
              onStop();
            }
          }}
        />
      </PromptInputFooter>
    </PromptInput>
  );
}
