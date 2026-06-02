import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Tiêu đề & Giới thiệu (Pedagogical approach: explain what this is) */}
      <section className="text-center space-y-4 pt-12 pb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Chào mừng đến với <span className="text-blue-600">Aha Tools</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Tập hợp các tiện ích nhỏ gọn (Micro-apps) giúp cuộc sống gia đình trở nên dễ dàng hơn. 
          Được thiết kế dựa trên tư duy chia để trị, với hiệu suất và trải nghiệm đặt lên hàng đầu.
        </p>
      </section>

      {/* Danh sách các ứng dụng (Micro-apps) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* App 1: White Noise */}
        <Card className="hover:shadow-lg transition-shadow duration-300 border-slate-200">
          <CardHeader>
            <div className="text-4xl mb-2">🎵</div>
            <CardTitle>White Noise</CardTitle>
            <CardDescription>
              Tạo tiếng ồn trắng giúp bạn tập trung làm việc hoặc ru em bé ngủ dễ dàng.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
              <Link href="/apps/white-noise">Mở ứng dụng</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Các App Tương Lai (Placeholder) */}
        <Card className="opacity-70 border-dashed border-slate-300 bg-slate-50/50">
          <CardHeader>
            <div className="text-4xl mb-2">📰</div>
            <CardTitle>Tổng hợp tin tức</CardTitle>
            <CardDescription>
              Đọc nhanh tin tức mỗi sáng. 
              <br/><span className="text-xs text-orange-600 font-medium">(Đang phát triển)</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full">
              Sắp ra mắt
            </Button>
          </CardContent>
        </Card>

        <Card className="opacity-70 border-dashed border-slate-300 bg-slate-50/50">
          <CardHeader>
            <div className="text-4xl mb-2">✅</div>
            <CardTitle>Nhắc việc</CardTitle>
            <CardDescription>
              Lên danh sách đi chợ, việc nhà. 
              <br/><span className="text-xs text-orange-600 font-medium">(Đang phát triển)</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full">
              Sắp ra mắt
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
