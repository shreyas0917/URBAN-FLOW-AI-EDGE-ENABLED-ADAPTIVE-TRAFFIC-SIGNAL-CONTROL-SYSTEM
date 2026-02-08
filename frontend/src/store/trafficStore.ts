import { create } from 'zustand'

interface TrafficState {
  signals: any[]
  selectedSignal: string | null
  setSignals: (signals: any[]) => void
  setSelectedSignal: (id: string | null) => void
}

export const useTrafficStore = create<TrafficState>((set) => ({
  signals: [],
  selectedSignal: null,
  setSignals: (signals) => set({ signals }),
  setSelectedSignal: (id) => set({ selectedSignal: id }),
}))


