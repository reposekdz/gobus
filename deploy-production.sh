#!/bin/bash

# GoBus Production Deployment Script
# This script deploys the GoBus application to production

set -e  # Exit on any error

echo "🚀 Starting GoBus Production Deployment..."

# Configuration
APP_NAME="gobus"
BACKEND_DIR="backend"
FRONTEND_DIR="."
MOBILE_DIR="mobile"
DEPLOY_USER="gobus"
DEPLOY_HOST="your-server.com"
DEPLOY_PATH="/var/www/gobus"
DB_NAME="gobus_production"
NODE_VERSION="18"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js $NODE_VERSION or higher."
        exit 1
    fi
    
    # Check Node.js version
    NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_CURRENT" -lt "$NODE_VERSION" ]; then
        log_error "Node.js version $NODE_VERSION or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed."
        exit 1
    fi
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        log_error "git is not installed."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Backend dependencies
    log_info "Installing backend dependencies..."
    cd $BACKEND_DIR
    npm ci --production
    cd ..
    
    # Frontend dependencies
    log_info "Installing frontend dependencies..."
    npm ci --production
    
    log_success "Dependencies installed"
}

# Build applications
build_applications() {
    log_info "Building applications..."
    
    # Build frontend
    log_info "Building frontend..."
    npm run build
    
    # Build backend
    log_info "Building backend..."
    cd $BACKEND_DIR
    npm run build
    cd ..
    
    log_success "Applications built successfully"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Backend tests
    log_info "Running backend tests..."
    cd $BACKEND_DIR
    if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
        npm test
    else
        log_warning "No backend tests found"
    fi
    cd ..
    
    # Frontend tests
    log_info "Running frontend tests..."
    if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
        npm test -- --watchAll=false
    else
        log_warning "No frontend tests found"
    fi
    
    log_success "Tests completed"
}

# Setup database
setup_database() {
    log_info "Setting up production database..."
    
    # Check if MySQL is available
    if ! command -v mysql &> /dev/null; then
        log_error "MySQL is not installed or not in PATH"
        exit 1
    fi
    
    # Create database if it doesn't exist
    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    # Run schema
    log_info "Running database schema..."
    mysql -u root -p $DB_NAME < backend/production-schema.sql
    
    log_success "Database setup completed"
}

# Create environment files
create_env_files() {
    log_info "Creating environment files..."
    
    # Backend environment
    cat > $BACKEND_DIR/.env << EOF
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=gobus_user
DB_PASSWORD=your_secure_password
DB_NAME=$DB_NAME
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
FRONTEND_URL=https://gobus.rw
CORS_ORIGIN=https://gobus.rw
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FILE_UPLOAD_MAX_SIZE=5242880
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=7d
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@gobus.rw
SMTP_PASS=your_email_password
MOBILE_MONEY_API_KEY=your_momo_api_key
MOBILE_MONEY_API_SECRET=your_momo_api_secret
BLOCKCHAIN_NETWORK=mainnet
BLOCKCHAIN_PRIVATE_KEY=your_blockchain_private_key
SSL_CERT_PATH=/etc/ssl/certs/gobus.crt
SSL_KEY_PATH=/etc/ssl/private/gobus.key
EOF

    # Frontend environment
    cat > .env.production << EOF
REACT_APP_API_URL=https://api.gobus.rw/api/v1
REACT_APP_SOCKET_URL=https://api.gobus.rw
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=1.0.0
REACT_APP_SENTRY_DSN=your_frontend_sentry_dsn
REACT_APP_GOOGLE_ANALYTICS_ID=your_ga_id
REACT_APP_GOOGLE_MAPS_API_KEY=your_maps_api_key
REACT_APP_PUSHER_APP_KEY=your_pusher_key
REACT_APP_PUSHER_CLUSTER=your_pusher_cluster
EOF

    log_success "Environment files created"
}

# Setup SSL certificates
setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    # Create SSL directory
    sudo mkdir -p /etc/ssl/certs /etc/ssl/private
    
    # Generate self-signed certificate for development (replace with real certificates in production)
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/gobus.key \
        -out /etc/ssl/certs/gobus.crt \
        -subj "/C=RW/ST=Kigali/L=Kigali/O=GoBus/CN=gobus.rw"
    
    # Set proper permissions
    sudo chmod 600 /etc/ssl/private/gobus.key
    sudo chmod 644 /etc/ssl/certs/gobus.crt
    
    log_success "SSL certificates configured"
}

# Setup systemd services
setup_services() {
    log_info "Setting up systemd services..."
    
    # Backend service
    sudo tee /etc/systemd/system/gobus-backend.service > /dev/null << EOF
[Unit]
Description=GoBus Backend API
After=network.target mysql.service redis.service

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=$DEPLOY_PATH/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=gobus-backend

[Install]
WantedBy=multi-user.target
EOF

    # Enable and start services
    sudo systemctl daemon-reload
    sudo systemctl enable gobus-backend
    
    log_success "Systemd services configured"
}

