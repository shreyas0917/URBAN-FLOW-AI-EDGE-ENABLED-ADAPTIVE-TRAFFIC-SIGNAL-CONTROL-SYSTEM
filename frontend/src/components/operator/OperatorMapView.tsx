import TrafficControlCenter from '../TrafficControlCenter'

interface OperatorMapViewProps {
  signals: any[]
  onSignalSelect: (id: string) => void
}

export default function OperatorMapView({ signals, onSignalSelect }: OperatorMapViewProps) {
  return <TrafficControlCenter />
}


