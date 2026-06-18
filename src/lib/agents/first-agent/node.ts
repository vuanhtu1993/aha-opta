import { SystemMessage, AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { GraphNode } from "@langchain/langgraph";
import { MessagesState } from "./state";
import { modelWithTools, toolsByName } from "./tools";

export const llmCall: GraphNode<typeof MessagesState> = async (state) => {
    console.log(JSON.stringify(state));
    console.log("================================================================");


    const response = await modelWithTools.invoke([
        new SystemMessage("You are a helpful assistant tasked with performing arithmetic."),
        ...state.messages
    ])
    return {
        messages: [response],
        llmCalls: 1
    }
}

export const toolNode: GraphNode<typeof MessagesState> = async (state) => {
    const lastMessage = state.messages.at(-1)

    // Guard clause: chỉ thực thi nếu message cuối là AIMessage có tool_calls
    if (lastMessage == null || !AIMessage.isInstance(lastMessage)) {
        return { messages: [] };
    }

    const result: ToolMessage[] = [];
    // Lặp qua từng tool_call trong AIMessage
    // LLM có thể yêu cầu nhiều tool cùng lúc
    for (const toolCall of lastMessage.tool_calls ?? []) {
        const selectedTool = toolsByName[toolCall.name];
        // tool.invoke(toolCall) = thực thi function với args từ LLM
        const observation = await selectedTool.invoke(toolCall);
        result.push(observation);
    }

    return { messages: result };
}