package io.github.renpengben.agentscope.chat.example;

import io.agentscope.core.tool.Tool;
import io.agentscope.core.tool.ToolParam;

/**
 * @author: ben
 **/
public class WeatherService {
  @Tool(description = "获取指定城市的天气")
  public String getWeather(
      @ToolParam(name = "city", description = "城市名称") String city) {
    return city + " 的天气：晴天，25°C";
  }
}