# Setup nginx
setup_nginx() {
    log_info "Setting up Nginx..."
    
    sudo tee /etc/nginx/sites-available/gobus << EOF
# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

# Upstream backend
upstream gobus_backend {
    server 127.0.0.1:5000;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name gobus.rw www.gobus.rw api.gobus.rw;
    return 301 https://\$server_name\$request_uri;
}

# Main application
server {
    listen 443 ssl http2;
    server_name gobus.rw www.gobus.rw;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/gobus.crt;
    ssl_certificate_key /etc/ssl/private/gobus.key;
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
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' wss: https:;";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Root directory
    root $DEPLOY_PATH/dist;
    index index.html;
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://gobus_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://gobus_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # React app
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# API subdomain
server {
    listen 443 ssl http2;
    server_name api.gobus.rw;
    
    # SSL Configuration (same as above)
    ssl_certificate /etc/ssl/certs/gobus.crt;
    ssl_certificate_key /etc/ssl/private/gobus.key;
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
    
    # API routes
    location / {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://gobus_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/gobus /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    
    log_success "Nginx configured"
}

# Setup monitoring
setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Create log directories
    sudo mkdir -p /var/log/gobus
    sudo chown $DEPLOY_USER:$DEPLOY_USER /var/log/gobus
    
    # Setup logrotate
    sudo tee /etc/logrotate.d/gobus << EOF
/var/log/gobus/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $DEPLOY_USER $DEPLOY_USER
    postrotate
        systemctl reload gobus-backend
    endscript
}
EOF

    log_success "Monitoring configured"
}

# Setup backup
setup_backup() {
    log_info "Setting up backup system..."
    
    # Create backup script
    sudo tee /usr/local/bin/gobus-backup.sh << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/gobus"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR

# Database backup
mysqldump -u root -p$DB_NAME > \$BACKUP_DIR/db_\$DATE.sql
gzip \$BACKUP_DIR/db_\$DATE.sql

# Application backup
tar -czf \$BACKUP_DIR/app_\$DATE.tar.gz -C $DEPLOY_PATH .

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF

    sudo chmod +x /usr/local/bin/gobus-backup.sh
    
    # Setup cron job for daily backups
    echo "0 2 * * * /usr/local/bin/gobus-backup.sh >> /var/log/gobus/backup.log 2>&1" | sudo crontab -
    
    log_success "Backup system configured"
}

# Deploy application
deploy_application() {
    log_info "Deploying application..."
    
    # Create deployment directory
    sudo mkdir -p $DEPLOY_PATH
    sudo chown $DEPLOY_USER:$DEPLOY_USER $DEPLOY_PATH
    
    # Copy built files
    cp -r dist/* $DEPLOY_PATH/
    cp -r $BACKEND_DIR/dist $DEPLOY_PATH/backend/
    cp -r $BACKEND_DIR/node_modules $DEPLOY_PATH/backend/
    cp $BACKEND_DIR/.env $DEPLOY_PATH/backend/
    
    # Set permissions
    sudo chown -R $DEPLOY_USER:$DEPLOY_USER $DEPLOY_PATH
    sudo chmod -R 755 $DEPLOY_PATH
    
    log_success "Application deployed"
}

# Start services
start_services() {
    log_info "Starting services..."
    
    # Start backend
    sudo systemctl start gobus-backend
    sudo systemctl status gobus-backend --no-pager
    
    # Start nginx
    sudo systemctl start nginx
    sudo systemctl status nginx --no-pager
    
    log_success "Services started"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    if curl -f -s http://localhost:5000/health > /dev/null; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        exit 1
    fi
    
    # Check frontend
    if curl -f -s http://localhost/health > /dev/null; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        exit 1
    fi
    
    log_success "All health checks passed"
}

# Main deployment function
main() {
    log_info "Starting GoBus production deployment..."
    
    check_prerequisites
    install_dependencies
    build_applications
    run_tests
    setup_database
    create_env_files
    setup_ssl
    setup_services
    setup_nginx
    setup_monitoring
    setup_backup
    deploy_application
    start_services
    health_check
    
    log_success "🎉 GoBus deployment completed successfully!"
    log_info "Application is now available at: https://gobus.rw"
    log_info "API is available at: https://api.gobus.rw"
    log_info "Admin panel: https://gobus.rw/admin"
    log_info ""
    log_info "Next steps:"
    log_info "1. Update DNS records to point to this server"
    log_info "2. Replace self-signed SSL certificates with real ones"
    log_info "3. Configure monitoring and alerting"
    log_info "4. Set up automated backups"
    log_info "5. Configure firewall rules"
}

# Run main function
main "$@"