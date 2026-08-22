import type { NextConfig } from "next";
import { execSync } from "child_process";
import { readFileSync } from "fs";

/**
 * Lấy git short hash an toàn — fallback "unknown" nếu không có git
 * (VD: trong Docker container không clone .git)
 */
function getGitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

const gitHash = getGitHash();
const pkgVersion = JSON.parse(
  readFileSync("./package.json", "utf-8")
).version;

const nextConfig: NextConfig = {
  // Build ID duy nhất dựa trên git commit hash
  generateBuildId: () => gitHash,

  // Inject build metadata vào bundle tại build-time (zero runtime cost)
  env: {
    NEXT_PUBLIC_APP_VERSION: pkgVersion,
    NEXT_PUBLIC_BUILD_HASH: gitHash,
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString(),
  },
};

export default nextConfig;
