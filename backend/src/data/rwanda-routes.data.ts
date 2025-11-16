/**
 * Comprehensive Rwanda Routes and Locations Data
 * This file contains all provinces, districts, cities, bus stations, and popular routes in Rwanda
 */

export interface Province {
  id: string;
  name: string;
  nameRw: string;
  nameFr: string;
  code: string;
  districts: District[];
}

export interface District {
  id: string;
  name: string;
  nameRw: string;
  nameFr: string;
  code: string;
  provinceId: string;
  cities: City[];
}

export interface City {
  id: string;
  name: string;
  nameRw: string;
  nameFr: string;
  districtId: string;
  latitude: number;
  longitude: number;
  isPopular: boolean;
  busStations: BusStation[];
}

export interface BusStation {
  id: string;
  name: string;
  nameRw: string;
  nameFr: string;
  cityId: string;
  address: string;
  latitude: number;
  longitude: number;
  facilities: string[];
  operatingHours: string;
  phoneNumber?: string;
  isMainStation: boolean;
}

export interface PopularRoute {
  id: string;
  fromCityId: string;
  toCityId: string;
  distance: number; // in kilometers
  estimatedDuration: number; // in minutes
  frequency: 'very_high' | 'high' | 'medium' | 'low';
  averagePrice: number; // in RWF
  isHighDemand: boolean;
  scenicRoute: boolean;
}

export interface TouristDestination {
  id: string;
  name: string;
  nameRw: string;
  nameFr: string;
  description: string;
  cityId: string;
  category: 'national_park' | 'museum' | 'memorial' | 'lake' | 'mountain' | 'cultural' | 'historical';
  latitude: number;
  longitude: number;
  entryFee?: number;
  openingHours?: string;
}

// PROVINCES DATA
export const provinces: Province[] = [
  {
    id: 'prov-kigali',
    name: 'Kigali City',
    nameRw: 'Umujyi wa Kigali',
    nameFr: 'Ville de Kigali',
    code: 'KGL',
    districts: []
  },
  {
    id: 'prov-eastern',
    name: 'Eastern Province',
    nameRw: 'Intara y\'Iburasirazuba',
    nameFr: 'Province de l\'Est',
    code: 'EST',
    districts: []
  },
  {
    id: 'prov-northern',
    name: 'Northern Province',
    nameRw: 'Intara y\'Amajyaruguru',
    nameFr: 'Province du Nord',
    code: 'NTH',
    districts: []
  },
  {
    id: 'prov-southern',
    name: 'Southern Province',
    nameRw: 'Intara y\'Amajyepfo',
    nameFr: 'Province du Sud',
    code: 'STH',
    districts: []
  },
  {
    id: 'prov-western',
    name: 'Western Province',
    nameRw: 'Intara y\'Iburengerazuba',
    nameFr: 'Province de l\'Ouest',
    code: 'WST',
    districts: []
  }
];

