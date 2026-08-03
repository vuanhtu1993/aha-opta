"use client";

import { useSettings } from "@/lib/hooks/use-settings";
import { SettingsGroup } from "@/components/settings/settings-group";
import { ToggleSetting } from "@/components/settings/toggle-setting";
import { SelectSetting } from "@/components/settings/select-setting";
import { Moon, Globe, Volume2, Timer, RotateCcw, Info, MessageSquare, BookOpen } from "lucide-react";

export default function ProfilePage() {
  const { settings, isLoaded, updateSetting } = useSettings();

  if (!isLoaded) return null;

  return (
    <div className="p-4 space-y-6">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl p-5 text-slate-900 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/30 backdrop-blur-md flex items-center justify-center text-2xl font-black shadow-inner shrink-0">
          👤
        </div>
        <div>
          <h2 className="text-lg font-extrabold">Anh Tú</h2>
          <p className="text-xs font-medium text-slate-800/80">Luyện tập thông minh cùng AI</p>
        </div>
      </div>

      {/* Group: Giao diện */}
      <SettingsGroup title="Giao diện">
        <ToggleSetting
          icon={<Moon className="w-5 h-5 text-indigo-500" />}
          label="Chế độ tối"
          description="Tiết kiệm pin và dịu mắt vào ban đêm"
          checked={settings.darkMode}
          onChange={(val) => updateSetting("darkMode", val)}
        />
        <SelectSetting
          icon={<Globe className="w-5 h-5 text-emerald-500" />}
          label="Ngôn ngữ"
          value={settings.language === "vi" ? "Tiếng Việt" : "English"}
        />
      </SettingsGroup>

      {/* Group: Shadowing */}
      <SettingsGroup title="Shadowing">
        <SelectSetting
          icon={<Volume2 className="w-5 h-5 text-amber-500" />}
          label="Giọng đọc mặc định"
          value={settings.defaultVoice}
        />
        <SelectSetting
          icon={<Timer className="w-5 h-5 text-rose-500" />}
          label="Thời gian lặp lại"
          value={`${settings.repeatTimeoutSeconds} giây`}
        />
        <ToggleSetting
          icon={<RotateCcw className="w-5 h-5 text-blue-500" />}
          label="Tự động chuyển câu"
          description="Tự động nhảy sang câu tiếp theo sau khi hết giờ"
          checked={settings.autoAdvance}
          onChange={(val) => updateSetting("autoAdvance", val)}
        />
      </SettingsGroup>

      {/* Group: Thông tin */}
      <SettingsGroup title="Thông tin">
        <SelectSetting
          icon={<Info className="w-5 h-5 text-slate-500" />}
          label="Phiên bản"
          value="v1.0.0 (PWA)"
        />
        <SelectSetting
          icon={<BookOpen className="w-5 h-5 text-slate-500" />}
          label="Hướng dẫn sử dụng"
          value="Xem chi tiết"
        />
        <SelectSetting
          icon={<MessageSquare className="w-5 h-5 text-slate-500" />}
          label="Góp ý & Phản hồi"
          value="Gửi tin nhắn"
        />
      </SettingsGroup>

      {/* Footer copyright */}
      <div className="pt-4 pb-2 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
        Made by Anh Tu - Share to be share
      </div>
    </div>
  );
}
