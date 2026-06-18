import { ConditionalEdgeRouter, END } from "@langchain/langgraph";
import { MessagesState } from "./state";
import { AIMessage } from "@langchain/core/messages";

export const shouldContinue = (state: typeof MessagesState.State): "toolNode" | typeof END => {
    const lastMessage = state.messages.at(-1);

    // Chỉ cần check tool_calls, vì node này chỉ chạy sau llmCall
    if (
        lastMessage &&
        AIMessage.isInstance(lastMessage) &&
        lastMessage.tool_calls?.length
    ) {
        return "toolNode";
    }

    return END;
};