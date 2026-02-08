/**
 * Mumbai Road Networks with Proper Pincodes
 * Final Year Project - Urban Flow Traffic Control System
 */

export interface RoadSegment {
  id: string
  name: string
  coordinates: [number, number][]
  congestion: 'low' | 'medium' | 'high' | 'severe'
  speed: number
  vehicleCount: number
  pincode: string
  zoneId: string
  zoneName: string
}

export const MUMBAI_ROADS: RoadSegment[] = [
  // South Mumbai (400001-400010)
  {
    id: 'mumbai-south-1',
    name: 'Marine Drive',
    coordinates: [[72.8215, 18.9400], [72.8250, 18.9420], [72.8285, 18.9440], [72.8320, 18.9460]],
    congestion: 'low',
    speed: 50,
    vehicleCount: 180,
    pincode: '400001',
    zoneId: 'south-mumbai',
    zoneName: 'South Mumbai',
  },
  {
    id: 'mumbai-south-2',
    name: 'Colaba Causeway',
    coordinates: [[72.8300, 18.9100], [72.8320, 18.9120], [72.8340, 18.9140]],
    congestion: 'high',
    speed: 25,
    vehicleCount: 480,
    pincode: '400001',
    zoneId: 'south-mumbai',
    zoneName: 'South Mumbai',
  },
  {
    id: 'mumbai-south-3',
    name: 'Nariman Point Road',
    coordinates: [[72.8250, 18.9200], [72.8270, 18.9220], [72.8290, 18.9240]],
    congestion: 'severe',
    speed: 15,
    vehicleCount: 680,
    pincode: '400021',
    zoneId: 'south-mumbai',
    zoneName: 'South Mumbai',
  },
  {
    id: 'mumbai-south-4',
    name: 'Fort Area Road',
    coordinates: [[72.8350, 18.9300], [72.8370, 18.9320]],
    congestion: 'medium',
    speed: 35,
    vehicleCount: 280,
    pincode: '400001',
    zoneId: 'south-mumbai',
    zoneName: 'South Mumbai',
  },
  
  // Central Mumbai (400011-400020)
  {
    id: 'mumbai-central-1',
    name: 'Dadar TT Circle',
    coordinates: [[72.8450, 19.0150], [72.8470, 19.0170], [72.8490, 19.0190]],
    congestion: 'severe',
    speed: 20,
    vehicleCount: 650,
    pincode: '400014',
    zoneId: 'central-mumbai',
    zoneName: 'Central Mumbai',
  },
  {
    id: 'mumbai-central-2',
    name: 'Parel Road',
    coordinates: [[72.8400, 19.0100], [72.8420, 19.0120]],
    congestion: 'high',
    speed: 30,
    vehicleCount: 520,
    pincode: '400012',
    zoneId: 'central-mumbai',
    zoneName: 'Central Mumbai',
  },
  {
    id: 'mumbai-central-3',
    name: 'Worli Sea Face',
    coordinates: [[72.8150, 19.0000], [72.8170, 19.0020], [72.8190, 19.0040]],
    congestion: 'medium',
    speed: 40,
    vehicleCount: 320,
    pincode: '400018',
    zoneId: 'central-mumbai',
    zoneName: 'Central Mumbai',
  },
  {
    id: 'mumbai-central-4',
    name: 'Lower Parel Road',
    coordinates: [[72.8380, 19.0080], [72.8400, 19.0100]],
    congestion: 'high',
    speed: 28,
    vehicleCount: 450,
    pincode: '400013',
    zoneId: 'central-mumbai',
    zoneName: 'Central Mumbai',
  },
  
  // Western Suburbs (400050-400059)
  {
    id: 'mumbai-west-1',
    name: 'Western Express Highway',
    coordinates: [[72.8500, 19.1000], [72.8520, 19.1020], [72.8540, 19.1040], [72.8560, 19.1060]],
    congestion: 'high',
    speed: 30,
    vehicleCount: 520,
    pincode: '400053',
    zoneId: 'western-suburbs',
    zoneName: 'Western Suburbs',
  },
  {
    id: 'mumbai-west-2',
    name: 'Andheri-Kurla Road',
    coordinates: [[72.8600, 19.1100], [72.8620, 19.1120], [72.8640, 19.1140]],
    congestion: 'severe',
    speed: 18,
    vehicleCount: 720,
    pincode: '400053',
    zoneId: 'western-suburbs',
    zoneName: 'Western Suburbs',
  },
  {
    id: 'mumbai-west-3',
    name: 'Bandra-Worli Sea Link Approach',
    coordinates: [[72.8200, 19.0500], [72.8220, 19.0520], [72.8240, 19.0540]],
    congestion: 'medium',
    speed: 35,
    vehicleCount: 280,
    pincode: '400050',
    zoneId: 'western-suburbs',
    zoneName: 'Western Suburbs',
  },
  {
    id: 'mumbai-west-4',
    name: 'Juhu Tara Road',
    coordinates: [[72.8300, 19.1000], [72.8320, 19.1020]],
    congestion: 'low',
    speed: 45,
    vehicleCount: 200,
    pincode: '400049',
    zoneId: 'western-suburbs',
    zoneName: 'Western Suburbs',
  },
  {
    id: 'mumbai-west-5',
    name: 'Santacruz Road',
    coordinates: [[72.8400, 19.0800], [72.8420, 19.0820]],
    congestion: 'medium',
    speed: 38,
    vehicleCount: 300,
    pincode: '400054',
    zoneId: 'western-suburbs',
    zoneName: 'Western Suburbs',
  },
  
  // North Mumbai (400060-400069)
  {
    id: 'mumbai-north-1',
    name: 'SV Road (Borivali)',
    coordinates: [[72.8700, 19.2200], [72.8720, 19.2220], [72.8740, 19.2240]],
    congestion: 'high',
    speed: 28,
    vehicleCount: 480,
    pincode: '400092',
    zoneId: 'north-mumbai',
    zoneName: 'North Mumbai',
  },
  {
    id: 'mumbai-north-2',
    name: 'Link Road (Kandivali)',
    coordinates: [[72.8800, 19.2100], [72.8820, 19.2120], [72.8840, 19.2140]],
    congestion: 'medium',
    speed: 38,
    vehicleCount: 350,
    pincode: '400067',
    zoneId: 'north-mumbai',
    zoneName: 'North Mumbai',
  },
  {
    id: 'mumbai-north-3',
    name: 'Goregaon-Malad Link Road',
    coordinates: [[72.8500, 19.1800], [72.8520, 19.1820]],
    congestion: 'high',
    speed: 25,
    vehicleCount: 450,
    pincode: '400063',
    zoneId: 'north-mumbai',
    zoneName: 'North Mumbai',
  },
  {
    id: 'mumbai-north-4',
    name: 'Malad Road',
    coordinates: [[72.8480, 19.1850], [72.8500, 19.1870]],
    congestion: 'medium',
    speed: 32,
    vehicleCount: 380,
    pincode: '400064',
    zoneId: 'north-mumbai',
    zoneName: 'North Mumbai',
  },
]



