import { createContext, useContext, useState, ReactNode } from "react";

export type LearningMode = "fast" | "visual" | "deep";

export interface LearningModeConfig {
  id: LearningMode;
  label: string;
  emoji: string;
  description: string;
}

export const LEARNING_MODES: LearningModeConfig[] = [
  {
    id: "fast",
    label: "Hızlı ve Odaklı",
    emoji: "⚡",
    description: "Madde işaretleri, kısa ve vurucu bilgiler, bionic reading",
  },
  {
    id: "visual",
    label: "Görsel Hafıza",
    emoji: "🧠",
    description: "Emoji çapaları, geniş boşluklar, görsel analojiler",
  },
  {
    id: "deep",
    label: "Derinlemesine Analiz",
    emoji: "🔬",
    description: "Akademik ton, detaylı açıklamalar, sınav soruları",
  },
];

interface LearningModeContextType {
  mode: LearningMode;
  setMode: (mode: LearningMode) => void;
  getModeConfig: () => LearningModeConfig;
}

const LearningModeContext = createContext<LearningModeContextType | undefined>(undefined);

export const LearningModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<LearningMode>("fast");

  const getModeConfig = () => LEARNING_MODES.find((m) => m.id === mode)!;

  return (
    <LearningModeContext.Provider value={{ mode, setMode, getModeConfig }}>
      {children}
    </LearningModeContext.Provider>
  );
};

export const useLearningMode = () => {
  const ctx = useContext(LearningModeContext);
  if (!ctx) throw new Error("useLearningMode must be used within LearningModeProvider");
  return ctx;
};
