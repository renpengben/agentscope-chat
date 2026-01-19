package io.github.renpengben.agentscope.chat;

import io.agentscope.core.ReActAgent;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * @author: ben
 **/
public interface AgentLoader {

  List<ReActAgent> listAgents();

  default ReActAgent loadAgent(String name) {
    List<ReActAgent> agents = listAgents();
    if (agents == null || agents.size() == 0) {
      throw new NoSuchElementException("Agent not register: " + name);
    }
    ReActAgent reActAgent = agents.stream().filter(agent -> agent.getName().equals(name))
        .findFirst().orElseThrow();
    return reActAgent;
  }
}
