import { create } from 'zustand';

export interface AgentProgressState {
  isRunning: boolean;
  message: string;
  progress?: number;
}

interface AgentStore extends AgentProgressState {
  setAgentProgress: (state: Partial<AgentProgressState>) => void;
  startAgent: (message: string) => void;
  stopAgent: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  isRunning: false,
  message: '',
  progress: undefined,

  setAgentProgress: (state) => set((prev) => ({ ...prev, ...state })),

  startAgent: (message) => set({ isRunning: true, message, progress: undefined }),

  stopAgent: () => set({ isRunning: false, message: '', progress: undefined }),
}));
