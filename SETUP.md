# replaceableParts - Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Google Cloud Console account (for OAuth)

## 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
7. Add authorized redirect URIs:
   - `http://localhost:5173` (development)
8. Copy the **Client ID** (you'll need it for both frontend and backend)

## 2. Database Setup

```bash
# Create PostgreSQL database
createdb replaceableParts

# Or using psql
psql -U postgres -c "CREATE DATABASE replaceableParts;"
```

## 3. Backend Configuration

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your values:
# - DATABASE_URL: Your PostgreSQL connection string
# - GOOGLE_CLIENT_ID: From step 1
# - JWT_SECRET: Generate a secure random string
```

Example `.env`:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/replaceableParts?schema=public"
GOOGLE_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
JWT_SECRET="your-super-secret-key-at-least-32-characters"
JWT_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

## 4. Frontend Configuration

```bash
cd frontend

# Copy environment template
cp .env.example .env

# Edit .env:
# - VITE_GOOGLE_CLIENT_ID: Same Client ID from step 1
```

Example `.env`:
```
VITE_GOOGLE_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
```

## 5. Install Dependencies

From the root directory:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

## 6. Initialize Database

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

## 7. Start Development Servers

From the root directory:

```bash
# Start both frontend and backend
npm run dev
```

Or separately:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## 8. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## First User = Admin

The **first user** to sign in becomes the administrator automatically. This user:
- Has full access to the admin panel
- Can approve/revoke other users
- Can promote other users to admin

Subsequent users will need approval from an admin before they can access the game.

## Project Structure

```
replaceableParts/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── src/
│   │   ├── middleware/      # Auth middleware
│   │   ├── routes/          # API routes
│   │   ├── db.js            # Prisma client
│   │   └── index.js         # Express app
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts
│   │   ├── locales/         # i18n translations
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service
│   │   ├── App.jsx          # Main app with routing
│   │   ├── i18n.js          # i18n configuration
│   │   ├── main.jsx         # Entry point
│   │   └── theme.js         # MUI theme
│   └── package.json
├── package.json             # Root package with scripts
├── PROJECT_PLAN.md          # Full project roadmap
└── SETUP.md                 # This file
```

## Available Scripts

From root:
- `npm run dev` - Start both servers
- `npm run dev:frontend` - Start frontend only
- `npm run dev:backend` - Start backend only
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Troubleshooting

### "Invalid Google token" error
- Ensure GOOGLE_CLIENT_ID matches in both frontend and backend
- Check that your domain is in authorized origins in Google Console

### Database connection errors
- Verify PostgreSQL is running
- Check DATABASE_URL format and credentials
- Ensure database exists

### CORS errors
- Verify FRONTEND_URL in backend .env matches your frontend URL

## Adding New Languages

1. Create new translation file in `frontend/src/locales/` (e.g., `fr.json`)
2. Copy structure from `en.json`
3. Add import and resource in `frontend/src/i18n.js`
4. Add menu item in `Layout.jsx` and `LoginPage.jsx`
