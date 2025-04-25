from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import urllib.request
import urllib.parse
import urllib.error
from urllib.error import URLError
import base64
import ssl

class JiraProxyHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_cors_headers()
        SimpleHTTPRequestHandler.end_headers(self)

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
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
                    # Make request to Jira
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
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Max-Age', '86400')

    def send_error_response(self, code, message, details=None):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        error_response = {
            'error': message,
            'details': details
        }
        self.wfile.write(json.dumps(error_response).encode())

    def do_GET(self):
        # Serve static files from the static directory
        if self.path == '/':
            self.path = '/static/index.html'
        elif not self.path.startswith('/static/'):
            self.path = '/static' + self.path
        return SimpleHTTPRequestHandler.do_GET(self)

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8000), JiraProxyHandler)
    print("Server running on http://localhost:8000")
    server.serve_forever()
