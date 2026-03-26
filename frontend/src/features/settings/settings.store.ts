import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
  // Appearance
  darkMode: boolean;
  language: string;

  // Notifications
  pushNotifications: boolean;
  emailSummaries: boolean;

  // Match Defaults
  defaultOvers: number;
  defaultSquadSize: number;
  soundEffects: boolean;

  // Privacy
  publicProfile: boolean;

  setSetting: <K extends keyof Omit<SettingsState, 'setSetting'>>(key: K, value: SettingsState[K]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: true,
      language: 'English (US)',
      
      pushNotifications: true,
      emailSummaries: false,
      
      defaultOvers: 5,
      defaultSquadSize: 11,
      soundEffects: true,
      
      publicProfile: true,

      setSetting: (key, value) => set((state) => ({ ...state, [key]: value })),
    }),
    {
      name: 'pitchpulse-settings',
    }
  )
);