// DISTRICTS DATA
export const districts: District[] = [
  // Kigali City Districts
  { id: 'dist-gasabo', name: 'Gasabo', nameRw: 'Gasabo', nameFr: 'Gasabo', code: 'GSB', provinceId: 'prov-kigali', cities: [] },
  { id: 'dist-kicukiro', name: 'Kicukiro', nameRw: 'Kicukiro', nameFr: 'Kicukiro', code: 'KCK', provinceId: 'prov-kigali', cities: [] },
  { id: 'dist-nyarugenge', name: 'Nyarugenge', nameRw: 'Nyarugenge', nameFr: 'Nyarugenge', code: 'NYR', provinceId: 'prov-kigali', cities: [] },
  
  // Eastern Province Districts
  { id: 'dist-bugesera', name: 'Bugesera', nameRw: 'Bugesera', nameFr: 'Bugesera', code: 'BGS', provinceId: 'prov-eastern', cities: [] },
  { id: 'dist-gatsibo', name: 'Gatsibo', nameRw: 'Gatsibo', nameFr: 'Gatsibo', code: 'GTS', provinceId: 'prov-eastern', cities: [] },
  { id: 'dist-kayonza', name: 'Kayonza', nameRw: 'Kayonza', nameFr: 'Kayonza', code: 'KYZ', provinceId: 'prov-eastern', cities: [] },
  { id: 'dist-kirehe', name: 'Kirehe', nameRw: 'Kirehe', nameFr: 'Kirehe', code: 'KRH', provinceId: 'prov-eastern', cities: [] },
  { id: 'dist-ngoma', name: 'Ngoma', nameRw: 'Ngoma', nameFr: 'Ngoma', code: 'NGM', provinceId: 'prov-eastern', cities: [] },
  { id: 'dist-nyagatare', name: 'Nyagatare', nameRw: 'Nyagatare', nameFr: 'Nyagatare', code: 'NYG', provinceId: 'prov-eastern', cities: [] },
  { id: 'dist-rwamagana', name: 'Rwamagana', nameRw: 'Rwamagana', nameFr: 'Rwamagana', code: 'RWM', provinceId: 'prov-eastern', cities: [] },
  
  // Northern Province Districts
  { id: 'dist-burera', name: 'Burera', nameRw: 'Burera', nameFr: 'Burera', code: 'BRR', provinceId: 'prov-northern', cities: [] },
  { id: 'dist-gakenke', name: 'Gakenke', nameRw: 'Gakenke', nameFr: 'Gakenke', code: 'GKK', provinceId: 'prov-northern', cities: [] },
  { id: 'dist-gicumbi', name: 'Gicumbi', nameRw: 'Gicumbi', nameFr: 'Gicumbi', code: 'GCM', provinceId: 'prov-northern', cities: [] },
  { id: 'dist-musanze', name: 'Musanze', nameRw: 'Musanze', nameFr: 'Musanze', code: 'MSZ', provinceId: 'prov-northern', cities: [] },
  { id: 'dist-rulindo', name: 'Rulindo', nameRw: 'Rulindo', nameFr: 'Rulindo', code: 'RLD', provinceId: 'prov-northern', cities: [] },
  
  // Southern Province Districts
  { id: 'dist-gisagara', name: 'Gisagara', nameRw: 'Gisagara', nameFr: 'Gisagara', code: 'GSG', provinceId: 'prov-southern', cities: [] },
  { id: 'dist-huye', name: 'Huye', nameRw: 'Huye', nameFr: 'Huye', code: 'HYE', provinceId: 'prov-southern', cities: [] },
  { id: 'dist-kamonyi', name: 'Kamonyi', nameRw: 'Kamonyi', nameFr: 'Kamonyi', code: 'KMN', provinceId: 'prov-southern', cities: [] },
  { id: 'dist-muhanga', name: 'Muhanga', nameRw: 'Muhanga', nameFr: 'Muhanga', code: 'MHG', provinceId: 'prov-southern', cities: [] },
  { id: 'dist-nyamagabe', name: 'Nyamagabe', nameRw: 'Nyamagabe', nameFr: 'Nyamagabe', code: 'NYM', provinceId: 'prov-southern', cities: [] },
  { id: 'dist-nyanza', name: 'Nyanza', nameRw: 'Nyanza', nameFr: 'Nyanza', code: 'NYZ', provinceId: 'prov-southern', cities: [] },
  { id: 'dist-nyaruguru', name: 'Nyaruguru', nameRw: 'Nyaruguru', nameFr: 'Nyaruguru', code: 'NYU', provinceId: 'prov-southern', cities: [] },
  { id: 'dist-ruhango', name: 'Ruhango', nameRw: 'Ruhango', nameFr: 'Ruhango', code: 'RHG', provinceId: 'prov-southern', cities: [] },
  
  // Western Province Districts
  { id: 'dist-karongi', name: 'Karongi', nameRw: 'Karongi', nameFr: 'Karongi', code: 'KRG', provinceId: 'prov-western', cities: [] },
  { id: 'dist-ngororero', name: 'Ngororero', nameRw: 'Ngororero', nameFr: 'Ngororero', code: 'NGR', provinceId: 'prov-western', cities: [] },
  { id: 'dist-nyabihu', name: 'Nyabihu', nameRw: 'Nyabihu', nameFr: 'Nyabihu', code: 'NYB', provinceId: 'prov-western', cities: [] },
  { id: 'dist-nyamasheke', name: 'Nyamasheke', nameRw: 'Nyamasheke', nameFr: 'Nyamasheke', code: 'NYS', provinceId: 'prov-western', cities: [] },
  { id: 'dist-rubavu', name: 'Rubavu', nameRw: 'Rubavu', nameFr: 'Rubavu', code: 'RBV', provinceId: 'prov-western', cities: [] },
  { id: 'dist-rutsiro', name: 'Rutsiro', nameRw: 'Rutsiro', nameFr: 'Rutsiro', code: 'RTS', provinceId: 'prov-western', cities: [] },
  { id: 'dist-rusizi', name: 'Rusizi', nameRw: 'Rusizi', nameFr: 'Rusizi', code: 'RSZ', provinceId: 'prov-western', cities: [] }
];

