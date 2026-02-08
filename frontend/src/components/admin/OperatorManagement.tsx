import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, User, Mail, MapPin, Search, Edit, Trash2, Shield } from 'lucide-react'
import { operatorsApi, zonesApi } from '../../lib/api'

interface Operator {
  id: string
  email: string
  name: string
  role: string
  zone_id?: string
}

interface Zone {
  id: string
  name: string
  city: string
}

export default function OperatorManagement() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    zone_id: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [operatorsRes, zonesRes] = await Promise.all([
        operatorsApi.getAll(),
        zonesApi.getAll(),
      ])
      setOperators(operatorsRes.data)
      setZones(zonesRes.data)
    } catch (error) {
      console.error('Failed to load data', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await operatorsApi.create({
        ...formData,
        zone_id: formData.zone_id || undefined,
      })
      setShowCreateModal(false)
      setFormData({ email: '', password: '', name: '', zone_id: '' })
      loadData()
    } catch (error: any) {
      console.error('Failed to create operator', error)
      alert(error.response?.data?.detail || 'Failed to create operator')
    }
  }

  const handleAssignZone = async (operatorId: string, zoneId: string) => {
    try {
      await operatorsApi.assignZone(operatorId, zoneId)
      loadData()
    } catch (error) {
      console.error('Failed to assign zone', error)
      alert('Failed to assign zone')
    }
  }

  const getZoneName = (zoneId?: string) => {
    if (!zoneId) return 'Unassigned'
    const zone = zones.find((z) => z.id === zoneId)
    if (!zone) return 'Unknown Zone'
    return `${zone.name}, ${zone.city}`
  }
  
  const getZonePincodes = (zoneId?: string) => {
    if (!zoneId) return null
    const zone = zones.find((z) => z.id === zoneId)
    return zone && (zone as any).pincodes ? (zone as any).pincodes : null
  }

  const filteredOperators = operators.filter(
    (op) =>
      op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="premium-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Operator Management</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage traffic operators and their zone assignments
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="premium-button flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Operator
          </motion.button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search operators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOperators.map((operator) => (
              <motion.div
                key={operator.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-card p-5 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{operator.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          operator.role === 'operator' 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        }`}>
                          {operator.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {operator.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {getZoneName(operator.zone_id)}
                        </span>
                        {getZonePincodes(operator.zone_id) && (
                          <span className="text-xs text-gray-500">
                            📮 {getZonePincodes(operator.zone_id)?.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={operator.zone_id || ''}
                      onChange={(e) => handleAssignZone(operator.id, e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Unassigned</option>
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                    <button className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {filteredOperators.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            No operators found
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="premium-card p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">Create New Operator</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Assign Zone (Optional)</label>
                <select
                  value={formData.zone_id}
                  onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">No Zone</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} - {zone.city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 premium-button">
                  Create Operator
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
