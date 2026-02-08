import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrafficCone, Search, Edit, Trash2, MapPin, Activity } from 'lucide-react'
import { signalsApi, zonesApi } from '../../lib/api'

interface Signal {
  id: string
  signal_id: string
  zone_id: string
  latitude: number
  longitude: number
  status: string
  current_phase: string
  green_time: number
  yellow_time: number
  red_time: number
  mode: string
}

interface Zone {
  id: string
  name: string
}

export default function SignalManagement() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterZone, setFilterZone] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [signalsRes, zonesRes] = await Promise.all([
        signalsApi.getAll(),
        zonesApi.getAll(),
      ])
      setSignals(signalsRes.data)
      setZones(zonesRes.data)
    } catch (error) {
      console.error('Failed to load data', error)
    } finally {
      setLoading(false)
    }
  }

  const getZoneName = (zoneId: string) => {
    const zone = zones.find((z) => z.id === zoneId)
    return zone ? zone.name : 'Unknown Zone'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'inactive':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'maintenance':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    }
  }

  const filteredSignals = signals.filter((signal) => {
    const matchesSearch =
      signal.signal_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getZoneName(signal.zone_id).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesZone = !filterZone || signal.zone_id === filterZone
    return matchesSearch && matchesZone
  })

  return (
    <div className="space-y-6">
      <div className="premium-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Signal Management</h2>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all traffic signals across the city
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search signals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Zones</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSignals.map((signal) => (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-card p-5 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                      <TrafficCone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{signal.signal_id}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {getZoneName(signal.zone_id)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(signal.status)}`}>
                    {signal.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Activity className="w-4 h-4" />
                      Phase:
                    </span>
                    <span className="font-semibold capitalize">{signal.current_phase || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Green</div>
                      <div className="font-bold text-green-600">{signal.green_time || 30}s</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Yellow</div>
                      <div className="font-bold text-yellow-600">{signal.yellow_time || 5}s</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Red</div>
                      <div className="font-bold text-red-600">{signal.red_time || 30}s</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Mode:</span>
                      <span className="font-semibold capitalize">{signal.mode || 'Auto'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`font-semibold capitalize ${
                        signal.status === 'active' ? 'text-green-600' :
                        signal.status === 'inactive' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {signal.status || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Location:</span>
                      <span className="text-xs">
                        {signal.latitude?.toFixed(4) || 'N/A'}, {signal.longitude?.toFixed(4) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {filteredSignals.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            No signals found
          </div>
        )}
      </div>
    </div>
  )
}