// MAJOR CITIES DATA
export const cities: City[] = [
  // Kigali City
  {
    id: 'city-kigali',
    name: 'Kigali',
    nameRw: 'Kigali',
    nameFr: 'Kigali',
    districtId: 'dist-nyarugenge',
    latitude: -1.9536,
    longitude: 30.0606,
    isPopular: true,
    busStations: []
  },
  {
    id: 'city-kimironko',
    name: 'Kimironko',
    nameRw: 'Kimironko',
    nameFr: 'Kimironko',
    districtId: 'dist-gasabo',
    latitude: -1.9442,
    longitude: 30.1272,
    isPopular: true,
    busStations: []
  },
  {
    id: 'city-nyabugogo',
    name: 'Nyabugogo',
    nameRw: 'Nyabugogo',
    nameFr: 'Nyabugogo',
    districtId: 'dist-nyarugenge',
    latitude: -1.9706,
    longitude: 30.0444,
    isPopular: true,
    busStations: []
  },
  
  // Eastern Province
  {
    id: 'city-rwamagana',
    name: 'Rwamagana',
    nameRw: 'Rwamagana',
    nameFr: 'Rwamagana',
    districtId: 'dist-rwamagana',
    latitude: -1.9489,
    longitude: 30.4347,
    isPopular: true,
    busStations: []
  },
  {
    id: 'city-kayonza',
    name: 'Kayonza',
    nameRw: 'Kayonza',
    nameFr: 'Kayonza',
    districtId: 'dist-kayonza',
    latitude: -1.8833,
    longitude: 30.4167,
    isPopular: true,
    busStations: []
  },
  {
    id: 'city-nyagatare',
    name: 'Nyagatare',
    nameRw: 'Nyagatare',
    nameFr: 'Nyagatare',
    districtId: 'dist-nyagatare',
    latitude: -1.2989,
    longitude: 30.3253,
    isPopular: true,
    busStations: []
  },
  {
    id: 'city-kibungo',
    name: 'Kibungo',
    nameRw: 'Kibungo',
    nameFr: 'Kibungo',
    districtId: 'dist-ngoma',
    latitude: -2.1597,
    longitude: 30.5428,
    isPopular: true,
    busStations: []
  },
  
  // Northern Province
  {
    id: 'city-musanze',
    name: 'Musanze',
    nameRw: 'Musanze',
    nameFr: 'Musanze',
    districtId: 'dist-musanze',
    latitude: -1.4992,
    longitude: 29.6342,
    isPopular: true,
    busStations: []
  },
  {
    id: 'city-byumba',
    name: 'Byumba',
    nameRw: 'Byumba',
    nameFr: 'Byumba',
    districtId: 'dist-gicumbi',
    latitude: -1.5764,
    longitude: 30.0672,
    isPopular: true,
    busStations: []
  },
  {
    id: 'city-ruhengeri',
    name: 'Ruhengeri',
    nameRw: 'Ruhengeri',
    nameFr: 'Ruhengeri',
    districtId: 'dist-musanze',
    latitude: -1.5000,
    longitude: 29.6333,
    isPopular: false,
    busStations: []
  },
  
  // Southern Province
  {
    id: 'city-huye',
    name: 'Huye',
    nameRw: 'Huye',
    nameFr: 'Huye',
    districtId: 'dist-huye',
    latitude: -2.5975,
    longitude: 29.7389,
    isPopular: true,
    busStations: []
  },
  {
    id: 'city-butare',
    name: 'Butare',
    nameRw: 'Butare',
    nameFr: 'Butare',
    districtId: 'dist-huye',
    latitude: -2.5975,
    longitude: 29.7389,
    isPopular: true,
    busStations: []
  },
  {
    id: 'city-muhanga',
    name: 'Muhanga',
    nameRw: 'Muhanga',
    nameFr: 'Muhanga',
    districtId: 'dist-muhanga',
    latitude: -2.0844,
    longitude: 29.7428,
    isPopular: true,
    busStations: []
  },
  {
    id: 'city-nyanza',
    name: 'Nyanza',
    nameRw: 'Nyanza',
    nameFr: 'Nyanza',
    districtId: 'dist-nyanza',
    latitude: -2.3514,
    longitude: 29.7503,
    isPopular: true,
    busStations: []
  },
  
  // Western Province
  {
    id: 'city-rubavu',
    name: 'Rubavu',
    nameRw: 'Rubavu',
    nameFr: 'Rubavu',
    districtId: 'dist-rubavu',
    latitude: -1.6778,
    longitude: 29.2667,
    isPopular: true,
    busStations: []
  },
  {
    id: 'city-gisenyi',
    name: 'Gisenyi',
    nameRw: 'Gisenyi',
    nameFr: 'Gisenyi',
    districtId: 'dist-rubavu',
    latitude: -1.7028,
    longitude: 29.2561,
    isPopular: true,
    busStations: []
  },
  {
    id: 'city-rusizi',
    name: 'Rusizi',
    nameRw: 'Rusizi',
    nameFr: 'Rusizi',
    districtId: 'dist-rusizi',
    latitude: -2.4833,
    longitude: 28.9000,
    isPopular: true,
    busStations: []
  },
  {
    id: 'city-cyangugu',
    name: 'Cyangugu',
    nameRw: 'Cyangugu',
    nameFr: 'Cyangugu',
    districtId: 'dist-rusizi',
    latitude: -2.4833,
    longitude: 28.9000,
    isPopular: true,
    busStations: []
  },
  {
    id: 'city-karongi',
    name: 'Karongi',
    nameRw: 'Karongi',
    nameFr: 'Karongi',
    districtId: 'dist-karongi',
    latitude: -2.0000,
    longitude: 29.3833,
    isPopular: true,
    busStations: []
  }
];

