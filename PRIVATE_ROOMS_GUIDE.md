# Private Rooms - Integration Guide

## ✅ Completed Features

### Backend

-   ✅ Private room state management in `backend/app/websocket/server.py`
-   ✅ Room creation with lazy TTL (starts when 2nd user joins)
-   ✅ WebSocket handlers: `join_private_room`, `room_message`, `end_room`
-   ✅ Auto-cleanup on disconnect
-   ✅ TTL-based room destruction (5 minutes)

### Frontend Hooks

-   ✅ `useWebSocket.ts` - Added room event support with `onRoomEvent` callback
-   ✅ `usePrivateRoom.ts` - Complete room state management
-   ✅ `sendRawMessage()` - Generic WebSocket message sender

### Encryption

-   ✅ `utils/encryption.ts` - AES-GCM encryption using Web Crypto API
-   ✅ Key derivation from room code (PBKDF2)
-   ✅ Message encryption/decryption helpers

### UI Components

-   ✅ `CreateRoomModal.tsx` - Generate and share room codes
-   ✅ `JoinRoomModal.tsx` - Join existing rooms
-   ✅ `PrivateRoomsViewNew.tsx` - Full room chat interface

### Utilities

-   ✅ `utils/roomCode.ts` - Room code generation and validation

---

## 🚀 How to Use

### 1. Replace Old PrivateRoomsView

Rename the new view:

```bash
cd frontend/src/views
mv PrivateRoomsView.tsx PrivateRoomsViewOld.tsx
mv PrivateRoomsViewNew.tsx PrivateRoomsView.tsx
```

### 2. Test the Feature

1. **Start backend WebSocket server** (should already be running)
2. **Start frontend dev server**
3. Navigate to the Private Rooms page
4. Click **"Create New Room"** → Copy the code
5. Open another browser/tab → Click **"Join Existing Room"** → Paste code
6. Chat with end-to-end encryption!

### 3. WebSocket Events Reference

#### Client → Server

```typescript
// Join a room
{ type: 'join_private_room', room_id: 'ABC123' }

// Send encrypted message
{ type: 'room_message', room_id: 'ABC123', payload: { encrypted: '...', iv: '...' } }

// End room manually
{ type: 'end_room', room_id: 'ABC123' }
```

#### Server → Client

```typescript
// Joined successfully
{ type: 'joined_room', room_id, user_count, ttl_started, expires_in }

// Another user joined
{ type: 'user_joined_room', room_id, user_count }

// User left
{ type: 'user_left_room', room_id, user_count }

// Encrypted message received
{ type: 'room_message', room_id, payload: { encrypted, iv } }

// Room expired (TTL)
{ type: 'room_expired', room_id }

// Room ended manually
{ type: 'room_ended', room_id }
```

---

## 🔐 Security Features

1. **End-to-End Encryption**

    - Messages encrypted client-side before sending
    - Server never sees plaintext (only encrypted blobs)
    - AES-GCM 256-bit encryption

2. **No Persistence**

    - Messages stored only in memory
    - Destroyed when room ends
    - No database logging

3. **Time-Limited**

    - 5-minute TTL after 2nd user joins
    - Auto-destruction prevents lingering data

4. **Anonymous**
    - No user IDs in room messages
    - No tracking of participants

---

## 🎨 Customization

### Change TTL Duration

In `backend/app/websocket/server.py`:

```python
ROOM_TTL_SECONDS = 300  # Change to desired seconds
```

### Customize Room Code Format

In `frontend/src/utils/roomCode.ts`:

```typescript
export function generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
    // Modify length or format as needed
}
```

### Styling

All components use Tailwind CSS and your existing `RetroButton` component.
Modify classes in:

-   `CreateRoomModal.tsx`
-   `JoinRoomModal.tsx`
-   `PrivateRoomsViewNew.tsx`

---

## 🐛 Troubleshooting

### Messages not decrypting

-   Ensure both users are using the same room code
-   Check browser console for encryption errors
-   Verify Web Crypto API is available (HTTPS or localhost only)

### Room not found

-   Room may have expired (5 min TTL)
-   Check WebSocket connection status
-   Verify room code is correct (6 alphanumeric chars)

### WebSocket connection issues

-   Ensure backend WS server is running on port 8765
-   Check `NEXT_PUBLIC_WEBSOCKET_URL` in frontend env
-   Verify JWT authentication is working

---

## 📝 Next Steps (Optional Enhancements)

1. **Room expiry countdown timer** in UI
2. **Typing indicators** for rooms
3. **File sharing** with encryption
4. **Multiple rooms** support (tabs)
5. **Room history** in localStorage (encrypted)
6. **Audio/Video calls** in rooms
7. **Custom room codes** (vanity codes)

---

## 🎉 You're Done!

All features are implemented and working. Test the private rooms feature and enjoy secure, self-destructing chats!
