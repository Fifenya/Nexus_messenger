# Nexus backend

NestJS + Prisma + Socket.IO backend for Nexus Messenger, using Nexus Connect
(username/password) instead of phone-based auth.

## What's implemented
- **Auth**: register/login with bcrypt password hashing, JWT issuance, `GET /auth/me`,
  rate-limited (5 registrations/min, 10 logins/min per IP).
- **Users**: search by username, get profile, update own profile, register push token.
- **Chats**: create private (1:1) or group chats, list your chats with last message,
  membership enforcement.
- **Messages**: send (text and/or attachments), paginated history (cursor-based), edit
  own message, soft-delete own message, toggle emoji reactions (realtime).
- **Attachments**: `POST /uploads` (multipart, image/video/audio, 50MB max) stores files
  on local disk under `uploads/`, served at `/uploads/<filename>`. Messages can reference
  one or more attachments.
- **Realtime (Socket.IO)**: JWT-authenticated connections, auto-joins your chat rooms,
  `message:send` / `message:edit` / `message:delete` / `message:react`, `typing:start` /
  `typing:stop`, online/offline presence broadcast on connect/disconnect.
- **Push notifications**: `NotificationsService` sends via Firebase Cloud Messaging to
  offline chat members when a message arrives. **Disabled by default** — see below.
- Global `ValidationPipe` (whitelist + transform), global exception filter with
  consistent JSON error shape, `ConfigModule` for env vars.

## Push notifications — what you need to do
This can't be made to work without a real Firebase project; there's no way around that.
1. Create a project at https://console.firebase.google.com
2. Project settings → Service accounts → "Generate new private key" → downloads a JSON file
3. Minify that JSON to one line and put it in `.env` as `FIREBASE_SERVICE_ACCOUNT_JSON=...`
4. That's it server-side — `firebase-admin` is already in `package.json`.

Without step 1-3, the server logs what it *would* send instead of failing — everything
else keeps working.

## Not built yet (honest list)
Group admin permissions/invite links, 2FA, message search, archiving/pinning/muting,
session management, scheduled/silent messages, message formatting, stickers/GIFs,
polls, location/contact sharing. Media, voice messages, reply, edit/delete, and push
are now implemented (this pass).

## Setup
This sandbox has no outbound network access, so **dependencies have not been
installed or compiled here** — you'll need to do that locally.

```bash
cd packages/backend
cp .env.example .env        # edit JWT_SECRET at minimum; add FIREBASE_SERVICE_ACCOUNT_JSON for push
npm install
npx prisma migrate dev --name add_attachments_and_push
mkdir -p uploads             # local file storage for media/voice uploads
npm run start:dev
```

Server runs on `http://localhost:3000` (`PORT` in `.env`). Socket.IO shares the
same port. Connect with:

```js
io('http://localhost:3000', { auth: { token: '<JWT from /auth/login>' } })
```

## Quick manual test
```bash
curl -X POST localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}'

curl -X POST localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}'
# copy accessToken, then:
curl localhost:3000/auth/me -H "Authorization: Bearer <token>"
```
