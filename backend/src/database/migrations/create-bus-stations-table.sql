-- Create bus_stations table for comprehensive Rwanda bus stations
CREATE TABLE IF NOT EXISTS bus_stations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  station_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  district VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  address TEXT,
  station_type ENUM('major', 'minor', 'terminal') DEFAULT 'major',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_province (province),
  INDEX idx_district (district),
  INDEX idx_station_type (station_type),
  INDEX idx_name (name),
  FULLTEXT INDEX idx_search (name, district, province)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