// BUS STATIONS DATA
export const busStations: BusStation[] = [
  // Kigali Stations
  {
    id: 'station-nyabugogo',
    name: 'Nyabugogo Bus Terminal',
    nameRw: 'Sitasiyo ya Bisi ya Nyabugogo',
    nameFr: 'Gare Routière de Nyabugogo',
    cityId: 'city-nyabugogo',
    address: 'KN 3 Ave, Kigali',
    latitude: -1.9706,
    longitude: 30.0444,
    facilities: ['waiting_area', 'toilets', 'food_vendors', 'atm', 'parking', 'ticket_office'],
    operatingHours: '05:00 - 22:00',
    phoneNumber: '+250788123456',
    isMainStation: true
  },
  {
    id: 'station-kimironko',
    name: 'Kimironko Bus Park',
    nameRw: 'Parike ya Bisi ya Kimironko',
    nameFr: 'Parc de Bus de Kimironko',
    cityId: 'city-kimironko',
    address: 'KG 11 Ave, Kigali',
    latitude: -1.9442,
    longitude: 30.1272,
    facilities: ['waiting_area', 'toilets', 'food_vendors', 'market', 'parking'],
    operatingHours: '05:00 - 21:00',
    phoneNumber: '+250788123457',
    isMainStation: true
  },
  {
    id: 'station-kigali-downtown',
    name: 'Kigali City Center Station',
    nameRw: 'Sitasiyo yo Hagati y\'Umujyi wa Kigali',
    nameFr: 'Station du Centre-Ville de Kigali',
    cityId: 'city-kigali',
    address: 'KN 4 Ave, Kigali',
    latitude: -1.9536,
    longitude: 30.0606,
    facilities: ['waiting_area', 'toilets', 'wifi', 'atm', 'cafe'],
    operatingHours: '06:00 - 20:00',
    isMainStation: false
  },
  
  // Musanze Stations
  {
    id: 'station-musanze-main',
    name: 'Musanze Bus Station',
    nameRw: 'Sitasiyo ya Bisi ya Musanze',
    nameFr: 'Gare Routière de Musanze',
    cityId: 'city-musanze',
    address: 'RN4, Musanze',
    latitude: -1.4992,
    longitude: 29.6342,
    facilities: ['waiting_area', 'toilets', 'food_vendors', 'parking', 'ticket_office'],
    operatingHours: '05:30 - 21:00',
    phoneNumber: '+250788234567',
    isMainStation: true
  },
  
  // Huye/Butare Stations
  {
    id: 'station-huye-main',
    name: 'Huye Bus Terminal',
    nameRw: 'Sitasiyo ya Bisi ya Huye',
    nameFr: 'Gare Routière de Huye',
    cityId: 'city-huye',
    address: 'RN1, Huye',
    latitude: -2.5975,
    longitude: 29.7389,
    facilities: ['waiting_area', 'toilets', 'food_vendors', 'atm', 'parking'],
    operatingHours: '05:00 - 21:00',
    phoneNumber: '+250788345678',
    isMainStation: true
  },
  
  // Rubavu/Gisenyi Stations
  {
    id: 'station-rubavu-main',
    name: 'Rubavu Bus Station',
    nameRw: 'Sitasiyo ya Bisi ya Rubavu',
    nameFr: 'Gare Routière de Rubavu',
    cityId: 'city-rubavu',
    address: 'RN4, Rubavu',
    latitude: -1.6778,
    longitude: 29.2667,
    facilities: ['waiting_area', 'toilets', 'food_vendors', 'parking', 'border_services'],
    operatingHours: '05:00 - 22:00',
    phoneNumber: '+250788456789',
    isMainStation: true
  },
  
  // Rusizi/Cyangugu Stations
  {
    id: 'station-rusizi-main',
    name: 'Rusizi Bus Terminal',
    nameRw: 'Sitasiyo ya Bisi ya Rusizi',
    nameFr: 'Gare Routière de Rusizi',
    cityId: 'city-rusizi',
    address: 'RN10, Rusizi',
    latitude: -2.4833,
    longitude: 28.9000,
    facilities: ['waiting_area', 'toilets', 'food_vendors', 'parking', 'border_services'],
    operatingHours: '05:00 - 21:00',
    phoneNumber: '+250788567890',
    isMainStation: true
  },
  
  // Rwamagana Station
  {
    id: 'station-rwamagana-main',
    name: 'Rwamagana Bus Park',
    nameRw: 'Parike ya Bisi ya Rwamagana',
    nameFr: 'Parc de Bus de Rwamagana',
    cityId: 'city-rwamagana',
    address: 'RN3, Rwamagana',
    latitude: -1.9489,
    longitude: 30.4347,
    facilities: ['waiting_area', 'toilets', 'food_vendors', 'parking'],
    operatingHours: '05:30 - 20:30',
    phoneNumber: '+250788678901',
    isMainStation: true
  },
  
  // Muhanga Station
  {
    id: 'station-muhanga-main',
    name: 'Muhanga Bus Station',
    nameRw: 'Sitasiyo ya Bisi ya Muhanga',
    nameFr: 'Gare Routière de Muhanga',
    cityId: 'city-muhanga',
    address: 'RN1, Muhanga',
    latitude: -2.0844,
    longitude: 29.7428,
    facilities: ['waiting_area', 'toilets', 'food_vendors', 'parking'],
    operatingHours: '05:30 - 20:30',
    phoneNumber: '+250788789012',
    isMainStation: true
  }
];

