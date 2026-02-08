import { useState, useEffect } from 'react'
import { aiExplanationApi } from '../../lib/api'
import { Brain, TrendingUp } from 'lucide-react'

interface ExplainableAIPanelProps {
  signalId: string
}

export default function ExplainableAIPanel({ signalId }: ExplainableAIPanelProps) {
  const [explanation, setExplanation] = useState<any>(null)

  useEffect(() => {
    loadExplanation()
    const interval = setInterval(loadExplanation, 5000)
    return () => clearInterval(interval)
  }, [signalId])

  const loadExplanation = async () => {
    try {
      const response = await aiExplanationApi.getLatest(signalId)
      setExplanation(response.data)
    } catch (error) {
      console.error('Failed to load explanation', error)
    }
  }

  if (!explanation) return <div className="premium-card p-6">Loading AI explanation...</div>

  return (
    <div className="premium-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-primary-500" />
        <h3 className="text-xl font-semibold">AI Explanation</h3>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Decision</p>
          <p className="font-semibold">{explanation.decision}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Reason</p>
          <p className="text-sm">{explanation.reason}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold">{(explanation.confidence * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}


