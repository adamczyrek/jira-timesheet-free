/**
 * Main Electron process file that creates the application window and manages the Python backend process.
 * This file is responsible for:
 * - Creating the main browser window
 * - Setting up IPC (Inter-Process Communication) channels between renderer and main process
 * - Starting and managing the Python proxy server
 * - Handling app lifecycle events (ready, window-all-closed, activate)
 */

const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron');
const path = require('path');
const url = require('url');
const { PythonShell } = require('python-shell');
const log = require('electron-log');
const Store = require('electron-store');
const fs = require('fs');

// Configure logging
log.transports.file.level = 'debug';
log.transports.console.level = 'debug';
log.info('App starting...');

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
  log.info('Creating main window...');
  
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
    icon: path.join(__dirname, 'icons', 'win', 'icon.ico')
  });

  // Start Python server if not running in development mode with the server already started
  if (!process.env.ELECTRON_START_URL) {
    startPythonServer();
  }

  // Enable DevTools in development mode or with explicit flag
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
    log.info('DevTools opened for debugging');
  }

  // Log when fails and when succeeds
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log.error(`Failed to load: ${errorDescription} (${errorCode})`);
    dialog.showErrorBox('Loading Error', 
      `Failed to load the application: ${errorDescription}\n\n` +
      'Please check the logs for more details.'
    );
  });

  mainWindow.webContents.on('did-finish-load', () => {
    log.info('Page loaded successfully');
  });

  // Wait a bit for the Python server to start before loading the URL
  setTimeout(() => {
    // Determine whether to load from development server or from local server
    const startUrl = process.env.ELECTRON_START_URL || 
      url.format({
        pathname: 'localhost:' + pythonPort,
        protocol: 'http:',
        slashes: true
      });

    log.info(`Loading URL: ${startUrl}`);
    
    // Load the app
    mainWindow.loadURL(startUrl);
  }, 2000); // Wait 2 seconds for the server to start

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
        },
        {
          label: 'Toggle Developer Tools',
          click: () => mainWindow.webContents.toggleDevTools()
        },
        {
          label: 'Show Logs',
          click: () => {
            const logPath = log.transports.file.getFile().path;
            shell.showItemInFolder(logPath);
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
    log.info('Starting Python server...');
    
    // Determine the path to the Python script based on whether we're in development or production
    let pythonScriptPath;
    
    if (app.isPackaged) {
      // In packaged app, server.py should be in the resources folder
      pythonScriptPath = path.join(process.resourcesPath, 'server.py');
    } else {
      // In development, server.py is in the project root
      pythonScriptPath = path.join(app.getAppPath(), 'server.py');
    }

    log.info(`Using Python script at: ${pythonScriptPath}`);

    // Verify the script exists
    if (!fs.existsSync(pythonScriptPath)) {
      log.error(`Python script not found at: ${pythonScriptPath}`);
      dialog.showErrorBox('Server Error', 
        `Could not find server.py at: ${pythonScriptPath}\n\n` +
        'The application may not work correctly. Please reinstall it.'
      );
      return;
    }

    // Create options for the Python process
    const options = {
      mode: 'text',
      pythonPath: 'python', // Use system Python
      pythonOptions: ['-u'], // Unbuffered output
      args: [`--port=${pythonPort}`]
    };

    log.info('Python options:', JSON.stringify(options));

    // Start the Python process
    pythonProcess = new PythonShell(pythonScriptPath, options);

    // Log messages from the Python process
    pythonProcess.on('message', (message) => {
      log.info('Python Server:', message);
    });

    // Handle errors
    pythonProcess.on('error', (err) => {
      log.error('Python Server Error:', err);
      dialog.showErrorBox('Server Error', 
        `Failed to start the Python server: ${err.message}\n\n` +
        'The application may not work correctly. Please check your Python installation.'
      );
    });

    // Handle process exit
    pythonProcess.on('close', (code) => {
      log.info(`Python Server exited with code ${code}`);
      if (code !== 0) {
        dialog.showErrorBox('Server Error', 
          `The Python server exited unexpectedly with code ${code}.\n\n` +
          'The application may not work correctly. Please check the logs for details.'
        );
      }
    });

    log.info('Python server started');
  } catch (error) {
    log.error('Failed to start Python server:', error);
    dialog.showErrorBox('Server Error', 
      `Failed to start the Python server: ${error.message}\n\n` +
      'The application may not work correctly. Please check your Python installation.'
    );
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
  log.info('App is ready, creating window...');
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
  dialog.showErrorBox('Application Error', 
    `An unhandled error occurred: ${error.message}\n\n` +
    'The application may not work correctly. Please check the logs for details.'
  );
  app.quit();
});
