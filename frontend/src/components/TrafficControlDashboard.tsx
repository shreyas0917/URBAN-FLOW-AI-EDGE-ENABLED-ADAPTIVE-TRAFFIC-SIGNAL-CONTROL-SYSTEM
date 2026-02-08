import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Navigation, AlertTriangle, CheckCircle, XCircle, ArrowRightLeft, MapPin } from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { signalsApi } from '../lib/api'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoic2hyZXlhczIyMDciLCJhIjoiY21sM2d2aWI2MGxmbDNncXR4ODIzdTJkMCJ9._XBc8GZlGXctOZmzzR1S7A'

interface RoadSegment {
  id: string
  name: string
  coordinates: [number, number][]
  congestion: 'low' | 'medium' | 'high' | 'severe'
  speed: number
  vehicleCount: number
}

interface TrafficDiversion {
  id: string
  fromRoad: string
  toRoad: string
  reason: string
  active: boolean
}

export default function TrafficControlDashboard() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [signals, setSignals] = useState<any[]>([])
  const [roads, setRoads] = useState<RoadSegment[]>([])
  const [diversions, setDiversions] = useState<TrafficDiversion[]>([])
  const [selectedRoad, setSelectedRoad] = useState<string | null>(null)

  // Simulated road network for Mumbai
  const roadNetworks: RoadSegment[] = [
    // Mumbai Roads
    {
      id: 'road-4',
      name: 'Western Express Highway',
      coordinates: [[72.85, 19.10], [72.87, 19.12], [72.89, 19.14]],
      congestion: 'high',
      speed: 30,
      vehicleCount: 520,
    },
    {
      id: 'road-5',
      name: 'Marine Drive',
      coordinates: [[72.82, 18.94], [72.84, 18.95], [72.86, 18.96]],
      congestion: 'low',
      speed: 50,
      vehicleCount: 180,
    },
  ]

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    if (!MAPBOX_TOKEN) {
      console.error('Mapbox token missing')
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [72.8777, 19.0760], // Mumbai
      zoom: 11,
      attributionControl: true,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.current.on('load', () => {
      loadSignals()
      initializeRoads()
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update roads on map when roads state changes
  useEffect(() => {
    if (!map.current || roads.length === 0) return
    
    // Redraw roads with updated congestion
    roads.forEach((road) => {
      const sourceId = `road-${road.id}`
      const source = map.current!.getSource(sourceId) as mapboxgl.GeoJSONSource
      
      if (source) {
        source.setData({
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
        })

        // Update road color
        const color = getCongestionColor(road.congestion)
        const width = getCongestionWidth(road.congestion)
        
        if (map.current!.getLayer(`road-${road.id}`)) {
          map.current!.setPaintProperty(`road-${road.id}`, 'line-color', color)
          map.current!.setPaintProperty(`road-${road.id}`, 'line-width', width)
        }
      }
    })
  }, [roads])

  const loadSignals = async () => {
    try {
      const response = await signalsApi.getAll()
      setSignals(response.data)
      addSignalMarkers(response.data)
    } catch (error) {
      console.error('Failed to load signals', error)
    }
  }

  const initializeRoads = () => {
    setRoads(roadNetworks)
    drawRoads(roadNetworks)
  }

  const getCongestionColor = (congestion: string): string => {
    switch (congestion) {
      case 'low':
        return '#10b981' // Green
      case 'medium':
        return '#f59e0b' // Yellow/Orange
      case 'high':
        return '#ef4444' // Red
      case 'severe':
        return '#991b1b' // Dark Red
      default:
        return '#6b7280' // Gray
    }
  }

  const getCongestionWidth = (congestion: string): number => {
    switch (congestion) {
      case 'low':
        return 3
      case 'medium':
        return 5
      case 'high':
        return 7
      case 'severe':
        return 9
      default:
        return 3
    }
  }

  const drawRoads = (roadData: RoadSegment[]) => {
    if (!map.current) return

    roadData.forEach((road) => {
      const color = getCongestionColor(road.congestion)
      const width = getCongestionWidth(road.congestion)

      // Add road as a source
      if (!map.current!.getSource(`road-${road.id}`)) {
        map.current!.addSource(`road-${road.id}`, {
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

        // Add road layer
        map.current!.addLayer({
          id: `road-${road.id}`,
          type: 'line',
          source: `road-${road.id}`,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': color,
            'line-width': width,
            'line-opacity': 0.8,
          },
        })

        // Add road label
        map.current!.addLayer({
          id: `road-label-${road.id}`,
          type: 'symbol',
          source: `road-${road.id}`,
          layout: {
            'text-field': road.name,
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 1.25],
            'text-anchor': 'top',
            'text-size': 12,
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 2,
          },
        })

        // Make roads clickable
        map.current!.on('click', `road-${road.id}`, (e) => {
          setSelectedRoad(road.id)
        })

        // Change cursor on hover
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
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)'

      new mapboxgl.Marker(el)
        .setLngLat([signal.longitude, signal.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-3">
                <h3 class="font-bold">${signal.signal_id || 'Signal'}</h3>
                <p class="text-sm">Status: ${signal.status}</p>
                <p class="text-sm">Phase: ${signal.current_phase}</p>
              </div>
            `)
        )
        .addTo(map.current)
    })
  }

  const createDiversion = (fromRoad: string, toRoad: string, reason: string) => {
    const newDiversion: TrafficDiversion = {
      id: `div-${Date.now()}`,
      fromRoad,
      toRoad,
      reason,
      active: true,
    }
    setDiversions([...diversions, newDiversion])
    
    // Update road congestion (simulate traffic reduction)
    setRoads(roads.map(road => {
      if (road.id === fromRoad) {
        return { ...road, congestion: 'low' as const, vehicleCount: Math.max(0, road.vehicleCount - 100) }
      }
      if (road.id === toRoad) {
        return { ...road, congestion: 'medium' as const, vehicleCount: road.vehicleCount + 50 }
      }
      return road
    }))
  }

  const removeDiversion = (id: string) => {
    setDiversions(diversions.filter(d => d.id !== id))
  }

  const selectedRoadData = roads.find(r => r.id === selectedRoad)

  return (
    <div className="space-y-4">
      {/* Traffic Control Panel */}
      <div className="premium-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Traffic Control Center
          </h3>
          <div className="flex gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-800"></div>
              <span>Severe</span>
            </div>
          </div>
        </div>

        {/* Road Status List */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {roads.map((road) => (
            <motion.div
              key={road.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setSelectedRoad(road.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedRoad === road.id
                  ? 'bg-primary-500/20 border-2 border-primary-500'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getCongestionColor(road.congestion) }}
                  ></div>
                  <div>
                    <p className="font-semibold text-sm">{road.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {road.vehicleCount} vehicles • {road.speed} km/h
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    road.congestion === 'severe' ? 'bg-red-900 text-red-200' :
                    road.congestion === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                    road.congestion === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {road.congestion.toUpperCase()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="premium-card p-4">
        <div className="w-full h-[500px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div ref={mapContainer} className="w-full h-full" />
        </div>
      </div>

      {/* Diversion Controls */}
      {selectedRoadData && (
        <div className="premium-card p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Traffic Diversion for {selectedRoadData.name}
          </h3>
          <div className="space-y-3">
            <select
              id="diversion-select"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              defaultValue=""
            >
              <option value="">Select alternative route...</option>
              {roads
                .filter(r => r.id !== selectedRoadData.id && r.congestion !== 'severe')
                .map(road => (
                  <option key={road.id} value={road.id}>
                    {road.name} ({road.congestion} traffic)
                  </option>
                ))}
            </select>
            <button
              onClick={() => {
                const select = document.getElementById('diversion-select') as HTMLSelectElement
                const altRoadId = select?.value
                if (altRoadId) {
                  const altRoad = roads.find(r => r.id === altRoadId)
                  if (altRoad) {
                    createDiversion(selectedRoadData.id, altRoad.id, 'High congestion detected')
                    select.value = ''
                  }
                } else {
                  const altRoad = roads.find(r => r.id !== selectedRoadData.id && r.congestion !== 'severe')
                  if (altRoad) {
                    createDiversion(selectedRoadData.id, altRoad.id, 'High congestion detected')
                  }
                }
              }}
              className="w-full premium-button flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              Create Diversion Route
            </button>
          </div>
        </div>
      )}

      {/* Active Diversions */}
      {diversions.length > 0 && (
        <div className="premium-card p-4">
          <h3 className="font-bold mb-3">Active Diversions</h3>
          <div className="space-y-2">
            {diversions.map((div) => (
              <div
                key={div.id}
                className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">
                      {roads.find(r => r.id === div.fromRoad)?.name} → {roads.find(r => r.id === div.toRoad)?.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{div.reason}</p>
                  </div>
                  <button
                    onClick={() => removeDiversion(div.id)}
                    className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

