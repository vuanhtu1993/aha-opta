"use client";

import { useAgentStore } from "@/lib/store/useAgentStore";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalFooter() {
  return (
    <footer className="mt-auto border-t bg-white overflow-hidden h-[68px] flex items-center justify-center">
      <div className="flex items-center justify-center w-full h-full text-sm text-slate-500">
        <p>Made by Anh Tu - Share to be share</p>
      </div>
    </footer>
  );
}
