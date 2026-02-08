import { useState, useEffect } from 'react'
import { signalsApi } from '../../lib/api'
import { Play, Pause, Settings } from 'lucide-react'

interface SignalControlPanelProps {
  signalId: string
}

export default function SignalControlPanel({ signalId }: SignalControlPanelProps) {
  const [signal, setSignal] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSignal()
  }, [signalId])

  const loadSignal = async () => {
    try {
      const response = await signalsApi.getById(signalId)
      setSignal(response.data)
    } catch (error) {
      console.error('Failed to load signal', error)
    }
  }

  const updateMode = async (mode: string) => {
    setLoading(true)
    try {
      await signalsApi.update(signalId, { mode })
      await loadSignal()
    } catch (error) {
      console.error('Failed to update mode', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTiming = async (timing: { green_time?: number; yellow_time?: number; red_time?: number }) => {
    setLoading(true)
    try {
      await signalsApi.updateTiming(signalId, timing)
      await loadSignal()
    } catch (error) {
      console.error('Failed to update timing', error)
    } finally {
      setLoading(false)
    }
  }

  if (!signal) return <div className="premium-card p-6">Loading...</div>

  return (
    <div className="premium-card p-6">
      <h3 className="text-xl font-semibold mb-4">Signal Control</h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Signal ID</p>
          <p className="font-semibold">{signal.signal_id}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Current Phase</p>
          <p className="font-semibold">{signal.current_phase}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Control Mode</p>
          <div className="flex gap-2">
            <button
              onClick={() => updateMode('auto')}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-lg transition ${
                signal.mode === 'auto'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Play className="w-4 h-4 inline mr-2" />
              Auto
            </button>
            <button
              onClick={() => updateMode('manual')}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-lg transition ${
                signal.mode === 'manual'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Manual
            </button>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Timing (seconds)</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500">Green</label>
              <input
                type="number"
                value={signal.green_time}
                onChange={(e) => updateTiming({ green_time: parseInt(e.target.value) })}
                className="w-full px-2 py-1 bg-white dark:bg-gray-800 border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Yellow</label>
              <input
                type="number"
                value={signal.yellow_time}
                onChange={(e) => updateTiming({ yellow_time: parseInt(e.target.value) })}
                className="w-full px-2 py-1 bg-white dark:bg-gray-800 border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Red</label>
              <input
                type="number"
                value={signal.red_time}
                onChange={(e) => updateTiming({ red_time: parseInt(e.target.value) })}
                className="w-full px-2 py-1 bg-white dark:bg-gray-800 border rounded text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


