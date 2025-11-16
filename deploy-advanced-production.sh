#!/bin/bash

# =====================================================
# GOBUS ADVANCED PRODUCTION DEPLOYMENT SCRIPT
# =====================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="gobus"
DOMAIN="gobus.rw"
DB_NAME="gobus_production"
DB_USER="gobus_user"
DB_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 32)
WALLET_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Directories
PROJECT_DIR="/var/www/gobus"
BACKUP_DIR="/var/backups/gobus"
LOG_DIR="/var/log/gobus"
SSL_DIR="/etc/ssl/gobus"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  GoBus Advanced Production Deployment  ${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

print_status "Starting GoBus production deployment..."

# =====================================================
# SYSTEM UPDATES AND DEPENDENCIES
# =====================================================

print_status "Updating system packages..."
apt update && apt upgrade -y

print_status "Installing system dependencies..."
apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    build-essential \
    python3-pip \
    htop \
    iotop \
    iftop \
    fail2ban \
    ufw \
    logrotate \
    cron \
    supervisor \
    redis-server \
    nginx \
    certbot \
    python3-certbot-nginx

# =====================================================
# NODE.JS INSTALLATION
# =====================================================

print_status "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2 yarn

# =====================================================
# MYSQL INSTALLATION AND CONFIGURATION
# =====================================================

print_status "Installing MySQL 8.0..."
apt install -y mysql-server mysql-client

print_status "Securing MySQL installation..."
mysql_secure_installation <<EOF

y
2
${DB_PASSWORD}
${DB_PASSWORD}
y
y
y
y
EOF

print_status "Creating database and user..."
mysql -u root -p${DB_PASSWORD} <<EOF
CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

# =====================================================
# REDIS CONFIGURATION
# =====================================================

print_status "Configuring Redis..."
sed -i "s/# requirepass foobared/requirepass ${REDIS_PASSWORD}/" /etc/redis/redis.conf
sed -i "s/# maxmemory <bytes>/maxmemory 256mb/" /etc/redis/redis.conf
sed -i "s/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/" /etc/redis/redis.conf

systemctl restart redis-server
systemctl enable redis-server

# =====================================================
# PROJECT SETUP
# =====================================================

print_status "Creating project directories..."
mkdir -p ${PROJECT_DIR}
mkdir -p ${BACKUP_DIR}
mkdir -p ${LOG_DIR}
mkdir -p ${SSL_DIR}

print_status "Setting up project structure..."
cd ${PROJECT_DIR}

# Clone or copy project files (assuming files are already present)
if [ ! -d "backend" ]; then
    print_error "Backend directory not found. Please ensure project files are in ${PROJECT_DIR}"
    exit 1
fi

# =====================================================
# BACKEND SETUP
# =====================================================

print_status "Setting up backend..."
cd ${PROJECT_DIR}/backend

# Install dependencies
npm ci --production

# Create production environment file
cat > .env.production <<EOF
# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://${DOMAIN}
API_BASE_URL=https://api.${DOMAIN}

# Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=${DB_USER}
MYSQL_PASSWORD=${DB_PASSWORD}
MYSQL_DATABASE=${DB_NAME}
MYSQL_CONNECTION_LIMIT=50

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_DB=0

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_EXPIRES_IN=30d

# Session Configuration
SESSION_SECRET=${SESSION_SECRET}

# Blockchain Configuration
WALLET_ENCRYPTION_KEY=${WALLET_ENCRYPTION_KEY}
BLOCKCHAIN_NETWORK=mainnet

# Security Configuration
BCRYPT_ROUNDS=14
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30

# File Upload Configuration
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=${LOG_DIR}/gobus-production.log
LOG_MAX_SIZE=50m
LOG_MAX_FILES=30d

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Business Logic Configuration
BOOKING_EXPIRY_MINUTES=15
MAX_SEATS_PER_BOOKING=8
REFUND_WINDOW_HOURS=24

# Advanced Features
ENABLE_BLOCKCHAIN_WALLET=true
ENABLE_MOBILE_MONEY=true
ENABLE_QR_TICKETS=true
ENABLE_REAL_TIME_TRACKING=true
ENABLE_PUSH_NOTIFICATIONS=true
EOF

# Build backend
npm run build

# =====================================================
# FRONTEND SETUP
# =====================================================

print_status "Setting up frontend..."
cd ${PROJECT_DIR}

# Install frontend dependencies and build
npm ci --production
npm run build

# =====================================================
# MOBILE APP SETUP
# =====================================================

print_status "Setting up mobile app..."
cd ${PROJECT_DIR}/mobile

# Install dependencies
npm ci --production

# Build APK (if needed)
if command -v expo &> /dev/null; then
    print_status "Building mobile app..."
    npm run build:android
fi

# =====================================================
# DATABASE INITIALIZATION
# =====================================================

print_status "Initializing database..."
mysql -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < ${PROJECT_DIR}/backend/advanced-production-schema.sql

print_status "Database initialized successfully"

# =====================================================
# SSL CERTIFICATE SETUP
# =====================================================

print_status "Setting up SSL certificates..."
certbot --nginx -d ${DOMAIN} -d api.${DOMAIN} -d admin.${DOMAIN} -d company.${DOMAIN} -d driver.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}

