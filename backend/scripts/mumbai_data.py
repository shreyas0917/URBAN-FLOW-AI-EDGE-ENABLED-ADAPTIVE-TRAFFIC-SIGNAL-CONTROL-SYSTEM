"""
Mumbai City Data with Proper Pincodes
Final Year Project - Urban Flow Traffic Control System
"""

# Mumbai Zones with Real Pincodes
MUMBAI_ZONES = [
    {
        "name": "South Mumbai",
        "city": "Mumbai",
        "pincodes": ["400001", "400002", "400003", "400004", "400005", "400006", "400007", "400008", "400009", "400010"],
        "latitude": 18.9388,
        "longitude": 72.8354,
        "area": "Colaba, Fort, Marine Drive, Nariman Point"
    },
    {
        "name": "Central Mumbai",
        "city": "Mumbai",
        "pincodes": ["400011", "400012", "400013", "400014", "400015", "400016", "400017", "400018", "400019", "400020"],
        "latitude": 19.0176,
        "longitude": 72.8562,
        "area": "Dadar, Parel, Worli, Lower Parel"
    },
    {
        "name": "Western Suburbs",
        "city": "Mumbai",
        "pincodes": ["400050", "400051", "400052", "400053", "400054", "400055", "400056", "400057", "400058", "400059"],
        "latitude": 19.1136,
        "longitude": 72.8697,
        "area": "Andheri, Bandra, Juhu, Santacruz"
    },
    {
        "name": "North Mumbai",
        "city": "Mumbai",
        "pincodes": ["400060", "400061", "400062", "400063", "400064", "400065", "400066", "400067", "400068", "400069"],
        "latitude": 19.2183,
        "longitude": 72.9781,
        "area": "Borivali, Kandivali, Malad, Goregaon"
    },
]

# Major Roads in Mumbai with Pincodes
MUMBAI_ROADS = [
    # South Mumbai (400001-400010)
    {
        "id": "mumbai-south-1",
        "name": "Marine Drive",
        "coordinates": [[72.8215, 18.9400], [72.8250, 18.9420], [72.8285, 18.9440], [72.8320, 18.9460]],
        "pincode": "400001",
        "zone": "South Mumbai",
        "congestion": "low",
        "speed": 50,
        "vehicleCount": 180,
    },
    {
        "id": "mumbai-south-2",
        "name": "Colaba Causeway",
        "coordinates": [[72.8300, 18.9100], [72.8320, 18.9120], [72.8340, 18.9140]],
        "pincode": "400001",
        "zone": "South Mumbai",
        "congestion": "high",
        "speed": 25,
        "vehicleCount": 480,
    },
    {
        "id": "mumbai-south-3",
        "name": "Nariman Point Road",
        "coordinates": [[72.8250, 18.9200], [72.8270, 18.9220], [72.8290, 18.9240]],
        "pincode": "400021",
        "zone": "South Mumbai",
        "congestion": "severe",
        "speed": 15,
        "vehicleCount": 680,
    },
    {
        "id": "mumbai-south-4",
        "name": "Fort Area Road",
        "coordinates": [[72.8350, 18.9300], [72.8370, 18.9320]],
        "pincode": "400001",
        "zone": "South Mumbai",
        "congestion": "medium",
        "speed": 35,
        "vehicleCount": 280,
    },
    
    # Central Mumbai (400011-400020)
    {
        "id": "mumbai-central-1",
        "name": "Dadar TT Circle",
        "coordinates": [[72.8450, 19.0150], [72.8470, 19.0170], [72.8490, 19.0190]],
        "pincode": "400014",
        "zone": "Central Mumbai",
        "congestion": "severe",
        "speed": 20,
        "vehicleCount": 650,
    },
    {
        "id": "mumbai-central-2",
        "name": "Parel Road",
        "coordinates": [[72.8400, 19.0100], [72.8420, 19.0120]],
        "pincode": "400012",
        "zone": "Central Mumbai",
        "congestion": "high",
        "speed": 30,
        "vehicleCount": 520,
    },
    {
        "id": "mumbai-central-3",
        "name": "Worli Sea Face",
        "coordinates": [[72.8150, 19.0000], [72.8170, 19.0020], [72.8190, 19.0040]],
        "pincode": "400018",
        "zone": "Central Mumbai",
        "congestion": "medium",
        "speed": 40,
        "vehicleCount": 320,
    },
    
    # Western Suburbs (400050-400059)
    {
        "id": "mumbai-west-1",
        "name": "Western Express Highway",
        "coordinates": [[72.8500, 19.1000], [72.8520, 19.1020], [72.8540, 19.1040], [72.8560, 19.1060]],
        "pincode": "400053",
        "zone": "Western Suburbs",
        "congestion": "high",
        "speed": 30,
        "vehicleCount": 520,
    },
    {
        "id": "mumbai-west-2",
        "name": "Andheri-Kurla Road",
        "coordinates": [[72.8600, 19.1100], [72.8620, 19.1120], [72.8640, 19.1140]],
        "pincode": "400053",
        "zone": "Western Suburbs",
        "congestion": "severe",
        "speed": 18,
        "vehicleCount": 720,
    },
    {
        "id": "mumbai-west-3",
        "name": "Bandra-Worli Sea Link Approach",
        "coordinates": [[72.8200, 19.0500], [72.8220, 19.0520], [72.8240, 19.0540]],
        "pincode": "400050",
        "zone": "Western Suburbs",
        "congestion": "medium",
        "speed": 35,
        "vehicleCount": 280,
    },
    {
        "id": "mumbai-west-4",
        "name": "Juhu Tara Road",
        "coordinates": [[72.8300, 19.1000], [72.8320, 19.1020]],
        "pincode": "400049",
        "zone": "Western Suburbs",
        "congestion": "low",
        "speed": 45,
        "vehicleCount": 200,
    },
    
    # North Mumbai (400060-400069)
    {
        "id": "mumbai-north-1",
        "name": "SV Road (Borivali)",
        "coordinates": [[72.8700, 19.2200], [72.8720, 19.2220], [72.8740, 19.2240]],
        "pincode": "400092",
        "zone": "North Mumbai",
        "congestion": "high",
        "speed": 28,
        "vehicleCount": 480,
    },
    {
        "id": "mumbai-north-2",
        "name": "Link Road (Kandivali)",
        "coordinates": [[72.8800, 19.2100], [72.8820, 19.2120], [72.8840, 19.2140]],
        "pincode": "400067",
        "zone": "North Mumbai",
        "congestion": "medium",
        "speed": 38,
        "vehicleCount": 350,
    },
    {
        "id": "mumbai-north-3",
        "name": "Goregaon-Malad Link Road",
        "coordinates": [[72.8500, 19.1800], [72.8520, 19.1820]],
        "pincode": "400063",
        "zone": "North Mumbai",
        "congestion": "high",
        "speed": 25,
        "vehicleCount": 450,
    },
]

