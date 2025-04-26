#!/usr/bin/env python
"""
Jira Timesheet Free - Server Launcher

This is a simple launcher script that starts the main Jira Timesheet Free proxy server.
For the full implementation, see server.py.
"""

import os
import sys
import subprocess

# Get the directory containing this script
base_dir = os.path.dirname(os.path.abspath(__file__))

# Path to the actual server implementation
server_path = os.path.join(base_dir, 'server.py')

def main():
    # Check if the server file exists
    if not os.path.exists(server_path):
        print(f"Error: Server implementation not found at {server_path}")
        print("Please make sure you have the complete project files.")
        sys.exit(1)
        
    print("Starting Jira Timesheet Free server...")
    print("Press Ctrl+C to stop the server.")
    
    # Pass through any command line arguments
    args = sys.argv[1:]
    
    try:
        # Start the server
        if sys.platform.startswith('win'):
            # On Windows, use Python executable
            subprocess.run([sys.executable, server_path] + args)
        else:
            # On Unix systems, the file should be executable
            subprocess.run(['python', server_path] + args)
    except KeyboardInterrupt:
        print("\nServer stopped by user.")
    except Exception as e:
        print(f"Error running server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
