# Jira Timesheet Free Report Generator

A lightweight, secure desktop and web application for generating timesheet reports from Jira worklogs. Built with Electron, JavaScript, and Python, this tool allows you to easily track time spent across Jira issues with no external dependencies, and for free.

## Screenshot
![image](https://github.com/user-attachments/assets/e2ce2d24-8a3d-486c-922a-3669b659a7ed)


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

## Why a Proxy Server?

### The CORS Challenge
When making direct requests from a web browser to the Jira API, you'll encounter CORS (Cross-Origin Resource Sharing) restrictions. This is a security feature implemented by browsers that prevents web pages from making requests to a different domain than the one that served the web page.

For example, if your page is served from `localhost:8000`, the browser will block direct requests to `your-company.atlassian.net` unless the Jira server explicitly allows it through CORS headers.

### How Our Proxy Solves the CORS Challenge
Our solution uses a simple Python HTTP server that acts as a proxy between your browser and the Jira API:

1. Your browser makes requests to `http://localhost:8000/proxy` (same origin, so no CORS issues)
2. The proxy server receives these requests and forwards them to the Jira API
3. The Jira API responds to the proxy server
4. The proxy server forwards the response back to your browser

This approach works because:
- CORS restrictions only apply to browser-initiated requests, not server-to-server communication
- The proxy server runs on the same origin as the web application, avoiding CORS entirely
- The server adds proper CORS headers in its responses back to the browser

### Security Implications
1. **Jira's CORS Policy**: Atlassian intentionally doesn't allow arbitrary domains to access their API directly from browsers. This prevents malicious websites from making unauthorized requests using stored cookies or credentials.

2. **Client-side Credentials**: Without a proxy, you'd need to include your API token in the frontend JavaScript code, which would:
   - Make your credentials visible in the browser's source code
   - Risk exposure through browser developer tools
   - Make it difficult to update credentials without changing the code

### How the Proxy Solves These Issues
Our proxy server:
1. Runs locally on your machine
2. Receives requests from the web interface
3. Adds your credentials server-side
4. Forwards the authenticated request to Jira
5. Returns the response to the web interface

This approach:
- Keeps API credentials secure on the server side
- Avoids CORS restrictions (browser → localhost is allowed)
- Provides a clean separation between frontend and API interaction
- Allows for additional security measures (rate limiting, request validation, etc.)

### Alternative Approaches (and Why We Didn't Use Them)
1. **Browser Extensions**: Could bypass CORS but requires installation and maintenance
2. **CORS Proxy Services**: Third-party services exist but would expose your credentials
3. **Jira OAuth**: More complex to set up and requires admin access to create apps
4. **Standalone Desktop App**: Would solve CORS but lose the convenience of web deployment

Our local proxy strikes the right balance between security, simplicity, and usability.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
