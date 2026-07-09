# UniSphere

A full-stack social networking platform exclusively for **NIT Calicut students** that helps you find friends based on shared interests and personality compatibility. Built with **Flask** (Python) backend and **Next.js** (TypeScript/React) frontend, featuring real-time chat powered by WebSockets and Redis.

## 🌟 Project Overview

**UniSphere** is a modern campus networking application designed specifically for NIT Calicut students. It combines personality matching, real-time messaging, and social features to help students connect with like-minded peers. The platform uses questionnaires to match users based on compatibility scores and provides seamless communication through an integrated chat system.

### Key Features

#### 🎯 **Personality Matching System**

- Interactive questionnaire to determine user preferences and personality traits
- Compatibility scoring algorithm to match students with similar interests
- "Find Your Tribe" recommendations based on quiz responses
- View potential friends' profiles with compatibility scores
- Quiz answers are persisted per user and used to compute an explainable score (quiz similarity + shared hobbies)

#### 💬 **Real-Time Chat System**

- **WebSocket-powered messaging** for instant communication
- Redis-backed online status tracking (using Upstash Cloud)
- Real-time typing indicators and message status (pending/sent/delivered/read)
- Support for text messages with emoji picker
- Conversation history with persistent storage
- Contact list with online/offline status indicators
- Unread message counters
- Offline-first sending: messages are queued locally when offline and flushed when online
- Idempotent send with `client_id` to prevent duplicates on retries

#### 👤 **User Profiles**

- Customizable profile with bio, age, gender, hobbies
- Profile picture support (Google OAuth integration)
- Social media links integration (Instagram, WhatsApp, GitHub)
- Activity feed showing user interactions
- Activity feed is served by `GET /api/activity` and powers the existing "Your Activity" UI
- "Top Questions" showcase on profiles

#### 🔐 **Authentication & Security**

- Google OAuth 2.0 integration (restricted to @nitc.ac.in emails)
- JWT token-based authentication
- Secure WebSocket authentication with separate token validation
- Protected routes and API endpoints

#### 📱 **Responsive UI/UX**

- Modern landing page with campus branding
- Mobile-responsive layout
- Bottom navigation bar for easy mobile access
- Real-time UI updates without page refreshes
- Smooth animations and transitions

#### ⚡ **Technical Features**

- RESTful API architecture
- WebSocket server with connection pooling
- Redis for distributed state management
- PostgreSQL database with SQLAlchemy ORM
- Database migrations with Alembic
- Concurrent server management (Flask + WebSocket)
- TypeScript for type-safe frontend development

## 🏗️ Technology Stack

### Backend

