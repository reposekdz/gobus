export const rwandaProvinces = [
  'Kigali City',
  'Eastern Province',
  'Northern Province', 
  'Southern Province',
  'Western Province'
];

export const rwandaDistricts = {
  'Kigali City': [
    'Gasabo',
    'Kicukiro', 
    'Nyarugenge'
  ],
  'Eastern Province': [
    'Bugesera',
    'Gatsibo',
    'Kayonza',
    'Kirehe',
    'Ngoma',
    'Nyagatare',
    'Rwamagana'
  ],
  'Northern Province': [
    'Burera',
    'Gakenke',
    'Gicumbi',
    'Musanze',
    'Rulindo'
  ],
  'Southern Province': [
    'Gisagara',
    'Huye',
    'Kamonyi',
    'Muhanga',
    'Nyamagabe',
    'Nyanza',
    'Nyaruguru',
    'Ruhango'
  ],
  'Western Province': [
    'Karongi',
    'Ngororero',
    'Nyabihu',
    'Nyamasheke',
    'Rubavu',
    'Rusizi',
    'Rutsiro'
  ]
};

export const majorCities = [
  { name: 'Kigali', district: 'Gasabo', province: 'Kigali City', isCapital: true },
  { name: 'Kimisagara', district: 'Nyarugenge', province: 'Kigali City' },
  { name: 'Kicukiro', district: 'Kicukiro', province: 'Kigali City' },
  { name: 'Rwamagana', district: 'Rwamagana', province: 'Eastern Province' },
  { name: 'Kayonza', district: 'Kayonza', province: 'Eastern Province' },
  { name: 'Nyagatare', district: 'Nyagatare', province: 'Eastern Province' },
  { name: 'Kibungo', district: 'Ngoma', province: 'Eastern Province' },
  { name: 'Kirehe', district: 'Kirehe', province: 'Eastern Province' },
  { name: 'Musanze', district: 'Musanze', province: 'Northern Province' },
  { name: 'Byumba', district: 'Gicumbi', province: 'Northern Province' },
  { name: 'Burera', district: 'Burera', province: 'Northern Province' },
  { name: 'Huye', district: 'Huye', province: 'Southern Province' },
  { name: 'Muhanga', district: 'Muhanga', province: 'Southern Province' },
  { name: 'Nyanza', district: 'Nyanza', province: 'Southern Province' },
  { name: 'Nyamagabe', district: 'Nyamagabe', province: 'Southern Province' },
  { name: 'Rubavu', district: 'Rubavu', province: 'Western Province' },
  { name: 'Rusizi', district: 'Rusizi', province: 'Western Province' },
  { name: 'Karongi', district: 'Karongi', province: 'Western Province' },
  { name: 'Nyamasheke', district: 'Nyamasheke', province: 'Western Province' }
];

export const popularRoutes = [
  { from: 'Kigali', to: 'Musanze', distance: 116, duration: '2h 30m', price: 2500 },
  { from: 'Kigali', to: 'Huye', distance: 136, duration: '2h 45m', price: 2800 },
  { from: 'Kigali', to: 'Rubavu', distance: 156, duration: '3h 15m', price: 3200 },
  { from: 'Kigali', to: 'Rusizi', distance: 228, duration: '4h 30m', price: 4500 },
  { from: 'Kigali', to: 'Rwamagana', distance: 52, duration: '1h 15m', price: 1500 },
  { from: 'Kigali', to: 'Nyagatare', distance: 167, duration: '3h 30m', price: 3500 },
  { from: 'Kigali', to: 'Muhanga', distance: 49, duration: '1h 10m', price: 1200 },
  { from: 'Kigali', to: 'Kayonza', distance: 74, duration: '1h 45m', price: 1800 },
  { from: 'Musanze', to: 'Rubavu', distance: 89, duration: '2h 15m', price: 2200 },
  { from: 'Huye', to: 'Rusizi', distance: 142, duration: '3h 20m', price: 3000 },
  { from: 'Rwamagana', to: 'Kayonza', distance: 32, duration: '45m', price: 800 },
  { from: 'Muhanga', to: 'Huye', distance: 87, duration: '2h 10m', price: 2000 },
  { from: 'Nyagatare', to: 'Kayonza', distance: 93, duration: '2h 20m', price: 2300 },
  { from: 'Musanze', to: 'Kigali', distance: 116, duration: '2h 30m', price: 2500 },
  { from: 'Huye', to: 'Kigali', distance: 136, duration: '2h 45m', price: 2800 },
  { from: 'Rubavu', to: 'Kigali', distance: 156, duration: '3h 15m', price: 3200 },
  { from: 'Rusizi', to: 'Kigali', distance: 228, duration: '4h 30m', price: 4500 },
  { from: 'Rwamagana', to: 'Kigali', distance: 52, duration: '1h 15m', price: 1500 },
  { from: 'Nyagatare', to: 'Kigali', distance: 167, duration: '3h 30m', price: 3500 },
  { from: 'Muhanga', to: 'Kigali', distance: 49, duration: '1h 10m', price: 1200 },
  { from: 'Kayonza', to: 'Kigali', distance: 74, duration: '1h 45m', price: 1800 }
];

export const getAllCities = () => {
  return majorCities.map(city => city.name).sort();
};

export const searchRoutes = (from: string, to: string) => {
  return popularRoutes.filter(route => 
    route.from.toLowerCase().includes(from.toLowerCase()) && 
    route.to.toLowerCase().includes(to.toLowerCase())
  );
};