# WebSocket Implementation with Redis (Upstash)

Modern WebSocket server with Redis-powered connection management for scalable real-time chat.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Frontend      │    │   Frontend      │    │   Frontend      │
│   (User A)      │    │   (User B)      │    │   (User C)      │
│                 │    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ WebSocket            │ WebSocket            │ WebSocket
          │ Connection           │ Connection           │ Connection
          │                      │                      │
┌─────────▼──────────────────────▼──────────────────────▼───────┐
│                                                                │
│                  Flask + WebSocket Server                     │
│                     (Single Instance)                         │
│                                                                │
│  ┌──────────────────┐  ┌──────────────────────────────────┐   │
│  │  HTTP Routes     │  │     WebSocket Handler            │   │
│  │  /api/websocket  │  │                                  │   │
│  │  - /token        │  │  • Authentication               │   │
│  │  - /status       │  │  • Message Routing              │   │
│  │  - /users/online │  │  • Connection Management        │   │
│  └──────────────────┘  └──────────────────────────────────┘   │
│                                                                │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          │ Redis Operations
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│                                                                │
│                    Upstash Redis                               │
│                   (Cloud Redis)                                │
│                                                                │
│  Keys:                                                         │
│  • ws:user:{user_id}    → Connection info + TTL               │
│  • ws:online_users      → Set of online user IDs              │
│                                                                │
│  Features:                                                     │
│  • Automatic TTL cleanup (1 hour)                             │
│  • Persistent online status                                   │
│  • Fast O(1) lookups                                          │
│  • Scales across multiple servers                             │
│                                                                │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          │ Database Operations
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│                                                                │
│                   PostgreSQL Database                         │
│                                                                │
│  Tables:                                                       │
│  • users           → User accounts                            │
│  • conversations   → Chat conversations                       │
│  • messages        → Chat messages                            │
│  • message_status  → Read/delivered status                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Features

-   ✅ **Redis-Powered**: Uses Upstash Redis for connection management
-   ✅ **Scalable**: Can handle multiple server instances
-   ✅ **Auto-Cleanup**: TTL-based connection cleanup (1 hour)
-   ✅ **Real-time**: Instant message delivery
-   ✅ **Persistent Status**: Online status survives server restarts
-   ✅ **JWT Authentication**: Secure token-based auth

## Setup

### 1. Redis Configuration

Add to your `.env` file:

```bash
# Redis Configuration (Upstash)
REDIS_URL=redis://default:your-password@your-endpoint.upstash.io:6379
```

### 2. Install Dependencies

```bash
pip install redis==5.0.1 websockets PyJWT
```

### 3. Start Server

```bash
python run.py
```

The WebSocket server starts automatically on port 8765.

## Redis Data Structure

### Connection Storage

```redis
# User connection info
ws:user:123 = {
    "connected_at": "2025-08-15T10:30:00",
    "last_seen": "2025-08-15T10:35:00",
    "server_id": "main"
}  # TTL: 1 hour
```

### Online Users Set

```redis
# Set of online user IDs
ws:online_users = {123, 456, 789}
```

## API Endpoints

| Endpoint                           | Method | Description                |
| ---------------------------------- | ------ | -------------------------- |
| `/api/websocket/token`             | POST   | Get WebSocket JWT token    |
| `/api/websocket/status`            | GET    | Server & Redis status      |
| `/api/websocket/users/online`      | GET    | List all online users      |
| `/api/websocket/users/{id}/online` | GET    | Check specific user status |

## Frontend Usage

```javascript
// Get token
const response = await fetch("/api/websocket/token", {
    method: "POST",
    headers: { Authorization: "Bearer session-token" },
});
const { token, websocket_url } = await response.json();

// Connect to WebSocket
const ws = new WebSocket(websocket_url);

// Authenticate
ws.onopen = () => {
    ws.send(
        JSON.stringify({
            type: "authenticate",
            token: token,
        })
    );
};

// Handle messages
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
        case "authenticated":
            console.log("Connected as user:", data.user_id);
            break;
        case "new_message":
            displayMessage(data.data);
            break;
    }
};

// Send message
function sendMessage(recipientId, content) {
    ws.send(
        JSON.stringify({
            type: "send_message",
            recipient_id: recipientId,
            content: content,
        })
    );
}
```

## Benefits of Redis Integration

### 1. **Scalability**

-   Multiple server instances can share connection state
-   No single point of failure
-   Load balancing friendly

### 2. **Persistence**

-   Online status survives server restarts
-   Connection info persists across deployments
-   TTL prevents stale connections

### 3. **Performance**

-   O(1) user lookups
-   Fast set operations for online users
-   Automatic cleanup with TTL

### 4. **Reliability**

-   Upstash provides 99.99% uptime
-   Built-in Redis clustering
-   Automatic failover

## Production Considerations

-   **TTL Management**: Connections expire after 1 hour of inactivity
-   **Error Handling**: Graceful fallback if Redis is unavailable
-   **Memory Usage**: Redis stores minimal connection metadata
-   **Network**: Upstash Redis supports TLS encryption
