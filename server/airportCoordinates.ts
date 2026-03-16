export interface AirportInfo {
  iata: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
}

const airports: Record<string, AirportInfo> = {
  JFK: { iata: "JFK", name: "John F. Kennedy International Airport", city: "New York", lat: 40.6413, lng: -73.7781 },
  LAX: { iata: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", lat: 33.9425, lng: -118.4081 },
  ORD: { iata: "ORD", name: "O'Hare International Airport", city: "Chicago", lat: 41.9742, lng: -87.9073 },
  ATL: { iata: "ATL", name: "Hartsfield-Jackson Atlanta International Airport", city: "Atlanta", lat: 33.6407, lng: -84.4277 },
  DFW: { iata: "DFW", name: "Dallas/Fort Worth International Airport", city: "Dallas", lat: 32.8998, lng: -97.0403 },
  DEN: { iata: "DEN", name: "Denver International Airport", city: "Denver", lat: 39.8561, lng: -104.6737 },
  SFO: { iata: "SFO", name: "San Francisco International Airport", city: "San Francisco", lat: 37.6213, lng: -122.379 },
  SEA: { iata: "SEA", name: "Seattle-Tacoma International Airport", city: "Seattle", lat: 47.4502, lng: -122.3088 },
  MIA: { iata: "MIA", name: "Miami International Airport", city: "Miami", lat: 25.7959, lng: -80.287 },
  BOS: { iata: "BOS", name: "Boston Logan International Airport", city: "Boston", lat: 42.3656, lng: -71.0096 },
  EWR: { iata: "EWR", name: "Newark Liberty International Airport", city: "Newark", lat: 40.6895, lng: -74.1745 },
  IAD: { iata: "IAD", name: "Washington Dulles International Airport", city: "Washington", lat: 38.9531, lng: -77.4565 },
  LHR: { iata: "LHR", name: "Heathrow Airport", city: "London", lat: 51.47, lng: -0.4543 },
  LGW: { iata: "LGW", name: "Gatwick Airport", city: "London", lat: 51.1537, lng: -0.1821 },
  CDG: { iata: "CDG", name: "Charles de Gaulle Airport", city: "Paris", lat: 49.0097, lng: 2.5479 },
  FRA: { iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt", lat: 50.0379, lng: 8.5622 },
  AMS: { iata: "AMS", name: "Amsterdam Schiphol Airport", city: "Amsterdam", lat: 52.3105, lng: 4.7683 },
  MAD: { iata: "MAD", name: "Adolfo Suárez Madrid–Barajas Airport", city: "Madrid", lat: 40.4983, lng: -3.5676 },
  BCN: { iata: "BCN", name: "Barcelona–El Prat Airport", city: "Barcelona", lat: 41.2974, lng: 2.0833 },
  FCO: { iata: "FCO", name: "Leonardo da Vinci–Fiumicino Airport", city: "Rome", lat: 41.8003, lng: 12.2389 },
  MXP: { iata: "MXP", name: "Milan Malpensa Airport", city: "Milan", lat: 45.63, lng: 8.7231 },
  IST: { iata: "IST", name: "Istanbul Airport", city: "Istanbul", lat: 41.2753, lng: 28.7519 },
  DXB: { iata: "DXB", name: "Dubai International Airport", city: "Dubai", lat: 25.2532, lng: 55.3657 },
  AUH: { iata: "AUH", name: "Abu Dhabi International Airport", city: "Abu Dhabi", lat: 24.433, lng: 54.6511 },
  DOH: { iata: "DOH", name: "Hamad International Airport", city: "Doha", lat: 25.2731, lng: 51.6081 },
  SIN: { iata: "SIN", name: "Singapore Changi Airport", city: "Singapore", lat: 1.3644, lng: 103.9915 },
  HKG: { iata: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", lat: 22.308, lng: 113.9185 },
  NRT: { iata: "NRT", name: "Narita International Airport", city: "Tokyo", lat: 35.7647, lng: 140.3864 },
  HND: { iata: "HND", name: "Haneda Airport", city: "Tokyo", lat: 35.5494, lng: 139.7798 },
  ICN: { iata: "ICN", name: "Incheon International Airport", city: "Seoul", lat: 37.4602, lng: 126.4407 },
  BKK: { iata: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", lat: 13.6899, lng: 100.7501 },
  SYD: { iata: "SYD", name: "Sydney Airport", city: "Sydney", lat: -33.9461, lng: 151.1772 },
  MEL: { iata: "MEL", name: "Melbourne Airport", city: "Melbourne", lat: -37.6733, lng: 144.8433 },
  YYZ: { iata: "YYZ", name: "Toronto Pearson International Airport", city: "Toronto", lat: 43.6777, lng: -79.6248 },
  YVR: { iata: "YVR", name: "Vancouver International Airport", city: "Vancouver", lat: 49.1967, lng: -123.1815 },
  GRU: { iata: "GRU", name: "São Paulo–Guarulhos International Airport", city: "São Paulo", lat: -23.4356, lng: -46.4731 },
  EZE: { iata: "EZE", name: "Ministro Pistarini International Airport", city: "Buenos Aires", lat: -34.8222, lng: -58.5358 },
  MEX: { iata: "MEX", name: "Mexico City International Airport", city: "Mexico City", lat: 19.4363, lng: -99.0721 },
  CUN: { iata: "CUN", name: "Cancún International Airport", city: "Cancún", lat: 21.0365, lng: -86.8771 },
  JED: { iata: "JED", name: "King Abdulaziz International Airport", city: "Jeddah", lat: 21.6796, lng: 39.1565 },
  RUH: { iata: "RUH", name: "King Khalid International Airport", city: "Riyadh", lat: 24.9578, lng: 46.6989 },
  MCT: { iata: "MCT", name: "Muscat International Airport", city: "Muscat", lat: 23.5933, lng: 58.2844 },
  CAI: { iata: "CAI", name: "Cairo International Airport", city: "Cairo", lat: 30.1219, lng: 31.4056 },
  JNB: { iata: "JNB", name: "O.R. Tambo International Airport", city: "Johannesburg", lat: -26.1392, lng: 28.246 },
  CPT: { iata: "CPT", name: "Cape Town International Airport", city: "Cape Town", lat: -33.9715, lng: 18.6021 },
  NBO: { iata: "NBO", name: "Jomo Kenyatta International Airport", city: "Nairobi", lat: -1.3192, lng: 36.9278 },
  DEL: { iata: "DEL", name: "Indira Gandhi International Airport", city: "New Delhi", lat: 28.5562, lng: 77.1 },
  BOM: { iata: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", lat: 19.0896, lng: 72.8656 },
  PEK: { iata: "PEK", name: "Beijing Capital International Airport", city: "Beijing", lat: 40.0799, lng: 116.6031 },
  PVG: { iata: "PVG", name: "Shanghai Pudong International Airport", city: "Shanghai", lat: 31.1443, lng: 121.8083 },
  KUL: { iata: "KUL", name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", lat: 2.7456, lng: 101.7099 },
  MNL: { iata: "MNL", name: "Ninoy Aquino International Airport", city: "Manila", lat: 14.5086, lng: 121.0198 },
  LIS: { iata: "LIS", name: "Lisbon Airport", city: "Lisbon", lat: 38.7742, lng: -9.1342 },
  ZRH: { iata: "ZRH", name: "Zurich Airport", city: "Zurich", lat: 47.4647, lng: 8.5492 },
  VIE: { iata: "VIE", name: "Vienna International Airport", city: "Vienna", lat: 48.1103, lng: 16.5697 },
  MUC: { iata: "MUC", name: "Munich Airport", city: "Munich", lat: 48.3537, lng: 11.775 },
  CPH: { iata: "CPH", name: "Copenhagen Airport", city: "Copenhagen", lat: 55.618, lng: 12.656 },
  OSL: { iata: "OSL", name: "Oslo Gardermoen Airport", city: "Oslo", lat: 60.1976, lng: 11.1004 },
  ARN: { iata: "ARN", name: "Stockholm Arlanda Airport", city: "Stockholm", lat: 59.6519, lng: 17.9186 },
  HEL: { iata: "HEL", name: "Helsinki-Vantaa Airport", city: "Helsinki", lat: 60.3172, lng: 24.9633 },
  DUB: { iata: "DUB", name: "Dublin Airport", city: "Dublin", lat: 53.4264, lng: -6.2499 },
  ATH: { iata: "ATH", name: "Athens International Airport", city: "Athens", lat: 37.9364, lng: 23.9445 },
  DME: { iata: "DME", name: "Domodedovo International Airport", city: "Moscow", lat: 55.4088, lng: 37.9063 },
  WAW: { iata: "WAW", name: "Warsaw Chopin Airport", city: "Warsaw", lat: 52.1657, lng: 20.9671 },
  PRG: { iata: "PRG", name: "Václav Havel Airport Prague", city: "Prague", lat: 50.1008, lng: 14.26 },
  BUD: { iata: "BUD", name: "Budapest Ferenc Liszt International Airport", city: "Budapest", lat: 47.4298, lng: 19.2611 },
};

export function getAirportByIata(iata: string): AirportInfo | undefined {
  return airports[iata.toUpperCase()];
}

export function getAllAirports(): AirportInfo[] {
  return Object.values(airports);
}