# =====================================================
# NGINX CONFIGURATION
# =====================================================

print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/gobus <<EOF
# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=auth:10m rate=5r/s;

# Main frontend
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    root ${PROJECT_DIR}/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# API subdomain
server {
    listen 80;
    listen [::]:80;
    server_name api.${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
}

# Admin subdomain
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    root ${PROJECT_DIR}/admin/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Stricter rate limiting for admin
        limit_req zone=auth burst=10 nodelay;
    }
}
EOF

# Enable site and restart nginx
ln -sf /etc/nginx/sites-available/gobus /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# =====================================================
# PM2 CONFIGURATION
# =====================================================

print_status "Configuring PM2..."
cd ${PROJECT_DIR}/backend

cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'gobus-backend',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '${LOG_DIR}/gobus-error.log',
    out_file: '${LOG_DIR}/gobus-out.log',
    log_file: '${LOG_DIR}/gobus-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    env_file: '.env.production'
  }]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# =====================================================
# FIREWALL CONFIGURATION
# =====================================================

print_status "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow from 127.0.0.1 to any port 3306  # MySQL
ufw allow from 127.0.0.1 to any port 6379  # Redis
ufw allow from 127.0.0.1 to any port 5000  # Backend
ufw --force enable

# =====================================================
# FAIL2BAN CONFIGURATION
# =====================================================

