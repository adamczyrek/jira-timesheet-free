/**
 * Preload script for Electron.
 * 
 * This file runs in a context between the main Electron process and the
 * renderer process (web content). It provides a controlled way for the
 * web content to access specific Electron and Node.js functionalities
 * through a secure contextBridge interface.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// specific Electron/Node.js APIs without directly accessing them.
contextBridge.exposeInMainWorld('electron', {
  // App info
  getAppVersion: () => process.env.npm_package_version,
  
  // Store API for saving/loading configuration
  store: {
    get: (key) => ipcRenderer.invoke('electron-store-get', key),
    set: (key, value) => ipcRenderer.invoke('electron-store-set', key, value),
    delete: (key) => ipcRenderer.invoke('electron-store-delete', key),
    clear: () => ipcRenderer.invoke('electron-store-clear')
  }
});
