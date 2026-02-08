// Mumbai Locations Data - Hospitals, Landmarks, and Key Points
export interface MumbaiLocation {
  id: string
  name: string
  type: 'hospital' | 'landmark' | 'police_station' | 'fire_station' | 'airport' | 'railway_station'
  latitude: number
  longitude: number
  pincode: string
  area: string
  description?: string
}

export const MUMBAI_LOCATIONS: MumbaiLocation[] = [
  // Government Hospitals
  {
    id: 'hosp-001',
    name: 'JJ Hospital',
    type: 'hospital',
    latitude: 18.9600,
    longitude: 72.8350,
    pincode: '400008',
    area: 'Byculla',
    description: 'Sir Jamshedjee Jeejeebhoy Hospital - Major Government Hospital'
  },
  {
    id: 'hosp-002',
    name: 'KEM Hospital',
    type: 'hospital',
    latitude: 19.0020,
    longitude: 72.8420,
    pincode: '400012',
    area: 'Parel',
    description: 'King Edward Memorial Hospital - Premier Government Hospital'
  },
  {
    id: 'hosp-003',
    name: 'Sion Hospital',
    type: 'hospital',
    latitude: 19.0400,
    longitude: 72.8600,
    pincode: '400022',
    area: 'Sion',
    description: 'Lokmanya Tilak Municipal General Hospital'
  },
  {
    id: 'hosp-004',
    name: 'Cooper Hospital',
    type: 'hospital',
    latitude: 19.1200,
    longitude: 72.8300,
    pincode: '400056',
    area: 'Juhu',
    description: 'H.B.T. Medical College & Dr. R.N. Cooper Municipal General Hospital'
  },
  {
    id: 'hosp-005',
    name: 'Bhabha Hospital',
    type: 'hospital',
    latitude: 19.1800,
    longitude: 72.8500,
    pincode: '400064',
    area: 'Bandra',
    description: 'Bhabha Atomic Research Centre Hospital'
  },
  {
    id: 'hosp-006',
    name: 'Rajawadi Hospital',
    type: 'hospital',
    latitude: 19.1100,
    longitude: 72.8700,
    pincode: '400077',
    area: 'Ghatkopar',
    description: 'Rajawadi Municipal General Hospital'
  },
  
  // Landmarks & Key Points
  {
    id: 'land-001',
    name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)',
    type: 'railway_station',
    latitude: 18.9400,
    longitude: 72.8350,
    pincode: '400001',
    area: 'Fort',
    description: 'Main Railway Station'
  },
  {
    id: 'land-002',
    name: 'Mumbai Airport (T1)',
    type: 'airport',
    latitude: 19.0900,
    longitude: 72.8700,
    pincode: '400099',
    area: 'Santacruz',
    description: 'Chhatrapati Shivaji Maharaj International Airport Terminal 1'
  },
  {
    id: 'land-003',
    name: 'Mumbai Airport (T2)',
    type: 'airport',
    latitude: 19.0950,
    longitude: 72.8750,
    pincode: '400099',
    area: 'Santacruz',
    description: 'Chhatrapati Shivaji Maharaj International Airport Terminal 2'
  },
  {
    id: 'land-004',
    name: 'Gateway of India',
    type: 'landmark',
    latitude: 18.9220,
    longitude: 72.8340,
    pincode: '400001',
    area: 'Colaba',
    description: 'Historic Monument'
  },
  {
    id: 'land-005',
    name: 'Marine Drive',
    type: 'landmark',
    latitude: 18.9400,
    longitude: 72.8250,
    pincode: '400020',
    area: 'Marine Lines',
    description: 'Famous Promenade'
  },
  {
    id: 'land-006',
    name: 'Bandra-Worli Sea Link',
    type: 'landmark',
    latitude: 19.0400,
    longitude: 72.8200,
    pincode: '400050',
    area: 'Bandra',
    description: 'Major Bridge'
  },
  
  // Police Stations
  {
    id: 'police-001',
    name: 'Colaba Police Station',
    type: 'police_station',
    latitude: 18.9150,
    longitude: 72.8300,
    pincode: '400001',
    area: 'Colaba',
    description: 'Police Station'
  },
  {
    id: 'police-002',
    name: 'Bandra Police Station',
    type: 'police_station',
    latitude: 19.0600,
    longitude: 72.8300,
    pincode: '400050',
    area: 'Bandra',
    description: 'Police Station'
  },
  
  // Fire Stations
  {
    id: 'fire-001',
    name: 'Worli Fire Station',
    type: 'fire_station',
    latitude: 19.0000,
    longitude: 72.8150,
    pincode: '400018',
    area: 'Worli',
    description: 'Fire Station'
  },
  {
    id: 'fire-002',
    name: 'Andheri Fire Station',
    type: 'fire_station',
    latitude: 19.1100,
    longitude: 72.8600,
    pincode: '400053',
    area: 'Andheri',
    description: 'Fire Station'
  },
]

// Helper function to find nearest hospital
export function findNearestHospital(latitude: number, longitude: number): MumbaiLocation | null {
  const hospitals = MUMBAI_LOCATIONS.filter(loc => loc.type === 'hospital')
  if (hospitals.length === 0) return null
  
  let nearest = hospitals[0]
  let minDistance = calculateDistance(latitude, longitude, nearest.latitude, nearest.longitude)
  
  for (const hospital of hospitals) {
    const distance = calculateDistance(latitude, longitude, hospital.latitude, hospital.longitude)
    if (distance < minDistance) {
      minDistance = distance
      nearest = hospital
    }
  }
  
  return nearest
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Get locations by type
export function getLocationsByType(type: MumbaiLocation['type']): MumbaiLocation[] {
  return MUMBAI_LOCATIONS.filter(loc => loc.type === type)
}

// Get all hospitals
export function getHospitals(): MumbaiLocation[] {
  return getLocationsByType('hospital')
}

// Get all landmarks
export function getLandmarks(): MumbaiLocation[] {
  return MUMBAI_LOCATIONS.filter(loc => 
    loc.type === 'landmark' || 
    loc.type === 'railway_station' || 
    loc.type === 'airport'
  )
}
