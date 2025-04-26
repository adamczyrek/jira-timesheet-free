# Jira Timesheet Free Report Generator

A lightweight, secure web application for generating timesheet reports from Jira worklogs. Built with vanilla JavaScript and Python, this tool allows you to easily track time spent across Jira issues with no external dependencies, and for free.

## Screenshot
![image](https://github.com/user-attachments/assets/d73bb113-90f9-42fd-91ed-c8b89a6e52f3)

## Features

- Secure handling of Jira API credentials
- Generate detailed worklog reports
- Filter by date range and project
- Export to CSV format
- Direct links to Jira issues
- Save/load configuration locally
- Zero external dependencies
- Responsive design with automatic light/dark theme support

## Project Structure

```
jira-timesheet-free/
├── static/              # Static assets
│   ├── index.html      # Main HTML file
│   ├── script.js       # JavaScript code
│   └── styles.css      # CSS styles
├── server.py           # Python proxy server
├── LICENSE            # MIT license
└── README.md         # This file
```

## Security Considerations

### API Credentials
- The application uses a local proxy server to handle Jira API requests
- Credentials are never stored on the server, only forwarded to Jira
- All configuration data is stored locally in your browser
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

## Prerequisites

- Python 3.6 or higher
- A Jira Cloud instance
- A Jira API token (can be generated from your Atlassian account settings)

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
