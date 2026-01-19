export const chatConfig = {
  // Agent name used in chat requests
  agentName: process.env.NEXT_PUBLIC_AGENT_NAME || "default_agent",

  // Internal API endpoint for SSE
  // For static export, this is typically not used directly if we bypass API routes
  apiEndpoint: "/api/sse",

  // Backend URL for server-side proxying or direct client call
  // If NEXT_PUBLIC_API_URL is provided, we assume it's the base URL and append /api/agent/chat
  // Otherwise fallback to default
  backendUrl: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/agent/chat`
    : (process.env.BACKEND_URL || "http://localhost:8080/api/agent/chat"),

  // Default user ID
  userId: process.env.NEXT_PUBLIC_USER_ID,
};
