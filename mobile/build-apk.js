const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building GoBus Mobile APK...');

// Check if Expo CLI is installed
try {
    execSync('npx expo --version', { stdio: 'ignore' });
} catch (error) {
    console.log('Installing Expo CLI...');
    execSync('npm install -g @expo/cli', { stdio: 'inherit' });
}

// Check if EAS CLI is installed
try {
    execSync('npx eas --version', { stdio: 'ignore' });
} catch (error) {
    console.log('Installing EAS CLI...');
    execSync('npm install -g eas-cli', { stdio: 'inherit' });
}

// Install dependencies
console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Build APK
console.log('Building APK...');
try {
    execSync('npx eas build --platform android --profile production --local', { 
        stdio: 'inherit',
        cwd: __dirname
    });
    console.log('✅ APK build completed successfully!');
} catch (error) {
    console.error('❌ APK build failed:', error.message);
    process.exit(1);
}