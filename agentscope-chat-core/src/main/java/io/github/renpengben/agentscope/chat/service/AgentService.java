package io.github.renpengben.agentscope.chat.service;


import static io.github.renpengben.agentscope.chat.utils.SseEmitterUtil.sendEvent;

import io.agentscope.core.ReActAgent;
import io.agentscope.core.agent.Event;
import io.agentscope.core.agent.EventType;
import io.agentscope.core.agent.StreamOptions;
import io.agentscope.core.message.Base64Source;
import io.agentscope.core.message.ContentBlock;
import io.agentscope.core.message.ImageBlock;
import io.agentscope.core.message.Msg;
import io.agentscope.core.message.Msg.Builder;
import io.agentscope.core.message.MsgRole;
import io.agentscope.core.message.TextBlock;
import io.agentscope.core.message.ThinkingBlock;
import io.agentscope.core.message.ToolResultBlock;
import io.agentscope.core.message.ToolUseBlock;
import io.agentscope.core.session.JsonSession;
import io.agentscope.core.session.Session;
import io.agentscope.core.state.SimpleSessionKey;
import io.github.renpengben.agentscope.chat.AgentLoader;
import io.github.renpengben.agentscope.chat.request.AgentRunRequest;
import io.github.renpengben.agentscope.chat.request.AgentRunRequest.FileRequest;
import io.github.renpengben.agentscope.chat.utils.JacksonUtil;
import java.io.IOException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * @author: ben
 **/
@Component
public class AgentService {

  private final AgentLoader agentLoader;
  Session session = new JsonSession(
      Path.of(System.getProperty("user.home"), ".agentscope", "sessions"));

  public AgentService(AgentLoader agentLoader) {
    this.agentLoader = agentLoader;
  }

  public List<Msg> getSessions(String sessionId) {
    return session.getList(SimpleSessionKey.of(sessionId), "memory_messages", Msg.class);
  }

  public void run(SseEmitter emitter, AgentRunRequest request) throws IOException {

    ReActAgent agent = agentLoader.loadAgent(request.getAgentName());
    agent.loadIfExists(session, request.getSessionId());
    
    TextBlock textBlock = TextBlock.builder().text(request.getMessage()).build();
    Builder contentBuilder = Msg.builder().content(textBlock).role(MsgRole.USER);
    if (!CollectionUtils.isEmpty(request.getFiles())) {
      for (FileRequest file : request.getFiles()) {
        ImageBlock imageBlock = ImageBlock.builder().source(
                Base64Source.builder().data(file.getBase64()).mediaType(file.getMediaType()).build())
            .build();
        contentBuilder.content(imageBlock);
      }
    }
    Msg userMsg = contentBuilder.build();
    String msgId = UUID.randomUUID().toString();
    sendEvent(emitter, "message/start", Map.of("id", msgId, "role", "assistant"));
    agent.stream(userMsg,
            StreamOptions.builder().eventTypes(EventType.REASONING, EventType.TOOL_RESULT).build())
        .subscribe(event -> handleEvent(event, msgId, emitter), error -> {
          emitter.completeWithError(error);
        }, () -> {
          try {
            sendEvent(emitter, "message/end", Map.of("id", msgId));
            emitter.complete();
            agent.saveTo(session, request.getSessionId());
          } catch (IOException e) {
            emitter.completeWithError(e);
          }
        });
  }

  private void handleEvent(Event event, String msgId, SseEmitter emitter) {
    try {
      if (event.getMessage() == null || event.getMessage().getContent() == null) {
        return;
      }

      for (ContentBlock block : event.getMessage().getContent()) {
        processContentBlock(block, event, msgId, emitter);
      }
    } catch (IOException e) {
      emitter.completeWithError(e);
    }
  }

  private void processContentBlock(ContentBlock block, Event event, String msgId,
      SseEmitter emitter) throws IOException {
    if (block instanceof TextBlock textBlock) {
      if (!event.isLast()) {
        sendDelta(emitter, msgId, "text", textBlock.getText());
      }
    } else if (block instanceof ThinkingBlock thinkingBlock) {
      if (!event.isLast()) {
        sendDelta(emitter, msgId, "reasoning", thinkingBlock.getThinking());
      }
    } else if (block instanceof ToolUseBlock toolUseBlock) {
      if (event.isLast()) {
        sendToolStart(emitter, toolUseBlock);
      }
    } else if (block instanceof ToolResultBlock toolResultBlock) {
      sendToolEnd(emitter, toolResultBlock);
    }
  }

  private void sendDelta(SseEmitter emitter, String msgId, String type, String text)
      throws IOException {
    Map deltaNode = new HashMap();
    deltaNode.put("id", msgId);
    Map delta = new HashMap();
    delta.put("type", type);
    delta.put("text", text);
    deltaNode.put("delta", delta);
    sendEvent(emitter, "message/delta", deltaNode);
  }

  private void sendToolStart(SseEmitter emitter, ToolUseBlock block) throws IOException {
    Map toolNode = new HashMap();
    toolNode.put("callId", block.getId());
    toolNode.put("name", block.getName());
    toolNode.put("input", JacksonUtil.toJson(block.getInput()));
    sendEvent(emitter, "tool/start", toolNode);
  }

  private void sendToolEnd(SseEmitter emitter, ToolResultBlock block) throws IOException {
    Map toolNode = new HashMap();
    toolNode.put("callId", block.getId());
    toolNode.put("output", JacksonUtil.toJson(block.getOutput()));
    sendEvent(emitter, "tool/end", toolNode);
  }

}
