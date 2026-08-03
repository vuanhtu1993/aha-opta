"use client";

import { useState, useEffect } from "react";

export interface AppSettings {
  darkMode: boolean;
  language: "vi" | "en";
  defaultVoice: string;
  repeatTimeoutSeconds: number;
  autoAdvance: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  language: "vi",
  defaultVoice: "en-US-Standard-C",
  repeatTimeoutSeconds: 5,
  autoAdvance: true,
};

const STORAGE_KEY = "aha_app_settings_v1";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        if (parsed.darkMode) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch (e) {
      console.error("Failed to read settings from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save settings", e);
      }

      // Xử lý toggle class dark mode trên document element
      if (key === "darkMode") {
        if (value) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }

      return next;
    });
  };

  return {
    settings,
    isLoaded,
    updateSetting,
  };
}
