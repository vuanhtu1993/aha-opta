import { useAgentStore } from "@/lib/store/useAgentStore";

export function useAgentFetch() {
  const startAgent = useAgentStore((state) => state.startAgent);
  const stopAgent = useAgentStore((state) => state.stopAgent);

  const fetchSSE = async <T = unknown>(
    url: string,
    options?: RequestInit
  ): Promise<T> => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            Accept: "text/event-stream",
          },
        });

        if (!response.ok) {
          const text = await response.text();
          let errMessage = "Lỗi không xác định";
          try {
            const data = JSON.parse(text);
            errMessage = data.error || text;
          } catch {
            errMessage = text;
          }
          return reject(new Error(errMessage));
        }

        if (!response.body) {
          return reject(new Error("Response body is empty"));
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          
          buffer = lines.pop() || ""; // Giữ lại phần chưa hoàn thành trong buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6).trim();
              if (!dataStr) continue;

              try {
                const data = JSON.parse(dataStr);
                
                if (data.log) {
                  startAgent(data.log);
                } else if (data.error) {
                  stopAgent();
                  return reject(new Error(data.error));
                } else if (data.result !== undefined) {
                  stopAgent();
                  return resolve(data.result as T);
                }
              } catch {
                console.warn("Failed to parse SSE data:", dataStr);
              }
            }
          }
        }
        
        stopAgent();
        reject(new Error("Stream closed without result"));
      } catch (err) {
        stopAgent();
        reject(err);
      }
    });
  };

  return { fetchSSE };
}
