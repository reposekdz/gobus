/**
 * Comprehensive Rwanda Bus Stations Database
 * All provinces, districts, and bus stations
 */

export interface BusStation {
  id: string;
  name: string;
  district: string;
  province: string;
  latitude: number;
  longitude: number;
  address?: string;
  type: 'major' | 'minor' | 'terminal';
}

export const rwandaStations: BusStation[] = [
  // KIGALI CITY
  { id: 'KG001', name: 'Nyabugogo Bus Terminal', district: 'Gasabo', province: 'Kigali City', latitude: -1.9441, longitude: 30.0619, type: 'terminal', address: 'Nyabugogo' },
  { id: 'KG002', name: 'Nyamirambo Bus Station', district: 'Nyarugenge', province: 'Kigali City', latitude: -1.9608, longitude: 30.0569, type: 'major' },
  { id: 'KG003', name: 'Remera Bus Station', district: 'Gasabo', province: 'Kigali City', latitude: -1.9333, longitude: 30.1083, type: 'major' },
  { id: 'KG004', name: 'Kimisagara Bus Station', district: 'Nyarugenge', province: 'Kigali City', latitude: -1.9667, longitude: 30.0500, type: 'minor' },
  { id: 'KG005', name: 'Kacyiru Bus Station', district: 'Gasabo', province: 'Kigali City', latitude: -1.9333, longitude: 30.0833, type: 'minor' },
  { id: 'KG006', name: 'Kicukiro Bus Station', district: 'Kicukiro', province: 'Kigali City', latitude: -1.9667, longitude: 30.1167, type: 'major' },
  { id: 'KG007', name: 'Niboye Bus Station', district: 'Kicukiro', province: 'Kigali City', latitude: -1.9833, longitude: 30.1333, type: 'minor' },
  { id: 'KG008', name: 'Gikondo Bus Station', district: 'Kicukiro', province: 'Kigali City', latitude: -1.9500, longitude: 30.1000, type: 'minor' },
  { id: 'KG009', name: 'Kibagabaga Bus Station', district: 'Gasabo', province: 'Kigali City', latitude: -1.9167, longitude: 30.1167, type: 'minor' },
  { id: 'KG010', name: 'Gisozi Bus Station', district: 'Gasabo', province: 'Kigali City', latitude: -1.9167, longitude: 30.0833, type: 'minor' },

  // NORTHERN PROVINCE
  // Musanze District
  { id: 'MU001', name: 'Musanze Bus Terminal', district: 'Musanze', province: 'Northern', latitude: -1.5000, longitude: 29.6167, type: 'terminal', address: 'Musanze Town' },
  { id: 'MU002', name: 'Kinigi Bus Station', district: 'Musanze', province: 'Northern', latitude: -1.4333, longitude: 29.5833, type: 'major' },
  { id: 'MU003', name: 'Ruhengeri Bus Station', district: 'Musanze', province: 'Northern', latitude: -1.5000, longitude: 29.6167, type: 'minor' },
  { id: 'MU004', name: 'Shingiro Bus Station', district: 'Musanze', province: 'Northern', latitude: -1.4500, longitude: 29.6500, type: 'minor' },

  // Burera District
  { id: 'BU001', name: 'Gitovu Bus Station', district: 'Burera', province: 'Northern', latitude: -1.4167, longitude: 29.7167, type: 'major' },
  { id: 'BU002', name: 'Rwerere Bus Station', district: 'Burera', province: 'Northern', latitude: -1.3667, longitude: 29.7667, type: 'minor' },
  { id: 'BU003', name: 'Butaro Bus Station', district: 'Burera', province: 'Northern', latitude: -1.3833, longitude: 29.7333, type: 'minor' },

  // Gicumbi District
  { id: 'GI001', name: 'Byumba Bus Terminal', district: 'Gicumbi', province: 'Northern', latitude: -1.5833, longitude: 30.0667, type: 'terminal', address: 'Byumba Town' },
  { id: 'GI002', name: 'Rukomo Bus Station', district: 'Gicumbi', province: 'Northern', latitude: -1.5500, longitude: 30.0833, type: 'major' },
  { id: 'GI003', name: 'Rushaki Bus Station', district: 'Gicumbi', province: 'Northern', latitude: -1.5167, longitude: 30.0333, type: 'minor' },
  { id: 'GI004', name: 'Kageyo Bus Station', district: 'Gicumbi', province: 'Northern', latitude: -1.6167, longitude: 30.0500, type: 'minor' },

  // Rulindo District
  { id: 'RU001', name: 'Bushoki Bus Station', district: 'Rulindo', province: 'Northern', latitude: -1.6667, longitude: 30.0333, type: 'major' },
  { id: 'RU002', name: 'Tumba Bus Station', district: 'Rulindo', province: 'Northern', latitude: -1.6833, longitude: 30.0000, type: 'minor' },
  { id: 'RU003', name: 'Mbogo Bus Station', district: 'Rulindo', province: 'Northern', latitude: -1.6500, longitude: 30.0667, type: 'minor' },

  // Gakenke District
  { id: 'GA001', name: 'Muhanga Bus Station', district: 'Gakenke', province: 'Northern', latitude: -1.7333, longitude: 29.7500, type: 'major' },
  { id: 'GA002', name: 'Nemba Bus Station', district: 'Gakenke', province: 'Northern', latitude: -1.7000, longitude: 29.7167, type: 'minor' },
  { id: 'GA003', name: 'Muhondo Bus Station', district: 'Gakenke', province: 'Northern', latitude: -1.7667, longitude: 29.7833, type: 'minor' },

  // EASTERN PROVINCE
  // Rwamagana District
  { id: 'RW001', name: 'Rwamagana Bus Terminal', district: 'Rwamagana', province: 'Eastern', latitude: -1.9486, longitude: 30.4347, type: 'terminal', address: 'Rwamagana Town' },
  { id: 'RW002', name: 'Gahini Bus Station', district: 'Rwamagana', province: 'Eastern', latitude: -1.8833, longitude: 30.4500, type: 'major' },
  { id: 'RW003', name: 'Mukarange Bus Station', district: 'Rwamagana', province: 'Eastern', latitude: -1.9833, longitude: 30.4167, type: 'minor' },
  { id: 'RW004', name: 'Nyamata Bus Station', district: 'Rwamagana', province: 'Eastern', latitude: -2.0167, longitude: 30.3500, type: 'major' },

  // Kayonza District
  { id: 'KY001', name: 'Kayonza Bus Terminal', district: 'Kayonza', province: 'Eastern', latitude: -1.9167, longitude: 30.5333, type: 'terminal', address: 'Kayonza Town' },
  { id: 'KY002', name: 'Gahunda Bus Station', district: 'Kayonza', province: 'Eastern', latitude: -1.8833, longitude: 30.5667, type: 'major' },
  { id: 'KY003', name: 'Mukarange Bus Station', district: 'Kayonza', province: 'Eastern', latitude: -1.9500, longitude: 30.5000, type: 'minor' },
  { id: 'KY004', name: 'Ndego Bus Station', district: 'Kayonza', province: 'Eastern', latitude: -1.9000, longitude: 30.4833, type: 'minor' },

  // Ngoma District
  { id: 'NG001', name: 'Kibungo Bus Terminal', district: 'Ngoma', province: 'Eastern', latitude: -2.1667, longitude: 30.5500, type: 'terminal', address: 'Kibungo Town' },
  { id: 'NG002', name: 'Rukira Bus Station', district: 'Ngoma', province: 'Eastern', latitude: -2.1333, longitude: 30.5333, type: 'major' },
  { id: 'NG003', name: 'Rurenge Bus Station', district: 'Ngoma', province: 'Eastern', latitude: -2.2000, longitude: 30.5667, type: 'minor' },
  { id: 'NG004', name: 'Sake Bus Station', district: 'Ngoma', province: 'Eastern', latitude: -2.1500, longitude: 30.5167, type: 'minor' },

  // Kirehe District
  { id: 'KI001', name: 'Kirehe Bus Terminal', district: 'Kirehe', province: 'Eastern', latitude: -2.2833, longitude: 30.7833, type: 'terminal', address: 'Kirehe Town' },
  { id: 'KI002', name: 'Gahara Bus Station', district: 'Kirehe', province: 'Eastern', latitude: -2.2500, longitude: 30.8000, type: 'major' },
  { id: 'KI003', name: 'Kigina Bus Station', district: 'Kirehe', province: 'Eastern', latitude: -2.3167, longitude: 30.7667, type: 'minor' },
  { id: 'KI004', name: 'Kazo Bus Station', district: 'Kirehe', province: 'Eastern', latitude: -2.2667, longitude: 30.7500, type: 'minor' },

  // Bugesera District
  { id: 'BG001', name: 'Nyamata Bus Terminal', district: 'Bugesera', province: 'Eastern', latitude: -2.2167, longitude: 30.1167, type: 'terminal', address: 'Nyamata Town' },
  { id: 'BG002', name: 'Ntarama Bus Station', district: 'Bugesera', province: 'Eastern', latitude: -2.1833, longitude: 30.1333, type: 'major' },
  { id: 'BG003', name: 'Mareba Bus Station', district: 'Bugesera', province: 'Eastern', latitude: -2.2500, longitude: 30.1000, type: 'minor' },
  { id: 'BG004', name: 'Gashora Bus Station', district: 'Bugesera', province: 'Eastern', latitude: -2.2000, longitude: 30.0833, type: 'minor' },

  // Gatsibo District
  { id: 'GT001', name: 'Kabarore Bus Terminal', district: 'Gatsibo', province: 'Eastern', latitude: -1.7833, longitude: 30.4667, type: 'terminal', address: 'Kabarore Town' },
  { id: 'GT002', name: 'Rugarama Bus Station', district: 'Gatsibo', province: 'Eastern', latitude: -1.7500, longitude: 30.4833, type: 'major' },
  { id: 'GT003', name: 'Kiziguro Bus Station', district: 'Gatsibo', province: 'Eastern', latitude: -1.8167, longitude: 30.4500, type: 'minor' },
  { id: 'GT004', name: 'Murambi Bus Station', district: 'Gatsibo', province: 'Eastern', latitude: -1.7667, longitude: 30.4167, type: 'minor' },

  // Nyagatare District
  { id: 'NY001', name: 'Nyagatare Bus Terminal', district: 'Nyagatare', province: 'Eastern', latitude: -1.3000, longitude: 30.3167, type: 'terminal', address: 'Nyagatare Town' },
  { id: 'NY002', name: 'Rwimiyaga Bus Station', district: 'Nyagatare', province: 'Eastern', latitude: -1.2667, longitude: 30.3333, type: 'major' },
  { id: 'NY003', name: 'Gatunda Bus Station', district: 'Nyagatare', province: 'Eastern', latitude: -1.3333, longitude: 30.3000, type: 'minor' },
  { id: 'NY004', name: 'Karama Bus Station', district: 'Nyagatare', province: 'Eastern', latitude: -1.2833, longitude: 30.3500, type: 'minor' },

  // SOUTHERN PROVINCE
  // Nyanza District
  { id: 'NZ001', name: 'Nyanza Bus Terminal', district: 'Nyanza', province: 'Southern', latitude: -2.3500, longitude: 29.7500, type: 'terminal', address: 'Nyanza Town' },
  { id: 'NZ002', name: 'Busasamana Bus Station', district: 'Nyanza', province: 'Southern', latitude: -2.3167, longitude: 29.7667, type: 'major' },
  { id: 'NZ003', name: 'Kigeme Bus Station', district: 'Nyanza', province: 'Southern', latitude: -2.3833, longitude: 29.7333, type: 'minor' },
  { id: 'NZ004', name: 'Muyira Bus Station', district: 'Nyanza', province: 'Southern', latitude: -2.3333, longitude: 29.7167, type: 'minor' },

  // Gisagara District
  { id: 'GS001', name: 'Kibirizi Bus Terminal', district: 'Gisagara', province: 'Southern', latitude: -2.6167, longitude: 29.7333, type: 'terminal', address: 'Kibirizi Town' },
  { id: 'GS002', name: 'Mamba Bus Station', district: 'Gisagara', province: 'Southern', latitude: -2.5833, longitude: 29.7500, type: 'major' },
  { id: 'GS003', name: 'Muganza Bus Station', district: 'Gisagara', province: 'Southern', latitude: -2.6500, longitude: 29.7167, type: 'minor' },
  { id: 'GS004', name: 'Ndora Bus Station', district: 'Gisagara', province: 'Southern', latitude: -2.6000, longitude: 29.7000, type: 'minor' },

  // Nyaruguru District
  { id: 'NR001', name: 'Muganza Bus Station', district: 'Nyaruguru', province: 'Southern', latitude: -2.8333, longitude: 29.6167, type: 'major' },
  { id: 'NR002', name: 'Kibeho Bus Station', district: 'Nyaruguru', province: 'Southern', latitude: -2.8000, longitude: 29.6333, type: 'major' },
  { id: 'NR003', name: 'Munini Bus Station', district: 'Nyaruguru', province: 'Southern', latitude: -2.8667, longitude: 29.6000, type: 'minor' },

  // Huye District
  { id: 'HU001', name: 'Huye Bus Terminal', district: 'Huye', province: 'Southern', latitude: -2.6000, longitude: 29.7500, type: 'terminal', address: 'Huye Town (Butare)' },
  { id: 'HU002', name: 'Tumba Bus Station', district: 'Huye', province: 'Southern', latitude: -2.5667, longitude: 29.7667, type: 'major' },
  { id: 'HU003', name: 'Ngoma Bus Station', district: 'Huye', province: 'Southern', latitude: -2.6333, longitude: 29.7333, type: 'minor' },
  { id: 'HU004', name: 'Rwaniro Bus Station', district: 'Huye', province: 'Southern', latitude: -2.5833, longitude: 29.7167, type: 'minor' },

  // Nyamagabe District
  { id: 'NM001', name: 'Nyamagabe Bus Terminal', district: 'Nyamagabe', province: 'Southern', latitude: -2.4667, longitude: 29.5667, type: 'terminal', address: 'Nyamagabe Town' },
  { id: 'NM002', name: 'Kaduha Bus Station', district: 'Nyamagabe', province: 'Southern', latitude: -2.4333, longitude: 29.5833, type: 'major' },
  { id: 'NM003', name: 'Kibeho Bus Station', district: 'Nyamagabe', province: 'Southern', latitude: -2.5000, longitude: 29.5500, type: 'major' },
  { id: 'NM004', name: 'Musange Bus Station', district: 'Nyamagabe', province: 'Southern', latitude: -2.4500, longitude: 29.5333, type: 'minor' },

  // Ruhango District
  { id: 'RH001', name: 'Ruhango Bus Terminal', district: 'Ruhango', province: 'Southern', latitude: -2.1333, longitude: 29.8333, type: 'terminal', address: 'Ruhango Town' },
  { id: 'RH002', name: 'Bweramana Bus Station', district: 'Ruhango', province: 'Southern', latitude: -2.1000, longitude: 29.8500, type: 'major' },
  { id: 'RH003', name: 'Mbuye Bus Station', district: 'Ruhango', province: 'Southern', latitude: -2.1667, longitude: 29.8167, type: 'minor' },
  { id: 'RH004', name: 'Kinazi Bus Station', district: 'Ruhango', province: 'Southern', latitude: -2.1167, longitude: 29.8000, type: 'minor' },

  // Muhanga District
  { id: 'MH001', name: 'Muhanga Bus Terminal', district: 'Muhanga', province: 'Southern', latitude: -2.0667, longitude: 29.7500, type: 'terminal', address: 'Muhanga Town' },
  { id: 'MH002', name: 'Shyogwe Bus Station', district: 'Muhanga', province: 'Southern', latitude: -2.0333, longitude: 29.7667, type: 'major' },
  { id: 'MH003', name: 'Nyamabuye Bus Station', district: 'Muhanga', province: 'Southern', latitude: -2.1000, longitude: 29.7333, type: 'minor' },
  { id: 'MH004', name: 'Cyeza Bus Station', district: 'Muhanga', province: 'Southern', latitude: -2.0500, longitude: 29.7167, type: 'minor' },

  // Kamonyi District
  { id: 'KM001', name: 'Runda Bus Terminal', district: 'Kamonyi', province: 'Southern', latitude: -1.9500, longitude: 29.9000, type: 'terminal', address: 'Runda Town' },
  { id: 'KM002', name: 'Gacurabwenge Bus Station', district: 'Kamonyi', province: 'Southern', latitude: -1.9167, longitude: 29.9167, type: 'major' },
  { id: 'KM003', name: 'Karama Bus Station', district: 'Kamonyi', province: 'Southern', latitude: -1.9833, longitude: 29.8833, type: 'minor' },
  { id: 'KM004', name: 'Kayenzi Bus Station', district: 'Kamonyi', province: 'Southern', latitude: -1.9667, longitude: 29.8667, type: 'minor' },

  // WESTERN PROVINCE
  // Karongi District
  { id: 'KR001', name: 'Karongi Bus Terminal', district: 'Karongi', province: 'Western', latitude: -2.0000, longitude: 29.3500, type: 'terminal', address: 'Karongi Town (Kibuye)' },
  { id: 'KR002', name: 'Rugabano Bus Station', district: 'Karongi', province: 'Western', latitude: -1.9667, longitude: 29.3667, type: 'major' },
  { id: 'KR003', name: 'Rutsiro Bus Station', district: 'Karongi', province: 'Western', latitude: -2.0333, longitude: 29.3333, type: 'minor' },
  { id: 'KR004', name: 'Gitesi Bus Station', district: 'Karongi', province: 'Western', latitude: -1.9833, longitude: 29.3167, type: 'minor' },

  // Rutsiro District
  { id: 'RT001', name: 'Rutsiro Bus Terminal', district: 'Rutsiro', province: 'Western', latitude: -2.1167, longitude: 29.3167, type: 'terminal', address: 'Rutsiro Town' },
  { id: 'RT002', name: 'Boneza Bus Station', district: 'Rutsiro', province: 'Western', latitude: -2.0833, longitude: 29.3333, type: 'major' },
  { id: 'RT003', name: 'Gihango Bus Station', district: 'Rutsiro', province: 'Western', latitude: -2.1500, longitude: 29.3000, type: 'minor' },
  { id: 'RT004', name: 'Kigeyo Bus Station', district: 'Rutsiro', province: 'Western', latitude: -2.1333, longitude: 29.2833, type: 'minor' },

  // Rubavu District
  { id: 'RB001', name: 'Rubavu Bus Terminal', district: 'Rubavu', province: 'Western', latitude: -1.6950, longitude: 29.2267, type: 'terminal', address: 'Rubavu Town (Gisenyi)' },
  { id: 'RB002', name: 'Gisenyi Bus Station', district: 'Rubavu', province: 'Western', latitude: -1.6833, longitude: 29.2500, type: 'major' },
  { id: 'RB003', name: 'Nyamyumba Bus Station', district: 'Rubavu', province: 'Western', latitude: -1.7167, longitude: 29.2000, type: 'minor' },
  { id: 'RB004', name: 'Kanzenze Bus Station', district: 'Rubavu', province: 'Western', latitude: -1.6667, longitude: 29.1833, type: 'minor' },

  // Nyabihu District
  { id: 'NB001', name: 'Bigogwe Bus Terminal', district: 'Nyabihu', province: 'Western', latitude: -1.6667, longitude: 29.4667, type: 'terminal', address: 'Bigogwe Town' },
  { id: 'NB002', name: 'Jenda Bus Station', district: 'Nyabihu', province: 'Western', latitude: -1.6333, longitude: 29.4833, type: 'major' },
  { id: 'NB003', name: 'Mukamira Bus Station', district: 'Nyabihu', province: 'Western', latitude: -1.7000, longitude: 29.4500, type: 'minor' },
  { id: 'NB004', name: 'Kageyo Bus Station', district: 'Nyabihu', province: 'Western', latitude: -1.6833, longitude: 29.4333, type: 'minor' },

  // Ngororero District
  { id: 'NO001', name: 'Ngororero Bus Terminal', district: 'Ngororero', province: 'Western', latitude: -1.8667, longitude: 29.8167, type: 'terminal', address: 'Ngororero Town' },
  { id: 'NO002', name: 'Muhororo Bus Station', district: 'Ngororero', province: 'Western', latitude: -1.8333, longitude: 29.8333, type: 'major' },
  { id: 'NO003', name: 'Nyange Bus Station', district: 'Ngororero', province: 'Western', latitude: -1.9000, longitude: 29.8000, type: 'minor' },
  { id: 'NO004', name: 'Kavumu Bus Station', district: 'Ngororero', province: 'Western', latitude: -1.8833, longitude: 29.7833, type: 'minor' },

  // Rusizi District
  { id: 'RS001', name: 'Rusizi Bus Terminal', district: 'Rusizi', province: 'Western', latitude: -2.4667, longitude: 28.9000, type: 'terminal', address: 'Rusizi Town (Cyangugu)' },
  { id: 'RS002', name: 'Cyangugu Bus Station', district: 'Rusizi', province: 'Western', latitude: -2.4500, longitude: 28.9167, type: 'major' },
  { id: 'RS003', name: 'Bugarama Bus Station', district: 'Rusizi', province: 'Western', latitude: -2.4833, longitude: 28.8833, type: 'minor' },
  { id: 'RS004', name: 'Giheke Bus Station', district: 'Rusizi', province: 'Western', latitude: -2.4333, longitude: 28.8667, type: 'minor' },

  // Nyamasheke District
  { id: 'NS001', name: 'Nyamasheke Bus Terminal', district: 'Nyamasheke', province: 'Western', latitude: -2.3833, longitude: 29.1500, type: 'terminal', address: 'Nyamasheke Town' },
  { id: 'NS002', name: 'Bushekeri Bus Station', district: 'Nyamasheke', province: 'Western', latitude: -2.3500, longitude: 29.1667, type: 'major' },
  { id: 'NS003', name: 'Bushoki Bus Station', district: 'Nyamasheke', province: 'Western', latitude: -2.4167, longitude: 29.1333, type: 'minor' },
  { id: 'NS004', name: 'Kanji Bus Station', district: 'Nyamasheke', province: 'Western', latitude: -2.3667, longitude: 29.1167, type: 'minor' },
];

export const getStationsByDistrict = (district: string): BusStation[] => {
  return rwandaStations.filter(station => station.district === district);
};

export const getStationsByProvince = (province: string): BusStation[] => {
  return rwandaStations.filter(station => station.province === province);
};

export const getAllDistricts = (): string[] => {
  return [...new Set(rwandaStations.map(s => s.district))].sort();
};

export const getAllProvinces = (): string[] => {
  return [...new Set(rwandaStations.map(s => s.province))].sort();
};

export const searchStations = (query: string): BusStation[] => {
  const lowerQuery = query.toLowerCase();
  return rwandaStations.filter(
    station =>
      station.name.toLowerCase().includes(lowerQuery) ||
      station.district.toLowerCase().includes(lowerQuery) ||
      station.province.toLowerCase().includes(lowerQuery)
  );
};

