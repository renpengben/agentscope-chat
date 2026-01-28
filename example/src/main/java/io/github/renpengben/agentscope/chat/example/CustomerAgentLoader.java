package io.github.renpengben.agentscope.chat.example;

import io.agentscope.core.ReActAgent;
import io.agentscope.core.embedding.EmbeddingModel;
import io.agentscope.core.embedding.dashscope.DashScopeTextEmbedding;
import io.agentscope.core.memory.InMemoryMemory;
import io.agentscope.core.model.DashScopeChatModel;
import io.agentscope.core.rag.Knowledge;
import io.agentscope.core.rag.RAGMode;
import io.agentscope.core.rag.knowledge.SimpleKnowledge;
import io.agentscope.core.rag.model.Document;
import io.agentscope.core.rag.model.RetrieveConfig;
import io.agentscope.core.rag.reader.ReaderInput;
import io.agentscope.core.rag.reader.SplitStrategy;
import io.agentscope.core.rag.reader.TextReader;
import io.agentscope.core.rag.store.InMemoryStore;
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
        .apiKey(System.getenv("DASHSCOPE_API_KEY")).modelName("glm-4.7").build();
    Knowledge rag = rag();
    return ReActAgent.builder()
        .name("default_agent")
        .model(chatModel)
        .toolkit(toolkit)
        .memory(new InMemoryMemory())
        // 启用 Agentic RAG 模式
        .knowledge(rag)
        .ragMode(RAGMode.AGENTIC)
        .retrieveConfig(
            RetrieveConfig.builder()
                .limit(3)
                .scoreThreshold(0.5)
                .build())
        .build();
  }

  Knowledge rag() {
    // 1. 创建知识库
    EmbeddingModel embeddingModel = DashScopeTextEmbedding.builder()
        .apiKey(System.getenv("DASHSCOPE_API_KEY"))
        .modelName("text-embedding-v3")
        .dimensions(1024)
        .build();

    Knowledge knowledge = SimpleKnowledge.builder()
        .embeddingModel(embeddingModel)
        .embeddingStore(InMemoryStore.builder().dimensions(1024).build())
        .build();

// 2. 添加文档
    String text = """
         1.  作品名称：高复杂场景多智能体协同决策与精准执行系统V1.0；
         2.  技术架构：采用“分布式协同+分层决策”架构，底层基于ROS2（机器人操作系统）搭建通信框架，中间层集成强化学习（PPO算法优化版）实现自主决策，上层通过自适应调度模块适配动态场景，整体支持多智能体并行计算与数据交互；
         3.  核心功能实现：
             - 自主决策：基于环境感知数据（动态干扰、任务优先级、资源余量）实时生成执行路径，引入容错机制，当单智能体故障时自动触发任务转移；
             - 多智能体协同：采用“主-从智能体”协同模式，主智能体负责全局调度，从智能体专注局部任务执行，通过自定义通信协议降低延迟，协同效率较传统算法提升28%；
             - 环境自适应：内置场景特征识别模型，可快速适配动态干扰、资源约束等场景变化，自动调整决策参数，在干扰强度≥30%的场景下任务完成率仍保持85%以上；
         4.  性能优化：针对响应延迟问题，优化算法迭代逻辑，将单任务响应时间控制在200ms内；通过代码精简与并行化处理，提升系统稳定性，连续运行72小时无崩溃；
         5.  场景适配成果：已完成赛事指定模拟场景的全流程适配，任务完成率达92%，在多任务并行及动态干扰场景下，容错恢复时间≤1.5秒，各项指标均满足赛事考核要求。
        """;
    TextReader reader = new TextReader(512, SplitStrategy.PARAGRAPH, 50);
    List<Document> docs = reader.read(ReaderInput.fromString(text)).block();
    knowledge.addDocuments(docs).block();

// 3. 检索
//    List<Document> results = knowledge.retrieve("查询内容",
//        RetrieveConfig.builder().limit(3).scoreThreshold(0.5).build()).block();
    return knowledge;
  }
}