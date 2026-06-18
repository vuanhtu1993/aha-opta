import "dotenv/config";
import { StateGraph, START, END } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { shouldContinue } from "./routing";
import { llmCall, toolNode } from "./node";
import { MessagesState } from "./state";

const agent = new StateGraph(MessagesState)
    .addNode("llmCall", llmCall)
    .addNode("toolNode", toolNode)
    // START → llmCall: điểm bắt đầu cố định
    .addEdge(START, "llmCall")
    // llmCall → shouldContinue → (toolNode | END): điều hướng có điều kiện
    .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
    // toolNode → llmCall: vòng lặp agent
    .addEdge("toolNode", "llmCall")
    .compile();

// Chạy agent


async function main() {
    const result = await agent.invoke({
        messages: [new HumanMessage("What is (3 + 4) * 2?")],
    });

    // In kết quả
    for (const message of result.messages) {
        console.log(`[${message.getType()}]: ${JSON.stringify(message.content)}`);
    }
}
// npx tsx src/lib/agents/first-agent/pipeline.ts
main()