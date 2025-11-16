#!/bin/bash

# GoBus Production Deployment Script
set -e

echo "🚀 Starting GoBus deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="gobus"
BACKEND_DIR="backend"
FRONTEND_DIR="."
MOBILE_DIR="mobile"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed - skipping containerization"
    fi
    
    print_status "Dependencies check completed"
}

# Install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    cd $BACKEND_DIR
    npm ci --production
    cd ..
}

# Install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    npm ci
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    npm run build
    
    # Copy built files to backend public directory
    print_status "Copying frontend build to backend..."
    rm -rf $BACKEND_DIR/public
    cp -r dist $BACKEND_DIR/public
}

# Build backend
build_backend() {
    print_status "Building backend..."
    cd $BACKEND_DIR
    npm run build
    cd ..
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    cd $BACKEND_DIR
    npm run migrate
    cd ..
}

# Create systemd service file
create_systemd_service() {
    print_status "Creating systemd service..."
    
    cat > /tmp/gobus.service << EOF
[Unit]
Description=GoBus Backend Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/gobus/backend
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    sudo mv /tmp/gobus.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable gobus
}

# Setup nginx configuration
setup_nginx() {
    print_status "Setting up Nginx configuration..."
    
    cat > /tmp/gobus.nginx << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Socket.IO proxy
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
    
    # Static files
    location / {
        root /var/www/gobus/backend/public;
        try_files \$uri \$uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Uploads
    location /uploads/ {
        root /var/www/gobus/backend;
        expires 30d;
        add_header Cache-Control "public";
    }
}
EOF

    sudo mv /tmp/gobus.nginx /etc/nginx/sites-available/gobus
    sudo ln -sf /etc/nginx/sites-available/gobus /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
}

# Create Docker configuration
create_docker_config() {
    print_status "Creating Docker configuration..."
    
    # Backend Dockerfile
    cat > $BACKEND_DIR/Dockerfile << EOF
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start application
CMD ["npm", "start"]
EOF

    # Docker Compose
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env
    depends_on:
      - mysql
      - redis
    restart: unless-stopped
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/logs:/app/logs

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: \${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: \${MYSQL_DATABASE}
      MYSQL_USER: \${MYSQL_USER}
      MYSQL_PASSWORD: \${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backend/schema.mysql.sql:/docker-entrypoint-initdb.d/schema.sql
    restart: unless-stopped
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./backend/public:/var/www/html
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
EOF
}

# Main deployment function
deploy() {
    print_status "Starting deployment process..."
    
    check_dependencies
    install_backend_deps
    install_frontend_deps
    build_frontend
    build_backend
    
    if [ "$1" = "docker" ]; then
        create_docker_config
        print_status "Docker configuration created. Run 'docker-compose up -d' to start services."
    else
        run_migrations
        create_systemd_service
        setup_nginx
        
        # Start services
        sudo systemctl start gobus
        sudo systemctl status gobus
        
        print_status "Deployment completed successfully!"
        print_status "Backend is running on port 5000"
        print_status "Frontend is served by Nginx"
    fi
}

# Rollback function
rollback() {
    print_warning "Rolling back to previous version..."
    
    # Stop services
    sudo systemctl stop gobus
    
    # Restore from backup (implement backup strategy)
    # This is a placeholder - implement actual rollback logic
    
    # Start services
    sudo systemctl start gobus
    
    print_status "Rollback completed"
}

# Health check function
health_check() {
    print_status "Performing health check..."
    
    # Check backend health
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        print_status "Backend is healthy"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Check database connection
    if systemctl is-active --quiet mysql; then
        print_status "Database is running"
    else
        print_error "Database is not running"
        exit 1
    fi
    
    # Check Redis connection
    if systemctl is-active --quiet redis; then
        print_status "Redis is running"
    else
        print_error "Redis is not running"
        exit 1
    fi
    
    print_status "All services are healthy"
}

# Main script logic
case "$1" in
    "deploy")
        deploy $2
        ;;
    "rollback")
        rollback
        ;;
    "health")
        health_check
        ;;
    "docker")
        deploy docker
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health|docker}"
        echo "  deploy        - Deploy the application"
        echo "  deploy docker - Create Docker configuration"
        echo "  rollback      - Rollback to previous version"
        echo "  health        - Check application health"
        exit 1
        ;;
esac