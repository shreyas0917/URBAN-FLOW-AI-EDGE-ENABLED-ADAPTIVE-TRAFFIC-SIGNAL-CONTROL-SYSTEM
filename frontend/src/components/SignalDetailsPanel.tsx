import { useState, useEffect } from 'react'
import { signalsApi } from '../lib/api'
import { Activity, Clock, Settings, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface SignalDetailsPanelProps {
  signalId: string
}

export default function SignalDetailsPanel({ signalId }: SignalDetailsPanelProps) {
  const [signal, setSignal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadSignal()
    // Refresh every 5 seconds
    const interval = setInterval(loadSignal, 5000)
    return () => clearInterval(interval)
  }, [signalId])

  const loadSignal = async () => {
    try {
      const response = await signalsApi.getById(signalId)
      setSignal(response.data)
    } catch (error) {
      console.error('Failed to load signal', error)
    } finally {
      setLoading(false)
    }
  }

  const updateMode = async (mode: string) => {
    setUpdating(true)
    try {
      await signalsApi.update(signalId, { mode })
      await loadSignal()
    } catch (error) {
      console.error('Failed to update mode', error)
    } finally {
      setUpdating(false)
    }
  }

  const updateTiming = async (timing: { green_time?: number; yellow_time?: number; red_time?: number }) => {
    setUpdating(true)
    try {
      await signalsApi.updateTiming(signalId, timing)
      await loadSignal()
    } catch (error) {
      console.error('Failed to update timing', error)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!signal) {
    return (
      <div className="text-center py-8 text-gray-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>Signal not found</p>
      </div>
    )
  }

  const getPhaseColor = (phase: string) => {
    switch (phase?.toLowerCase()) {
      case 'north': return 'text-blue-400'
      case 'south': return 'text-green-400'
      case 'east': return 'text-yellow-400'
      case 'west': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'text-green-400'
      case 'inactive': return 'text-red-400'
      case 'maintenance': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Signal Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Signal ID</span>
          <span className="text-sm font-bold text-white">{signal.signal_id || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Status</span>
          <span className={`text-sm font-semibold flex items-center gap-1 ${getStatusColor(signal.status)}`}>
            {signal.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {signal.status || 'Unknown'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Current Phase</span>
          <span className={`text-sm font-semibold ${getPhaseColor(signal.current_phase)}`}>
            {signal.current_phase || 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Control Mode</span>
          <span className="text-sm font-semibold text-white">{signal.mode || 'Auto'}</span>
        </div>
      </div>

      {/* Control Mode */}
      <div className="pt-2 border-t border-gray-700">
        <p className="text-xs text-gray-400 mb-2">Control Mode</p>
        <div className="flex gap-2">
          <button
            onClick={() => updateMode('auto')}
            disabled={updating}
            className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition ${
              signal.mode === 'auto'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Activity className="w-3 h-3 inline mr-1" />
            Auto
          </button>
          <button
            onClick={() => updateMode('manual')}
            disabled={updating}
            className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition ${
              signal.mode === 'manual'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Settings className="w-3 h-3 inline mr-1" />
            Manual
          </button>
        </div>
      </div>

      {/* Timing Controls */}
      <div className="pt-2 border-t border-gray-700">
        <p className="text-xs text-gray-400 mb-2">Timing (seconds)</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Green</label>
            <input
              type="number"
              value={signal.green_time || 30}
              onChange={(e) => updateTiming({ green_time: parseInt(e.target.value) || 30 })}
              disabled={updating}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-primary-500"
              min="10"
              max="120"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Yellow</label>
            <input
              type="number"
              value={signal.yellow_time || 5}
              onChange={(e) => updateTiming({ yellow_time: parseInt(e.target.value) || 5 })}
              disabled={updating}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-primary-500"
              min="3"
              max="10"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Red</label>
            <input
              type="number"
              value={signal.red_time || 30}
              onChange={(e) => updateTiming({ red_time: parseInt(e.target.value) || 30 })}
              disabled={updating}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-primary-500"
              min="10"
              max="120"
            />
          </div>
        </div>
      </div>

      {/* Coordinates */}
      {signal.latitude && signal.longitude && (
        <div className="pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Location</span>
            <span className="text-xs text-gray-300">
              {signal.latitude.toFixed(4)}, {signal.longitude.toFixed(4)}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}



