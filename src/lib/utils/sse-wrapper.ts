import { NextRequest } from "next/server";

export type AgentSSEHandler = (
  req: NextRequest,
  log: (msg: string | { message?: string; progress?: any }) => void
) => Promise<unknown>;

export function withAgentSSE(handler: AgentSSEHandler) {
  return async function (req: NextRequest) {
    const encoder = new TextEncoder();
    let pingInterval: NodeJS.Timeout;

    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;

        // Keep connection alive with empty comments every 15s
        pingInterval = setInterval(() => {
          if (isClosed) return;
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            isClosed = true;
            clearInterval(pingInterval);
          }
        }, 15000);

        const log = (payload: string | { message?: string; progress?: any }) => {
          if (isClosed) return;
          try {
            let data: string;
            if (typeof payload === 'string') {
              data = JSON.stringify({ log: payload });
            } else {
              data = JSON.stringify({ 
                log: payload.message,
                progress: payload.progress
              });
            }
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } catch {
            // Ignore encoding errors
          }
        };

        try {
          const result = await handler(req, log);
          if (isClosed) return;
          const data = JSON.stringify({ result });
          try {
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            isClosed = true;
            controller.close();
          } catch (e) {
            console.error("[SSE] Stream already closed by client before completion.");
          }
        } catch (error: unknown) {
          if (isClosed) return;
          console.error("[SSE Error]", error);
          const errData = JSON.stringify({
            error: error instanceof Error ? error.message : "Lỗi không xác định"
          });
          try {
            controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
            isClosed = true;
            controller.close();
          } catch (e) {
            // Ignore if already closed
          }
        } finally {
          isClosed = true;
          clearInterval(pingInterval);
        }
      },
      cancel() {
        clearInterval(pingInterval);
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  };
}
