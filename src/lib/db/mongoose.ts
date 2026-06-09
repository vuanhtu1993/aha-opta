/**
 * MongoDB Connection Singleton
 *
 * Tại sao cần Singleton Pattern?
 * → Next.js hot-reload (dev mode) tạo ra module mới mỗi lần save
 * → Nếu không cache, mỗi lần hot-reload tạo 1 connection mới → exhaust MongoDB pool
 * → Solution: Cache connection trên `global` object — tồn tại xuyên suốt process lifetime
 *
 * Trade-off: Global state là anti-pattern trong OOP, nhưng đây là chuẩn được Next.js
 * khuyến nghị chính thức cho persistent connections.
 */

import mongoose from "mongoose";

// Đăng ký toàn bộ các Schema Mongoose để tránh lỗi MissingSchemaError do lazy-loading
import "./models/Team";
import "./models/Match";
import "./models/Prediction";

// Khai báo kiểu dữ liệu cho cache (TypeScript strict mode)
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Mở rộng global type để TypeScript không báo lỗi khi dùng `global.mongoose`
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

// Lấy cache từ global (nếu đã có) hoặc khởi tạo mới
const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

// Lưu lại vào global để các lần reload sau có thể tái sử dụng
global.mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "❌ Thiếu biến môi trường MONGODB. Kiểm tra file .env"
    );
  }
  // Nếu đã có connection → trả về ngay, không kết nối lại
  if (cached.conn) {
    return cached.conn;
  }

  // Nếu chưa có promise kết nối → tạo mới
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      // bufferCommands: false → không queue commands khi chưa kết nối
      // Tránh tình huống app "treo" im lặng khi DB offline
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongooseInstance) => {
        console.log("✅ MongoDB connected: aha-opta");
        return mongooseInstance;
      })
      .catch((err) => {
        // Reset promise nếu lỗi → lần sau sẽ thử lại
        cached.promise = null;
        throw err;
      });
  }

  // Await promise (dù là lần đầu hay đang chờ từ request trước)
  cached.conn = await cached.promise;
  return cached.conn;
}