// POPULAR ROUTES DATA
export const popularRoutes: PopularRoute[] = [
  // Kigali Routes
  {
    id: 'route-kigali-musanze',
    fromCityId: 'city-kigali',
    toCityId: 'city-musanze',
    distance: 116,
    estimatedDuration: 120,
    frequency: 'very_high',
    averagePrice: 2500,
    isHighDemand: true,
    scenicRoute: true
  },
  {
    id: 'route-kigali-huye',
    fromCityId: 'city-kigali',
    toCityId: 'city-huye',
    distance: 135,
    estimatedDuration: 150,
    frequency: 'very_high',
    averagePrice: 3000,
    isHighDemand: true,
    scenicRoute: false
  },
  {
    id: 'route-kigali-rubavu',
    fromCityId: 'city-kigali',
    toCityId: 'city-rubavu',
    distance: 155,
    estimatedDuration: 180,
    frequency: 'high',
    averagePrice: 3500,
    isHighDemand: true,
    scenicRoute: true
  },
  {
    id: 'route-kigali-rusizi',
    fromCityId: 'city-kigali',
    toCityId: 'city-rusizi',
    distance: 225,
    estimatedDuration: 270,
    frequency: 'high',
    averagePrice: 4500,
    isHighDemand: true,
    scenicRoute: true
  },
  {
    id: 'route-kigali-rwamagana',
    fromCityId: 'city-kigali',
    toCityId: 'city-rwamagana',
    distance: 52,
    estimatedDuration: 60,
    frequency: 'very_high',
    averagePrice: 1500,
    isHighDemand: true,
    scenicRoute: false
  },
  {
    id: 'route-kigali-kayonza',
    fromCityId: 'city-kigali',
    toCityId: 'city-kayonza',
    distance: 98,
    estimatedDuration: 120,
    frequency: 'high',
    averagePrice: 2000,
    isHighDemand: true,
    scenicRoute: false
  },
  {
    id: 'route-kigali-nyagatare',
    fromCityId: 'city-kigali',
    toCityId: 'city-nyagatare',
    distance: 175,
    estimatedDuration: 210,
    frequency: 'medium',
    averagePrice: 3500,
    isHighDemand: false,
    scenicRoute: false
  },
  {
    id: 'route-kigali-muhanga',
    fromCityId: 'city-kigali',
    toCityId: 'city-muhanga',
    distance: 48,
    estimatedDuration: 60,
    frequency: 'very_high',
    averagePrice: 1200,
    isHighDemand: true,
    scenicRoute: false
  },
  {
    id: 'route-kigali-nyanza',
    fromCityId: 'city-kigali',
    toCityId: 'city-nyanza',
    distance: 90,
    estimatedDuration: 105,
    frequency: 'high',
    averagePrice: 2000,
    isHighDemand: true,
    scenicRoute: false
  },
  {
    id: 'route-kigali-karongi',
    fromCityId: 'city-kigali',
    toCityId: 'city-karongi',
    distance: 135,
    estimatedDuration: 165,
    frequency: 'medium',
    averagePrice: 3000,
    isHighDemand: false,
    scenicRoute: true
  },
  
  // Inter-city Routes
  {
    id: 'route-musanze-rubavu',
    fromCityId: 'city-musanze',
    toCityId: 'city-rubavu',
    distance: 75,
    estimatedDuration: 90,
    frequency: 'high',
    averagePrice: 2000,
    isHighDemand: true,
    scenicRoute: true
  },
  {
    id: 'route-huye-rusizi',
    fromCityId: 'city-huye',
    toCityId: 'city-rusizi',
    distance: 145,
    estimatedDuration: 180,
    frequency: 'medium',
    averagePrice: 3000,
    isHighDemand: false,
    scenicRoute: true
  },
  {
    id: 'route-rwamagana-kayonza',
    fromCityId: 'city-rwamagana',
    toCityId: 'city-kayonza',
    distance: 46,
    estimatedDuration: 45,
    frequency: 'high',
    averagePrice: 1000,
    isHighDemand: true,
    scenicRoute: false
  },
  {
    id: 'route-muhanga-huye',
    fromCityId: 'city-muhanga',
    toCityId: 'city-huye',
    distance: 87,
    estimatedDuration: 105,
    frequency: 'high',
    averagePrice: 2000,
    isHighDemand: true,
    scenicRoute: false
  }
];

