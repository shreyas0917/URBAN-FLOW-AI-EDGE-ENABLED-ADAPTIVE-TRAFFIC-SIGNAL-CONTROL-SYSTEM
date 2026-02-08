import { useState, useEffect } from 'react'
import { emergencyApi } from '../../lib/api'
import { Truck, AlertTriangle, MapPin, CheckCircle, Building2, XCircle } from 'lucide-react'

export default function EmergencyControl() {
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
  })
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning'>('success')

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

  const handleLocationChange = (type: 'start' | 'end', locationId: string) => {
    const location = MUMBAI_LOCATIONS.find(loc => loc.id === locationId)
    if (location) {
      if (type === 'start') {
        setFormData({
          ...formData,
          start_location: locationId,
          start_latitude: location.latitude,
          start_longitude: location.longitude,
        })
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

  const findNearestHospitalToLocation = () => {
    if (!formData.start_location) {
      showAlertMessage('Please select a starting location first', 'warning')
      return
    }
    
    const startLocation = MUMBAI_LOCATIONS.find(loc => loc.id === formData.start_location)
    if (!startLocation) return
    
    const nearestHospital = findNearestHospital(startLocation.latitude, startLocation.longitude)
    if (nearestHospital) {
      setFormData({
        ...formData,
        end_location: nearestHospital.id,
        end_latitude: nearestHospital.latitude,
        end_longitude: nearestHospital.longitude,
        name: `Emergency Route: ${startLocation.name} to ${nearestHospital.name}`,
      })
      showAlertMessage(
        `Nearest hospital found: ${nearestHospital.name}. Route configured automatically.`,
        'success'
      )
    } else {
      showAlertMessage('No hospital found nearby', 'error')
    }
  }

  const showAlertMessage = (message: string, type: 'success' | 'error' | 'warning') => {
    setAlertMessage(message)
    setAlertType(type)
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 5000)
  }

  const createEmergencyRoute = async () => {
    if (!formData.name.trim()) {
      showAlertMessage('Please enter a route name', 'warning')
      return
    }
    
    if (!formData.start_location || !formData.end_location) {
      showAlertMessage('Please select both start and end locations', 'warning')
      return
    }
    
    setLoading(true)
    try {
      const response = await emergencyApi.createRoute({
        name: formData.name,
        start_latitude: formData.start_latitude,
        start_longitude: formData.start_longitude,
        end_latitude: formData.end_latitude,
        end_longitude: formData.end_longitude,
        vehicle_type: formData.vehicle_type,
        priority: formData.priority,
        clear_signals: formData.clear_signals,
      })
      
      if (response.data) {
        const signalsCleared = response.data.signals_cleared?.length || 0
        showAlertMessage(
          `🚨 Emergency Route Created! ${signalsCleared} signal(s) cleared along the route. Traffic signals are now green for emergency passage.`,
          'success'
        )
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
        })
        loadActiveRoutes()
      }
    } catch (error: any) {
      console.error('Failed to create emergency route', error)
      showAlertMessage(
        error.response?.data?.detail || 'Failed to create emergency route',
        'error'
      )
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

  return (
    <div className="premium-card p-6">
      {/* Alerts */}
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
                <Bell className="w-5 h-5" />
                <p className="font-semibold">{alert.message}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-red-500" />
          <h3 className="text-xl font-semibold">Emergency Control</h3>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowCreate(!showCreate)
          }}
          className="px-3 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition text-sm"
        >
          {showCreate ? 'Cancel' : 'New Route'}
        </button>
      </div>

      {showCreate && (
        <div className="mb-4 p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border-2 border-red-200 dark:border-red-800">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Create Emergency Route
          </h4>
          <div className="space-y-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Route Name *</label>
              <input
                type="text"
                placeholder="e.g., Emergency Response Route"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">From Location *</label>
                <select
                  value={formData.start_location}
                  onChange={(e) => handleLocationChange('start_location', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm"
                >
                  <option value="">Select Starting Location</option>
                  <optgroup label="Hospitals">
                    {getHospitals().map(loc => (
                      <option key={loc.id} value={loc.id}>
                        🏥 {loc.name} - {loc.area}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Landmarks">
                    {getLandmarks().map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.type === 'railway_station' ? '🚂' : loc.type === 'airport' ? '✈️' : '📍'} {loc.name} - {loc.area}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">To Location *</label>
                <select
                  value={formData.end_location}
                  onChange={(e) => handleLocationChange('end_location', e.target.value)}
                  disabled={formData.use_nearest_hospital}
                  className={`w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm ${
                    formData.use_nearest_hospital ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">Select Destination</option>
                  {formData.use_nearest_hospital ? (
                    <option value={formData.end_location}>
                      🏥 {MUMBAI_LOCATIONS.find(l => l.id === formData.end_location)?.name || 'Nearest Hospital'}
                    </option>
                  ) : (
                    <optgroup label="Hospitals">
                      {getHospitals().map(loc => (
                        <option key={loc.id} value={loc.id}>
                          🏥 {loc.name} - {loc.area}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.use_nearest_hospital}
                  onChange={(e) => handleUseNearestHospital(e.target.checked)}
                  className="w-4 h-4 text-red-500 rounded"
                  id="nearest-hospital"
                />
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                      Auto-select Nearest Government Hospital
                    </span>
                  </div>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Vehicle Type</label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm"
                >
                  <option value="ambulance">🚑 Ambulance</option>
                  <option value="fire_truck">🚒 Fire Truck</option>
                  <option value="police">🚓 Police</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm"
                >
                  <option value={1}>Low (1)</option>
                  <option value={2}>Medium (2)</option>
                  <option value={3}>High (3)</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.clear_signals}
                onChange={(e) => setFormData({ ...formData, clear_signals: e.target.checked })}
                className="w-4 h-4 text-red-500 rounded"
                id="clear-signals"
              />
              <label htmlFor="clear-signals" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                Automatically Clear Signals Along Route
              </label>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              createEmergencyRoute()
            }}
            disabled={loading || !formData.name.trim()}
            className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:shadow-lg shadow-red-500/50 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Emergency Route & Clear Signals'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {activeRoutes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No active emergency routes</p>
        ) : (
          activeRoutes.map((route) => (
            <div
              key={route.id}
              className="p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 border-2 border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {route.vehicle_type === 'ambulance' ? '🚑' : route.vehicle_type === 'fire_truck' ? '🚒' : '🚓'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {route.name || `${route.vehicle_type.toUpperCase()} Route`}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {route.vehicle_type.replace('_', ' ')} • Priority {route.priority}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deactivateRoute(route.id)}
                  disabled={loading}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition"
                >
                  Deactivate
                </button>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-red-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Start: {route.start_latitude.toFixed(4)}, {route.start_longitude.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-orange-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    End: {route.end_latitude.toFixed(4)}, {route.end_longitude.toFixed(4)}
                  </span>
                </div>
                {route.signals_cleared && route.signals_cleared.length > 0 && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    {route.signals_cleared.length} Signal(s) Cleared
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}


