import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import OperatorMapView from '../components/operator/OperatorMapView'
import SignalControlPanel from '../components/operator/SignalControlPanel'
import ExplainableAIPanel from '../components/operator/ExplainableAIPanel'
import EmergencyControl from '../components/operator/EmergencyControl'
import LiveTrafficStats from '../components/operator/LiveTrafficStats'
import { useAuthStore } from '../store/authStore'
import { wsService } from '../lib/websocket'
import { signalsApi } from '../lib/api'

export default function OperatorDashboard() {
  const { user } = useAuthStore()
  const [signals, setSignals] = useState<any[]>([])
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null)

  useEffect(() => {
    loadSignals()
    
    wsService.on('traffic_update', () => {
      loadSignals()
    })
    
    wsService.on('signal_update', () => {
      loadSignals()
    })

    return () => {
      wsService.off('traffic_update', loadSignals)
      wsService.off('signal_update', loadSignals)
    }
  }, [])

  const loadSignals = async () => {
    try {
      const response = await signalsApi.getAll(user?.zone_id)
      setSignals(response.data)
    } catch (error) {
      console.error('Failed to load signals', error)
    }
  }

  return (
    <Layout>
      <div className="space-y-6 pb-6">
        <div className="premium-card p-6 flex-shrink-0">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
            Operator Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage traffic signals in your assigned zone
          </p>
        </div>

        <div className="flex-shrink-0">
          <LiveTrafficStats />
        </div>

        {/* Traffic Control Center - Full Width */}
        <div className="min-h-0">
          <OperatorMapView
            signals={signals}
            onSignalSelect={setSelectedSignal}
          />
        </div>

        {/* Control Panels */}
        {selectedSignal && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-shrink-0">
            <SignalControlPanel signalId={selectedSignal} />
            <ExplainableAIPanel signalId={selectedSignal} />
          </div>
        )}
        
        <div className="flex-shrink-0">
          <EmergencyControl />
        </div>
      </div>
    </Layout>
  )
}


