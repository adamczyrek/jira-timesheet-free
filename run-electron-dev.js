/**
 * Development script for running the Electron app with the Python server
 * This script first starts the Python server and then launches the Electron app
 * pointing to that server.
 */

const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');
const waitOn = require('wait-on');

// Configuration
const PORT = 8000;
const SERVER_URL = `http://localhost:${PORT}`;
const WAIT_TIMEOUT = 30000; // 30 seconds timeout for server to start

console.log('Starting Jira Timesheet Free in development mode...');

// Start Python server
console.log('Starting Python server...');
const pythonProcess = spawn('python', ['server.py'], {
  stdio: 'inherit',
  shell: true
});

// Handle Python server exit
pythonProcess.on('exit', (code) => {
  if (code !== null) {
    console.log(`Python server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle script termination to clean up Python process
process.on('SIGINT', () => {
  console.log('Stopping Python server and Electron...');
  pythonProcess.kill();
  process.exit(0);
});

process.on('exit', () => {
  pythonProcess.kill();
});

// Wait for server to be available then start Electron
console.log(`Waiting for server to be available at ${SERVER_URL}...`);
waitOn({
  resources: [SERVER_URL],
  timeout: WAIT_TIMEOUT
})
  .then(() => {
    console.log('Server is up! Starting Electron...');
    
    // Start Electron with environment variable to point to the dev server
    const electronProcess = spawn(
      electron, 
      ['.'], 
      {
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          ELECTRON_START_URL: SERVER_URL,
          NODE_ENV: 'development'
        }
      }
    );
    
    electronProcess.on('exit', (code) => {
      console.log(`Electron exited with code ${code}`);
      pythonProcess.kill();
      process.exit(code);
    });
  })
  .catch((err) => {
    console.error('Error waiting for server:', err);
    pythonProcess.kill();
    process.exit(1);
  });
