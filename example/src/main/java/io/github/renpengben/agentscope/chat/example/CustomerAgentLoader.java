package io.github.renpengben.agentscope.chat.example;

import io.agentscope.core.ReActAgent;
import io.agentscope.core.memory.InMemoryMemory;
import io.agentscope.core.model.DashScopeChatModel;
import io.agentscope.core.tool.Toolkit;
import io.github.renpengben.agentscope.chat.AgentLoader;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * @author: ben
 **/
@Component
public class CustomerAgentLoader implements AgentLoader {


  @Override
  public List<ReActAgent> listAgents() {
    return List.of(createReActAgent());
  }


  ReActAgent createReActAgent() {
    Toolkit toolkit = new Toolkit();
    toolkit.registerTool(new WeatherService());

    DashScopeChatModel chatModel = DashScopeChatModel.builder().enableThinking(true)
        .apiKey(System.getenv("DASHSCOPE_API_KEY")).modelName("qwen-flash").build();
    return ReActAgent.builder()
        .name("default_agent")
        .model(chatModel)
        .toolkit(toolkit)
        .memory(new InMemoryMemory())
        .build();
  }
}