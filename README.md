# 🏠 HostelHub

> A marketplace built for college hostel students — list, discover, and trade essentials right inside your campus.

HostelHub connects students within the same hostel or college to buy, sell, and rent items (furniture, appliances, books, meal subscriptions, etc.), find roommates, and share services — all in one place built specifically for the hostel lifestyle.

---

## ✨ Features (Planned)

- 🛒 **Marketplace** – Post and browse listings for items and services
- 🤝 **Roommate Finder** – Match with compatible roommates
- 💬 **In-app Messaging** – Chat directly with buyers/sellers
- 📸 **Image Uploads** – Cloudinary-powered photo management
- 🔐 **Auth** – JWT-based access + refresh token flow
- 📱 **Responsive UI** – Mobile-first Next.js frontend

---

## 🧱 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend    | Node.js, Express, TypeScript        |
| Database   | MongoDB with Mongoose               |
| Auth       | JWT (access + refresh tokens)       |
| Media      | Cloudinary                          |
| Monorepo   | npm Workspaces                      |

---

## 📁 Project Structure

```
hostelhub/                  ← monorepo root
├── client/                 ← Next.js frontend
├── server/                 ← Express backend
├── package.json            ← root workspace config
├── tsconfig.json           ← base TypeScript config
├── .env.example            ← environment variable template
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js **≥ 20** and npm **≥ 10**
- MongoDB running locally **or** a MongoDB Atlas connection string
- A free [Cloudinary](https://cloudinary.com) account

### 2. Clone the repository

```bash
git clone https://github.com/your-username/hostelhub.git
cd hostelhub
```

### 3. Install all dependencies (root + workspaces)

```bash
npm install
```

### 4. Configure environment variables

```bash
cp .env.example .env
# Open .env and fill in your real values
```

### 5. Run in development mode (client + server concurrently)

```bash
npm run dev
```

- **Client** → [http://localhost:3000](http://localhost:3000)
- **Server** → [http://localhost:5000](http://localhost:5000)

---

## 🛠️ Other Scripts

| Command          | Description                              |
|------------------|------------------------------------------|
| `npm run build`  | Build both client and server             |
| `npm run start`  | Start the production server              |
| `npm run lint`   | Lint client and server                   |
| `npm run clean`  | Remove all build artifacts and caches    |

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first to discuss what you'd like to change.

---

## 📄 License

MIT © HostelHub Contributors
# Build: Wed Jun  3 03:53:09 UTC 2026
