# Real-Time Data Sources - Free & Public APIs

## Overview
This project integrates multiple **free** real-time data sources to provide realistic traffic information for Mumbai city.

## Integrated Data Sources

### 1. **Time-Based Traffic Patterns** ✅ (Always Available)
- **Source**: Mumbai rush hour patterns
- **Cost**: Free
- **Features**:
  - Morning rush: 8-10 AM (1.5x traffic)
  - Evening rush: 6-8 PM (1.6x traffic)
  - Weekend patterns (lower traffic)
  - Night patterns (minimal traffic)
- **Update Frequency**: Real-time based on current time

### 2. **OpenStreetMap (OSM) Overpass API** ✅ (Free)
- **Source**: https://overpass-api.de/api/interpreter
- **Cost**: Completely free, no API key required
- **Features**:
  - Real road network geometries
  - Highway classifications
  - Road names and types
- **Usage**: Fetches Mumbai road network data
- **Rate Limits**: Generous, suitable for academic use

### 3. **Weather-Based Traffic Simulation** ✅ (Free)
- **Source**: Simulated weather patterns (can integrate OpenWeatherMap)
- **Cost**: Free (simulated) or Free tier available
- **Features**:
  - Rain increases traffic by 40%
  - Fog increases traffic by 30%
  - Clear weather: normal patterns
- **Impact**: Weather directly affects traffic density

### 4. **WebSocket Real-Time Updates** ✅ (Built-in)
- **Source**: Custom WebSocket service
- **Cost**: Free (self-hosted)
- **Features**:
  - Live traffic updates every 15 seconds
  - Signal phase changes
  - Road congestion updates
  - Emergency alerts

## API Endpoints

### Get Traffic Pattern
```
GET /api/v1/realtime/traffic-pattern
```
Returns current traffic pattern based on time of day.

### Get Weather Data
```
GET /api/v1/realtime/weather
```
Returns weather conditions affecting traffic.

### Get Road Congestion
```
GET /api/v1/realtime/road-congestion
```
Returns current road congestion levels.

### Get OSM Data (Super Admin Only)
```
GET /api/v1/realtime/osm-data
```
Returns OpenStreetMap road network data for Mumbai.

## Optional: OpenWeatherMap Integration

To use real weather data (optional):

1. Sign up at https://openweathermap.org/api (Free tier: 60 calls/minute)
2. Get API key
3. Update `realtime_data_service.py`:
   ```python
   OPENWEATHER_API_KEY = "your_api_key_here"
   url = f"https://api.openweathermap.org/data/2.5/weather?lat=19.0760&lon=72.8777&appid={OPENWEATHER_API_KEY}"
   ```

## Data Flow

```
Real-Time Data Service
├── Time-Based Patterns (Mumbai rush hours)
├── Weather Conditions (affects traffic)
├── OpenStreetMap (road network)
└── WebSocket Broadcasting (live updates)
    └── Frontend receives updates every 15 seconds
```

## Features

✅ **No API Keys Required** (for basic functionality)  
✅ **Free Forever** (OpenStreetMap, time-based patterns)  
✅ **Realistic Patterns** (based on Mumbai traffic)  
✅ **Weather Integration** (affects traffic density)  
✅ **Real-Time Updates** (WebSocket broadcasting)  
✅ **Academic Use** (perfect for final year project)  

## Update Frequencies

- **Traffic Data**: Every 15 seconds
- **Road Congestion**: Every 30 seconds
- **Signal Updates**: Every 30 seconds
- **Weather Data**: Every 5 minutes (if using real API)

## Mumbai-Specific Patterns

The system uses actual Mumbai traffic patterns:
- **Peak Hours**: 8-10 AM, 6-8 PM
- **Weekend Traffic**: 30% lower than weekdays
- **Monsoon Impact**: Rain increases traffic by 40%
- **Night Traffic**: Minimal (30% of normal)

---

**Status**: ✅ **Real-Time Data Integration Complete - All Free Sources**



