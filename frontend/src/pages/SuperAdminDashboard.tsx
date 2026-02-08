import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, MapPin, Users, TrafficCone, TrendingUp, Activity, Zap, RefreshCw, Car, Gauge, Truck } from 'lucide-react'
import Layout from '../components/Layout'
import TrafficControlCenter from '../components/TrafficControlCenter'
import ZoneManagement from '../components/admin/ZoneManagement'
import OperatorManagement from '../components/admin/OperatorManagement'
import SignalManagement from '../components/admin/SignalManagement'
import EmergencyVehicleManagement from '../components/admin/EmergencyVehicleManagement'
import { zonesApi, operatorsApi, signalsApi, trafficApi, emergencyApi } from '../lib/api'
import { wsService } from '../lib/websocket'

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    zones: 0,
    operators: 0,
    signals: 0,
    activeSignals: 0,
    totalVehicles: 0,
    avgCongestion: 0,
    avgSpeed: 0,
    emergencyRoutes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [realtimeUpdates, setRealtimeUpdates] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadStats()
    
    // Set up real-time updates
    if (realtimeUpdates) {
      const handleMessage = (message: any) => {
        if (message.type === 'traffic_update' || message.type === 'signal_update') {
          loadStats()
          setLastUpdate(new Date())
        }
      }
      
      wsService.on('message', handleMessage)
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadStats()
        setLastUpdate(new Date())
      }, 30000)
      
      return () => {
        wsService.off('message', handleMessage)
        clearInterval(interval)
      }
    }
  }, [realtimeUpdates])

  const loadStats = async () => {
    try {
      setLoading(true)
      const [zonesRes, operatorsRes, signalsRes, trafficStatsRes, emergencyRes] = await Promise.all([
        zonesApi.getAll(),
        operatorsApi.getAll(),
        signalsApi.getAll(),
        trafficApi.getStats(),
        emergencyApi.getActiveRoutes().catch(() => ({ data: [] })),
      ])
      const signals = signalsRes.data || []
      const trafficStats = trafficStatsRes.data || {}
      const emergencyRoutes = emergencyRes.data || []
      
      setStats({
        zones: zonesRes.data.length,
        operators: operatorsRes.data.length,
        signals: signals.length,
        activeSignals: trafficStats.active_signals || signals.filter((s: any) => s.status === 'active').length,
        totalVehicles: trafficStats.total_vehicles || 0,
        avgCongestion: trafficStats.congestion_level === 'high' ? 75 : trafficStats.congestion_level === 'low' ? 25 : 50,
        avgSpeed: trafficStats.avg_speed || 0,
        emergencyRoutes: emergencyRoutes.length,
      })
    } catch (error) {
      console.error('Failed to load stats', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'zones', label: 'Zones', icon: MapPin },
    { id: 'operators', label: 'Operators', icon: Users },
    { id: 'signals', label: 'Signals', icon: TrafficCone },
    { id: 'emergency', label: 'Emergency Vehicles', icon: Truck },
  ]

  return (
    <Layout>
      <div className="space-y-6 pb-6">
        <div className="premium-card p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                Super Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage the entire Urban Flow system - Real-time monitoring
              </p>
              {lastUpdate && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRealtimeUpdates(!realtimeUpdates)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  realtimeUpdates
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Zap className="w-4 h-4" />
                {realtimeUpdates ? 'Live' : 'Paused'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadStats}
                className="premium-button flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </motion.button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto flex-shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 font-semibold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg shadow-primary-500/50'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </motion.button>
            )
          })}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6 min-h-0">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-card p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Zones</p>
                    <p className="text-3xl font-bold mt-2">{loading ? '...' : stats.zones}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="premium-card p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Operators</p>
                    <p className="text-3xl font-bold mt-2">{loading ? '...' : stats.operators}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="premium-card p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Signals</p>
                    <p className="text-3xl font-bold mt-2">{loading ? '...' : stats.signals}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {stats.activeSignals} active
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                    <TrafficCone className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="premium-card p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Vehicles</p>
                    <p className="text-3xl font-bold mt-2">{loading ? '...' : stats.totalVehicles.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="premium-card p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Congestion</p>
                    <p className="text-3xl font-bold mt-2">{loading ? '...' : `${stats.avgCongestion}%`}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stats.avgCongestion > 70 ? 'High' : stats.avgCongestion > 40 ? 'Medium' : 'Low'}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
                    <Gauge className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="premium-card p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Speed</p>
                    <p className="text-3xl font-bold mt-2">{loading ? '...' : `${stats.avgSpeed} km/h`}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="premium-card p-6 border-2 border-red-200 dark:border-red-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Emergency Routes</p>
                    <p className="text-3xl font-bold mt-2 text-red-600 dark:text-red-400">{loading ? '...' : stats.emergencyRoutes || 0}</p>
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      Active routes
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Traffic Control Dashboard - Train Dashboard Style */}
            <div className="min-h-0 flex-1 overflow-hidden">
              <TrafficControlCenter />
            </div>
          </div>
        )}
        {activeTab === 'zones' && (
          <div className="min-h-0">
            <ZoneManagement />
          </div>
        )}
        {activeTab === 'operators' && (
          <div className="min-h-0">
            <OperatorManagement />
          </div>
        )}
        {activeTab === 'signals' && (
          <div className="min-h-0">
            <SignalManagement />
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="min-h-0">
            <EmergencyVehicleManagement />
          </div>
        )}
      </div>
    </Layout>
  )
}


