import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppearanceStore {
  topbar: boolean
  leftSidebar: boolean
  rightSidebar: boolean
  setTopbar: (topbar: boolean) => void
  setLeftSidebar: (leftSidebar: boolean) => void
  setRightSidebar: (rightSidebar: boolean) => void
}

export const useAppearance = create<AppearanceStore>()(
  persist(
    (set) => ({
      topbar: true,
      leftSidebar: true,
      rightSidebar: true,
      setTopbar: (topbar) => set(() => ({ topbar })),
      setLeftSidebar: (leftSidebar) => set(() => ({ leftSidebar })),
      setRightSidebar: (rightSidebar) => set(() => ({ rightSidebar })),
    }),
    {
      name: 'appearance-storage',
    },
  ),
)