// TOURIST DESTINATIONS DATA
export const touristDestinations: TouristDestination[] = [
  {
    id: 'dest-volcanoes-np',
    name: 'Volcanoes National Park',
    nameRw: 'Pariki y\'Ibirunga',
    nameFr: 'Parc National des Volcans',
    description: 'Home to mountain gorillas and golden monkeys',
    cityId: 'city-musanze',
    category: 'national_park',
    latitude: -1.4667,
    longitude: 29.5833,
    entryFee: 1500000,
    openingHours: '07:00 - 18:00'
  },
  {
    id: 'dest-akagera-np',
    name: 'Akagera National Park',
    nameRw: 'Pariki y\'Akagera',
    nameFr: 'Parc National de l\'Akagera',
    description: 'Wildlife safari park with the Big Five',
    cityId: 'city-kayonza',
    category: 'national_park',
    latitude: -1.9000,
    longitude: 30.7500,
    entryFee: 50000,
    openingHours: '06:00 - 18:00'
  },
  {
    id: 'dest-nyungwe-np',
    name: 'Nyungwe National Park',
    nameRw: 'Pariki y\'Ishyamba rya Nyungwe',
    nameFr: 'Parc National de Nyungwe',
    description: 'Ancient rainforest with chimpanzees and canopy walk',
    cityId: 'city-rusizi',
    category: 'national_park',
    latitude: -2.4833,
    longitude: 29.2000,
    entryFee: 100000,
    openingHours: '07:00 - 17:00'
  },
  {
    id: 'dest-genocide-memorial',
    name: 'Kigali Genocide Memorial',
    nameRw: 'Urwibutso rw\'Itsembabwoko rya Kigali',
    nameFr: 'Mémorial du Génocide de Kigali',
    description: 'Memorial and museum commemorating the 1994 genocide',
    cityId: 'city-kigali',
    category: 'memorial',
    latitude: -1.9536,
    longitude: 30.0606,
    openingHours: '08:00 - 17:00'
  },
  {
    id: 'dest-kings-palace',
    name: 'King\'s Palace Museum',
    nameRw: 'Ingoro y\'Umwami',
    nameFr: 'Musée du Palais Royal',
    description: 'Traditional royal residence and museum',
    cityId: 'city-nyanza',
    category: 'museum',
    latitude: -2.3514,
    longitude: 29.7503,
    entryFee: 6000,
    openingHours: '08:00 - 17:00'
  },
  {
    id: 'dest-lake-kivu',
    name: 'Lake Kivu',
    nameRw: 'Ikiyaga cya Kivu',
    nameFr: 'Lac Kivu',
    description: 'Beautiful lake with beaches and water activities',
    cityId: 'city-rubavu',
    category: 'lake',
    latitude: -1.7028,
    longitude: 29.2561
  },
  {
    id: 'dest-ethnographic-museum',
    name: 'Ethnographic Museum',
    nameRw: 'Inzu Ndangamurage',
    nameFr: 'Musée Ethnographique',
    description: 'Rwanda\'s cultural and historical museum',
    cityId: 'city-huye',
    category: 'museum',
    latitude: -2.5975,
    longitude: 29.7389,
    entryFee: 6000,
    openingHours: '08:00 - 17:00'
  },
  {
    id: 'dest-inema-arts',
    name: 'Inema Arts Center',
    nameRw: 'Ikigo cy\'Ubuhanzi bwa Inema',
    nameFr: 'Centre d\'Arts Inema',
    description: 'Contemporary art gallery and studio',
    cityId: 'city-kigali',
    category: 'cultural',
    latitude: -1.9536,
    longitude: 30.0606,
    openingHours: '09:00 - 18:00'
  }
];

