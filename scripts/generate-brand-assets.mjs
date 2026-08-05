/**
 * @file generate-brand-assets.mjs
 * @description Script tự động kết xuất toàn bộ bộ nhận diện thương hiệu (Brand Assets Suite)
 * từ 2 tệp nguồn vector SVG chuẩn:
 *  - public/brand/logo-final.svg (Icon biểu tượng)
 *  - public/brand/logo-full-final.svg (Logo đầy đủ)
 * 
 * Toàn bộ tài nguyên được lưu trữ DUY NHẤT tại: public/brand/
 * 
 * Bộ sản phẩm gồm 5 danh mục:
 * 1. App icon (PWA 192, 512, 1024, Maskable icon, Apple Touch Icon)
 * 2. Logo đầy đủ (Bản sáng, bản tối, OpenGraph Social Card 1200x630)
 * 3. Splash screen (PWA Splash Mobile 1170x2532 và 1080x1920)
 * 4. App store assets (Store Icon 512, Feature Graphic 1024x500, Promo Banner 1200x630)
 * 5. Favicon (16x16, 32x32, 48x48, multi-size favicon.ico)
 *
 * Made by Anh Tu - Share to be share
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const BRAND_DIR = path.resolve('public/brand');

// Đọc 2 file SVG nguồn
const iconSvgPath = path.join(BRAND_DIR, 'logo-final.svg');
const fullSvgPath = path.join(BRAND_DIR, 'logo-full-final.svg');

if (!fs.existsSync(iconSvgPath) || !fs.existsSync(fullSvgPath)) {
  console.error('❌ Không tìm thấy tệp SVG nguồn tại public/brand/');
  process.exit(1);
}

const iconSvgBuffer = fs.readFileSync(iconSvgPath);
const fullSvgBuffer = fs.readFileSync(fullSvgPath);

// Tạo biến thể SVG Full Logo màu sáng (text trắng) cho Dark Theme
const fullSvgDarkBuffer = Buffer.from(
  fullSvgBuffer.toString('utf-8').replace(/fill="#0f172a"/g, 'fill="#f8fafc"')
);

/**
 * Hàm ghi multi-size ICO binary
 */
function createIco(pngBuffers, outputPath) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = ICO
  header.writeUInt16LE(pngBuffers.length, 4); // count

  let offset = 6 + 16 * pngBuffers.length;
  const entries = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // image data size
    entry.writeUInt32LE(offset, 12); // image data offset
    offset += item.buffer.length;
    entries.push(entry);
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...pngBuffers.map(b => b.buffer)]);
  fs.writeFileSync(outputPath, icoBuffer);
}

