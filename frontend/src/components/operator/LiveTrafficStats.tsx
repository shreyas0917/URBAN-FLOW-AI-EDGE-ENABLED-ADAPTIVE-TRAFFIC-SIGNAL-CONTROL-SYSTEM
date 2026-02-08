import { useState, useEffect } from 'react'
import { wsService } from '../../lib/websocket'
import { trafficApi, emergencyApi, realtimeApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { Activity, AlertCircle, Clock, Cloud } from 'lucide-react'

export default function LiveTrafficStats() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    activeSignals: 0,
    totalSignals: 0,
    congestionLevel: 'Low',
    emergencyActive: false,
    avgSpeed: 0,
    weather: 'clear',
    isRushHour: false,
    lastUpdate: new Date(),
  })

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 10000) // Update every 10 seconds

    const updateStats = (data: any) => {
      loadStats() // Reload on WebSocket update
    }

    wsService.on('traffic_update', updateStats)
    
    return () => {
      clearInterval(interval)
      wsService.off('traffic_update', updateStats)
    }
  }, [user?.zone_id])

  const loadStats = async () => {
    try {
      const [trafficRes, emergencyRes, patternRes, weatherRes] = await Promise.all([
        trafficApi.getStats(user?.zone_id),
        emergencyApi.getActiveRoutes().catch(() => ({ data: [] })),
        realtimeApi.getTrafficPattern().catch(() => ({ data: {} })),
        realtimeApi.getWeather().catch(() => ({ data: {} })),
      ])
      
      const trafficData = trafficRes.data
      const pattern = patternRes.data?.pattern || {}
      const weather = weatherRes.data?.weather || {}
      
      setStats({
        activeSignals: trafficData.active_signals || 0,
        totalSignals: trafficData.total_signals || 0,
        congestionLevel: trafficData.congestion_level || 'Low',
        emergencyActive: (emergencyRes.data?.length || 0) > 0,
        avgSpeed: trafficData.avg_speed || 0,
        weather: weather.condition || 'clear',
        isRushHour: pattern.is_rush_hour || false,
        lastUpdate: new Date(),
      })
    } catch (error) {
      console.error('Failed to load stats', error)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
      <div className="premium-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Signals</p>
            <p className="text-2xl font-bold">{stats.activeSignals}/{stats.totalSignals}</p>
          </div>
          <Activity className="w-8 h-8 text-primary-500" />
        </div>
      </div>
      <div className="premium-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Congestion</p>
            <p className="text-2xl font-bold capitalize">{stats.congestionLevel}</p>
          </div>
          <AlertCircle className={`w-8 h-8 ${
            stats.congestionLevel === 'high' ? 'text-red-500' :
            stats.congestionLevel === 'medium' ? 'text-yellow-500' :
            'text-green-500'
          }`} />
        </div>
      </div>
      <div className="premium-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Speed</p>
            <p className="text-2xl font-bold">{stats.avgSpeed} km/h</p>
          </div>
          <Activity className="w-8 h-8 text-blue-500" />
        </div>
      </div>
      <div className="premium-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Emergency</p>
            <p className="text-2xl font-bold">{stats.emergencyActive ? 'Active' : 'None'}</p>
          </div>
          <AlertCircle className={`w-8 h-8 ${stats.emergencyActive ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
        </div>
      </div>
      <div className="premium-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Weather</p>
            <p className="text-sm font-semibold capitalize">{stats.weather}</p>
            {stats.isRushHour && (
              <p className="text-xs text-orange-500 mt-1">Rush Hour</p>
            )}
          </div>
          <Cloud className={`w-8 h-8 ${
            stats.weather === 'rainy' ? 'text-blue-500' :
            stats.weather === 'foggy' ? 'text-gray-500' :
            'text-yellow-500'
          }`} />
        </div>
      </div>
      <div className="premium-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Last Update</p>
            <p className="text-sm font-semibold">{stats.lastUpdate.toLocaleTimeString()}</p>
          </div>
          <Clock className="w-8 h-8 text-green-500" />
        </div>
      </div>
    </div>
  )
}


