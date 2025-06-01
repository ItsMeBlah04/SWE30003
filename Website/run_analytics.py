import subprocess
import sys
import threading
import webbrowser
import time

def run_main_app():
    """Run the main Flask application"""
    print("Starting main application server...")
    subprocess.run([sys.executable, "admin_update_product.py"])

def run_analytics_api():
    """Run the analytics API server"""
    print("Starting analytics API server...")
    subprocess.run([sys.executable, "analytics_api.py"])

def open_browser():
    """Open the analytics dashboard in the browser"""
    # Wait for servers to start
    time.sleep(3)
    print("Opening analytics dashboard in browser...")
    webbrowser.open("http://localhost:5000/html/admin_analytics.html")

if __name__ == "__main__":
    # Start both servers in separate threads
    main_thread = threading.Thread(target=run_main_app)
    analytics_thread = threading.Thread(target=run_analytics_api)
    browser_thread = threading.Thread(target=open_browser)
    
    main_thread.daemon = True
    analytics_thread.daemon = True
    browser_thread.daemon = True
    
    main_thread.start()
    analytics_thread.start()
    browser_thread.start()
    
    # Keep the script running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        sys.exit(0) 
        