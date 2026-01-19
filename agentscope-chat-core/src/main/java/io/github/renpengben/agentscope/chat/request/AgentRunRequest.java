package io.github.renpengben.agentscope.chat.request;

import java.util.List;
import lombok.Data;

/**
 * @author: ben
 **/
@Data
public class AgentRunRequest {

  private String agentName;
  private String message;
  private String userId;
  private String sessionId;
  private List<FileRequest> files;

  @Data
  public static class FileRequest {
      private String type;
      private String mediaType;
      private String filename;
      private String base64;
  }
}
