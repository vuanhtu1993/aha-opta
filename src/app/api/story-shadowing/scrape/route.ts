import { NextRequest, NextResponse } from "next/server";
import { JSDOM, VirtualConsole } from "jsdom";
import { Readability } from "@mozilla/readability";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Vui lòng cung cấp tham số 'url'" }, { status: 400 });
  }

  try {
    // Validate URL format
    new URL(url);
    
    // Fetch HTML with a browser-like User-Agent to avoid simple bot blocks
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Không thể lấy dữ liệu từ URL: ${response.statusText}` }, { status: response.status });
    }

    const html = await response.text();

    // Disable running scripts inside JSDOM and suppress console errors from the page
    const virtualConsole = new VirtualConsole();
    const doc = new JSDOM(html, { url, virtualConsole });
    
    // Parse using Readability
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (!article) {
      return NextResponse.json({ error: "Không thể phân tích nội dung bài viết từ trang này." }, { status: 422 });
    }

    // Extract Thumbnail (Readability doesn't provide cover image, so we fallback to meta tags)
    let thumbnail = "";
    const metaImage = doc.window.document.querySelector('meta[property="og:image"]');
    if (metaImage) {
      thumbnail = metaImage.getAttribute("content") || "";
    }

    // Clean up text content (remove excessive empty lines/whitespaces that Readability might leave)
    const textContent = (article.textContent || "").replace(/\n\s*\n/g, '\n\n').trim();

    return NextResponse.json({
      title: article.title,
      thumbnail,
      text: textContent,
      source: article.siteName || url
    });

  } catch (error) {
    console.error("[API/story-shadowing/scrape]", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi phân tích Link. Vui lòng kiểm tra lại URL." },
      { status: 500 }
    );
  }
}
