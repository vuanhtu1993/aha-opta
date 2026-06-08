/**
 * API-Football HTTP Client
 *
 * Singleton client axios với interceptor để xử lý Authentication và Rate Limit.
 */

import axios, { AxiosError } from "axios";

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

// Lấy config từ biến môi trường
const API_KEY = process.env.API_FOOTBALL_KEY;
// Mặc định host API-Football v3
const API_HOST = process.env.API_FOOTBALL_HOST || "v3.football.api-sports.io";

if (!API_KEY) {
  throw new Error("Missing API_FOOTBALL_KEY in environment variables.");
}

export const footballClient = axios.create({
  baseURL: `https://${API_HOST}`,
  headers: {
    // API-Sports dùng x-apisports-key, RapidAPI dùng x-rapidapi-key
    // Hỗ trợ cả hai thông qua cấu hình host
    [API_HOST.includes("rapidapi") ? "x-rapidapi-key" : "x-apisports-key"]: API_KEY,
    [API_HOST.includes("rapidapi") ? "x-rapidapi-host" : "x-apisports-host"]: API_HOST,
  },
  timeout: 10000,
});

// Interceptor: Track Rate Limit từ Response Header
footballClient.interceptors.response.use(
  (response) => {
    // API-Football trả về Remaining Requests trong header
    const remaining = response.headers["x-ratelimit-requests-remaining"];
    if (remaining) {
      console.log(`[API-Football] Gọi API thành công. Remaining calls: ${remaining}`);
      // Nếu chỉ còn < 5 request/ngày, throw Error để stop ETL an toàn
      if (parseInt(remaining, 10) < 5) {
        console.warn("⚠️ API-Football Rate Limit Warning: Dưới 5 requests còn lại.");
      }
    }
    
    // API-Football free tier đôi khi trả HTTP 200 nhưng body chứa error object
    if (response.data?.errors && Object.keys(response.data.errors).length > 0) {
      const errMsg = Object.values(response.data.errors).join(", ");
      throw new Error(`API-Football logic error: ${errMsg}`);
    }

    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 429) {
      throw new RateLimitError("API-Football Rate Limit Exceeded (HTTP 429)");
    }
    if (error.response?.status === 403 || error.response?.status === 401) {
       throw new Error("API-Football Auth Error: Kiểm tra lại API_FOOTBALL_KEY hoặc subscription.");
    }
    throw error;
  }
);