print_status "Configuring Fail2Ban..."
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/*error.log
findtime = 600
bantime = 7200
maxretry = 10
EOF

systemctl restart fail2ban
systemctl enable fail2ban

# =====================================================
# LOG ROTATION
# =====================================================

print_status "Setting up log rotation..."
cat > /etc/logrotate.d/gobus <<EOF
${LOG_DIR}/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# =====================================================
# MONITORING SETUP
# =====================================================

print_status "Setting up monitoring..."

# Install Node Exporter for Prometheus
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
tar xvfz node_exporter-1.6.1.linux-amd64.tar.gz
cp node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/
rm -rf node_exporter-1.6.1.linux-amd64*

# Create node_exporter service
cat > /etc/systemd/system/node_exporter.service <<EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=nobody
Group=nogroup
Type=simple
ExecStart=/usr/local/bin/node_exporter --web.listen-address=127.0.0.1:9100

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl start node_exporter
systemctl enable node_exporter

# =====================================================
# BACKUP SETUP
# =====================================================

print_status "Setting up automated backups..."
cat > /usr/local/bin/gobus-backup.sh <<EOF
#!/bin/bash

BACKUP_DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/gobus_backup_\${BACKUP_DATE}.sql"

# Database backup
mysqldump -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > \${BACKUP_FILE}
gzip \${BACKUP_FILE}

# Files backup
tar -czf ${BACKUP_DIR}/gobus_files_\${BACKUP_DATE}.tar.gz ${PROJECT_DIR}/backend/uploads

# Clean old backups (keep 30 days)
find ${BACKUP_DIR} -name "gobus_*" -mtime +30 -delete

echo "Backup completed: \${BACKUP_DATE}"
EOF

chmod +x /usr/local/bin/gobus-backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/gobus-backup.sh >> ${LOG_DIR}/backup.log 2>&1") | crontab -

# =====================================================
# HEALTH CHECK SETUP
# =====================================================

print_status "Setting up health checks..."
cat > /usr/local/bin/gobus-health-check.sh <<EOF
#!/bin/bash

# Check if backend is running
if ! curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "Backend is down, restarting..."
    pm2 restart gobus-backend
    echo "Backend restarted at \$(date)" >> ${LOG_DIR}/health-check.log
fi

# Check MySQL
if ! mysqladmin ping -u ${DB_USER} -p${DB_PASSWORD} > /dev/null 2>&1; then
    echo "MySQL is down, restarting..."
    systemctl restart mysql
    echo "MySQL restarted at \$(date)" >> ${LOG_DIR}/health-check.log
fi

# Check Redis
if ! redis-cli -a ${REDIS_PASSWORD} ping > /dev/null 2>&1; then
    echo "Redis is down, restarting..."
    systemctl restart redis-server
    echo "Redis restarted at \$(date)" >> ${LOG_DIR}/health-check.log
fi

# Check Nginx
if ! systemctl is-active --quiet nginx; then
    echo "Nginx is down, restarting..."
    systemctl restart nginx
    echo "Nginx restarted at \$(date)" >> ${LOG_DIR}/health-check.log
fi
EOF

chmod +x /usr/local/bin/gobus-health-check.sh

# Add to crontab (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/gobus-health-check.sh") | crontab -

# =====================================================
# PERFORMANCE OPTIMIZATION
# =====================================================

print_status "Applying performance optimizations..."

# MySQL optimizations
cat >> /etc/mysql/mysql.conf.d/mysqld.cnf <<EOF

# GoBus Performance Optimizations
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
query_cache_type = 1
query_cache_size = 128M
max_connections = 200
thread_cache_size = 16
table_open_cache = 2048
EOF

# Nginx optimizations
cat >> /etc/nginx/nginx.conf <<EOF

# GoBus Performance Optimizations
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
client_max_body_size 50M;
client_body_buffer_size 128k;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;
output_buffers 1 32k;
postpone_output 1460;
EOF

# System optimizations
cat >> /etc/sysctl.conf <<EOF

# GoBus System Optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 400000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_window_scaling = 1
net.ipv4.tcp_max_orphans = 60000
net.ipv4.ip_local_port_range = 1024 65535
fs.file-max = 100000
EOF

sysctl -p

# =====================================================
# FINAL SETUP
# =====================================================

print_status "Restarting services..."
systemctl restart mysql
systemctl restart redis-server
systemctl restart nginx
pm2 restart all

print_status "Setting up service auto-start..."
systemctl enable mysql
systemctl enable redis-server
systemctl enable nginx

# =====================================================
# SECURITY HARDENING
# =====================================================

print_status "Applying security hardening..."

# Disable root SSH login
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Change SSH port (optional)
# sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

systemctl restart ssh

# Set proper file permissions
chown -R www-data:www-data ${PROJECT_DIR}
chmod -R 755 ${PROJECT_DIR}
chmod -R 644 ${PROJECT_DIR}/backend/.env.production

# =====================================================
# CLEANUP
# =====================================================

print_status "Cleaning up..."
apt autoremove -y
apt autoclean

# =====================================================
# DEPLOYMENT SUMMARY
# =====================================================

print_status "Deployment completed successfully!"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}         DEPLOYMENT SUMMARY             ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Domain:${NC} https://${DOMAIN}"
echo -e "${BLUE}API:${NC} https://api.${DOMAIN}"
echo -e "${BLUE}Admin:${NC} https://admin.${DOMAIN}"
echo ""
echo -e "${BLUE}Database:${NC}"
echo -e "  Name: ${DB_NAME}"
echo -e "  User: ${DB_USER}"
echo -e "  Password: ${DB_PASSWORD}"
echo ""
echo -e "${BLUE}Redis Password:${NC} ${REDIS_PASSWORD}"
echo ""
echo -e "${BLUE}JWT Secret:${NC} ${JWT_SECRET}"
echo ""
echo -e "${BLUE}Directories:${NC}"
echo -e "  Project: ${PROJECT_DIR}"
echo -e "  Logs: ${LOG_DIR}"
echo -e "  Backups: ${BACKUP_DIR}"
echo ""
echo -e "${BLUE}Services Status:${NC}"
systemctl is-active mysql && echo -e "  MySQL: ${GREEN}Active${NC}" || echo -e "  MySQL: ${RED}Inactive${NC}"
systemctl is-active redis-server && echo -e "  Redis: ${GREEN}Active${NC}" || echo -e "  Redis: ${RED}Inactive${NC}"
systemctl is-active nginx && echo -e "  Nginx: ${GREEN}Active${NC}" || echo -e "  Nginx: ${RED}Inactive${NC}"
pm2 list | grep -q "gobus-backend" && echo -e "  Backend: ${GREEN}Active${NC}" || echo -e "  Backend: ${RED}Inactive${NC}"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo -e "1. Save the database credentials securely"
echo -e "2. Update DNS records to point to this server"
echo -e "3. Configure external APIs (MTN, Airtel, etc.)"
echo -e "4. Set up monitoring alerts"
echo -e "5. Test all functionality before going live"
echo ""
echo -e "${GREEN}Deployment completed at: $(date)${NC}"

# Save deployment info
cat > ${PROJECT_DIR}/deployment-info.txt <<EOF
GoBus Production Deployment
===========================
Date: $(date)
Domain: ${DOMAIN}
Database: ${DB_NAME}
DB User: ${DB_USER}
DB Password: ${DB_PASSWORD}
Redis Password: ${REDIS_PASSWORD}
JWT Secret: ${JWT_SECRET}
Session Secret: ${SESSION_SECRET}
Wallet Encryption Key: ${WALLET_ENCRYPTION_KEY}

Directories:
- Project: ${PROJECT_DIR}
- Logs: ${LOG_DIR}
- Backups: ${BACKUP_DIR}

Services:
- MySQL: Port 3306
- Redis: Port 6379
- Backend: Port 5000
- Nginx: Ports 80, 443

SSL Certificate: Let's Encrypt
Firewall: UFW enabled
Monitoring: Node Exporter on port 9100
Backups: Daily at 2 AM
Health Checks: Every 5 minutes
EOF

print_status "Deployment information saved to ${PROJECT_DIR}/deployment-info.txt"
print_status "GoBus is now ready for production!"

exit 0