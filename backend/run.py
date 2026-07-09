#!/usr/bin/env python3
import sys
import threading
from app import app

def start_worker():
    """Start the message queue worker in a background thread"""
    try:
        from worker import run_pending_processor, run_retry_processor
        
        # Start both processors in separate threads
        pending_thread = threading.Thread(target=run_pending_processor, daemon=True)
        retry_thread = threading.Thread(target=run_retry_processor, daemon=True)
        
        pending_thread.start()
        retry_thread.start()
        
        print("[OK] Message queue workers started successfully")
    except Exception as e:
        print(f"[WARN] Failed to start workers: {e}")
        print("   Offline message queuing may not work properly")

if __name__ == "__main__":
    # Start background workers for message queue processing
    start_worker()
    
    # Disable the Werkzeug reloader because it spawns a second process.
    # That breaks the in-process WebSocket server (port bind conflicts) and makes chat feel non-live.
    app.run(debug=True, use_reloader=False, host="0.0.0.0", port=5000)