- **Framework**: Flask (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Real-time**: WebSocket server (websockets library)
- **Cache/State**: Redis (Upstash Cloud)
- **Authentication**:
    - Google OAuth 2.0 (Authlib)
    - JWT tokens (PyJWT)
    - Flask-Login for session management
- **Migrations**: Alembic
- **CORS**: Flask-CORS

### Frontend

- **Framework**: Next.js 15 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: React Icons
- **WebSocket Client**: Native WebSocket API with custom hooks

### Infrastructure

- **Concurrent Execution**: Runs Flask HTTP + WebSocket servers simultaneously
- **Virtual Environment**: Python venv for dependency isolation
- **Package Management**: npm for frontend, pip for backend

## Getting Started

### Prerequisites

- Node.js and npm installed
- Python installed
- Git installed

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/MUHSIN-M-P/Project-FindMyFriend
    cd frontend
    ```

2. Install dependencies for the frontend:

    ```bash
    npm install
    ```

3. Install dependencies for the backend (ensure you're in the project root):

    ```bash
    cd backend
    # Recommended: create + activate a virtual environment so installs/runs use the same Python
    python -m venv .venv
    # Windows (PowerShell): .\.venv\Scripts\Activate.ps1
    # Windows (cmd.exe):    .\.venv\Scripts\activate.bat
    # macOS/Linux:          source .venv/bin/activate

    python -m pip install -r requirements.txt
    ```

4. Run database migrations:

    ```bash
    cd backend
    alembic upgrade head
    ```

## Available Scripts

### Frontend

- **`npm run frontend`**: Runs the Next.js frontend on port `3000`.

### Backend

- **`npm run backend:win`**: Starts the Flask server on **Windows** using `app.py`.
- **`npm run backend:linux`**: Starts the Flask server on **Linux/macOS** using `app.py`.

### Full-Stack Development

- **`npm run dev:win`**: Runs both the frontend and backend concurrently on **Windows**.
- **`npm run dev:linux`**: Runs both the frontend and backend concurrently on **Linux/macOS**.

## 📂 Project Structure

```
Project-FindMyFriend/
├── backend/                    # Flask Backend
│   ├── app/
│   │   ├── models/            # SQLAlchemy models (User, Message, Conversation)
│   │   ├── routes/            # API routes (auth, chat, websocket)
│   │   ├── services/          # Business logic (AuthService, ChatService)
│   │   ├── utils/             # Utilities (decorators, helpers)
│   │   └── websocket/         # WebSocket implementation
│   │       ├── server.py      # WebSocket server
│   │       ├── client.py      # Connection handler
│   │       ├── service.py     # WebSocket service manager
│   │       └── redis_manager.py # Redis operations
│   ├── migrations/            # Alembic database migrations
│   ├── requirements.txt       # Python dependencies
│   ├── run.py                # Main application entry point
│   └── alembic.ini           # Migration configuration
│
├── frontend/                  # Next.js Frontend
│   ├── src/
│   │   ├── app/              # Next.js app router
│   │   │   ├── chat/         # Real-time chat interface
│   │   │   ├── quiz/         # Personality quiz
│   │   │   ├── profile/      # User profiles
│   │   │   ├── activity/     # Activity feed
│   │   │   ├── settings/     # User settings
│   │   │   └── api/          # API routes (auth, chat)
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Chat_Components/  # Chat-specific components
│   │   │   ├── Navbar.tsx
│   │   │   ├── bottomBar.tsx
│   │   │   └── Usercard.tsx
│   │   └── hooks/            # Custom React hooks
│   │       ├── useAuth.ts    # Authentication hook
│   │       └── useWebSocket.ts # WebSocket connection hook
│   ├── public/               # Static assets
│   │   ├── avatars/          # User avatars
│   │   └── icons/            # UI icons
│   ├── package.json
│   └── next.config.ts        # Next.js configuration
│
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost/findmyfriend

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# JWT Secret
SECRET_KEY=your_secret_key_for_jwt

# Redis (Upstash)
REDIS_URL=redis://default:password@host:port

# WebSocket
WEBSOCKET_HOST=0.0.0.0
WEBSOCKET_PORT=8765

# Flask
FLASK_ENV=development
FLASK_APP=run.py
```

## 🚀 Features in Detail

### WebSocket Architecture

The application uses a sophisticated WebSocket implementation for real-time features:

- **Separate WebSocket server** running on port 8765
- **Redis-powered connection management** for scalability
- **JWT authentication** for secure connections
- **Automatic reconnection** on connection loss
- **Online status tracking** with TTL-based cleanup
- **Message delivery status** (sent, delivered, read)
- **Typing indicators** for active conversations

#### Offline-first outgoing messages

For 1-to-1 chat, the frontend sends messages via the HTTP endpoint `POST /api/chat/send`.

- If the browser is offline, the frontend queues the message locally and shows it as `pending`.
- When the browser comes back online, queued messages are flushed automatically.
- The backend accepts an optional `client_id` for idempotency (dedupe on retries/flush).

**Demo tip**: In Chrome DevTools → Network → set “Offline”, send a message (shows `pending`), then switch back online (flush + status updates).

### Chat Features

- **Contact list** with search functionality
- **Conversation threads** with message history
- **Real-time message delivery**
- **Emoji picker** for expressive messaging
- **Unread message badges**
- **Last seen status** for offline users
- **Profile quick view** from contact list

### Matching Algorithm

- Questionnaire-based personality assessment
- Compatibility scoring based on shared interests
- Best match recommendations
- Profile discovery with filtering options

## Contributing

Feel free to fork the repository and submit pull requests. For major changes, please open an issue first to discuss the proposed changes.
