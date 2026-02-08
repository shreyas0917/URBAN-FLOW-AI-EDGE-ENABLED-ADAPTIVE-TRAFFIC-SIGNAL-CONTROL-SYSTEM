import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { emergencyApi, signalsApi } from '../../lib/api'
import { Truck, AlertTriangle, MapPin, Zap, CheckCircle, XCircle, Clock, Navigation, Building2 } from 'lucide-react'
import { MUMBAI_LOCATIONS, findNearestHospital, getHospitals, getLandmarks, type MumbaiLocation } from '../../data/mumbai_locations'

export default function EmergencyVehicleManagement() {
  const [activeRoutes, setActiveRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    start_location: '',
    end_location: '',
    start_latitude: 19.0760,
    start_longitude: 72.8777,
    end_latitude: 19.0810,
    end_longitude: 72.8827,
    vehicle_type: 'ambulance',
    priority: 1,
    clear_signals: true,
    use_nearest_hospital: false,
  })
  const [alerts, setAlerts] = useState<Array<{id: string, message: string, type: 'success' | 'warning' | 'error', timestamp: Date}>>([])

  useEffect(() => {
    loadActiveRoutes()
    const interval = setInterval(loadActiveRoutes, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadActiveRoutes = async () => {
    try {
      const response = await emergencyApi.getActiveRoutes()
      setActiveRoutes(response.data || [])
    } catch (error) {
      console.error('Failed to load emergency routes', error)
    }
  }

  const handleLocationChange = (field: 'start_location' | 'end_location', locationId: string) => {
    const location = MUMBAI_LOCATIONS.find(loc => loc.id === locationId)
    if (location) {
      if (field === 'start_location') {
        setFormData({
          ...formData,
          start_location: locationId,
          start_latitude: location.latitude,
          start_longitude: location.longitude,
        })
        
        // If "use nearest hospital" is checked, find and set nearest hospital
        if (formData.use_nearest_hospital) {
          const nearestHospital = findNearestHospital(location.latitude, location.longitude)
          if (nearestHospital) {
            setFormData(prev => ({
              ...prev,
              end_location: nearestHospital.id,
              end_latitude: nearestHospital.latitude,
              end_longitude: nearestHospital.longitude,
            }))
            addAlert('success', `Nearest hospital found: ${nearestHospital.name} (${nearestHospital.area})`)
          }
        }
      } else {
        setFormData({
          ...formData,
          end_location: locationId,
          end_latitude: location.latitude,
          end_longitude: location.longitude,
        })
      }
    }
  }

  const handleUseNearestHospital = (checked: boolean) => {
    setFormData({ ...formData, use_nearest_hospital: checked })
    if (checked && formData.start_location) {
      const startLoc = MUMBAI_LOCATIONS.find(loc => loc.id === formData.start_location)
      if (startLoc) {
        const nearestHospital = findNearestHospital(startLoc.latitude, startLoc.longitude)
        if (nearestHospital) {
          setFormData(prev => ({
            ...prev,
            end_location: nearestHospital.id,
            end_latitude: nearestHospital.latitude,
            end_longitude: nearestHospital.longitude,
          }))
          addAlert('success', `Nearest hospital: ${nearestHospital.name} (${nearestHospital.area})`)
        }
      }
    }
  }

  const addAlert = (type: 'success' | 'warning' | 'error', message: string) => {
    const alert = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date(),
    }
    setAlerts(prev => [...prev, alert])
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== alert.id))
    }, 5000)
  }

  const createEmergencyRoute = async () => {
    if (!formData.name.trim()) {
      addAlert('error', 'Please enter a route name')
      return
    }
    
    if (!formData.start_location || !formData.end_location) {
      addAlert('error', 'Please select both start and destination locations')
      return
    }
    
    setLoading(true)
    try {
      const routeData = {
        name: formData.name,
        start_latitude: formData.start_latitude,
        start_longitude: formData.start_longitude,
        end_latitude: formData.end_latitude,
        end_longitude: formData.end_longitude,
        vehicle_type: formData.vehicle_type,
        priority: formData.priority,
        clear_signals: formData.clear_signals,
      }
      
      const response = await emergencyApi.createRoute(routeData)
      if (response.data) {
        const signalsCleared = response.data.signals_cleared?.length || 0
        addAlert('success', `🚨 Emergency route created! ${signalsCleared} signal(s) cleared for fast passage.`)
        
        setShowCreate(false)
        setFormData({
          name: '',
          start_location: '',
          end_location: '',
          start_latitude: 19.0760,
          start_longitude: 72.8777,
          end_latitude: 19.0810,
          end_longitude: 72.8827,
          vehicle_type: 'ambulance',
          priority: 1,
          clear_signals: true,
          use_nearest_hospital: false,
        })
        loadActiveRoutes()
      }
    } catch (error: any) {
      console.error('Failed to create emergency route', error)
      addAlert('error', error.response?.data?.detail || 'Failed to create emergency route')
    } finally {
      setLoading(false)
    }
  }

  const deactivateRoute = async (routeId: string) => {
    if (!confirm('Deactivate this emergency route and restore normal signal operation?')) {
      return
    }
    
    setLoading(true)
    try {
      await emergencyApi.deactivateRoute(routeId)
      addAlert('success', 'Emergency route deactivated. Signals restored to normal operation.')
      loadActiveRoutes()
    } catch (error) {
      console.error('Failed to deactivate route', error)
      addAlert('error', 'Failed to deactivate route')
    } finally {
      setLoading(false)
    }
  }

  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ambulance':
        return '🚑'
      case 'fire_truck':
      case 'firetruck':
        return '🚒'
      case 'police':
        return '🚓'
      default:
        return '🚨'
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 3) return 'bg-red-500'
    if (priority === 2) return 'bg-orange-500'
    return 'bg-yellow-500'
  }

  return (
    <div className="space-y-6">
      {/* Alerts/Notifications */}
      {alerts.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className={`p-4 rounded-lg shadow-lg border-2 ${
                alert.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-200'
                  : alert.type === 'warning'
                  ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500 text-yellow-800 dark:text-yellow-200'
                  : 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {alert.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : alert.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <p className="font-semibold">{alert.message}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="premium-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Emergency Vehicle Management
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Create routes and clear traffic signals for emergency vehicles
              </p>
            </div>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowCreate(!showCreate)
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              showCreate
                ? 'bg-gray-500 text-white'
                : 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/50'
            }`}
          >
            {showCreate ? (
              <>
                <XCircle className="w-5 h-5" />
                Cancel
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                New Emergency Route
              </>
            )}
          </motion.button>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border-2 border-red-200 dark:border-red-800 mb-6"
          >
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Create Emergency Vehicle Route
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Route Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Ambulance to Hospital"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Vehicle Type
                </label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="ambulance">🚑 Ambulance</option>
                  <option value="fire_truck">🚒 Fire Truck</option>
                  <option value="police">🚓 Police Vehicle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  From Location *
                </label>
                <select
                  value={formData.start_location}
                  onChange={(e) => handleLocationChange('start_location', e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select Starting Location</option>
                  <optgroup label="🏥 Hospitals">
                    {getHospitals().map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} - {loc.area} ({loc.pincode})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="📍 Landmarks & Key Points">
                    {getLandmarks().map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.type === 'railway_station' ? '🚂' : loc.type === 'airport' ? '✈️' : '📍'} {loc.name} - {loc.area}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🚓 Police Stations">
                    {MUMBAI_LOCATIONS.filter(loc => loc.type === 'police_station').map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} - {loc.area}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🚒 Fire Stations">
                    {MUMBAI_LOCATIONS.filter(loc => loc.type === 'fire_station').map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} - {loc.area}
                      </option>
                    ))}
                  </optgroup>
                </select>
                {formData.start_location && (
                  <p className="text-xs text-gray-500 mt-1">
                    {MUMBAI_LOCATIONS.find(l => l.id === formData.start_location)?.description}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  To Location *
                </label>
                <select
                  value={formData.end_location}
                  onChange={(e) => handleLocationChange('end_location', e.target.value)}
                  disabled={formData.use_nearest_hospital}
                  className={`w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 ${
                    formData.use_nearest_hospital ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">Select Destination</option>
                  {formData.use_nearest_hospital ? (
                    <option value={formData.end_location}>
                      🏥 {MUMBAI_LOCATIONS.find(l => l.id === formData.end_location)?.name || 'Nearest Hospital'} (Auto-selected)
                    </option>
                  ) : (
                    <>
                      <optgroup label="🏥 Hospitals">
                        {getHospitals().map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} - {loc.area} ({loc.pincode})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="📍 Landmarks & Key Points">
                        {getLandmarks().map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.type === 'railway_station' ? '🚂' : loc.type === 'airport' ? '✈️' : '📍'} {loc.name} - {loc.area}
                          </option>
                        ))}
                      </optgroup>
                    </>
                  )}
                </select>
                {formData.end_location && (
                  <p className="text-xs text-gray-500 mt-1">
                    {MUMBAI_LOCATIONS.find(l => l.id === formData.end_location)?.description}
                  </p>
                )}
              </div>
              <div className="md:col-span-2 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.use_nearest_hospital}
                    onChange={(e) => handleUseNearestHospital(e.target.checked)}
                    className="w-5 h-5 text-red-500 rounded focus:ring-red-500"
                    id="nearest-hospital"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-blue-800 dark:text-blue-300">
                        Auto-select Nearest Government Hospital
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Automatically find and route to the nearest government hospital from selected starting location
                    </p>
                  </div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Priority Level
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value={1}>Low (1)</option>
                  <option value={2}>Medium (2)</option>
                  <option value={3}>High (3)</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.clear_signals}
                    onChange={(e) => setFormData({ ...formData, clear_signals: e.target.checked })}
                    className="w-5 h-5 text-red-500 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Automatically Clear Signals
                  </span>
                </label>
              </div>
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                createEmergencyRoute()
              }}
              disabled={loading || !formData.name.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-bold text-lg hover:shadow-lg shadow-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Route...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Create Emergency Route & Clear Signals
              </>
            )}
            </motion.button>
          </motion.div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Active Emergency Routes ({activeRoutes.length})
            </h4>
          </div>
          
          {activeRoutes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <Truck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400 font-semibold">No active emergency routes</p>
              <p className="text-sm text-gray-400 mt-2">Create a new route to clear traffic signals for emergency vehicles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRoutes.map((route) => (
                <motion.div
                  key={route.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 rounded-xl border-2 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{getVehicleIcon(route.vehicle_type)}</div>
                      <div>
                        <h5 className="font-bold text-lg text-gray-900 dark:text-white">
                          {route.name || `${route.vehicle_type.toUpperCase()} Route`}
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                          {route.vehicle_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getPriorityColor(route.priority)}`}>
                      Priority {route.priority}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Start:</p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">
                          {route.start_latitude.toFixed(4)}, {route.start_longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Navigation className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Destination:</p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">
                          {route.end_latitude.toFixed(4)}, {route.end_longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                    {route.signals_cleared && route.signals_cleared.length > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            {route.signals_cleared.length} Signal(s) Cleared
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Traffic signals set to green for emergency passage
                          </p>
                        </div>
                      </div>
                    )}
                    {route.estimated_arrival && (
                      <div className="flex items-start gap-2 text-sm">
                        <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-700 dark:text-gray-300">ETA:</p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs">
                            {new Date(route.estimated_arrival).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {route.created_by && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Created by: {route.created_by}
                      </p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => deactivateRoute(route.id)}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Deactivate & Restore Signals
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

