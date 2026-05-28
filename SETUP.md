# HostelHub — Setup Guide

A campus marketplace for hostel students to buy, sell, and request items.

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v20+ | https://nodejs.org |
| MongoDB | v6+ (local) or Atlas | https://mongodb.com |
| npm | v10+ | comes with Node |

---

## 1. Clone / Open the Project

```
C:\Users\KIIT0001\Downloads\hostelhub\
├── server/          ← Express + TypeScript backend
├── client/          ← (frontend)
└── SETUP.md
```

---

## 2. Backend Setup

```bash
cd C:\Users\KIIT0001\Downloads\hostelhub\server
npm install
```

Create a `.env` file in the `server/` folder:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/hostelhub

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
CLIENT_URL=http://localhost:3000
```

Start the backend:

```bash
npm run dev
```

The server runs at **http://localhost:5000**

---

## 3. Seed the Database

Make sure MongoDB is running, then:

```bash
cd C:\Users\KIIT0001\Downloads\hostelhub\server

# Seed hostels only (38 hostels: KP-1 to KP-25, QC-1 to QC-13)
npm run seed:hostels

# Seed everything (users, products, chats, polls, notifications)
npm run seed

# Clear all data (asks for confirmation)
npm run seed:clear
```

### What `npm run seed` creates:

| Collection | Count | Details |
|-----------|-------|---------|
| Hostels | 38 | KP-1 to KP-25, QC-1 to QC-13 |
| Users | 20 | students + hostelOwner roles |
| Products | 52 | Electronics, Books, Clothes, Snacks, Accessories, Daily essentials |
| Chats | 6 | With 5 messages each |
| Poll Requests | 10 | 8 open, 2 closed |
| Notifications | 12 | Various types |

### Test accounts (use OTP login in the app):

| Mobile | Name | Role |
|--------|------|------|
| 9000000001 | Eshana Singh | student |
| 9000000002 | Admin User | hostelOwner |
| 9000000003 | Rahul Kumar | student |
| ... | ... | ... |
| 9000000020 | Tanvi Chawla | student |

> **Note:** Auth uses OTP via mobile. In development, check your backend console for the OTP code.

---

## 4. API Endpoints

Base URL: `http://localhost:5000/api`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/send-otp` | Send OTP to mobile |
| POST | `/auth/verify-otp` | Verify OTP, get tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List products (filters: category, hostel, condition, search) |
| GET | `/products/:id` | Get single product |
| POST | `/products` | Create listing (auth required) |
| PUT | `/products/:id` | Update listing |
| DELETE | `/products/:id` | Delete listing |
| PATCH | `/products/:id/sold` | Mark as sold |

### Hostels
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hostels` | List all hostels |
| GET | `/hostels/:id` | Get hostel + listings |

### Chats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chats` | Get my chats |
| GET | `/chats/:id` | Get chat with messages |
| POST | `/chats` | Start new chat |
| POST | `/chats/:id/messages` | Send message |

### Poll Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/polls` | List all poll requests |
| GET | `/polls/:id` | Get single poll |
| POST | `/polls` | Create poll request (buyer) |
| POST | `/polls/:id/reply` | Reply to poll (seller) |
| PATCH | `/polls/:id/close` | Close poll |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get my notifications |
| PATCH | `/notifications/read-all` | Mark all as read |
| PATCH | `/notifications/:id/read` | Mark one as read |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get my profile |
| PUT | `/users/me` | Update profile |
| GET | `/users/:id` | Get user profile |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Dashboard stats |
| GET | `/admin/users` | List all users |
| DELETE | `/admin/products/:id` | Remove any listing |

### Socket.io Events

Connect to `http://localhost:5000`

| Event | Direction | Payload |
|-------|-----------|---------|
| `join_chat` | client → server | `{ chatId }` |
| `send_message` | client → server | `{ chatId, text }` |
| `new_message` | server → client | `{ chatId, message }` |
| `user_online` | server → client | `{ userId }` |
| `user_offline` | server → client | `{ userId }` |
| `notification` | server → client | `{ notification }` |
| `poll_reply` | server → client | `{ pollId, reply }` |

---

## 5. Deployment

### Frontend — Vercel
1. Push code to GitHub
2. Import repo on vercel.com
3. Set `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`
4. Deploy

### Backend — Railway
1. Push server/ to GitHub
2. New project on railway.app → Deploy from GitHub
3. Add environment variables from `.env`
4. Railway gives you a public URL

### Database — MongoDB Atlas
1. Create free cluster at mongodb.com/atlas
2. Get connection string
3. Replace `MONGODB_URI` in Railway env vars
4. Whitelist `0.0.0.0/0` for Railway access

### Images — Cloudinary
1. Sign up at cloudinary.com (free tier = 25 credits/month)
2. Get Cloud Name, API Key, API Secret from dashboard
3. Add to environment variables

---

## 6. Folder Structure

```
server/
├── src/
│   ├── config/         # DB, Cloudinary, env config
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth, error handling
│   ├── models/         # Mongoose schemas
│   │   ├── User.model.ts
│   │   ├── Product.ts
│   │   ├── Hostel.ts
│   │   ├── Chat.ts
│   │   ├── PollRequest.ts
│   │   └── Notification.ts
│   ├── routes/         # Express routers
│   ├── scripts/        # Seed scripts
│   │   ├── seedHostels.ts
│   │   ├── seed.ts       ← full seed
│   │   └── clearDb.ts    ← clear all data
│   ├── services/       # Business logic
│   ├── socket/         # Socket.io handlers
│   ├── types/          # TypeScript interfaces
│   ├── utils/          # Helpers
│   └── index.ts        # Entry point
├── .env                ← create this!
├── package.json
└── tsconfig.json
```

---

## Common Issues

**MongoDB not connecting:**
- Make sure MongoDB service is running: `net start MongoDB` (Windows)
- Check MONGODB_URI in .env

**ts-node not found:**
- Run `npm install` in server/ folder
- ts-node is in devDependencies

**Port already in use:**
- Change PORT in .env to 5001 or another free port
