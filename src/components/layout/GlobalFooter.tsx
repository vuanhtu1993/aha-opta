"use client";

import { useAgentStore } from "@/lib/store/useAgentStore";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalFooter() {
  const { isRunning, message, progress } = useAgentStore();

  return (
    <footer className="mt-auto border-t bg-white overflow-hidden h-[68px] flex items-center justify-center">
      <AnimatePresence mode="wait">
        {isRunning ? (
          <motion.div
            key="running"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex items-center justify-center gap-3 w-full h-full bg-slate-50 text-sm"
          >
            <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
            <span className="font-medium text-slate-800">{message}</span>
            {progress !== undefined && (
              <span className="text-xs text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full font-semibold">
                {progress}%
              </span>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex items-center justify-center w-full h-full text-sm text-slate-500"
          >
            <p>Made by Anh Tu - Share to be share</p>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