// Helper functions
export const getCityById = (cityId: string): City | undefined => {
  return cities.find(city => city.id === cityId);
};

export const getDistrictById = (districtId: string): District | undefined => {
  return districts.find(district => district.id === districtId);
};

export const getProvinceById = (provinceId: string): Province | undefined => {
  return provinces.find(province => province.id === provinceId);
};

export const getBusStationById = (stationId: string): BusStation | undefined => {
  return busStations.find(station => station.id === stationId);
};

export const getCitiesByDistrict = (districtId: string): City[] => {
  return cities.filter(city => city.districtId === districtId);
};

export const getDistrictsByProvince = (provinceId: string): District[] => {
  return districts.filter(district => district.provinceId === provinceId);
};

export const getBusStationsByCity = (cityId: string): BusStation[] => {
  return busStations.filter(station => station.cityId === cityId);
};

export const getPopularCities = (): City[] => {
  return cities.filter(city => city.isPopular);
};

export const getRoutesBetweenCities = (fromCityId: string, toCityId: string): PopularRoute[] => {
  return popularRoutes.filter(
    route => 
      (route.fromCityId === fromCityId && route.toCityId === toCityId) ||
      (route.fromCityId === toCityId && route.toCityId === fromCityId)
  );
};

export const getTouristDestinationsByCity = (cityId: string): TouristDestination[] => {
  return touristDestinations.filter(dest => dest.cityId === cityId);
};

export const searchCities = (query: string): City[] => {
  const lowerQuery = query.toLowerCase();
  return cities.filter(city => 
    city.name.toLowerCase().includes(lowerQuery) ||
    city.nameRw.toLowerCase().includes(lowerQuery) ||
    city.nameFr.toLowerCase().includes(lowerQuery)
  );
};

export const searchRoutes = (fromQuery: string, toQuery: string): PopularRoute[] => {
  const fromCities = searchCities(fromQuery);
  const toCities = searchCities(toQuery);
  
  const routes: PopularRoute[] = [];
  fromCities.forEach(fromCity => {
    toCities.forEach(toCity => {
      const cityRoutes = getRoutesBetweenCities(fromCity.id, toCity.id);
      routes.push(...cityRoutes);
    });
  });
  
  return routes;
};

export default {
  provinces,
  districts,
  cities,
  busStations,
  popularRoutes,
  touristDestinations,
  getCityById,
  getDistrictById,
  getProvinceById,
  getBusStationById,
  getCitiesByDistrict,
  getDistrictsByProvince,
  getBusStationsByCity,
  getPopularCities,
  getRoutesBetweenCities,
  getTouristDestinationsByCity,
  searchCities,
  searchRoutes
};