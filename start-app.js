#!/usr/bin/env node
/**
 * Jira Timesheet Free - Application Starter
 * 
 * This script provides a simple way to start the application in different modes:
 * - Web mode (default): Starts only the Python server for browser access
 * - Electron mode: Starts the Electron desktop application
 * 
 * Usage:
 *   node start-app.js [options]
 * 
 * Options:
 *   --electron   Start in Electron mode
 *   --help       Show help information
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const isElectron = args.includes('--electron');
const showHelp = args.includes('--help');

// Show help and exit
if (showHelp) {
  console.log(`
Jira Timesheet Free - Application Starter

Usage:
  node start-app.js [options]

Options:
  --electron   Start in Electron mode
  --help       Show this help information

Examples:
  node start-app.js            # Start in web mode (Python server only)
  node start-app.js --electron # Start as Electron desktop app
  `);
  process.exit(0);
}

// Check if we're in the right directory
if (!fs.existsSync('./server.py')) {
  console.error('Error: Could not find server.py. Please run this script from the project root directory.');
  process.exit(1);
}

// Check if npm is installed when electron mode is requested
if (isElectron) {
  try {
    const npmVersion = require('child_process').execSync('npm --version').toString().trim();
    console.log(`Found npm version ${npmVersion}`);
  } catch (e) {
    console.error('Error: npm is required to run in Electron mode. Please install Node.js and npm first.');
    process.exit(1);
  }
}

// Start in the appropriate mode
if (isElectron) {
  console.log('Starting Jira Timesheet Free in Electron mode...');
  
  // Check if node_modules exists, if not, offer to install dependencies
  if (!fs.existsSync('./node_modules')) {
    console.log('Node dependencies not found. Installing dependencies first...');
    
    const npmInstall = spawn('npm', ['install'], {
      stdio: 'inherit',
      shell: true
    });
    
    npmInstall.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Error: npm install failed with code ${code}`);
        process.exit(code);
      } else {
        console.log('Dependencies installed successfully. Starting application...');
        startElectron();
      }
    });
  } else {
    startElectron();
  }
} else {
  console.log('Starting Jira Timesheet Free in web mode...');
  
  // Start Python server directly
  const pythonProcess = spawn('python', ['server.py'], {
    stdio: 'inherit',
    shell: true
  });
  
  pythonProcess.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });
  
  // Handle termination signals
  process.on('SIGINT', () => {
    console.log('\nStopping server...');
    pythonProcess.kill();
  });
}

// Function to start the Electron app
function startElectron() {
  // Start using npm script for consistency
  const npmStart = spawn('npm', ['run', 'start'], {
    stdio: 'inherit',
    shell: true
  });
  
  npmStart.on('exit', (code) => {
    console.log(`Electron app exited with code ${code}`);
    process.exit(code);
  });
}
