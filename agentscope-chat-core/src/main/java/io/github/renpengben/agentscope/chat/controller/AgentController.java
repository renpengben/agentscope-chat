package io.github.renpengben.agentscope.chat.controller;

import io.agentscope.core.message.Msg;
import io.github.renpengben.agentscope.chat.request.AgentRunRequest;
import io.github.renpengben.agentscope.chat.service.AgentService;
import java.io.IOException;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * @author: ben
 **/
@Slf4j
@RestController
@RequestMapping("/api/agent")
@CrossOrigin(origins = "*")
public class AgentController {

  private final AgentService agentService;

  public AgentController(AgentService agentService) {
    this.agentService = agentService;
  }

  @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter agentRunSse(@RequestBody AgentRunRequest request) {
    SseEmitter emitter = new SseEmitter(60 * 60 * 1000L);
    if (!StringUtils.hasText(request.getAgentName())) {
      log.warn(
          "appName cannot be null or empty in SseEmitter request for agentName: {}, session: {}",
          request.getAgentName(), request.getSessionId());
      emitter.completeWithError(
          new ResponseStatusException(HttpStatus.BAD_REQUEST, "agentName cannot be null or empty"));
      return emitter;
    }
    if (!StringUtils.hasText(request.getSessionId())) {
      log.warn(
          "sessionId cannot be null or empty in SseEmitter request for appName: {}, session: {}",
          request.getAgentName(), request.getSessionId());
      emitter.completeWithError(
          new ResponseStatusException(HttpStatus.BAD_REQUEST, "sessionId cannot be null or empty"));
      return emitter;
    }
    try {
      agentService.run(emitter, request);
    } catch (IOException e) {
      emitter.completeWithError(
          new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage()));
      return emitter;
    }
    return emitter;
  }

  @GetMapping("/session/msg")
  public List<Msg> getSessionMsgList(String sessionId) {
    return agentService.getSessions(sessionId);
  }
}
