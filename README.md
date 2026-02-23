# Messenger Clone

> This project was built independently from scratch. No step-by-step "messenger clone" tutorial was followed during development.

A full-stack real-time messaging application with authentication, email verification, password reset, user presence, and chat messaging.

## Stack

- Frontend: React 19, Vite, Tailwind CSS, React Router, Socket.IO Client
- Backend: Node.js, Express 5, Socket.IO, MongoDB + Mongoose
- Services: Cloudinary (profile/media upload), Resend (email delivery)

## Project Structure

```text
.
├── client/    # React app (Vite)
├── server/    # Express API + Socket.IO server
└── README.md
```

## Feature Scan (Current Implementation)

### Fully implemented

- Auth lifecycle
- Register/login/logout/refresh/current-user (`/auth/*`)
- Access token auth header + refresh token cookie flow
- Email verification and resend verification
- Forgot-password and reset-password
- Protected API routes via JWT middleware

- Messaging and chats
- 1:1 chat creation/reuse
- Group chat creation (when participants > 2)
- Real-time message delivery with Socket.IO
- Optimistic message rendering on client
- Message text + media attachments (image/video/file via Cloudinary)
- Seen-status sync (`message:seen`, `messages:seenUpdate`)
- Typing indicators (`typing:start`, `typing:stop`, `typing:update`)
- Suggested users and chat/user/group search
- Per-user soft delete of chats (chat hidden for that user, not globally deleted)
- Chat restoration when new user message arrives

- Chat customization and system events
- Group chat name update
- Participant nickname updates
- System messages generated for chat metadata updates
- Chat settings panel and member list in UI

- Profile and UX
- Profile update (text fields + Cloudinary profile image upload)
- Password update from profile page
- Presence updates (online/offline) and online user broadcast
- Responsive chat UI with mobile bottom navigation
- Theme toggle on auth/profile/mobile menu

### Implemented but currently limited / partial

- `GET /users` exists but currently returns an under-development message.
- Refresh-token cookies are set with `secure: true` and `sameSite: "none"`; for local HTTP this may require HTTPS/proxy setup to behave like production.
- Some message `systemAction` enum values are present in model but not all are exercised through current UI flows.

## Prerequisites

- Node.js 18+
- npm
- MongoDB connection string
- Cloudinary account (for media uploads)
- Resend API key (for verification/reset emails)

## Installation

From the repository root:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

## Environment Variables

Create a `.env` file in `server/`:

```bash
# Server
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=your_mongodb_connection_string

# JWT/Auth
ACCESS_TOKEN_SECRET=replace_me
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_SECRET=replace_me
REFRESH_TOKEN_TTL=7d
REFRESH_TOKEN_REMEMBER_TTL=30d
VERIFICATION_TOKEN_TTL=86400000
RESET_PASSWORD_TOKEN_TTL=900000

# Email
RESEND_API_KEY=your_resend_api_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=messenger-clone
```

Create a `.env` file in `client/`:

```bash
VITE_API_URL=http://localhost:5001
```

## Run Locally

From root, run both client and server together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run server
npm run client
```

Default local URLs:

- Client: `http://localhost:5173`
- Server: `http://localhost:5001`

Connectivity check endpoint:

- `GET /welcome`

## API Overview

### Auth routes (`/auth`)

- `GET /me`
- `POST /register`
- `POST /login`
- `POST /refresh`
- `POST /logout`
- `POST /verify-email`
- `POST /resend-verification`
- `POST /forgot-password`
- `POST /reset-password`

### User routes (`/users`, protected)

- `GET /`
- `GET /suggested`
- `PUT /update-profile`
- `PUT /update-password`

Note: `GET /users` is currently a placeholder endpoint.

### Chat routes (`/chats`, protected)

- `GET /`
- `POST /`
- `GET /search?q=...`
- `GET /:id`
- `POST /:id/messages`
- `PATCH /:id`
- `DELETE /:id`

## Realtime Events (Socket.IO)

Common server events in use:

- `user:online`
- `user:joinAll`
- `user:joinChat`
- `sendMessage`
- `receiveMessage`
- `typing:start`
- `typing:stop`
- `typing:update`
- `message:seen`
- `messages:seenUpdate`
- `presence:update`
- `onlineUsers:list`

## Chat Behavior Notes

- Chat deletion is soft-delete per user (`deletedFor` + `clearedAtBy`), not hard delete.
- New messages in a previously deleted chat remove the deleted flag and make chat visible again.
- New chats started from the UI use temporary client IDs first, then reconcile with persisted chat IDs after create.
- Media uploads are sent as base64 from client, uploaded by server to Cloudinary, then stored as message media metadata.

## Scripts

### Root

- `npm run dev` - run client + server concurrently
- `npm run client` - run frontend only
- `npm run server` - run backend only

### Client

- `npm run dev --prefix client`
- `npm run build --prefix client`
- `npm run lint --prefix client`
- `npm run preview --prefix client`

### Server

- `npm run dev --prefix server`
- `npm run start --prefix server`

## Notes

- The backend CORS origin is controlled by `CLIENT_URL`.
- Auth refresh tokens are set as `httpOnly` cookies.
- If you test across different domains, ensure your client/server protocol and cookie settings are compatible.
- Client API base URL is `VITE_API_URL`; socket connection also uses that same value.
