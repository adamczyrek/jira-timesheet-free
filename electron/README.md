# Electron Implementation for Jira Timesheet Free

This directory contains the Electron implementation files for packaging the Jira Timesheet Free application as a desktop app.

## Structure

- `main.js` - The main Electron process that creates windows and manages the Python backend
- `preload.js` - Preload script that provides secure communication between Electron and the web content

## Development

To run the application in development mode:

```
npm run dev
```

This will start both the Python server and Electron app together.

## Building

To build the application for your current platform:

```
npm run dist
```

This creates platform-specific packages in the `dist` directory.

## Implementation Notes

- The Electron app embeds the Python interpreter and server to avoid requiring a separate installation
- Communication between the frontend and Python backend happens via HTTP on localhost
- We use the same static files from the web version to maintain a single codebase
