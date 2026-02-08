import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Navigation, AlertTriangle, CheckCircle, XCircle, ArrowRightLeft, MapPin, Activity, TrendingUp, Clock, Users } from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { signalsApi, zonesApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { MUMBAI_ROADS, RoadSegment as MumbaiRoadSegment } from '../data/mumbai_roads'
import { wsService } from '../lib/websocket'
import SignalDetailsPanel from './SignalDetailsPanel'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoic2hyZXlhczIyMDciLCJhIjoiY21sM2d2aWI2MGxmbDNncXR4ODIzdTJkMCJ9._XBc8GZlGXctOZmzzR1S7A'

interface RoadSegment {
  id: string
  name: string
  coordinates: [number, number][]
  congestion: 'low' | 'medium' | 'high' | 'severe'
  speed: number
  vehicleCount: number
  pincode?: string
  zoneId?: string
}

interface TrafficDiversion {
  id: string
  fromRoad: string
  toRoad: string
  reason: string
  active: boolean
  timestamp: Date
}

interface Zone {
  id: string
  name: string
  city: string
  latitude: number
  longitude: number
  pincode?: string
  pincodes?: string
}

export default function TrafficControlCenter() {
  const { user } = useAuthStore()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const roadsDrawnRef = useRef<boolean>(false) // Track if roads have been drawn initially
  const [signals, setSignals] = useState<any[]>([])
  const [zone, setZone] = useState<Zone | null>(null)
  const [roads, setRoads] = useState<RoadSegment[]>([])
  const [diversions, setDiversions] = useState<TrafficDiversion[]>([])
  const [selectedRoad, setSelectedRoad] = useState<string | null>(null)
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<'overview' | 'roads' | 'signals' | 'diversions'>('overview')

  // Use Mumbai roads data - Convert to RoadSegment format
  const allRoadNetworks: RoadSegment[] = MUMBAI_ROADS.map(road => ({
    id: road.id,
    name: road.name,
    coordinates: road.coordinates as [number, number][],
    congestion: road.congestion,
    speed: road.speed,
    vehicleCount: road.vehicleCount,
    pincode: road.pincode,
    zoneId: road.zoneId,
  }))

  useEffect(() => {
    loadZoneAndRoads()
    
    // Listen for real-time traffic updates via WebSocket
    const handleMessage = (message: any) => {
      if (message.type === 'traffic_update' || message.type === 'signal_update') {
        // Reload signals to get latest data
        loadSignals()
        
        // Update roads if signal data is available
        if (message.data?.signals_updated) {
          // Trigger road update by reloading signals which will update congestion
          loadSignals()
        }
      }
      
      if (message.type === 'realtime_traffic_update' && message.data?.signals) {
        // Update road congestion based on real-time signal data (debounced)
        setRoads(prevRoads => {
          const updatedRoads = prevRoads.map(road => {
            // Find matching signal data by zone or proximity
            const signalData = message.data.signals.find((s: any) => {
              // Match by zone ID if available
              if (road.zoneId && s.zone_id) {
                return true // Simplified matching
              }
              return true // Update all roads for now
            })
            
            if (signalData) {
              // Update congestion based on density
              let newCongestion: 'low' | 'medium' | 'high' | 'severe' = 'low'
              const density = signalData.density || signalData.traffic_density || 0
              if (density >= 0.8) newCongestion = 'severe'
              else if (density >= 0.6) newCongestion = 'high'
              else if (density >= 0.4) newCongestion = 'medium'
              
              // Only update if congestion actually changed
              if (road.congestion === newCongestion) {
                return road // No change
              }
              
              return {
                ...road,
                congestion: newCongestion,
                vehicleCount: signalData.vehicle_count || road.vehicleCount,
                speed: signalData.speed || (60 - density * 40), // Calculate speed from density
              }
            }
            return road
          })
          
          // Only update state if something changed
          const hasChanges = updatedRoads.some((road, idx) => road.congestion !== prevRoads[idx]?.congestion)
          return hasChanges ? updatedRoads : prevRoads
        })
      }
      
      if (message.type === 'road_congestion_update' && message.data?.congestion) {
        // Update all roads with new congestion level
        setRoads(prevRoads => prevRoads.map(road => ({
          ...road,
          congestion: message.data.congestion as 'low' | 'medium' | 'high' | 'severe',
        })))
      }
    }
    
    wsService.on('message', handleMessage)
    
    // Auto-refresh signals every 30 seconds for real-time updates (reduced frequency to prevent blinking)
    const interval = setInterval(() => {
      loadSignals()
    }, 30000) // 30 seconds instead of more frequent updates
    
    return () => {
      wsService.off('message', handleMessage)
      clearInterval(interval)
    }
  }, [user?.zone_id, user?.role])

  useEffect(() => {
    if (!mapContainer.current || map.current) return
    if (!MAPBOX_TOKEN) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    // Mumbai center coordinates
    const center = zone ? [zone.longitude, zone.latitude] : [72.8777, 19.0760]
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: center as [number, number],
      zoom: zone ? 13 : 12,
      attributionControl: true,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.current.once('load', () => {
      loadSignals()
      // Draw roads after they're loaded (wait for roads to be set)
      const checkAndDraw = () => {
        if (roads.length > 0 && !roadsDrawnRef.current) {
          drawRoads()
          roadsDrawnRef.current = true
        } else if (roads.length === 0) {
          // Retry after a delay if roads not loaded yet
          setTimeout(checkAndDraw, 500)
        }
      }
      setTimeout(checkAndDraw, 500)
    })

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => {
        marker.remove()
        if ((marker as any)._clickHandler) {
          window.removeEventListener('signal-click', (marker as any)._clickHandler)
        }
      })
      markersRef.current = []
      
      if (map.current) {
        map.current.remove()
        map.current = null
        roadsDrawnRef.current = false // Reset flag on cleanup
      }
    }
  }, [zone]) // Removed roads dependency to prevent map re-initialization

  const loadZoneAndRoads = async () => {
    try {
      if (user?.zone_id) {
        const zonesRes = await zonesApi.getAll()
        const operatorZone = zonesRes.data.find((z: Zone) => z.id === user.zone_id)
        setZone(operatorZone || null)

        if (!operatorZone) {
          setRoads([])
          return
        }

        // Filter roads by zone name (Mumbai-specific)
        // Match zone name: "South Mumbai", "Central Mumbai", "Western Suburbs", "North Mumbai"
        const zoneNameMatch = operatorZone.name.toLowerCase()
        const filteredRoads = allRoadNetworks.filter(road => {
          // Match by zone name from Mumbai roads data
          const roadZoneName = road.zoneId
            ?.replace('-', ' ')
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          
          // Direct zone name match
          if (roadZoneName && operatorZone.name.toLowerCase().includes(roadZoneName.toLowerCase())) {
            return true
          }
          
          // Match by zone ID pattern
          if (road.zoneId) {
            if (zoneNameMatch.includes('south') && road.zoneId.includes('south')) return true
            if (zoneNameMatch.includes('central') && road.zoneId.includes('central')) return true
            if (zoneNameMatch.includes('western') && road.zoneId.includes('west')) return true
            if (zoneNameMatch.includes('north') && road.zoneId.includes('north')) return true
          }
          
          return false
        })
        
        setRoads(filteredRoads)
        roadsDrawnRef.current = false // Reset flag when roads change
        console.log(`[TrafficControl] Operator zone: ${operatorZone.name}, Roads filtered: ${filteredRoads.length}`)
      } else {
        // Super Admin sees all Mumbai roads
        setRoads(allRoadNetworks)
        roadsDrawnRef.current = false // Reset flag when roads change
        console.log(`[TrafficControl] Super Admin view: All ${allRoadNetworks.length} Mumbai roads`)
      }
      
      // Draw roads if map is ready
      if (map.current && map.current.loaded() && !roadsDrawnRef.current) {
        setTimeout(() => {
          if (roads.length > 0) {
            drawRoads()
            roadsDrawnRef.current = true
          }
        }, 300)
      }
    } catch (error) {
      console.error('Failed to load zone', error)
      // Fallback: show all Mumbai roads
      setRoads(allRoadNetworks)
    }
  }

  const loadSignals = async () => {
    try {
      // Super Admin gets all signals, Operators get filtered by zone
      const zoneId = (user?.role === 'super_admin' || !user?.zone_id) ? undefined : user.zone_id
      const response = await signalsApi.getAll(zoneId)
      const signalsData = response.data || []
      setSignals(signalsData)
      
      // Update roads based on signal data (only if congestion actually changed)
      if (signalsData.length > 0 && roads.length > 0) {
        setRoads(prevRoads => {
          const updatedRoads = prevRoads.map(road => {
            // Find signals near this road (simplified: use average of all signals)
            const avgDensity = signalsData.reduce((sum: number, s: any) => {
              return sum + (s.traffic_density || s.density || 0)
            }, 0) / signalsData.length
            
            let newCongestion: 'low' | 'medium' | 'high' | 'severe' = 'low'
            if (avgDensity >= 0.8) newCongestion = 'severe'
            else if (avgDensity >= 0.6) newCongestion = 'high'
            else if (avgDensity >= 0.4) newCongestion = 'medium'
            
            // Only update if congestion actually changed
            if (road.congestion === newCongestion) {
              return road // No change, return same object
            }
            
            const totalVehicles = signalsData.reduce((sum: number, s: any) => sum + (s.vehicle_count || 0), 0)
            
            return {
              ...road,
              congestion: newCongestion,
              vehicleCount: totalVehicles / signalsData.length, // Average vehicles per signal
              speed: Math.max(20, 60 - avgDensity * 40), // Speed based on density
            }
          })
          
          // Only update state if something actually changed
          const hasChanges = updatedRoads.some((road, idx) => road.congestion !== prevRoads[idx]?.congestion)
          return hasChanges ? updatedRoads : prevRoads
        })
      }
      
      // Only add markers if map is ready
      if (map.current && map.current.loaded()) {
        addSignalMarkers(signalsData)
      } else if (map.current) {
        // Wait for map to load
        map.current.once('load', () => {
          addSignalMarkers(signalsData)
        })
      }
    } catch (error) {
      console.error('Failed to load signals', error)
    }
  }

  const getCongestionColor = (congestion: string): string => {
    switch (congestion) {
      case 'low': return '#10b981'
      case 'medium': return '#f59e0b'
      case 'high': return '#ef4444'
      case 'severe': return '#991b1b'
      default: return '#6b7280'
    }
  }

  const getCongestionWidth = (congestion: string): number => {
    switch (congestion) {
      case 'low': return 3
      case 'medium': return 5
      case 'high': return 7
      case 'severe': return 9
      default: return 3
    }
  }

  // Update roads on map when roads state changes (debounced to prevent blinking)
  const roadsUpdateRef = useRef<NodeJS.Timeout | null>(null)
  const previousRoadsRef = useRef<RoadSegment[]>([])
  
  useEffect(() => {
    if (!map.current || !map.current.loaded() || roads.length === 0) {
      // If roads are empty, draw them when they become available
      if (roads.length > 0 && !roadsDrawnRef.current && map.current && map.current.loaded()) {
        drawRoads()
        roadsDrawnRef.current = true
        previousRoadsRef.current = roads
      }
      return
    }
    
    // Check if roads actually changed
    const roadsChanged = roads.some((road, idx) => {
      const prevRoad = previousRoadsRef.current[idx]
      return !prevRoad || road.congestion !== prevRoad.congestion || road.vehicleCount !== prevRoad.vehicleCount
    })
    
    if (!roadsChanged && previousRoadsRef.current.length === roads.length) {
      return // No changes, skip update
    }
    
    // If roads haven't been drawn yet, draw them
    if (!roadsDrawnRef.current) {
      drawRoads()
      roadsDrawnRef.current = true
      previousRoadsRef.current = roads
      return
    }
    
    // Clear previous timeout
    if (roadsUpdateRef.current) {
      clearTimeout(roadsUpdateRef.current)
    }
    
    // Debounce updates to prevent blinking (only update paint properties, not full redraw)
    roadsUpdateRef.current = setTimeout(() => {
      updateRoadsOnMap()
      previousRoadsRef.current = roads
    }, 300) // Increased debounce time to prevent blinking
    
    return () => {
      if (roadsUpdateRef.current) {
        clearTimeout(roadsUpdateRef.current)
      }
    }
  }, [roads])

  // Optimized function to update roads without full redraw
  const updateRoadsOnMap = () => {
    if (!map.current || roads.length === 0) return

    roads.forEach((road) => {
      const sourceId = `road-${road.id}`
      const layerId = `road-${road.id}`
      
      // Only update paint properties if layer exists (no full redraw)
      if (map.current!.getLayer(layerId)) {
        const currentColor = map.current!.getPaintProperty(layerId, 'line-color')
        const newColor = getCongestionColor(road.congestion)
        const newWidth = getCongestionWidth(road.congestion)
        
        // Only update if congestion actually changed
        if (currentColor !== newColor) {
          map.current!.setPaintProperty(layerId, 'line-color', newColor)
          map.current!.setPaintProperty(layerId, 'line-width', newWidth)
        }
      }
    })
  }

  const drawRoads = () => {
    if (!map.current || roads.length === 0) return

    roads.forEach((road) => {
      const sourceId = `road-${road.id}`
      const layerId = `road-${road.id}`
      
      // Only create if doesn't exist
      if (!map.current!.getSource(sourceId)) {
        // Create new road source and layer
        map.current!.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {
              name: road.name,
              congestion: road.congestion,
              speed: road.speed,
              vehicleCount: road.vehicleCount,
            },
            geometry: {
              type: 'LineString',
              coordinates: road.coordinates,
            },
          },
        })

        map.current!.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': getCongestionColor(road.congestion),
            'line-width': getCongestionWidth(road.congestion),
            'line-opacity': 0.9,
          },
        })

        map.current!.addLayer({
          id: `road-label-${road.id}`,
          type: 'symbol',
          source: sourceId,
          layout: {
            'text-field': road.name,
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 1.25],
            'text-anchor': 'top',
            'text-size': 11,
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 2,
          },
        })

        map.current!.on('click', `road-${road.id}`, () => {
          setSelectedRoad(road.id)
          setActivePanel('roads')
        })

        map.current!.on('mouseenter', `road-${road.id}`, () => {
          map.current!.getCanvas().style.cursor = 'pointer'
        })

        map.current!.on('mouseleave', `road-${road.id}`, () => {
          map.current!.getCanvas().style.cursor = ''
        })
      }
    })
  }

  const addSignalMarkers = (signalData: any[]) => {
    if (!map.current) return

    // Clear existing markers first
    markersRef.current.forEach(marker => {
      marker.remove()
      // Cleanup event listener if exists
      if ((marker as any)._clickHandler) {
        window.removeEventListener('signal-click', (marker as any)._clickHandler)
      }
    })
    markersRef.current = []

    signalData.forEach((signal) => {
      if (!signal.longitude || !signal.latitude) return

      const el = document.createElement('div')
      el.className = 'signal-marker'
      el.style.width = '20px'
      el.style.height = '20px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = signal.status === 'active' ? '#10b981' : '#ef4444'
      el.style.border = '3px solid white'
      el.style.cursor = 'pointer'
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.6)'
      el.style.transition = 'all 0.2s'
      el.style.position = 'relative'
      el.style.zIndex = '100'
      
      // Add hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)'
        el.style.zIndex = '1000'
      })
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)'
        el.style.zIndex = '100'
      })

      // Create click handler
      const handleClick = () => {
        setSelectedSignal(signal.id || signal.signal_id)
        setActivePanel('signals')
        // Close popup if open
        marker.getPopup()?.remove()
      }

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat([signal.longitude, signal.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, closeOnClick: false })
            .setHTML(`
              <div class="p-3 min-w-[200px]">
                <h3 class="font-bold text-sm mb-2 text-gray-900">${signal.signal_id || 'Signal'}</h3>
                <div class="space-y-1 text-xs">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Status:</span>
                    <span class="font-semibold ${signal.status === 'active' ? 'text-green-600' : 'text-red-600'}">
                      ${signal.status || 'Unknown'}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Phase:</span>
                    <span class="font-semibold">${signal.current_phase || 'N/A'}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Mode:</span>
                    <span class="font-semibold">${signal.mode || 'Auto'}</span>
                  </div>
                  <button 
                    onclick="window.dispatchEvent(new CustomEvent('signal-click', { detail: '${signal.id || signal.signal_id}' }))"
                    class="mt-2 w-full px-3 py-1.5 bg-primary-500 text-white text-xs rounded hover:bg-primary-600 transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            `)
        )
        .addTo(map.current!)

      // Add click listener to marker element
      el.addEventListener('click', handleClick)
      
      // Listen for custom event from popup button
      const signalId = signal.id || signal.signal_id
      const clickHandler = ((e: CustomEvent) => {
        if (e.detail === signalId) {
          handleClick()
        }
      }) as EventListener
      
      window.addEventListener('signal-click', clickHandler)
      
      // Store marker and handler for cleanup
      ;(marker as any)._clickHandler = clickHandler
      markersRef.current.push(marker)
    })
  }

  const createDiversion = (fromRoad: string, toRoad: string, reason: string) => {
    const newDiversion: TrafficDiversion = {
      id: `div-${Date.now()}`,
      fromRoad,
      toRoad,
      reason,
      active: true,
      timestamp: new Date(),
    }
    setDiversions([...diversions, newDiversion])
    
    setRoads(prevRoads => prevRoads.map(road => {
      if (road.id === fromRoad) {
        return { ...road, congestion: 'low' as const, vehicleCount: Math.max(0, road.vehicleCount - 100) }
      }
      if (road.id === toRoad) {
        return { ...road, congestion: 'medium' as const, vehicleCount: road.vehicleCount + 50 }
      }
      return road
    }))
  }

  const totalVehicles = roads.reduce((sum, r) => sum + r.vehicleCount, 0)
  const avgSpeed = roads.length > 0 ? Math.round(roads.reduce((sum, r) => sum + r.speed, 0) / roads.length) : 0
  const severeCongestion = roads.filter(r => r.congestion === 'severe').length

  return (
    <div className="space-y-4">
      {/* Control Center Header */}
      <div className="premium-card p-4 bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-primary-500/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Navigation className="w-6 h-6" />
              Traffic Control Center - Mumbai
            </h2>
            <p className="text-sm text-gray-300 mt-1">
              {zone ? (
                <>
                  {zone.name}, {zone.city}
                  {zone.pincode && (
                    <span className="ml-2 px-2 py-0.5 bg-primary-500/30 rounded text-xs">
                      Pincode: {zone.pincode}
                    </span>
                  )}
                </>
              ) : (
                'City-Wide Monitoring - All Mumbai Zones'
              )}
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-400">{roads.length}</div>
              <div className="text-gray-400">Roads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{signals.length}</div>
              <div className="text-gray-400">Signals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{diversions.length}</div>
              <div className="text-gray-400">Diversions</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Left Control Panels */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto max-h-[calc(100vh-250px)]">
          {/* Status Overview */}
          <div className="premium-card p-4 bg-gray-900 border border-gray-700 flex-shrink-0">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              System Status
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Vehicles:</span>
                <span className="text-white font-semibold">{totalVehicles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Speed:</span>
                <span className="text-white font-semibold">{avgSpeed} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Severe Congestion:</span>
                <span className="text-red-400 font-semibold">{severeCongestion}</span>
              </div>
            </div>
          </div>

          {/* Road Status List */}
          <div className="premium-card p-4 bg-gray-900 border border-gray-700 overflow-y-auto">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Road Network
            </h3>
            <div className="space-y-2">
              {roads.map((road) => (
                <motion.div
                  key={road.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    setSelectedRoad(road.id)
                    setActivePanel('roads')
                  }}
                  className={`p-2 rounded cursor-pointer transition-all border ${
                    selectedRoad === road.id
                      ? 'bg-primary-500/20 border-primary-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCongestionColor(road.congestion) }}
                      ></div>
                      <span className="text-xs text-white truncate">{road.name}</span>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      road.congestion === 'severe' ? 'bg-red-900 text-red-200' :
                      road.congestion === 'high' ? 'bg-red-800 text-red-300' :
                      road.congestion === 'medium' ? 'bg-yellow-800 text-yellow-300' :
                      'bg-green-800 text-green-300'
                    }`}>
                      {road.congestion.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                    <span>{road.vehicleCount} vehicles • {road.speed} km/h</span>
                    {road.pincode && (
                      <span className="text-gray-400 ml-2">📮 {road.pincode}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Map Display */}
        <div className="lg:col-span-2 min-h-0 flex flex-col">
          <div className="premium-card p-2 bg-gray-900 border border-gray-700 flex-1 min-h-0 flex flex-col">
            <div className="w-full flex-1 rounded overflow-hidden min-h-[600px]">
              <div ref={mapContainer} className="w-full h-full" />
            </div>
          </div>
        </div>

        {/* Right Control Panels */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto max-h-[calc(100vh-250px)]">
          {/* Diversion Control */}
          {selectedRoad && (
            <div className="premium-card p-4 bg-gray-900 border border-gray-700 flex-shrink-0">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                Traffic Diversion
              </h3>
              <div className="space-y-2">
                <select
                  id="diversion-select"
                  className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white"
                  defaultValue=""
                >
                  <option value="">Select route...</option>
                  {roads
                    .filter(r => r.id !== selectedRoad && r.congestion !== 'severe')
                    .map(road => (
                      <option key={road.id} value={road.id}>
                        {road.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => {
                    const select = document.getElementById('diversion-select') as HTMLSelectElement
                    const altRoadId = select?.value
                    if (altRoadId) {
                      const altRoad = roads.find(r => r.id === altRoadId)
                      const fromRoad = roads.find(r => r.id === selectedRoad)
                      if (altRoad && fromRoad) {
                        createDiversion(selectedRoad, altRoad.id, `Diversion from ${fromRoad.name}`)
                        select.value = ''
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-semibold transition"
                >
                  Create Diversion
                </button>
              </div>
            </div>
          )}

          {/* Active Diversions */}
          <div className="premium-card p-4 bg-gray-900 border border-gray-700 overflow-y-auto">
            <h3 className="text-sm font-bold text-white mb-3">Active Diversions</h3>
            <div className="space-y-2">
              {diversions.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No active diversions</p>
              ) : (
                diversions.map((div) => {
                  const fromRoad = roads.find(r => r.id === div.fromRoad)
                  const toRoad = roads.find(r => r.id === div.toRoad)
                  return (
                    <div
                      key={div.id}
                      className="p-2 bg-yellow-900/30 border border-yellow-700 rounded text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-yellow-300 font-semibold truncate">
                            {fromRoad?.name} → {toRoad?.name}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">{div.reason}</p>
                        </div>
                        <button
                          onClick={() => setDiversions(diversions.filter(d => d.id !== div.id))}
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Zone Info */}
          {zone && (
            <div className="premium-card p-4 bg-blue-900/30 border border-blue-700 flex-shrink-0">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Zone Information
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Zone:</span>
                  <span className="text-white font-semibold">{zone.name}</span>
                </div>
                {zone.pincode && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pincode:</span>
                    <span className="text-white font-semibold">{zone.pincode}</span>
                  </div>
                )}
                {zone.pincodes && (
                  <div className="mt-2">
                    <span className="text-gray-400 text-xs">All Pincodes:</span>
                    <p className="text-white text-xs mt-1 break-all">{zone.pincodes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="premium-card p-4 bg-gray-900 border border-gray-700 flex-shrink-0">
            <h3 className="text-sm font-bold text-white mb-3">Traffic Legend</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500 rounded"></div>
                <span className="text-gray-300">Low Traffic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-yellow-500 rounded"></div>
                <span className="text-gray-300">Medium Traffic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-red-500 rounded"></div>
                <span className="text-gray-300">High Traffic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-red-800 rounded"></div>
                <span className="text-gray-300">Severe Congestion</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

