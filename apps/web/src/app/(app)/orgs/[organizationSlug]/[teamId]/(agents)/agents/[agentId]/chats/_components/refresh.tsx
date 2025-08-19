import * as React from 'react'
import { create } from 'zustand'

interface RefreshStore {
  loadingAnimation: boolean
  refresh: () => void
}

export const useRefresh = create<RefreshStore>((set, get) => ({
  loadingAnimation: false,
  refresh: () => {
    if (!get().loadingAnimation) {
      set(() => ({ loadingAnimation: true }))
      setTimeout(() => set(() => ({ loadingAnimation: false })), 3000)
    }
  },
}))

export const Refresh = ({ children }: { children: React.ReactNode }) => {
  const { loadingAnimation } = useRefresh()
  const [refresh, setRefresh] = React.useState(true)

  React.useEffect(() => {
    if (loadingAnimation) {
      setRefresh(false)
      setTimeout(() => setRefresh(true), 150)
    }
  }, [loadingAnimation])

  if (refresh) {
    return children
  }
}
