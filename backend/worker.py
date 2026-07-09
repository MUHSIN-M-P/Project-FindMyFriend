"""
Background Worker for Message Queue Processing
Handles message delivery, retry logic, and offline user queuing
Run this alongside your Flask server:
    python worker.py
"""

import sys
import os
from threading import Thread
import time

from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables for the worker process
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from app.services.message_queue_service import get_message_queue_service

def run_pending_processor():
    """Process pending messages"""
    print("Starting pending message processor...")
    queue_service = get_message_queue_service()
    queue_service.process_pending_messages()

def run_retry_processor():
    """Process retry queue"""
    print("Starting retry queue processor...")
    queue_service = get_message_queue_service()
    queue_service.process_retry_queue()

if __name__ == "__main__":
    print("=" * 50)
    print("Message Queue Worker Starting")
    print("=" * 50)
    
    # Start pending processor in separate thread
    pending_thread = Thread(target=run_pending_processor, daemon=True)
    pending_thread.start()
    
    # Start retry processor in separate thread
    retry_thread = Thread(target=run_retry_processor, daemon=True)
    retry_thread.start()
    
    print("\n✓ Pending message processor started")
    print("✓ Retry queue processor started")
    print("\nWorker is running. Press Ctrl+C to stop.")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nShutting down worker...")
        sys.exit(0)