# Traffic Signals in Mumbai with Pincodes
MUMBAI_SIGNALS = [
    # South Mumbai
    {"signal_id": "MUM-S-001", "name": "Marine Drive Signal", "lat": 18.9400, "lon": 72.8250, "pincode": "400001", "zone": "South Mumbai"},
    {"signal_id": "MUM-S-002", "name": "Colaba Signal", "lat": 18.9120, "lon": 72.8320, "pincode": "400001", "zone": "South Mumbai"},
    {"signal_id": "MUM-S-003", "name": "Nariman Point Signal", "lat": 18.9220, "lon": 72.8270, "pincode": "400021", "zone": "South Mumbai"},
    {"signal_id": "MUM-S-004", "name": "Fort Signal", "lat": 18.9300, "lon": 72.8350, "pincode": "400001", "zone": "South Mumbai"},
    
    # Central Mumbai
    {"signal_id": "MUM-C-001", "name": "Dadar TT Signal", "lat": 19.0170, "lon": 72.8470, "pincode": "400014", "zone": "Central Mumbai"},
    {"signal_id": "MUM-C-002", "name": "Parel Signal", "lat": 19.0120, "lon": 72.8420, "pincode": "400012", "zone": "Central Mumbai"},
    {"signal_id": "MUM-C-003", "name": "Worli Signal", "lat": 19.0020, "lon": 72.8170, "pincode": "400018", "zone": "Central Mumbai"},
    {"signal_id": "MUM-C-004", "name": "Lower Parel Signal", "lat": 19.0080, "lon": 72.8380, "pincode": "400013", "zone": "Central Mumbai"},
    
    # Western Suburbs
    {"signal_id": "MUM-W-001", "name": "Andheri Signal", "lat": 19.1100, "lon": 72.8620, "pincode": "400053", "zone": "Western Suburbs"},
    {"signal_id": "MUM-W-002", "name": "Bandra Signal", "lat": 19.0520, "lon": 72.8220, "pincode": "400050", "zone": "Western Suburbs"},
    {"signal_id": "MUM-W-003", "name": "Juhu Signal", "lat": 19.1020, "lon": 72.8320, "pincode": "400049", "zone": "Western Suburbs"},
    {"signal_id": "MUM-W-004", "name": "Santacruz Signal", "lat": 19.0800, "lon": 72.8400, "pincode": "400054", "zone": "Western Suburbs"},
    
    # North Mumbai
    {"signal_id": "MUM-N-001", "name": "Borivali Signal", "lat": 19.2220, "lon": 72.8720, "pincode": "400092", "zone": "North Mumbai"},
    {"signal_id": "MUM-N-002", "name": "Kandivali Signal", "lat": 19.2120, "lon": 72.8820, "pincode": "400067", "zone": "North Mumbai"},
    {"signal_id": "MUM-N-003", "name": "Malad Signal", "lat": 19.1820, "lon": 72.8520, "pincode": "400064", "zone": "North Mumbai"},
    {"signal_id": "MUM-N-004", "name": "Goregaon Signal", "lat": 19.1750, "lon": 72.8480, "pincode": "400063", "zone": "North Mumbai"},
]



