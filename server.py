#!/usr/bin/env python
"""
Jira Timesheet Free - Proxy Server

This server functions as a proxy between the web client and Jira API to:
1. Bypass CORS restrictions
2. Keep API credentials secure on the server side
3. Handle authentication and forwarding requests to Jira
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import urllib.request
import urllib.parse
import urllib.error
from urllib.error import URLError
import base64
import ssl
import os
import sys
import argparse

# Enable debug logging
DEBUG = True
# Global variable for static files path
STATIC_PATH = None

def debug_log(message):
    """Print debug log messages if DEBUG is enabled"""
    if DEBUG:
        print(f"DEBUG: {message}")

class JiraProxyHandler(SimpleHTTPRequestHandler):
    """
    Custom HTTP request handler that proxies requests to Jira API
    and serves static files from the static directory.
    """
    
    def log_message(self, format, *args):
        """Override to provide more detailed logging"""
        if DEBUG:
            sys.stderr.write("%s - - [%s] %s\n" %
                             (self.address_string(),
                              self.log_date_time_string(),
                              format%args))
    
    def end_headers(self):
        """Add CORS headers to all responses"""
        self.send_cors_headers()
        SimpleHTTPRequestHandler.end_headers(self)

    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        """Handle POST requests, primarily for the proxy endpoint"""
        if self.path == '/proxy':
            try:
                # Read request body
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                request_data = json.loads(body)

                # Extract Jira credentials and request details
                jira_domain = request_data.get('domain')
                email = request_data.get('email')
                api_token = request_data.get('apiToken')
                url_path = request_data.get('path')
                
                if not all([jira_domain, email, api_token, url_path]):
                    self.send_error_response(400, "Missing required parameters")
                    return

                # Construct full Jira URL
                jira_url = f"https://{jira_domain}{url_path}"
                
                # Create request with auth header
                auth = base64.b64encode(f"{email}:{api_token}".encode()).decode()
                headers = {
                    'Authorization': f'Basic {auth}',
                    'Content-Type': 'application/json'
                }
                
                req = urllib.request.Request(jira_url, headers=headers)
                
                try:
                    # Make request to Jira with proper SSL verification
                    ctx = ssl.create_default_context()
                    ctx.check_hostname = True
                    ctx.verify_mode = ssl.CERT_REQUIRED
                    
                    with urllib.request.urlopen(req, context=ctx) as response:
                        jira_response = response.read()
                        
                        # Send response back to client
                        self.send_response(200)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(jira_response)
                        
                except urllib.error.HTTPError as e:
                    self.send_error_response(e.code, e.reason, e.read().decode())
                except URLError as e:
                    self.send_error_response(500, f"Failed to connect to Jira: {str(e)}")
                    
            except Exception as e:
                self.send_error_response(500, f"Server error: {str(e)}")
        else:
            self.send_error_response(404, "Not Found")

    def send_cors_headers(self):
        """Add CORS headers to allow cross-origin requests"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Max-Age', '86400')

    def send_error_response(self, code, message, details=None):
        """Send a JSON-formatted error response"""
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        error_response = {
            'error': message,
            'details': details
        }
        self.wfile.write(json.dumps(error_response).encode())

    def do_GET(self):
        """Serve static files from the static directory"""
        debug_log(f"GET request for path: {self.path}")
        
        # Special case for the root path
        if self.path == '/' or self.path == '/index.html':
            static_file_path = self.find_static_file('index.html')
            return self.serve_static_file(static_file_path)
        
        # For other paths, check if they exist in the static directory
        if self.path.startswith('/static/'):
            # Remove the /static/ prefix
            relative_path = self.path[8:]
            static_file_path = self.find_static_file(relative_path)
            return self.serve_static_file(static_file_path)
        else:
            # For paths without /static/ prefix, try looking in static directory
            static_file_path = self.find_static_file(self.path.lstrip('/'))
            if static_file_path:
                return self.serve_static_file(static_file_path)
            
        # If we couldn't find the file, return 404
        self.send_error_response(404, f"File not found: {self.path}")
        
    def find_static_file(self, relative_path):
        """Find a static file in various possible locations"""
        debug_log(f"Looking for static file: {relative_path}")
        
        # List of possible paths to check, prioritizing the explicitly provided path
        possible_paths = []
        
        # If we have a global static path specified, add it first
        if STATIC_PATH:
            possible_paths.append(os.path.join(STATIC_PATH, relative_path))
        
        # Add other possible static file locations
        possible_paths.extend([
            # 1. Regular static directory in current working directory
            os.path.join(os.getcwd(), 'static', relative_path),
            
            # 2. Static directory next to the executable (for packaged apps)
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', relative_path),
            
            # 3. Static directory in parent directory
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', relative_path),
            
            # 4. Just the file in current working directory
            os.path.join(os.getcwd(), relative_path),
            
            # 5. Try resources directory for Electron (if available)
            os.path.join(os.getcwd(), 'resources', 'static', relative_path),
            
            # 6. Look in parent directories up to 3 levels
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'static', relative_path),
        ])
        
        # Try each possible path
        for path in possible_paths:
            debug_log(f"Checking path: {path}")
            if os.path.exists(path) and os.path.isfile(path):
                debug_log(f"Found file at: {path}")
                return path
        
        debug_log(f"File not found in any location: {relative_path}")
        return None
    
    def serve_static_file(self, file_path):
        """Serve a static file given its path"""
        if not file_path:
            self.send_error_response(404, "File not found")
            return False
        
        try:
            # Determine content type
            content_type = self.guess_type(file_path)
            
            # Read file content
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return True
        except Exception as e:
            debug_log(f"Error serving static file: {str(e)}")
            self.send_error_response(500, f"Error serving file: {str(e)}")
            return False

def run_server(host='localhost', port=8000):
    """Start the HTTP server on the specified host and port"""
    server = HTTPServer((host, port), JiraProxyHandler)
    print(f"Server running on http://{host}:{port}")
    if STATIC_PATH:
        print(f"Serving static files from: {STATIC_PATH}")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer shutdown requested...")
        server.shutdown()
    finally:
        print("Server stopped.")

if __name__ == '__main__':
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Jira Timesheet Free Proxy Server')
    parser.add_argument('--host', default='localhost', help='Host to bind to (default: localhost)')
    parser.add_argument('--port', type=int, default=8000, help='Port to bind to (default: 8000)')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    parser.add_argument('--static-path', help='Path to static files directory')
    
    args = parser.parse_args()
    
    # Set debug mode if requested
    if args.debug:
        DEBUG = True
    
    # Set static path if provided
    if args.static_path:
        STATIC_PATH = args.static_path
        debug_log(f"Using provided static path: {STATIC_PATH}")
        if not os.path.exists(STATIC_PATH):
            print(f"WARNING: Provided static path does not exist: {STATIC_PATH}")
    
    # Run the server
    run_server(args.host, args.port)
