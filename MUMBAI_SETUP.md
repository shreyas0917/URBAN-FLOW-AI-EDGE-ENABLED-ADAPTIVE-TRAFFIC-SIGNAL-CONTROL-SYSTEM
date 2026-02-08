# Mumbai City Configuration - Final Year Project

## Overview
This project is configured specifically for **Mumbai City** with proper pincodes and zone-based access control.

## Mumbai Zones & Pincodes

### 1. South Mumbai
- **Pincodes**: 400001-400010
- **Areas**: Colaba, Fort, Marine Drive, Nariman Point
- **Operator**: operator1@urbanflow.gov
- **Major Roads**: Marine Drive, Colaba Causeway, Nariman Point Road, Fort Area Road

### 2. Central Mumbai
- **Pincodes**: 400011-400020
- **Areas**: Dadar, Parel, Worli, Lower Parel
- **Operator**: operator2@urbanflow.gov
- **Major Roads**: Dadar TT Circle, Parel Road, Worli Sea Face, Lower Parel Road

### 3. Western Suburbs
- **Pincodes**: 400050-400059
- **Areas**: Andheri, Bandra, Juhu, Santacruz
- **Operator**: operator3@urbanflow.gov
- **Major Roads**: Western Express Highway, Andheri-Kurla Road, Bandra-Worli Sea Link Approach, Juhu Tara Road

### 4. North Mumbai
- **Pincodes**: 400060-400069
- **Areas**: Borivali, Kandivali, Malad, Goregaon
- **Operator**: operator4@urbanflow.gov
- **Major Roads**: SV Road (Borivali), Link Road (Kandivali), Goregaon-Malad Link Road, Malad Road

## Database Initialization

### Option 1: Mumbai-Specific (Recommended)
```bash
cd backend
python scripts/init_db_mumbai.py
```

### Option 2: Standard (with Mumbai support)
```bash
cd backend
python scripts/init_db.py
```

## User Credentials

| Role | Email | Password | Zone Access |
|------|-------|----------|-------------|
| Super Admin | admin@urbanflow.gov | Admin@2024 | All Mumbai zones |
| Operator 1 | operator1@urbanflow.gov | Operator@2024 | South Mumbai (400001-400010) |
| Operator 2 | operator2@urbanflow.gov | Operator@2024 | Central Mumbai (400011-400020) |
| Operator 3 | operator3@urbanflow.gov | Operator@2024 | Western Suburbs (400050-400059) |
| Operator 4 | operator4@urbanflow.gov | Operator@2024 | North Mumbai (400060-400069) |
| Viewer | viewer@urbanflow.gov | Viewer@2024 | Read-only access |

## Features

### Zone-Based Access Control
- Each operator can **only see roads and signals** from their assigned zone
- Roads are filtered by pincode matching the operator's zone
- Super Admin can see all zones

### Road Network
- **18 major roads** across Mumbai with real pincodes
- Traffic congestion levels: Low, Medium, High, Severe
- Real-time vehicle counts and speeds
- Google Maps-style traffic visualization

### Traffic Signals
- **16 traffic signals** distributed across Mumbai zones
- Each signal assigned to specific zone with pincode
- Real-time status and phase control

## How It Works

1. **Operator Login**: Operator logs in with their credentials
2. **Zone Detection**: System detects operator's assigned zone
3. **Road Filtering**: Only roads from operator's zone pincodes are displayed
4. **Signal Filtering**: Only signals from operator's zone are shown
5. **Map Centering**: Map automatically centers on operator's zone

## Technical Details

### Database Schema
- `zones` table includes `pincode` and `pincodes` fields
- `pincode`: Primary pincode for the zone
- `pincodes`: Comma-separated list of all pincodes in the zone

### Frontend Filtering
- Roads filtered by matching `zoneId` with operator's zone name
- Pincode-based filtering ensures accurate zone boundaries
- Real-time updates maintain zone-specific view

## Project Structure

```
backend/
├── scripts/
│   ├── mumbai_data.py          # Mumbai zones, roads, signals
│   ├── init_db_mumbai.py        # Mumbai-specific initialization
│   └── init_db.py               # Standard initialization (with Mumbai support)
└── app/
    └── db/
        └── models.py            # Zone model with pincode fields

frontend/
├── src/
│   ├── data/
│   │   └── mumbai_roads.ts     # Mumbai road networks
│   └── components/
│       └── TrafficControlCenter.tsx  # Zone-based filtering
```

## Final Year Project Features

✅ **Real-world Data**: Mumbai city with actual pincodes  
✅ **Zone-based Access**: Operators see only their assigned area  
✅ **Pincode Filtering**: Accurate geographic boundaries  
✅ **Production-ready**: Industry-grade implementation  
✅ **Academic Quality**: Proper documentation and structure  

---

**Status**: ✅ **Mumbai Configuration Complete - Ready for Final Year Project**



