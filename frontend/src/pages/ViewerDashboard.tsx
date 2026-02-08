import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  MapPin,
  Clock,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Filter,
  Zap,
  Car,
  TrafficCone,
  Bell,
  Eye,
  Layers,
  Gauge,
  FileText,
  FileSpreadsheet,
  ThermometerSun,
  CheckCircle,
} from 'lucide-react'
import Layout from '../components/Layout'
import { signalsApi, zonesApi, trafficApi } from '../lib/api'
import { wsService } from '../lib/websocket'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface DashboardStats {
  totalSignals: number
  activeSignals: number
  totalZones: number
  totalVehicles: number
  avgCongestion: number
  emergencyRoutes: number
  systemUptime: string
}

interface TrafficData {
  time: string
  vehicles: number
  congestion: number
  incidents: number
  isPrediction?: boolean
  confidence?: number
}

interface ZoneStats {
  zoneId: string
  zoneName: string
  signalCount: number
  avgCongestion: number
  vehicleCount: number
}

interface Prediction {
  timestamp: string
  predicted_vehicles: number
  predicted_congestion: number
  confidence: number
  hour_of_day: number
}

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

export default function ViewerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSignals: 0,
    activeSignals: 0,
    totalZones: 0,
    totalVehicles: 0,
    avgCongestion: 0,
    emergencyRoutes: 0,
    systemUptime: '99.9%',
  })
  const [trafficData, setTrafficData] = useState<TrafficData[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [zoneStats, setZoneStats] = useState<ZoneStats[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h')
  const [selectedZone, setSelectedZone] = useState<string>('all')
  const [selectedPincode, setSelectedPincode] = useState<string>('')
  const [selectedArea, setSelectedArea] = useState<string>('')
  const [realtimeUpdates, setRealtimeUpdates] = useState(true)
  
  // Mumbai areas with their pincodes
  const mumbaiAreas = [
    { name: 'South Mumbai', pincodes: ['400001', '400002', '400003', '400004', '400005', '400006', '400007', '400008', '400009', '400010'], area: 'Colaba, Fort, Marine Drive, Nariman Point' },
    { name: 'Central Mumbai', pincodes: ['400011', '400012', '400013', '400014', '400015', '400016', '400017', '400018', '400019', '400020'], area: 'Dadar, Parel, Worli, Lower Parel' },
    { name: 'Western Suburbs', pincodes: ['400050', '400051', '400052', '400053', '400054', '400055', '400056', '400057', '400058', '400059'], area: 'Andheri, Bandra, Juhu, Santacruz' },
    { name: 'North Mumbai', pincodes: ['400060', '400061', '400062', '400063', '400064', '400065', '400066', '400067', '400068', '400069'], area: 'Borivali, Kandivali, Malad, Goregaon' },
  ]
  
  // Validate if pincode is a Mumbai pincode
  const isValidMumbaiPincode = (pincode: string): boolean => {
    if (!pincode || pincode.length !== 6) return false
    // Mumbai pincodes start with 400
    return pincode.startsWith('400') && /^\d{6}$/.test(pincode)
  }
  const [alerts, setAlerts] = useState<any[]>([])
  const [predictionHours, setPredictionHours] = useState<number>(6)
  const [comparativeData, setComparativeData] = useState<any>(null)
  const [peakHours, setPeakHours] = useState<any[]>([])
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json')
  const [trafficInsights, setTrafficInsights] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh interval for real-time updates
    let interval: ReturnType<typeof setInterval> | null = null
    let congestionUpdateInterval: ReturnType<typeof setInterval> | null = null
    
    if (realtimeUpdates) {
      // Refresh full data every 30 seconds
      interval = setInterval(() => {
        loadDashboardData()
      }, 30000)
      
      // Update congestion more frequently (every 10 seconds) for real-time feel
      congestionUpdateInterval = setInterval(async () => {
        try {
          const zoneId = selectedZone === 'all' ? undefined : selectedZone
          const trafficStatsRes = await trafficApi.getStats(zoneId)
          const trafficStats = trafficStatsRes.data || {}
          
          // Update congestion in real-time
          if (trafficStats.current_congestion !== undefined) {
            setStats(prev => ({
              ...prev,
              avgCongestion: Math.round(trafficStats.current_congestion),
            }))
            
            // Update the last point in trafficData with current congestion
            setTrafficData(prev => {
              const updated = [...prev]
              if (updated.length > 0 && !updated[updated.length - 1].isPrediction) {
                const now = new Date()
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                  congestion: Math.round(trafficStats.current_congestion),
                  vehicles: trafficStats.total_vehicles || updated[updated.length - 1].vehicles,
                }
              }
              return updated
            })
          }
        } catch (error) {
          console.error('Failed to update congestion', error)
        }
      }, 10000) // Update every 10 seconds
      
      const handleMessage = (message: any) => {
        if (message.type === 'traffic_update' || message.type === 'signal_update') {
          loadDashboardData()
        }
        if (message.type === 'emergency_alert') {
          setAlerts((prev) => [message.data, ...prev.slice(0, 9)])
        }
      }
      
      wsService.on('message', handleMessage)
      return () => {
        wsService.off('message', handleMessage)
        if (interval) clearInterval(interval)
        if (congestionUpdateInterval) clearInterval(congestionUpdateInterval)
      }
    }
    
    return () => {
      if (interval) clearInterval(interval)
      if (congestionUpdateInterval) clearInterval(congestionUpdateInterval)
    }
  }, [timeRange, selectedZone, selectedPincode, selectedArea, realtimeUpdates, predictionHours])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const zoneId = selectedZone === 'all' ? undefined : selectedZone
      
      // Calculate time range for history
      const now = new Date()
      const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : timeRange === '24h' ? 24 : 168
      const startTime = new Date(now.getTime() - hours * (timeRange === '7d' ? 86400000 : 3600000))
      
      const [signalsRes, zonesRes, trafficStatsRes, trafficHistoryRes, predictionsRes, zonesTrafficRes] = await Promise.all([
        signalsApi.getAll(zoneId),
        zonesApi.getAll(),
        trafficApi.getStats(zoneId),
        trafficApi.getHistory(
          startTime.toISOString(),
          now.toISOString(),
          zoneId
        ),
        trafficApi.getPredictions(predictionHours, zoneId),
        trafficApi.getZones(),
      ])

      const signals = signalsRes.data || []
      const zones = zonesRes.data || []
      const trafficStats = trafficStatsRes.data || {}
      const history = trafficHistoryRes.data?.history || []
      const predictionsData = predictionsRes.data?.predictions || []
      const zonesTraffic = zonesTrafficRes.data?.zones || []

      // Get real-time congestion from API (most recent data)
      const currentCongestion = trafficStats.current_congestion !== undefined
        ? Math.round(trafficStats.current_congestion)
        : (() => {
            // Fallback: calculate from most recent history entries (last 5 minutes equivalent)
            const now = new Date()
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
            const veryRecentHistory = history.filter((h: any) => {
              const logTime = new Date(h.timestamp)
              return logTime >= fiveMinutesAgo
            })
            
            if (veryRecentHistory.length > 0) {
              const recentDensities = veryRecentHistory.map((h: any) => (h.density || 0) * 100)
              return Math.round(recentDensities.reduce((a: number, b: number) => a + b, 0) / recentDensities.length)
            }
            
            // Use last few entries as fallback
            const recentDensities = history.slice(-5).map((h: any) => (h.density || 0) * 100)
            if (recentDensities.length > 0) {
              return Math.round(recentDensities.reduce((a: number, b: number) => a + b, 0) / recentDensities.length)
            }
            
            // Final fallback
            return trafficStats.congestion_level === 'high' ? 75 : trafficStats.congestion_level === 'low' ? 25 : 50
          })()
      
      // Set accurate stats from API with real-time congestion
      setStats({
        totalSignals: trafficStats.total_signals || signals.length,
        activeSignals: trafficStats.active_signals || signals.filter((s: any) => s.status === 'active').length,
        totalZones: zones.length,
        totalVehicles: trafficStats.total_vehicles || 0,
        avgCongestion: currentCongestion, // Real-time congestion from most recent data
        emergencyRoutes: alerts.length,
        systemUptime: '99.9%',
      })

      // Convert history to chart data - include current time point for real-time display
      const currentTime = new Date()
      const historicalData: TrafficData[] = history.map((item: any) => {
        const date = new Date(item.timestamp)
        return {
          time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          vehicles: item.vehicle_count || 0,
          congestion: (item.density || 0) * 100,
          incidents: 0,
          isPrediction: false,
        }
      })
      
      // Add current time point with real-time congestion for live display
      const currentTimeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      const lastPoint = historicalData[historicalData.length - 1]
      
      // Add or update current time point
      if (lastPoint && lastPoint.time === currentTimeStr) {
        // Update existing point with current congestion
        lastPoint.congestion = currentCongestion
        lastPoint.vehicles = trafficStats.total_vehicles || lastPoint.vehicles
      } else {
        // Add new current time point
        historicalData.push({
          time: currentTimeStr,
          vehicles: trafficStats.total_vehicles || 0,
          congestion: currentCongestion,
          incidents: 0,
          isPrediction: false,
        })
      }

      // Add predictions to data - based on selected filters
      const predictionData: TrafficData[] = predictionsData.map((pred: any) => {
        const date = new Date(pred.timestamp)
        // Convert density (0-1) to percentage (0-100) if needed
        const congestionValue = pred.density !== undefined 
          ? (pred.density * 100) 
          : (pred.predicted_congestion || 0)
        
        return {
          time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          vehicles: pred.vehicle_count || pred.predicted_vehicles || 0,
          congestion: congestionValue,
          incidents: 0,
          isPrediction: true,
          confidence: pred.confidence || 0.8,
        }
      })

      // Combine historical and prediction data with proper sorting
      const combinedData = [...historicalData, ...predictionData].sort((a, b) => {
        // Sort by time for proper chart display
        const timeA = a.time.split(':').map(Number)
        const timeB = b.time.split(':').map(Number)
        const minutesA = timeA[0] * 60 + timeA[1]
        const minutesB = timeB[0] * 60 + timeB[1]
        return minutesA - minutesB
      })
      
      setTrafficData(combinedData)
      setPredictions(predictionsData)

      // Zone statistics from real data
      let zoneData: ZoneStats[] = zonesTraffic.map((zone: any) => ({
        zoneId: zone.id,
        zoneName: zone.name,
        signalCount: zone.signal_count || 0,
        avgCongestion: zone.avg_congestion || 0,
        vehicleCount: zone.total_vehicles || 0,
      }))
      
      // If zonesTraffic is empty, fallback to zones
      if (zoneData.length === 0) {
        zoneData = zones.map((zone: any) => {
          const zoneSignals = signals.filter((s: any) => s.zone_id === zone.id)
          return {
            zoneId: zone.id,
            zoneName: zone.name,
            signalCount: zoneSignals.length,
            avgCongestion: 0,
            vehicleCount: 0,
          }
        })
      }
      
      // Filter zones by pincode or area if selected
      let filteredZoneData = zoneData
      let pincodeZoneName: string | undefined = undefined
      let filterPincode: string | undefined = selectedPincode.trim() || undefined
      
      // If area is selected, use the first pincode from that area
      if (selectedArea && !selectedPincode) {
        const selectedAreaData = mumbaiAreas.find(a => a.name === selectedArea)
        if (selectedAreaData && selectedAreaData.pincodes.length > 0) {
          filterPincode = selectedAreaData.pincodes[0]
          pincodeZoneName = selectedAreaData.name
        }
      }
      
      if (filterPincode) {
        // Validate Mumbai pincode
        if (!isValidMumbaiPincode(filterPincode)) {
          // Invalid pincode - show error insight
          setTrafficInsights([{
            type: 'warning',
            icon: 'AlertCircle',
            title: 'Invalid Pincode',
            message: `Pincode ${filterPincode} is not a valid Mumbai pincode. Mumbai pincodes start with 400 (e.g., 400001-400069).`,
            recommendation: 'Please enter a valid Mumbai pincode or select an area from the dropdown.',
            priority: 'medium',
          }])
          setZoneStats(zoneData)
          return
        }
        
        // Find zones that match the pincode
        const matchingZones = zones.filter((zone: any) => {
          if (!zone.pincodes && !zone.pincode) return false
          const pincodesList = typeof zone.pincodes === 'string' 
            ? zone.pincodes.split(',').map((p: string) => p.trim())
            : (zone.pincodes || [])
          return pincodesList.includes(filterPincode!) || zone.pincode === filterPincode
        })
        
        if (matchingZones.length > 0) {
          pincodeZoneName = matchingZones[0].name
          const matchingZoneIds = matchingZones.map((z: any) => z.id)
          filteredZoneData = zoneData.filter(z => matchingZoneIds.includes(z.zoneId))
        } else {
          // No zones found for this pincode
          filteredZoneData = []
        }
      } else if (selectedArea) {
        // Filter by area name
        const matchingZones = zones.filter((zone: any) => zone.name === selectedArea)
        if (matchingZones.length > 0) {
          pincodeZoneName = selectedArea
          const matchingZoneIds = matchingZones.map((z: any) => z.id)
          filteredZoneData = zoneData.filter(z => matchingZoneIds.includes(z.zoneId))
        }
      }
      
      setZoneStats(zoneData) // Always set all zones for dropdown

      // Generate traffic insights and recommendations (with pincode/area filtering)
      generateTrafficInsights(
        history, 
        trafficStats, 
        filteredZoneData,
        filterPincode,
        pincodeZoneName || selectedArea || undefined
      )
      
      // Generate comparative analysis
      await generateComparativeAnalysis(history, zoneId)
      
      // Identify peak hours
      identifyPeakHours(history)

    } catch (error) {
      console.error('Failed to load dashboard data', error)
    } finally {
      setLoading(false)
    }
  }

  // Feature 1: Generate Traffic Insights & Recommendations (with pincode support)
  const generateTrafficInsights = (
    history: any[], 
    trafficStats: any, 
    zoneStats: ZoneStats[],
    pincode?: string,
    pincodeZoneName?: string
  ) => {
    const insights: any[] = []
    const now = new Date()
    const currentHour = now.getHours()
    
    // Calculate average congestion from history
    const avgCongestion = history.length > 0
      ? history.reduce((sum: number, h: any) => sum + ((h.density || 0) * 100), 0) / history.length
      : 0
    
    // Add pincode-specific context to insights
    const pincodeContext = pincode ? ` for Pincode ${pincode}${pincodeZoneName ? ` (${pincodeZoneName})` : ''}` : ''
    
    // Insight 1: Pincode-Specific Welcome
    if (pincode) {
      insights.push({
        type: 'info',
        icon: 'MapPin',
        title: `Traffic Insights for Pincode ${pincode}`,
        message: `Showing traffic insights${pincodeZoneName ? ` for ${pincodeZoneName} zone` : ''}. ${zoneStats.length} zone(s) and ${zoneStats.reduce((sum, z) => sum + z.signalCount, 0)} signal(s) in this area.`,
        recommendation: `Monitor traffic conditions in your area. All insights below are specific to pincode ${pincode}.`,
        priority: 'low',
      })
    }
    
    // Insight 2: Rush Hour Detection (pincode-specific)
    if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)) {
      insights.push({
        type: 'warning',
        icon: 'Clock',
        title: `Rush Hour Detected${pincodeContext}`,
        message: `Current time (${currentHour}:00) is during rush hour${pincode ? ` in pincode ${pincode}` : ''}. Expect higher traffic volumes${pincode ? ' in your area' : ''}.`,
        recommendation: pincode 
          ? `Consider alternative routes in pincode ${pincode} or adjust travel time if possible.`
          : 'Consider alternative routes or adjust travel time if possible.',
        priority: 'high',
      })
    }
    
    // Insight 3: High Congestion Alert (pincode-specific)
    if (avgCongestion > 70) {
      const worstZone = zoneStats.length > 0 
        ? zoneStats.reduce((worst, zone) => 
            zone.avgCongestion > worst.avgCongestion ? zone : worst
          )
        : null
      insights.push({
        type: 'critical',
        icon: 'AlertTriangle',
        title: `High Congestion Detected${pincodeContext}`,
        message: `Average congestion${pincode ? ` in pincode ${pincode}` : ''} is ${Math.round(avgCongestion)}%.${worstZone ? ` ${worstZone.zoneName} has the highest congestion at ${worstZone.avgCongestion}%.` : ''}`,
        recommendation: pincode
          ? `Traffic management systems in pincode ${pincode} are actively optimizing signal timings. Consider public transport or alternative routes.`
          : 'Traffic management systems are actively optimizing signal timings. Consider public transport.',
        priority: 'high',
      })
    } else if (avgCongestion < 30) {
      insights.push({
        type: 'success',
        icon: 'CheckCircle',
        title: `Low Traffic Conditions${pincodeContext}`,
        message: `Traffic is flowing smoothly${pincode ? ` in pincode ${pincode}` : ''} with ${Math.round(avgCongestion)}% average congestion.`,
        recommendation: pincode
          ? `Optimal conditions for travel in pincode ${pincode}. All routes in your area are operating efficiently.`
          : 'Optimal conditions for travel. All routes are operating efficiently.',
        priority: 'low',
      })
    }
    
    // Insight 4: Zone Performance (pincode-specific)
    const zonesWithHighCongestion = zoneStats.filter(z => z.avgCongestion > 60)
    if (zonesWithHighCongestion.length > 0) {
      insights.push({
        type: 'info',
        icon: 'MapPin',
        title: `Zone Performance Alert${pincodeContext}`,
        message: `${zonesWithHighCongestion.length} zone(s)${pincode ? ` in pincode ${pincode}` : ''} experiencing high congestion: ${zonesWithHighCongestion.map(z => z.zoneName).join(', ')}.`,
        recommendation: pincode
          ? `Traffic operators are monitoring zones in pincode ${pincode}. Signal timings are being adjusted automatically.`
          : 'Traffic operators are monitoring these zones. Signal timings are being adjusted automatically.',
        priority: 'medium',
      })
    }
    
    // Insight 5: Peak Hours Recommendation (pincode-specific)
    if (peakHours.length > 0) {
      const topPeak = peakHours[0]
      if (currentHour === topPeak.hour || currentHour === topPeak.hour - 1) {
        insights.push({
          type: 'warning',
          icon: 'TrendingUp',
          title: `Approaching Peak Hour${pincodeContext}`,
          message: `Peak congestion hour (${topPeak.hour}:00)${pincode ? ` in pincode ${pincode}` : ''} is approaching or current. Average congestion: ${topPeak.avgCongestion}%.`,
          recommendation: pincode
            ? `Plan routes in pincode ${pincode} accordingly. Consider delaying non-essential travel in this area.`
            : 'Plan routes accordingly. Consider delaying non-essential travel.',
          priority: 'medium',
        })
      }
    }
    
    // Insight 6: Traffic Trend Analysis (pincode-specific)
    if (history.length >= 2) {
      const recent = history.slice(-5).map((h: any) => (h.density || 0) * 100)
      const earlier = history.slice(-10, -5).map((h: any) => (h.density || 0) * 100)
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
      const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length
      const trend = recentAvg - earlierAvg
      
      if (Math.abs(trend) > 10) {
        insights.push({
          type: trend > 0 ? 'warning' : 'success',
          icon: trend > 0 ? 'TrendingUp' : 'TrendingDown',
          title: trend > 0 ? `Traffic Increasing${pincodeContext}` : `Traffic Improving${pincodeContext}`,
          message: `Traffic congestion${pincode ? ` in pincode ${pincode}` : ''} has ${trend > 0 ? 'increased' : 'decreased'} by ${Math.abs(trend).toFixed(1)}% in the last period.`,
          recommendation: trend > 0 
            ? (pincode ? `Traffic is building up in pincode ${pincode}. Consider alternative routes or wait if possible.` : 'Traffic is building up. Consider alternative routes or wait if possible.')
            : (pincode ? `Traffic conditions in pincode ${pincode} are improving. Good time to travel.` : 'Traffic conditions are improving. Good time to travel.'),
          priority: 'medium',
        })
      }
    }
    
    // Insight 7: Vehicle Volume Analysis (pincode-specific)
    const totalVehicles = trafficStats.total_vehicles || 0
    const signalCount = zoneStats.reduce((sum, z) => sum + z.signalCount, 0) || stats.totalSignals
    const avgVehiclesPerSignal = signalCount > 0 ? totalVehicles / signalCount : 0
    
    if (avgVehiclesPerSignal > 100) {
      insights.push({
        type: 'info',
        icon: 'Car',
        title: `High Vehicle Volume${pincodeContext}`,
        message: `High vehicle density detected${pincode ? ` in pincode ${pincode}` : ''}: ${totalVehicles.toLocaleString()} vehicles across ${signalCount} signal(s).`,
        recommendation: pincode
          ? `Signal timings in pincode ${pincode} are optimized for current volume. System is operating at peak efficiency in your area.`
          : 'Signal timings are optimized for current volume. System is operating at peak efficiency.',
        priority: 'medium',
      })
    }
    
    // Insight 8: System Health (pincode-specific)
    const activeSignals = zoneStats.reduce((sum, z) => sum + z.signalCount, 0) || stats.activeSignals
    const totalSignalsInArea = signalCount || stats.totalSignals
    const activeRatio = totalSignalsInArea > 0 ? (activeSignals / totalSignalsInArea) * 100 : 0
    
    if (activeRatio < 90 && totalSignalsInArea > 0) {
      insights.push({
        type: 'warning',
        icon: 'Activity',
        title: `Signal Status Alert${pincodeContext}`,
        message: `${totalSignalsInArea - activeSignals} signal(s)${pincode ? ` in pincode ${pincode}` : ''} are inactive. System uptime: ${stats.systemUptime}.`,
        recommendation: pincode
          ? `Maintenance teams are notified for pincode ${pincode}. Backup systems are active in your area.`
          : 'Maintenance teams are notified. Backup systems are active.',
        priority: 'high',
      })
    } else if (totalSignalsInArea > 0) {
      insights.push({
        type: 'success',
        icon: 'CheckCircle',
        title: `System Operating Optimally${pincodeContext}`,
        message: `All systems operational${pincode ? ` in pincode ${pincode}` : ''}. ${activeSignals}/${totalSignalsInArea} signal(s) active.`,
        recommendation: pincode
          ? `Traffic management system in pincode ${pincode} is functioning at full capacity.`
          : 'Traffic management system is functioning at full capacity.',
        priority: 'low',
      })
    }
    
    // Sort by priority (high -> medium -> low)
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    insights.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder])
    
    setTrafficInsights(insights.slice(0, 6)) // Show top 6 insights
  }

  // Feature 2: Enhanced Comparative Analysis (compare with previous period)
  const generateComparativeAnalysis = async (currentHistory: any[], zoneId?: string) => {
    try {
      const now = new Date()
      const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : timeRange === '24h' ? 24 : 168
      const periodMs = hours * (timeRange === '7d' ? 86400000 : 3600000)
      
      // Get previous period data (same duration, shifted back)
      const previousStart = new Date(now.getTime() - periodMs * 2)
      const previousEnd = new Date(now.getTime() - periodMs)
      
      const previousHistoryRes = await trafficApi.getHistory(
        previousStart.toISOString(),
        previousEnd.toISOString(),
        zoneId
      )
      const previousHistory = previousHistoryRes.data?.history || []
      
      // Helper function to calculate statistics
      const calculateStats = (history: any[]) => {
        if (history.length === 0) {
          return {
            avg: 0,
            min: 0,
            max: 0,
            median: 0,
            totalVehicles: 0,
            dataPoints: 0,
          }
        }
        
        const densities = history.map((h: any) => (h.density || 0) * 100)
        const vehicles = history.map((h: any) => h.vehicle_count || 0)
        
        densities.sort((a, b) => a - b)
        const mid = Math.floor(densities.length / 2)
        const median = densities.length % 2 === 0
          ? (densities[mid - 1] + densities[mid]) / 2
          : densities[mid]
        
        return {
          avg: densities.reduce((a, b) => a + b, 0) / densities.length,
          min: Math.min(...densities),
          max: Math.max(...densities),
          median: median,
          totalVehicles: vehicles.reduce((a, b) => a + b, 0),
          dataPoints: history.length,
        }
      }
      
      const currentStats = calculateStats(currentHistory)
      const previousStats = calculateStats(previousHistory)
      
      // Calculate percentage changes
      const avgChange = previousStats.avg > 0 
        ? ((currentStats.avg - previousStats.avg) / previousStats.avg) * 100 
        : 0
      const peakChange = previousStats.max > 0
        ? ((currentStats.max - previousStats.max) / previousStats.max) * 100
        : 0
      const vehicleChange = previousStats.totalVehicles > 0
        ? ((currentStats.totalVehicles - previousStats.totalVehicles) / previousStats.totalVehicles) * 100
        : 0
      
      // Determine period labels
      const getPeriodLabel = () => {
        if (timeRange === '1h') return 'Last Hour'
        if (timeRange === '6h') return 'Last 6 Hours'
        if (timeRange === '24h') return 'Last 24 Hours'
        return 'Last 7 Days'
      }
      
      const periodLabel = getPeriodLabel()
      
      // Calculate time ranges for display
      const currentStart = new Date(now.getTime() - periodMs)
      const previousStartTime = previousStart
      const previousEndTime = previousEnd
      
      setComparativeData({
        // Averages
        currentAvg: Math.round(currentStats.avg * 10) / 10,
        previousAvg: Math.round(previousStats.avg * 10) / 10,
        avgChange: Math.round(avgChange * 10) / 10,
        
        // Peaks
        currentPeak: Math.round(currentStats.max),
        previousPeak: Math.round(previousStats.max),
        peakChange: Math.round(peakChange * 10) / 10,
        
        // Minimums
        currentMin: Math.round(currentStats.min),
        previousMin: Math.round(previousStats.min),
        
        // Medians
        currentMedian: Math.round(currentStats.median * 10) / 10,
        previousMedian: Math.round(previousStats.median * 10) / 10,
        
        // Vehicles
        currentVehicles: currentStats.totalVehicles,
        previousVehicles: previousStats.totalVehicles,
        vehicleChange: Math.round(vehicleChange * 10) / 10,
        
        // Data points
        currentDataPoints: currentStats.dataPoints,
        previousDataPoints: previousStats.dataPoints,
        
        // Overall status
        isBetter: avgChange < 0, // Negative change means less congestion (better)
        improvement: Math.abs(avgChange),
        
        // Period info
        periodLabel,
        currentPeriod: {
          start: currentStart.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          end: now.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        },
        previousPeriod: {
          start: previousStartTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          end: previousEndTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        },
      })
    } catch (error) {
      console.error('Failed to generate comparative analysis', error)
      setComparativeData(null)
    }
  }

  // Feature 3: Identify Peak Hours
  const identifyPeakHours = (history: any[]) => {
    const hourlyData: { [key: number]: number[] } = {}
    
    history.forEach((item: any) => {
      const hour = new Date(item.timestamp).getHours()
      if (!hourlyData[hour]) {
        hourlyData[hour] = []
      }
      hourlyData[hour].push((item.density || 0) * 100)
    })
    
    const peakHoursArray = Object.entries(hourlyData)
      .map(([hour, values]) => ({
        hour: parseInt(hour),
        avgCongestion: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        count: values.length,
      }))
      .sort((a, b) => b.avgCongestion - a.avgCongestion)
      .slice(0, 5) // Top 5 peak hours
    
    setPeakHours(peakHoursArray)
  }

  const exportData = () => {
    const timestamp = new Date().toISOString()
    const exportMetadata = {
      exportedAt: timestamp,
      exportedBy: 'Viewer Dashboard',
      filters: {
        timeRange,
        selectedZone: selectedZone === 'all' ? 'All Zones' : zoneStats.find(z => z.zoneId === selectedZone)?.zoneName || selectedZone,
        selectedPincode: selectedPincode || 'None',
        predictionHours,
        realtimeUpdates,
      },
      version: '1.0.0',
    }

    const fullData = {
      metadata: exportMetadata,
      statistics: stats,
      trafficData: {
        historical: trafficData.filter(d => !d.isPrediction),
        predictions: trafficData.filter(d => d.isPrediction),
        totalPoints: trafficData.length,
      },
      zoneStatistics: zoneStats,
      trafficInsights: trafficInsights,
      comparativeAnalysis: comparativeData,
      peakHours: peakHours,
      predictions: predictions,
      alerts: alerts,
    }

    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `traffic-dashboard-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else if (exportFormat === 'csv') {
      // Convert to CSV format
      let csv = 'Traffic Dashboard Export\n'
      csv += `Exported At,${timestamp}\n`
      csv += `Time Range,${timeRange}\n`
      csv += `Zone,${selectedZone === 'all' ? 'All Zones' : selectedZone}\n\n`
      
      csv += 'Statistics\n'
      csv += `Total Signals,${stats.totalSignals}\n`
      csv += `Active Signals,${stats.activeSignals}\n`
      csv += `Total Zones,${stats.totalZones}\n`
      csv += `Total Vehicles,${stats.totalVehicles}\n`
      csv += `Avg Congestion,${stats.avgCongestion}%\n\n`
      
      csv += 'Traffic Data\n'
      csv += 'Time,Vehicles,Congestion %,Is Prediction,Confidence\n'
      trafficData.forEach(d => {
        csv += `${d.time},${d.vehicles},${d.congestion},${d.isPrediction ? 'Yes' : 'No'},${d.confidence || 'N/A'}\n`
      })
      
      csv += '\nZone Statistics\n'
      csv += 'Zone Name,Signal Count,Vehicle Count,Avg Congestion %\n'
      zoneStats.forEach(z => {
        csv += `${z.zoneName},${z.signalCount},${z.vehicleCount},${z.avgCongestion}\n`
      })
      
      if (peakHours.length > 0) {
        csv += '\nPeak Hours\n'
        csv += 'Hour,Avg Congestion %,Data Points\n'
        peakHours.forEach(p => {
          csv += `${p.hour}:00,${p.avgCongestion},${p.count}\n`
        })
      }
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `traffic-dashboard-${new Date().toISOString().split('T')[0]}-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else if (exportFormat === 'pdf') {
      // For PDF, we'll create a formatted text version that can be printed
      let pdfContent = `
TRAFFIC DASHBOARD EXPORT
========================
Exported: ${new Date(timestamp).toLocaleString()}
Time Range: ${timeRange}
Zone: ${selectedZone === 'all' ? 'All Zones' : selectedZone}

STATISTICS
----------
Total Signals: ${stats.totalSignals}
Active Signals: ${stats.activeSignals}
Total Zones: ${stats.totalZones}
Total Vehicles: ${stats.totalVehicles.toLocaleString()}
Average Congestion: ${stats.avgCongestion}%

ZONE STATISTICS
---------------
${zoneStats.map(z => `${z.zoneName}: ${z.signalCount} signals, ${z.vehicleCount.toLocaleString()} vehicles, ${z.avgCongestion}% congestion`).join('\n')}

PEAK HOURS
----------
${peakHours.map(p => `${p.hour}:00 - ${p.avgCongestion}% congestion (${p.count} data points)`).join('\n')}

${comparativeData ? `
COMPARATIVE ANALYSIS
--------------------
Period: ${comparativeData.periodLabel}
Current Period: ${comparativeData.currentPeriod.start} - ${comparativeData.currentPeriod.end}
Previous Period: ${comparativeData.previousPeriod.start} - ${comparativeData.previousPeriod.end}

Average Congestion:
  Current: ${comparativeData.currentAvg}%
  Previous: ${comparativeData.previousAvg}%
  Change: ${comparativeData.avgChange > 0 ? '+' : ''}${comparativeData.avgChange}%

Peak Congestion:
  Current: ${comparativeData.currentPeak}%
  Previous: ${comparativeData.previousPeak}%
  Change: ${comparativeData.peakChange > 0 ? '+' : ''}${comparativeData.peakChange}%

Minimum Congestion:
  Current: ${comparativeData.currentMin}%
  Previous: ${comparativeData.previousMin}%

Median Congestion:
  Current: ${comparativeData.currentMedian}%
  Previous: ${comparativeData.previousMedian}%

Total Vehicles:
  Current: ${comparativeData.currentVehicles.toLocaleString()}
  Previous: ${comparativeData.previousVehicles.toLocaleString()}
  Change: ${comparativeData.vehicleChange > 0 ? '+' : ''}${comparativeData.vehicleChange}%

Data Points:
  Current: ${comparativeData.currentDataPoints}
  Previous: ${comparativeData.previousDataPoints}

Overall Status: ${comparativeData.isBetter ? 'Improved' : 'Worsened'} (${comparativeData.improvement.toFixed(1)}% change)
` : ''}

TRAFFIC DATA SUMMARY
--------------------
Total Data Points: ${trafficData.length}
Historical Points: ${trafficData.filter(d => !d.isPrediction).length}
Prediction Points: ${trafficData.filter(d => d.isPrediction).length}
      `.trim()
      
      // Create a printable version
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Traffic Dashboard Export</title>
              <style>
                body { font-family: monospace; padding: 20px; }
                pre { white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <pre>${pdfContent}</pre>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const filteredZoneStats = selectedZone === 'all'
    ? zoneStats
    : zoneStats.filter((z) => z.zoneId === selectedZone)

  const pieChartData = zoneStats.map((zone) => ({
    name: zone.zoneName,
    value: zone.signalCount,
  }))

  return (
    <Layout>
      <div className="space-y-6 pb-6">
        {/* Header - Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-8 flex-shrink-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/20">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-3">
                  Viewer Dashboard
                </h1>
                <div className="mt-2 flex items-center gap-4 flex-wrap">
                  <p className="text-gray-400 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Comprehensive traffic analytics and real-time system monitoring
                  </p>
                  {realtimeUpdates && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs font-semibold text-green-400">
                        Live • Last updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(34, 197, 94, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRealtimeUpdates(!realtimeUpdates)}
                className={`px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all ${
                  realtimeUpdates
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Zap className={`w-4 h-4 ${realtimeUpdates ? 'animate-pulse' : ''}`} />
                {realtimeUpdates ? 'Live' : 'Paused'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={loadDashboardData}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-semibold"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </motion.button>
              <div className="relative group">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(168, 85, 247, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportData}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2 font-semibold"
                >
                  <Download className="w-4 h-4" />
                  Export
                </motion.button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => { setExportFormat('json'); exportData(); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Export as JSON
                    </button>
                    <button
                      onClick={() => { setExportFormat('csv'); exportData(); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Export as CSV
                    </button>
                    <button
                      onClick={() => { setExportFormat('pdf'); exportData(); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Print/PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Alerts Banner */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-100">Emergency Alerts</h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {alerts.length} active emergency route{alerts.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Key Metrics - Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="premium-card p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400 mb-2">Total Signals</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {loading ? '...' : stats.totalSignals}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="px-2 py-1 bg-green-500/20 rounded-lg">
                    <p className="text-xs font-semibold text-green-400 flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {stats.activeSignals} active
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <TrafficCone className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="premium-card p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400 mb-2">Total Zones</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {loading ? '...' : stats.totalZones}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="px-2 py-1 bg-purple-500/20 rounded-lg">
                    <p className="text-xs font-semibold text-purple-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Mumbai
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <Layers className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="premium-card p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:border-green-500/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400 mb-2">Total Vehicles</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {loading ? '...' : stats.totalVehicles.toLocaleString()}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="px-2 py-1 bg-green-500/20 rounded-lg">
                    <p className="text-xs font-semibold text-green-400 flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      Across all zones
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                <Car className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="premium-card p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400 mb-2">Avg Congestion</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  {loading ? '...' : `${stats.avgCongestion}%`}
                </p>
                <div className="mt-3 space-y-2">
                  <div className={`px-2 py-1 rounded-lg ${
                    stats.avgCongestion > 70 ? 'bg-red-500/20' : 
                    stats.avgCongestion > 40 ? 'bg-yellow-500/20' : 
                    'bg-green-500/20'
                  }`}>
                    <p className={`text-xs font-semibold flex items-center gap-1 ${
                      stats.avgCongestion > 70 ? 'text-red-400' : 
                      stats.avgCongestion > 40 ? 'text-yellow-400' : 
                      'text-green-400'
                    }`}>
                      <Gauge className="w-3 h-3" />
                      {stats.avgCongestion > 70 ? 'High' : stats.avgCongestion > 40 ? 'Medium' : 'Low'}
                    </p>
                  </div>
                  {/* Real-time congestion indicator */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.avgCongestion}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          stats.avgCongestion > 70
                            ? 'bg-gradient-to-r from-red-500 to-red-600'
                            : stats.avgCongestion > 40
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-400">{stats.avgCongestion}%</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters - Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-5 flex-shrink-0 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
              <Filter className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-gray-300">Filters</span>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 font-medium transition-all hover:border-gray-600"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-200 font-medium transition-all hover:border-gray-600"
            >
              <option value="all">All Zones</option>
              {zoneStats.map((zone) => (
                <option key={zone.zoneId} value={zone.zoneId}>
                  {zone.zoneName}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/30">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <select
                value={selectedArea}
                onChange={(e) => {
                  setSelectedArea(e.target.value)
                  if (e.target.value) {
                    setSelectedPincode('') // Clear pincode when area is selected
                  }
                }}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-200 text-sm font-medium transition-all hover:border-gray-600 min-w-[200px]"
              >
                <option value="">Select Mumbai Area</option>
                {mumbaiAreas.map((area) => (
                  <option key={area.name} value={area.name}>
                    {area.name} ({area.area})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-lg border border-teal-500/30">
              <span className="text-xs font-semibold text-gray-300 whitespace-nowrap">OR Pincode:</span>
              <input
                type="text"
                placeholder="400001-400069"
                value={selectedPincode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6) // Only numbers, max 6 digits
                  setSelectedPincode(value)
                  if (value) {
                    setSelectedArea('') // Clear area when pincode is entered
                  }
                }}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-200 text-sm font-medium transition-all hover:border-gray-600 w-32 placeholder-gray-500"
              />
              {selectedPincode && (
                <>
                  {!isValidMumbaiPincode(selectedPincode) && selectedPincode.length === 6 && (
                    <span className="text-xs text-red-400" title="Invalid Mumbai pincode">⚠</span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedPincode('')
                      setSelectedArea('')
                    }}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-red-400 transition-colors rounded"
                    title="Clear"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
              <span className="text-sm font-semibold text-gray-300">Predictions:</span>
              <select
                value={predictionHours}
                onChange={(e) => setPredictionHours(Number(e.target.value))}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-200 text-sm font-medium transition-all hover:border-gray-600"
              >
                <option value={3}>Next 3 Hours</option>
                <option value={6}>Next 6 Hours</option>
                <option value={12}>Next 12 Hours</option>
                <option value={24}>Next 24 Hours</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Flow Over Time - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="premium-card p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-blue-500/50 transition-all flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Traffic Flow Over Time
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Vehicle count trends</p>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={400}>
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  label={{ value: 'Time', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  label={{ value: 'Vehicles', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  }}
                  labelStyle={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '8px' }}
                  formatter={(value: any) => [
                    <div key="veh" className="text-blue-400 font-bold">{value.toLocaleString()} vehicles</div>,
                    'Vehicle Count'
                  ]}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Area
                  type="monotone"
                  dataKey="vehicles"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVehicles)"
                  name="Vehicle Count"
                  dot={{ fill: '#0ea5e9', r: 3, strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Congestion Levels with Predictions - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -2 }}
            className="premium-card p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-orange-500/50 transition-all flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                  <Gauge className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    Congestion Levels
                  </h3>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {predictions.length > 0 && (
                      <span className="text-xs font-medium text-purple-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        AI Predictions Active
                      </span>
                    )}
                    {realtimeUpdates && (
                      <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        Live: {stats.avgCongestion}% @ {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={400}>
              <LineChart data={trafficData}>
                <defs>
                  <linearGradient id="congestionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  label={{ value: 'Time', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  label={{ value: 'Congestion %', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  }}
                  labelStyle={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '8px' }}
                  formatter={(value: any, _name: string, props: any) => {
                    if (props.payload.isPrediction) {
                      return [
                        <div key="pred" className="space-y-1">
                          <div className="text-purple-400 font-bold">{value}%</div>
                          <div className="text-xs text-gray-400">
                            Predicted • {Math.round((props.payload.confidence || 0) * 100)}% confidence
                          </div>
                        </div>,
                        'Prediction'
                      ]
                    }
                    return [
                      <div key="hist" className="text-orange-400 font-bold">{value}%</div>,
                      'Historical'
                    ]
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                {/* Historical data line */}
                <Line
                  type="monotone"
                  dataKey="congestion"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                  name="Historical (Live)"
                  data={trafficData.filter(d => !d.isPrediction)}
                  animationDuration={500}
                />
                {/* Prediction line */}
                {trafficData.some(d => d.isPrediction) && (
                  <Line
                    type="monotone"
                    dataKey="congestion"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    strokeDasharray="8 4"
                    dot={{ fill: '#8b5cf6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                    name={`Predicted (Next ${predictionHours}h)`}
                    data={trafficData.filter(d => d.isPrediction)}
                    animationDuration={500}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
            </div>
            {predictions.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                    Traffic Predictions (Next {predictionHours} Hours)
                  </p>
                  <span className="text-xs text-gray-500">
                    Based on {timeRange === '1h' ? 'last hour' : timeRange === '6h' ? 'last 6 hours' : timeRange === '24h' ? 'last 24 hours' : 'last 7 days'} data
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {predictions.slice(0, Math.min(8, predictionHours)).map((pred: any, idx: number) => {
                    const congestionValue = pred.density !== undefined 
                      ? (pred.density * 100) 
                      : (pred.predicted_congestion || 0)
                    const date = new Date(pred.timestamp)
                    const isRushHour = (date.getHours() >= 7 && date.getHours() <= 9) || (date.getHours() >= 17 && date.getHours() <= 19)
                    
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        className={`p-4 rounded-xl backdrop-blur-sm border transition-all ${
                          congestionValue > 70
                            ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/40'
                            : congestionValue > 40
                            ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/40'
                            : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-white text-sm">
                            {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {isRushHour && (
                            <span className="px-1.5 py-0.5 bg-orange-500/30 text-orange-300 text-xs rounded font-semibold">
                              Rush
                            </span>
                          )}
                        </div>
                        <div className={`font-bold text-lg mb-2 ${
                          congestionValue > 70 ? 'text-red-400' :
                          congestionValue > 40 ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {Math.round(congestionValue)}%
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Vehicles</span>
                            <span className="text-gray-300 font-semibold">
                              {(pred.vehicle_count || pred.predicted_vehicles || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.round((pred.confidence || 0.8) * 100)}%` }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                              />
                            </div>
                            <span className="text-xs text-gray-400 font-medium">
                              {Math.round((pred.confidence || 0.8) * 100)}%
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Zone Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Signal Distribution by Zone
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Zone Performance - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -2 }}
            className="premium-card p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-cyan-500/50 transition-all"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Zone Performance
                </h3>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredZoneStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="zoneName" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="avgCongestion" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* NEW FEATURES SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feature 1: Traffic Insights & Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-cyan-500/50 transition-all flex flex-col h-full"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Traffic Insights & Recommendations
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-xs text-gray-400">AI-powered insights and actionable recommendations</p>
                  {(selectedPincode || selectedArea) && (
                    <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded text-xs font-semibold text-cyan-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedArea ? selectedArea : `Pincode: ${selectedPincode}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {trafficInsights.length > 0 ? (
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 500px)', minHeight: '400px' }}>
                {trafficInsights.map((insight, idx) => {
                  const IconComponent = insight.icon === 'Clock' ? Clock :
                    insight.icon === 'AlertTriangle' ? AlertCircle :
                    insight.icon === 'CheckCircle' ? CheckCircle :
                    insight.icon === 'MapPin' ? MapPin :
                    insight.icon === 'TrendingUp' ? TrendingUp :
                    insight.icon === 'TrendingDown' ? TrendingDown :
                    insight.icon === 'Car' ? Car : Zap
                  
                  const bgColor = insight.type === 'critical' ? 'from-red-500/20 to-red-600/20 border-red-500/40' :
                    insight.type === 'warning' ? 'from-yellow-500/20 to-orange-500/20 border-yellow-500/40' :
                    insight.type === 'success' ? 'from-green-500/20 to-emerald-500/20 border-green-500/40' :
                    'from-blue-500/20 to-cyan-500/20 border-blue-500/40'
                  
                  const iconColor = insight.type === 'critical' ? 'text-red-400' :
                    insight.type === 'warning' ? 'text-yellow-400' :
                    insight.type === 'success' ? 'text-green-400' :
                    'text-blue-400'
                  
                  const priorityBadge = insight.priority === 'high' ? 'bg-red-500/30 text-red-300 border-red-500/50' :
                    insight.priority === 'medium' ? 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50' :
                    'bg-green-500/30 text-green-300 border-green-500/50'
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`p-4 rounded-xl bg-gradient-to-br ${bgColor} border backdrop-blur-sm hover:scale-[1.01] transition-all`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gray-800/50 ${iconColor} flex-shrink-0`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <h4 className="font-bold text-white text-sm leading-tight">{insight.title}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${priorityBadge}`}>
                              {insight.priority.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 mb-2 leading-relaxed">{insight.message}</p>
                          <div className="p-2 bg-gray-900/50 rounded-lg border border-gray-700/50">
                            <p className="text-xs text-gray-400 flex items-start gap-2">
                              <span className="font-semibold text-cyan-400 flex-shrink-0">💡 Recommendation:</span>
                              <span className="text-gray-300 leading-relaxed">{insight.recommendation}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Analyzing traffic data to generate insights...</p>
              </div>
            )}
          </motion.div>

          {/* Feature 2: Comparative Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="premium-card p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:border-indigo-500/40 transition-all flex flex-col h-full"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Comparative Analysis
                </h3>
                <p className="text-xs text-gray-400 mt-1">vs Previous Period</p>
              </div>
            </div>
            {comparativeData ? (
              <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 500px)', minHeight: '400px' }}>
                {/* Period Information */}
                <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <p className="text-xs font-semibold text-gray-300 mb-2">Comparing: {comparativeData.periodLabel}</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-gray-500 flex-shrink-0">Current:</span>
                      <span className="text-gray-300 text-right leading-tight">{comparativeData.currentPeriod.start} - {comparativeData.currentPeriod.end}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-gray-500 flex-shrink-0">Previous:</span>
                      <span className="text-gray-300 text-right leading-tight">{comparativeData.previousPeriod.start} - {comparativeData.previousPeriod.end}</span>
                    </div>
                  </div>
                </div>

                {/* Average Congestion Comparison */}
                <div className="p-4 bg-gray-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-300">Average Congestion</span>
                    <div className="flex items-center gap-2">
                      {comparativeData.isBetter ? (
                        <TrendingDown className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-sm font-bold ${
                        comparativeData.isBetter ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {comparativeData.avgChange > 0 ? '+' : ''}{comparativeData.avgChange}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Current</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden max-w-[120px]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${comparativeData.currentAvg}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                          />
                        </div>
                        <span className="text-sm font-bold text-white min-w-[3rem] text-right">{comparativeData.currentAvg}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Previous</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className="h-full bg-gradient-to-r from-gray-500 to-gray-600 rounded-full"
                            style={{ width: `${comparativeData.previousAvg}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-300 min-w-[3rem] text-right">{comparativeData.previousAvg}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Overall Status */}
                <div className={`p-4 rounded-xl ${
                  comparativeData.isBetter
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30'
                    : 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-200">Overall Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      comparativeData.isBetter
                        ? 'bg-green-500/30 text-green-300 border border-green-500/50'
                        : 'bg-red-500/30 text-red-300 border border-red-500/50'
                    }`}>
                      {comparativeData.isBetter ? '✓ Improved' : '⚠ Worsened'}
                    </span>
                  </div>
                  <p className={`text-xs ${
                    comparativeData.isBetter ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {comparativeData.isBetter 
                      ? `Traffic improved by ${comparativeData.improvement.toFixed(1)}% compared to previous period`
                      : `Traffic worsened by ${comparativeData.improvement.toFixed(1)}% compared to previous period`
                    }
                  </p>
                </div>
                
                {/* Detailed Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Peak Congestion */}
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1.5">Peak Congestion</p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base font-bold text-orange-400">{comparativeData.currentPeak}%</span>
                      <span className="text-xs text-gray-400">vs {comparativeData.previousPeak}%</span>
                    </div>
                    {comparativeData.peakChange !== 0 && (
                      <p className={`text-xs ${
                        comparativeData.peakChange < 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {comparativeData.peakChange > 0 ? '+' : ''}{comparativeData.peakChange}%
                      </p>
                    )}
                  </div>
                  
                  {/* Minimum Congestion */}
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Minimum</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-400">{comparativeData.currentMin}%</span>
                      <span className="text-xs text-gray-400">vs {comparativeData.previousMin}%</span>
                    </div>
                  </div>
                  
                  {/* Median */}
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Median</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-400">{comparativeData.currentMedian}%</span>
                      <span className="text-xs text-gray-400">vs {comparativeData.previousMedian}%</span>
                    </div>
                  </div>
                  
                  {/* Total Vehicles */}
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Total Vehicles</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-purple-400">{comparativeData.currentVehicles.toLocaleString()}</span>
                      <span className="text-xs text-gray-400">vs {comparativeData.previousVehicles.toLocaleString()}</span>
                    </div>
                    {comparativeData.vehicleChange !== 0 && (
                      <p className={`text-xs mt-1 ${
                        comparativeData.vehicleChange < 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {comparativeData.vehicleChange > 0 ? '+' : ''}{comparativeData.vehicleChange}%
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Data Points Info */}
                <div className="p-2 bg-gray-800/30 rounded-lg text-center">
                  <p className="text-xs text-gray-400">
                    Based on {comparativeData.currentDataPoints} current vs {comparativeData.previousDataPoints} previous data points
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Loading comparison data...</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Feature 3: Peak Hours Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-all"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
              <ThermometerSun className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Peak Hours Analysis
              </h3>
              <p className="text-xs text-gray-400 mt-1">Top congested hours</p>
            </div>
          </div>
          {peakHours.length > 0 ? (
            <div className="space-y-3">
              {peakHours.map((peak, idx) => (
                <motion.div
                  key={peak.hour}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                        idx === 0
                          ? 'bg-gradient-to-br from-red-500 to-red-600 text-white'
                          : idx === 1
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                          : 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-white">
                          {peak.hour.toString().padStart(2, '0')}:00 - {(peak.hour + 1).toString().padStart(2, '0')}:00
                        </p>
                        <p className="text-xs text-gray-400">{peak.count} data points</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-400">{peak.avgCongestion}%</p>
                      <p className="text-xs text-gray-400">congestion</p>
                    </div>
                  </div>
                  <div className="mt-2 flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${peak.avgCongestion}%` }}
                      transition={{ delay: idx * 0.1 + 0.3, duration: 0.5 }}
                      className={`h-full rounded-full ${
                        peak.avgCongestion > 70
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : peak.avgCongestion > 40
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Analyzing peak hours...</p>
            </div>
          )}
        </motion.div>

        {/* Zone Statistics Table - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Zone Statistics
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-4 font-semibold text-gray-300">Zone</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-300">Signals</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-300">Vehicles</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-300">Congestion</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredZoneStats.map((zone, idx) => (
                  <motion.tr
                    key={zone.zoneId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-gray-700/50 hover:bg-gray-800/50 transition-all group"
                  >
                    <td className="py-4 px-4 font-semibold text-gray-200 group-hover:text-white transition-colors">
                      {zone.zoneName}
                    </td>
                    <td className="py-4 px-4 text-gray-300">{zone.signalCount}</td>
                    <td className="py-4 px-4 text-gray-300 font-medium">{zone.vehicleCount.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-700 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${zone.avgCongestion}%` }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            className={`h-full rounded-full ${
                              zone.avgCongestion > 70
                                ? 'bg-gradient-to-r from-red-500 to-red-600'
                                : zone.avgCongestion > 40
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500'
                            }`}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-300 min-w-[3rem]">{zone.avgCongestion}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          zone.avgCongestion > 70
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : zone.avgCongestion > 40
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}
                      >
                        {zone.avgCongestion > 70 ? 'High' : zone.avgCongestion > 40 ? 'Medium' : 'Low'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* System Status - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="premium-card p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:border-green-500/40 transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg shadow-green-500/30">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-gray-200">System Status</h4>
                <p className="text-sm text-gray-400">All systems operational</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
                <span className="text-sm text-gray-400">Uptime</span>
                <span className="font-bold text-green-400">{stats.systemUptime}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
                <span className="text-sm text-gray-400">Active Signals</span>
                <span className="font-bold text-green-400">{stats.activeSignals}/{stats.totalSignals}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="premium-card p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/30">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-gray-200">Response Time</h4>
                <p className="text-sm text-gray-400">Average signal response</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
                <span className="text-sm text-gray-400">Avg Response</span>
                <span className="font-bold text-blue-400">2.3s</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
                <span className="text-sm text-gray-400">Peak Load</span>
                <span className="font-bold text-orange-400">45%</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="premium-card p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/30">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-gray-200">Alerts</h4>
                <p className="text-sm text-gray-400">Active notifications</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
                <span className="text-sm text-gray-400">Emergency Routes</span>
                <span className="font-bold text-red-400">{alerts.length}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
                <span className="text-sm text-gray-400">System Alerts</span>
                <span className="font-bold text-gray-300">0</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
