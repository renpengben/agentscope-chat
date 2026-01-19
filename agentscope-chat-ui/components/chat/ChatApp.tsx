"use client";

import { useEffect, useState } from "react";
import { useChat } from "./useChat";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatSidebar } from "./ChatSidebar";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = window.document.documentElement;
    const stored = window.localStorage.getItem("theme");

    if (stored === "dark") {
      root.classList.add("dark");
      setIsDark(true);
      return;
    }

    if (stored === "light") {
      root.classList.remove("dark");
      setIsDark(false);
      return;
    }

    setIsDark(root.classList.contains("dark"));
  }, []);

  const handleToggle = () => {
    if (typeof window === "undefined") return;
    const root = window.document.documentElement;
    const next = !isDark;

    setIsDark(next);
    if (next) {
      root.classList.add("dark");
      window.localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      window.localStorage.setItem("theme", "light");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? "切换到浅色模式" : "切换到深色模式"}
      onClick={handleToggle}
    >
      {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </Button>
  );
}

export default function ChatApp() {
  const {
    messages,
    handleSubmit,
    isStreaming,
    stop,
    sessions,
    currentSessionId,
    setCurrentSessionId,
    newSession,
  } = useChat();

  return (
    <SidebarProvider>
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={newSession}
      />
      <SidebarInset className="h-svh overflow-hidden">
        <header className="flex items-center gap-2 border-b p-2">
          <SidebarTrigger />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col overflow-hidden h-full">
          <ChatMessages messages={messages} />
          <footer className="p-3 bg-background shrink-0">
            <ChatInput
              onSubmit={handleSubmit}
              isLoading={isStreaming}
              onStop={stop}
            />
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
