import { create } from 'zustand';

export interface AgentStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}

export interface AgentProgressState {
  isRunning: boolean;
  message: string;
  progress?: number;
  
  // New structured fields
  title?: string;
  steps: AgentStep[];
  activeStepId?: string;
}

interface AgentStore extends AgentProgressState {
  setAgentProgress: (state: Partial<AgentProgressState>) => void;
  startAgent: (message: string) => void;
  stopAgent: () => void;
  
  initProgress: (title: string, steps: Omit<AgentStep, 'status'>[]) => void;
  updateProgress: (stepId: string, status: AgentStep['status'], message?: string) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  isRunning: false,
  message: '',
  progress: undefined,
  title: undefined,
  steps: [],
  activeStepId: undefined,

  setAgentProgress: (state) => set((prev) => ({ ...prev, ...state })),

  startAgent: (message) => set({ isRunning: true, message, progress: undefined }),

  stopAgent: () => set({ 
    isRunning: false, 
    message: '', 
    progress: undefined,
    title: undefined,
    steps: [],
    activeStepId: undefined
  }),

  initProgress: (title, steps) => set({
    isRunning: true,
    title,
    steps: steps.map(s => ({ ...s, status: 'pending' })),
    activeStepId: undefined,
    message: 'Khởi tạo tiến trình...'
  }),

  updateProgress: (stepId, status, message) => set((prev) => {
    const newSteps = prev.steps.map(step => 
      step.id === stepId ? { ...step, status } : step
    );
    return {
      ...prev,
      steps: newSteps,
      activeStepId: stepId,
      ...(message ? { message } : {})
    };
  }),
}));
