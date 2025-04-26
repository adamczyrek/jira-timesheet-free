# Jira Timesheet Free Report Generator

A lightweight, secure desktop and web application for generating timesheet reports from Jira worklogs. Built with Electron, JavaScript, and Python, this tool allows you to easily track time spent across Jira issues with no external dependencies, and for free.

## Screenshot
![image](https://github.com/user-attachments/assets/d73bb113-90f9-42fd-91ed-c8b89a6e52f3)


## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/jira-timesheet-free.git
   cd jira-timesheet-free
   ```
   (Or just download and expand the zip file, then run command prompt)

2. Start the server:
   ```bash
   python server.py
   ```
   (If you are not sure if you have python installed: https://www.python.org/downloads/)

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## Configuration

You'll need the following information from your Jira instance:

1. **Jira Domain**: Your Atlassian domain (e.g., `your-domain.atlassian.net`)
2. **Email**: Your Atlassian account email
3. **API Token**: Generate from [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
4. **Timesheet User Email**: Email of the user whose timesheet you want to generate (leave empty to use your own email, you can only generate timesheets for other users if you are a Jira admin)

Optional filters:
- Project Key (e.g., "PROJ")
- Start Date
- End Date

## Usage

1. Enter your Jira credentials and configuration
2. Click "Generate Report"
3. View your worklog data in the table
4. Download as CSV:
   - Detailed report includes all worklog entries
   - Summary report shows daily totals

## Features

- Convenient desktop application with automatic updates
- Secure handling of Jira API credentials
- Generate detailed worklog reports
- Filter by date range and project
- Export to CSV format with total hours
- Direct links to Jira issues
- Save/load configuration locally
- Zero external dependencies
- Responsive design with automatic light/dark theme support
- Available as both a desktop app and a simple web application

## Installation & Usage

### Recommended: Desktop Application (Electron)

The easiest way to use Jira Timesheet Free is with our desktop application, which packages everything you need into a single installer.

#### Download & Install

You can download the latest release:

- Windows: `[Jira-Timesheet-Free-Setup-1.0.0.exe](https://github.com/adamczyrek/jira-timesheet-free/releases/Jira-Timesheet-Free-Setup-1.0.0.exe)`
- macOS: `Jira-Timesheet-Free-1.0.0.dmg` (coming soon)
- Linux: `Jira-Timesheet-Free-1.0.0.AppImage` (coming soon)

Run the installer and follow the prompts. Once installed, launch the app from your desktop shortcut or applications menu.

#### Running from Source

If you prefer to run the app from source:

**Prerequisites**
- Node.js 14 or higher
- npm or yarn
- Python 3.6 or higher

**Quick Start**

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/jira-timesheet-free.git
   cd jira-timesheet-free
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   node start-app.js --electron
   ```

**Building from Source**

To create your own installer:

```bash
npm run dist
```

This will create platform-specific installers in the `dist` folder.

### Alternative: Run as a Web Application

If you prefer not to install a desktop application or have specific deployment needs, you can run Jira Timesheet Free as a standalone web application with just Python.

**Prerequisites**
- Python 3.6 or higher
- A Jira Cloud instance
- A Jira API token

**Quick Start**

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/jira-timesheet-free.git
   cd jira-timesheet-free
   ```

2. Start the server:
   ```bash
   python server.py
   ```
   or
   ```bash
   node start-app.js
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## Project Structure

```
jira-timesheet-free/
├── static/              # Static web assets (HTML, CSS, JS)
├── python/             # Python implementation
├── electron/           # Electron app files
├── server.py           # Python proxy server launcher
├── start-app.js        # Application launcher script
├── package.json        # Node.js dependencies and scripts
├── LICENSE             # MIT license
└── README.md           # This file
```

## Configuration

You'll need the following information from your Jira instance:

1. **Jira Domain**: Your Atlassian domain (e.g., `your-domain.atlassian.net`)
2. **Email**: Your Atlassian account email
3. **API Token**: Generate from [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
4. **Timesheet User Email**: Email of the user whose timesheet you want to generate (leave empty to use your own email, you can only generate timesheets for other users if you are a Jira admin)

Optional filters:
- Project Key (e.g., "PROJ") - Filter to a specific project
- Start Date - Beginning of the timesheet period
- End Date - End of the timesheet period

## Usage

1. Enter your Jira credentials and configuration
2. Click "Generate Report"
3. View your worklog data in the table, with total hours at the bottom
4. Download as CSV:
   - Detailed report includes all worklog entries
   - Summary report shows daily totals

## Security Considerations

### API Credentials
- The application uses a local proxy to handle Jira API requests
- Credentials are never stored on a remote server, only forwarded to Jira
- All configuration data is stored locally in Electron's secure storage or your browser's localStorage
- SSL verification is enforced for all Jira API requests

### CORS and Network Security
- The proxy server only accepts requests from localhost
- CORS headers are properly configured
- No external network requests except to your Jira instance

## Prerequisites

- Python 3.6 or higher
- A Jira Cloud instance
- A Jira API token (can be generated from your Atlassian account settings)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
