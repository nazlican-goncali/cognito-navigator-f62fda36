import { createContext, useContext, useState, ReactNode } from "react";

export type AgeGroup = "child" | "teen" | "university";

export interface UserProfile {
  name: string;
  age: number;
  ageGroup: AgeGroup;
}

export function getAgeGroup(age: number): AgeGroup {
  if (age <= 12) return "child";
  if (age <= 18) return "teen";
  return "university";
}

export const AGE_GROUP_CONFIG: Record<AgeGroup, {
  label: string;
  emoji: string;
  description: string;
  promptStyle: string;
  analogyType: string;
}> = {
  child: {
    label: "Çocuk (7–12)",
    emoji: "🧒",
    description: "Basit kelimeler, eğlenceli örnekler ve kısa cümleler",
    promptStyle: "Masalsı dil, oyun analojileri, çok kısa cümleler",
    analogyType: "oyun ve masal analojileri",
  },
  teen: {
    label: "Genç (13–18)",
    emoji: "🎓",
    description: "Sınav odaklı, günlük hayattan örnekler, orta uzunlukta cümleler",
    promptStyle: "Sınav odaklı, günlük hayat örnekleri, orta uzunlukta cümleler",
    analogyType: "günlük hayat ve sınav odaklı analojiler",
  },
  university: {
    label: "Üniversite (19–26)",
    emoji: "🎯",
    description: "Akademik ama akıcı, sektörel ve mantıksal benzetmeler",
    promptStyle: "Akademik ama akıcı dil, sektörel/mantıksal analojiler",
    analogyType: "sektörel ve mantıksal analojiler",
  },
};

interface UserContextType {
  user: UserProfile | null;
  setUser: (profile: UserProfile) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);

  const setUser = (profile: UserProfile) => setUserState(profile);
  const clearUser = () => setUserState(null);

  return (
    <UserContext.Provider value={{ user, setUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};
