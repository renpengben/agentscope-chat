package io.github.renpengben.agentscope.chat.utils;

import java.io.IOException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * @author: ben
 **/
public class SseEmitterUtil {


  public static void sendEvent(SseEmitter emitter, String eventName, Object data)
      throws IOException {
    emitter.send(SseEmitter.event()
        .name(eventName)
        .data(data));
  }

}