async function generateAll() {
  console.log('🚀 Bắt đầu khởi tạo Bộ tài nguyên Nhận diện Thương hiệu Aha-Mind...\n');

  // =========================================================================
  // 1. APP ICONS (PWA, Apple Touch Icon, Android)
  // =========================================================================
  console.log('📦 1. Tạo App Icons...');
  
  // Icon 192x192 (Transparent)
  const icon192 = await sharp(iconSvgBuffer, { density: 300 })
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(BRAND_DIR, 'icon-192.png'), icon192);

  // Icon 512x512 (Transparent)
  const icon512 = await sharp(iconSvgBuffer, { density: 300 })
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(BRAND_DIR, 'icon-512.png'), icon512);

  // Icon 1024x1024 (Master Icon)
  const icon1024 = await sharp(iconSvgBuffer, { density: 300 })
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(BRAND_DIR, 'icon-1024.png'), icon1024);

  // Maskable Icon 512x512 (PWA Android chuẩn an toàn Safe Zone 80%)
  const innerIcon360 = await sharp(iconSvgBuffer, { density: 300 })
    .resize(360, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const iconMaskable512 = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: '#0f172a'
    }
  })
    .composite([{ input: innerIcon360, gravity: 'center' }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(BRAND_DIR, 'icon-maskable-512.png'), iconMaskable512);

  // Apple Touch Icon 180x180 (Nền tối sang trọng cho iOS)
  const innerIcon130 = await sharp(iconSvgBuffer, { density: 300 })
    .resize(130, 130, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const appleTouchIcon = await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: '#0f172a'
    }
  })
    .composite([{ input: innerIcon130, gravity: 'center' }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(BRAND_DIR, 'apple-touch-icon.png'), appleTouchIcon);

  // =========================================================================
  // 2. LOGO ĐẦY ĐỦ (Full Logo & OpenGraph)
  // =========================================================================
  console.log('🎨 2. Tạo Logo Đầy Đủ & OpenGraph Image...');

  // Logo đầy đủ nền trong suốt (Bản sáng)
  const fullLogoLight = await sharp(fullSvgBuffer, { density: 300 })
    .resize(1200, null, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(BRAND_DIR, 'logo-full-light.png'), fullLogoLight);

  // Logo đầy đủ nền trong suốt (Bản tối - chữ trắng)
  const fullLogoDark = await sharp(fullSvgDarkBuffer, { density: 300 })
    .resize(1200, null, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(BRAND_DIR, 'logo-full-dark.png'), fullLogoDark);

  // OpenGraph Social Share Card (1200x630)
  const ogCenterLogo = await sharp(fullSvgDarkBuffer, { density: 300 })
    .resize(750, null, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const ogCard = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: '#0f172a'
    }
  })
    .composite([
      {
        input: Buffer.from(`
          <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="glow" cx="50%" cy="45%" r="50%">
                <stop offset="0%" stop-color="#4FB5B5" stop-opacity="0.22"/>
                <stop offset="50%" stop-color="#FFD043" stop-opacity="0.12"/>
                <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <rect width="1200" height="630" fill="url(#glow)"/>
            <text x="600" y="475" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="600" fill="#94a3b8" letter-spacing="1">
              AI Story Shadowing &amp; Smart Micro-Apps
            </text>
            <text x="600" y="525" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="500" fill="#64748b" letter-spacing="2">
              aha-mind.vercel.app
            </text>
          </svg>
        `),
        top: 0,
        left: 0
      },
      {
        input: ogCenterLogo,
        top: 170,
        left: Math.round((1200 - 750) / 2)
      }
    ])
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(BRAND_DIR, 'og-image.png'), ogCard);

  // =========================================================================
  // 3. SPLASH SCREEN (PWA / Mobile Launch Screen)
  // =========================================================================
  console.log('📱 3. Tạo Splash Screens...');

  // Splash Screen 1170x2532 (iPhone / Modern Mobile)
  const splashLogo = await sharp(fullSvgDarkBuffer, { density: 300 })
    .resize(680, null, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const splashScreen1170 = await sharp({
    create: {
      width: 1170,
      height: 2532,
      channels: 4,
      background: '#0f172a'
    }
  })
    .composite([
      {
        input: Buffer.from(`
          <svg width="1170" height="2532" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="splashGlow" cx="50%" cy="48%" r="40%">
                <stop offset="0%" stop-color="#4FB5B5" stop-opacity="0.25"/>
                <stop offset="60%" stop-color="#FDC425" stop-opacity="0.10"/>
                <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <rect width="1170" height="2532" fill="url(#splashGlow)"/>
            <text x="585" y="2350" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="500" fill="#64748b" letter-spacing="3">
              POWERED BY AI AGENTS
            </text>
          </svg>
        `),
        top: 0,
        left: 0
      },
      {
        input: splashLogo,
        top: Math.round((2532 - 130) / 2) - 80,
        left: Math.round((1170 - 680) / 2)
      }
    ])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(BRAND_DIR, 'splash-screen-1170x2532.png'), splashScreen1170);

  // Splash Screen 1080x1920 (Universal 16:9 Mobile)
  const splashScreen1080 = await sharp({
    create: {
      width: 1080,
      height: 1920,
      channels: 4,
      background: '#0f172a'
    }
  })
    .composite([
      {
        input: Buffer.from(`
          <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="splashGlow2" cx="50%" cy="48%" r="45%">
                <stop offset="0%" stop-color="#4FB5B5" stop-opacity="0.25"/>
                <stop offset="60%" stop-color="#FDC425" stop-opacity="0.10"/>
                <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <rect width="1080" height="1920" fill="url(#splashGlow2)"/>
            <text x="540" y="1780" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="500" fill="#64748b" letter-spacing="3">
              POWERED BY AI AGENTS
            </text>
          </svg>
        `),
        top: 0,
        left: 0
      },
      {
        input: splashLogo,
        top: Math.round((1920 - 130) / 2) - 60,
        left: Math.round((1080 - 680) / 2)
      }
    ])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(BRAND_DIR, 'splash-screen-1080x1920.png'), splashScreen1080);

  // =========================================================================
  // 4. APP STORE ASSETS
  // =========================================================================
  console.log('🏪 4. Tạo App Store Assets...');

  // Store Icon 512x512 (Google Play / App Store listing)
  const storeIconCenter = await sharp(iconSvgBuffer, { density: 300 })
    .resize(340, 340, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const appStoreIcon = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: '#0f172a'
    }
  })
    .composite([
      {
        input: Buffer.from(`
          <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="storeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#1e293b"/>
                <stop offset="100%" stop-color="#0f172a"/>
              </linearGradient>
            </defs>
            <rect width="512" height="512" fill="url(#storeGrad)"/>
          </svg>
        `),
        top: 0,
        left: 0
      },
      {
        input: storeIconCenter,
        gravity: 'center'
      }
    ])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(BRAND_DIR, 'app-store-icon-512.png'), appStoreIcon);

  // Feature Graphic 1024x500 (Google Play Store Header)
  const featureLogo = await sharp(fullSvgDarkBuffer, { density: 300 })
    .resize(650, null, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const featureGraphic = await sharp({
    create: {
      width: 1024,
      height: 500,
      channels: 4,
      background: '#0f172a'
    }
  })
    .composite([
      {
        input: Buffer.from(`
          <svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="featGlow" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stop-color="#4FB5B5" stop-opacity="0.22"/>
                <stop offset="50%" stop-color="#FFD043" stop-opacity="0.12"/>
                <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <rect width="1024" height="500" fill="url(#featGlow)"/>
            <text x="512" y="370" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600" fill="#94a3b8" letter-spacing="1">
              AI Story Shadowing &amp; Smart Micro-Apps
            </text>
          </svg>
        `),
        top: 0,
        left: 0
      },
      {
        input: featureLogo,
        top: 140,
        left: Math.round((1024 - 650) / 2)
      }
    ])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(BRAND_DIR, 'feature-graphic-1024x500.png'), featureGraphic);

  // Promo Banner 1200x630
  fs.writeFileSync(path.join(BRAND_DIR, 'promo-banner-1200x630.png'), ogCard);

  // =========================================================================
  // 5. FAVICON SUITE (16x16, 32x32, 48x48, Multi-size ICO)
  // =========================================================================
  console.log('🌐 5. Tạo Favicon Suite...');

  const fav16 = await sharp(iconSvgBuffer, { density: 300 })
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(BRAND_DIR, 'favicon-16x16.png'), fav16);

  const fav32 = await sharp(iconSvgBuffer, { density: 300 })
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(BRAND_DIR, 'favicon-32x32.png'), fav32);

  const fav48 = await sharp(iconSvgBuffer, { density: 300 })
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(BRAND_DIR, 'favicon-48x48.png'), fav48);

  // Multi-size favicon.ico
  createIco([
    { width: 16, height: 16, buffer: fav16 },
    { width: 32, height: 32, buffer: fav32 },
    { width: 48, height: 48, buffer: fav48 },
  ], path.join(BRAND_DIR, 'favicon.ico'));

  console.log('\n✨ HOÀN THÀNH XUẤT BẢN TOÀN BỘ BRAND ASSETS SUITE!');
  console.log(`📁 Thư mục lưu trữ duy nhất: ${BRAND_DIR}`);
}

generateAll().catch(err => {
  console.error('❌ Lỗi khi khởi tạo Brand Assets:', err);
  process.exit(1);
});
