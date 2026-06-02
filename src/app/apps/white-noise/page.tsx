"use client";

import { useNoiseGenerator } from "./useNoiseGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Play, Square, Volume2 } from "lucide-react";

export default function WhiteNoiseApp() {
  const { isPlaying, toggle, volume, setVolume, noiseType, setNoiseType } = useNoiseGenerator();

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Tiêu đề */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">White Noise Generator</h1>
        <p className="text-slate-500">
          Giúp bạn tập trung cao độ hoặc ru em bé ngủ dễ dàng.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden relative">
        {/* Decorative background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50/50 transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />

        <CardHeader className="relative z-10 text-center pb-2">
          <CardTitle className="text-xl">Bảng Điều Khiển</CardTitle>
          <CardDescription>Chọn loại âm thanh và điều chỉnh âm lượng</CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 space-y-8 pt-4">
          
          {/* Chọn loại âm thanh */}
          <div className="flex justify-center gap-4">
            <Button 
              variant={noiseType === "brown" ? "default" : "outline"}
              onClick={() => setNoiseType("brown")}
              className={`w-32 transition-all ${noiseType === "brown" ? "shadow-md bg-blue-600 hover:bg-blue-700" : ""}`}
            >
              🌧️ Tiếng mưa
            </Button>
            <Button 
              variant={noiseType === "white" ? "default" : "outline"}
              onClick={() => setNoiseType("white")}
              className={`w-32 transition-all ${noiseType === "white" ? "shadow-md bg-indigo-600 hover:bg-indigo-700" : ""}`}
            >
              📺 Tivi hỏng
            </Button>
          </div>

          {/* Âm lượng */}
          <div className="space-y-4 px-4 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
              <span className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-500" />
                Âm lượng
              </span>
              <span>{volume}%</span>
            </div>
            <Slider 
              value={[volume]} 
              onValueChange={(val) => setVolume(val[0])} 
              max={100} 
              step={1} 
              className="w-full cursor-pointer"
            />
          </div>

          {/* Nút Play/Pause chính */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={toggle} 
              size="lg"
              className={`h-20 w-20 rounded-full shadow-xl transition-all duration-300 ${isPlaying ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'}`}
            >
              {isPlaying ? (
                <Square className="h-8 w-8 fill-white" />
              ) : (
                <Play className="h-8 w-8 fill-white ml-1" />
              )}
            </Button>
          </div>
          <div className="text-center text-sm text-slate-400 font-medium">
            {isPlaying ? "Đang phát..." : "Nhấn để phát"}
          </div>

        </CardContent>
      </Card>
      
      {/* Góc sư phạm */}
      <Card className="bg-slate-50 border-none">
        <CardContent className="pt-6 text-sm text-slate-600">
          <p className="font-semibold text-slate-800 mb-2">💡 Bạn có biết?</p>
          <p>
            Ứng dụng này <strong>không</strong> tải bất kỳ file MP3 nào! Âm thanh bạn đang nghe được tạo ra hoàn toàn bằng các phép toán (Web Audio API) chạy trực tiếp trên trình duyệt. Điều này giúp ứng dụng chạy cực nhanh và có thể phát liên tục không bị ngắt quãng.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
