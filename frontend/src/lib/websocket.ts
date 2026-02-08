import { authApi } from './api'

export type WebSocketMessage =
  | { type: 'traffic_update'; data: any }
  | { type: 'signal_update'; data: any }
  | { type: 'emergency_alert'; data: any }
  | { type: 'ai_explanation'; data: any }
  | { type: 'edge_update'; data: any }
  | { type: 'mqtt_data'; data: any }
  | { type: 'realtime_traffic_update'; data: any }
  | { type: 'road_congestion_update'; data: any }
  | { type: 'connected'; data: any }
  | { type: 'pong'; data: any }
  | { type: 'error'; data: any }

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  connect(token: string) {
    const wsUrl = `ws://localhost:8000/ws?token=${token}`
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.notifyListeners(message.type, message.data)
      } catch (error) {
        console.error('Failed to parse WebSocket message', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error', error)
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => {
          const token = localStorage.getItem('token')
          if (token) this.connect(token)
        }, 3000 * this.reconnectAttempts)
      }
    }
  }

  on(type: string, callback: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(callback)
  }

  off(type: string, callback: (data: any) => void) {
    this.listeners.get(type)?.delete(callback)
  }

  private notifyListeners(type: string, data: any) {
    this.listeners.get(type)?.forEach((callback) => callback(data))
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.listeners.clear()
  }
}

export const wsService = new WebSocketService()


