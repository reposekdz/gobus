#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting GoBus Production Build...\n');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function step(message) {
    log(`\n📋 ${message}`, 'cyan');
}

function success(message) {
    log(`✅ ${message}`, 'green');
}

function error(message) {
    log(`❌ ${message}`, 'red');
}

function warning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

try {
    // Step 1: Clean previous builds
    step('Cleaning previous builds...');
    if (fs.existsSync('backend/dist')) {
        fs.rmSync('backend/dist', { recursive: true, force: true });
    }
    if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true, force: true });
    }
    success('Previous builds cleaned');

    // Step 2: Install backend dependencies
    step('Installing backend dependencies...');
    process.chdir('backend');
    execSync('npm ci --only=production', { stdio: 'inherit' });
    success('Backend dependencies installed');

    // Step 3: Build backend
    step('Building backend...');
    execSync('npm run build', { stdio: 'inherit' });
    success('Backend built successfully');

    // Step 4: Install frontend dependencies
    step('Installing frontend dependencies...');
    process.chdir('..');
    execSync('npm ci --only=production', { stdio: 'inherit' });
    success('Frontend dependencies installed');

    // Step 5: Build frontend
    step('Building frontend...');
    execSync('npm run build', { stdio: 'inherit' });
    success('Frontend built successfully');

    // Step 6: Create production package
    step('Creating production package...');
    
    // Create production directory structure
    const prodDir = 'production-build';
    if (fs.existsSync(prodDir)) {
        fs.rmSync(prodDir, { recursive: true, force: true });
    }
    fs.mkdirSync(prodDir, { recursive: true });
    fs.mkdirSync(`${prodDir}/backend`, { recursive: true });
    fs.mkdirSync(`${prodDir}/frontend`, { recursive: true });

    // Copy backend files
    execSync(`cp -r backend/dist ${prodDir}/backend/`);
    execSync(`cp backend/package.json ${prodDir}/backend/`);
    execSync(`cp backend/package-lock.json ${prodDir}/backend/`);
    execSync(`cp -r backend/uploads ${prodDir}/backend/` || true);

    // Copy frontend files
    if (fs.existsSync('dist')) {
        execSync(`cp -r dist/* ${prodDir}/frontend/`);
    } else if (fs.existsSync('build')) {
        execSync(`cp -r build/* ${prodDir}/frontend/`);
    }

    // Copy configuration files
    execSync(`cp docker-compose.production.yml ${prodDir}/`);
    execSync(`cp deploy-production.sh ${prodDir}/`);
    execSync(`cp backend/Dockerfile ${prodDir}/backend/`);
    execSync(`cp backend/.dockerignore ${prodDir}/backend/`);

    success('Production package created');

    // Step 7: Create deployment instructions
    step('Creating deployment instructions...');
    const deployInstructions = `
# GoBus Production Deployment

## Quick Start
1. Upload this entire directory to your production server
2. Copy .env.example to .env and configure your environment variables
3. Run: chmod +x deploy-production.sh
4. Run: ./deploy-production.sh deploy

## Manual Deployment
1. Install Docker and Docker Compose on your server
2. Configure environment variables in .env file
3. Run: docker-compose -f docker-compose.production.yml up -d

## Health Check
- Application: http://your-domain/health
- API: http://your-domain/api/v1/health

## Monitoring
- Grafana: http://your-domain:3001
- Prometheus: http://your-domain:9090

For detailed instructions, see PRODUCTION-DEPLOYMENT.md
`;

    fs.writeFileSync(`${prodDir}/DEPLOYMENT.md`, deployInstructions);
    success('Deployment instructions created');

    // Step 8: Generate build info
    step('Generating build information...');
    const buildInfo = {
        buildDate: new Date().toISOString(),
        version: require('./package.json').version || '1.0.0',
        nodeVersion: process.version,
        environment: 'production',
        features: [
            'Real-time bus booking',
            'Multi-role support',
            'Live GPS tracking',
            'Digital wallet system',
            'Loyalty program',
            'Package delivery',
            'Lost & found system',
            'Multi-language support',
            'Push notifications',
            'Dynamic pricing',
            'Charter booking',
            'Corporate travel',
            'Advanced analytics',
            'Blockchain integration',
            'AI recommendations'
        ]
    };

    fs.writeFileSync(`${prodDir}/build-info.json`, JSON.stringify(buildInfo, null, 2));
    success('Build information generated');

    // Final success message
    log('\n🎉 Production build completed successfully!', 'green');
    log(`📦 Production package created in: ${prodDir}/`, 'cyan');
    log('📖 See DEPLOYMENT.md for deployment instructions', 'blue');
    
    // Display build summary
    log('\n📊 Build Summary:', 'bright');
    log(`   Version: ${buildInfo.version}`, 'blue');
    log(`   Build Date: ${buildInfo.buildDate}`, 'blue');
    log(`   Node Version: ${buildInfo.nodeVersion}`, 'blue');
    log(`   Features: ${buildInfo.features.length} advanced features included`, 'blue');

} catch (err) {
    error(`Build failed: ${err.message}`);
    process.exit(1);
}