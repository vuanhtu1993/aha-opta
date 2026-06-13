import { OptaStateType } from "../state";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tavily } from "@tavily/core";

export async function expertOpinionNode(state: OptaStateType): Promise<Partial<OptaStateType>> {
  console.log(`[LangGraph] Node 3: Fetching Expert Opinion...`);

  if (!state.homeTeamInfo || !state.awayTeamInfo) {
    return { expertOpinion: null };
  }

  const home = state.homeTeamInfo.name;
  const away = state.awayTeamInfo.name;

  try {
    // 1. Thực hiện tra cứu thực tế với Tavily
    console.log(`[LangGraph] Node 3: Searching web for predictions using Tavily...`);
    let searchResultsStr = "";

    if (process.env.TAVILY_API_KEY) {
      const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
      // Đưa thêm năm hiện tại để tránh tìm nhầm các bài viết phân tích trận đấu từ 5-10 năm trước
      const currentYear = new Date().getFullYear();
      const searchQuery = `expert predictions football match ${home} vs ${away} ${currentYear} World Cup`;
      try {
        const rawResults = await tvly.search(searchQuery, { searchDepth: "basic", maxResults: 3 });
        // Chỉ lấy mảng results (title, url, content) để truyền vào LLM cho nhẹ
        searchResultsStr = JSON.stringify(rawResults.results);
        console.log(`[LangGraph] Node 3: Tavily search completed.`);
      } catch (e) {
        console.warn("[LangGraph] Node 3: Tavily search failed", e);
      }
    } else {
      console.warn("[LangGraph] Node 3: Missing TAVILY_API_KEY");
    }

    // 2. Tổng hợp bằng LLM
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const llm = new ChatGoogleGenerativeAI({
      model: modelName,
      temperature: 0.3, // Nhiệt độ thấp hơn để bám sát dữ liệu search hơn
    });

    const prompt = `
    Bạn là một trợ lý ảo chuyên phân tích và tổng hợp thông tin thể thao.
    Trận đấu sắp tới: ${home} vs ${away}.
    
    Dưới đây là KẾT QUẢ TRA CỨU TỪ INTERNET (Báo cáo từ các trang thể thao):
    """
    ${searchResultsStr}
    """
    
    Nhiệm vụ:
    Dựa BÁM SÁT vào dữ liệu tra cứu trên, hãy viết MỘT ĐOẠN VĂN NGẮN GỌN (tối đa 3-4 câu) tóm tắt nhận định chung của các nhà chuyên môn bóng đá hoặc các trang báo. 
    BẮT BUỘC phải trích dẫn tên nguồn một cách rõ ràng (VD: "Theo ESPN...", "Trang SportsMole nhận định...").
    
    Nếu kết quả tra cứu rỗng hoặc không có nội dung liên quan đến trận đấu này, hãy tự suy luận bằng kiến thức của bạn, nhưng hãy bắt đầu câu trả lời bằng: "Chưa có nhận định cụ thể trên báo chí quốc tế..."
    `;

    const response = await llm.invoke(prompt);
    const opinion = response.content.toString();

    console.log(`[LangGraph] Node 3 -> Expert Opinion synthesized`, opinion);

    return { expertOpinion: opinion };
  } catch (error) {
    console.error("[LangGraph] Node 3: Failed to fetch expert opinion", error);
    return { expertOpinion: null };
  }
}
