/**
 * Main Electron process file that creates the application window and manages the Python backend process.
 * This file is responsible for:
 * - Creating the main browser window
 * - Setting up IPC (Inter-Process Communication) channels between renderer and main process
 * - Starting and managing the Python proxy server
 * - Handling app lifecycle events (ready, window-all-closed, activate)
 */

const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const url = require('url');
const { PythonShell } = require('python-shell');
const log = require('electron-log');
const Store = require('electron-store');

// Initialize configuration store
const store = new Store();

// Keep a global reference of the window object to prevent it from being garbage collected
let mainWindow;
let pythonProcess = null;
let pythonPort = 8000;

/**
 * Create the main application window with appropriate settings
 */
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Jira Timesheet Free',
    icon: path.join(__dirname, '..', 'static', 'favicon.ico')
  });

  // Start Python server if not running in development mode with the server already started
  if (!process.env.ELECTRON_START_URL) {
    startPythonServer();
  }

  // Determine whether to load from development server or from local files
  const startUrl = process.env.ELECTRON_START_URL || 
    url.format({
      pathname: 'localhost:' + pythonPort,
      protocol: 'http:',
      slashes: true
    });

  // Load the app
  mainWindow.loadURL(startUrl);

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Set up application menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Jira Timesheet Free',
          click: async () => {
            shell.openExternal('https://github.com/adamczyrek/jira-timesheet-free');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Handle window close event
  mainWindow.on('closed', () => {
    mainWindow = null;
    stopPythonServer();
  });
}

/**
 * Start the Python proxy server that handles communication with the Jira API
 */
function startPythonServer() {
  try {
    // Determine the path to the Python script based on whether we're in development or production
    let pythonPath;
    if (app.isPackaged) {
      // In production, Python is in the resources directory
      pythonPath = path.join(process.resourcesPath, 'python');
    } else {
      // In development, Python is in the project directory
      pythonPath = path.join(__dirname, '..', 'python');
    }

    // Create options for the Python process
    const options = {
      mode: 'text',
      pythonPath: 'python', // Use system Python or bundled Python
      pythonOptions: ['-u'], // Unbuffered output
      scriptPath: pythonPath,
      args: [`--port=${pythonPort}`]
    };

    // Copy the server.py file to the python directory if in development mode
    if (!app.isPackaged) {
      const fs = require('fs');
      const srcPath = path.join(__dirname, '..', 'server.py');
      const destPath = path.join(pythonPath, 'server.py');
      
      // Create the directory if it doesn't exist
      if (!fs.existsSync(pythonPath)) {
        fs.mkdirSync(pythonPath, { recursive: true });
      }
      
      // Copy the file
      fs.copyFileSync(srcPath, destPath);
    }

    // Start the Python process
    pythonProcess = new PythonShell('server.py', options);

    // Log messages from the Python process
    pythonProcess.on('message', (message) => {
      log.info('Python Server:', message);
    });

    // Handle errors
    pythonProcess.on('error', (err) => {
      log.error('Python Server Error:', err);
      app.quit();
    });

    // Handle process exit
    pythonProcess.on('close', (code) => {
      log.info(`Python Server exited with code ${code}`);
    });

    log.info('Python server started');
  } catch (error) {
    log.error('Failed to start Python server:', error);
    app.quit();
  }
}

/**
 * Stop the Python server when the app is closing
 */
function stopPythonServer() {
  if (pythonProcess) {
    log.info('Stopping Python server');
    pythonProcess.kill();
    pythonProcess = null;
  }
}

// Create the window when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // macOS specific behavior to recreate window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopPythonServer();
    app.quit();
  }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  app.quit();
});
