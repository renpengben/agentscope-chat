import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { MessageSquare, Plus } from "lucide-react";
import type { Session } from "./types";
import type { ComponentProps } from "react";

interface ChatSidebarProps extends ComponentProps<typeof Sidebar> {
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  ...props
}: ChatSidebarProps) {
  // Sort sessions by createdAt descending (newest first)
  const sortedSessions = [...sessions].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="px-2 text-lg font-semibold tracking-tight">Agent Chat UI</div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onNewChat} tooltip="New Chat">
              <Plus className="size-4" />
              <span>New Chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sortedSessions.map((session) => (
                <SidebarMenuItem key={session.id}>
                  <SidebarMenuButton
                    isActive={currentSessionId === session.id}
                    onClick={() => onSelectSession(session.id)}
                    tooltip={session.title}
                    size="sm">
                    <MessageSquare className="size-3 text-muted-foreground" />
                    <span className="truncate text-xs">{session.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {sortedSessions.length === 0 && (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                  No conversations
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
