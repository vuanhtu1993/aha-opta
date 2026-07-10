import { NextRequest } from "next/server";

export type AgentSSEHandler = (
  req: NextRequest,
  log: (msg: string) => void
) => Promise<unknown>;

export function withAgentSSE(handler: AgentSSEHandler) {
  return async function (req: NextRequest) {
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const log = (msg: string) => {
          try {
            const data = JSON.stringify({ log: msg });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } catch {
            // Ignore encoding errors
          }
        };

        try {
          const result = await handler(req, log);
          const data = JSON.stringify({ result });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          controller.close();
        } catch (error: unknown) {
          console.error("[SSE Error]", error);
          const errData = JSON.stringify({ 
            error: error instanceof Error ? error.message : "Lỗi không xác định" 
          });
          controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  };
}
