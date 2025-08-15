#!/usr/bin/env python3
"""
Simple test to verify WebSocket + Redis integration
"""

import asyncio
import websockets
import json
import jwt
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

def generate_test_token(user_id: int) -> str:
    """Generate test JWT token"""
    secret_key = os.getenv("SECRET_KEY", "dev-secret-key")
    expiration = datetime.utcnow() + timedelta(hours=1)
    
    payload = {
        "user_id": user_id,
        "exp": expiration,
        "type": "websocket"
    }
    
    return jwt.encode(payload, secret_key, algorithm="HS256")

async def test_websocket_connection():
    """Test WebSocket connection with Redis"""
    print("🚀 Testing WebSocket + Redis integration...")
    
    try:
        # Connect to WebSocket server
        uri = "ws://localhost:8765"
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket server")
            
            # Authenticate
            token = generate_test_token(123)
            auth_message = {
                "type": "authenticate",
                "token": token
            }
            
            await websocket.send(json.dumps(auth_message))
            print("📤 Sent authentication message")
            
            # Wait for authentication response
            response = await websocket.recv()
            data = json.loads(response)
            
            if data.get("type") == "authenticated":
                print(f"✅ Authenticated as user: {data.get('user_id')}")
                
                # Test sending a message (this will try to save to DB, but won't crash)
                test_message = {
                    "type": "send_message",
                    "recipient_id": 456,
                    "content": "Hello from Redis test!"
                }
                
                await websocket.send(json.dumps(test_message))
                print("📤 Sent test message")
                
                # Keep connection alive for a few seconds
                print("⏱️  Keeping connection alive for 5 seconds...")
                await asyncio.sleep(5)
                
            else:
                print(f"❌ Authentication failed: {data}")
                
    except websockets.exceptions.ConnectionRefused:
        print("❌ Could not connect to WebSocket server")
        print("💡 Make sure to run: python run.py")
    except Exception as e:
        print(f"❌ Test failed: {e}")

async def test_redis_direct():
    """Test Redis connection directly"""
    print("\n🔍 Testing Redis connection...")
    
    try:
        from app.websocket.redis_manager import redis_manager
        
        # Test setting user online
        success = redis_manager.set_user_online(123, {"test": True})
        if success:
            print("✅ Set user 123 online in Redis")
        
        # Test checking if user is online
        is_online = redis_manager.is_user_online(123)
        print(f"✅ User 123 online status: {is_online}")
        
        # Test getting online users
        online_users = redis_manager.get_online_users()
        print(f"✅ Online users: {online_users}")
        
        # Test cleanup
        redis_manager.set_user_offline(123)
        print("✅ Set user 123 offline")
        
        # Verify cleanup
        is_online_after = redis_manager.is_user_online(123)
        print(f"✅ User 123 online status after cleanup: {is_online_after}")
        
    except Exception as e:
        print(f"❌ Redis test failed: {e}")

async def main():
    """Run all tests"""
    await test_redis_direct()
    await test_websocket_connection()

if __name__ == "__main__":
    print("🧪 WebSocket + Redis Integration Test")
    print("=" * 50)
    asyncio.run(main())
