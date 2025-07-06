# Project-FindMyFriend

A Python/Flask backend integrated with a Next.js frontend for seamless full-stack development.

## Project Overview

This project combines a **Flask** backend with a **Next.js** frontend, allowing you to build and run a full-stack application effortlessly. The Flask server is mapped into the Next.js app under `/`, using `next.config.js` rewrites to route any request to `/:path*` to the Flask API.

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
   pip install -r requirements.txt
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

## Project Structure
- **`/frontend`**: Contains the Next.js application.
- **`/backend`**: Contains the Flask server logic.
- **`next.config.js`**: Configures rewrites to map API requests to the Flask backend.

## Contributing
Feel free to fork the repository and submit pull requests. For major changes, please open an issue first to discuss the proposed changes.

