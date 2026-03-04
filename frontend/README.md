# Employee Ideas Management - Frontend

React-based frontend application for the Employee Ideas Management System.

## Tech Stack

- **React 18** with TypeScript
- **React Router** for routing
- **Axios** for API calls
- **Context API** for state management
- **Vite** for build tooling
- **Vitest** for testing

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API client and service modules
│   │   ├── client.ts     # Axios client with interceptors
│   │   ├── userService.ts    # User Service API calls
│   │   └── ideasService.ts   # Ideas Service API calls
│   ├── context/          # React Context for state management
│   │   └── AuthContext.tsx   # Authentication state
│   ├── routes/           # Routing configuration
│   │   ├── AppRoutes.tsx     # Main route definitions
│   │   └── ProtectedRoute.tsx # Auth guard component
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Application entry point
│   └── types.ts          # TypeScript type definitions
├── .env.example          # Environment variable template
├── package.json
└── vite.config.ts
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from template:
```bash
cp .env.example .env
```

3. Update `.env` with your API endpoint:
```
VITE_API_BASE_URL=http://localhost:3001/api
```

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Building

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Architecture

### State Management

The application uses React Context API for state management:

- **AuthContext**: Manages authentication state (token, userId, role)
  - Persists auth state to localStorage
  - Provides `login()` and `logout()` methods
  - Accessible via `useAuth()` hook

### API Client

The API client (`src/api/client.ts`) is configured with:

- Automatic auth token injection in request headers
- Response interceptor for 401 handling (auto-logout)
- Base URL configuration via environment variable

### Routing

Routes are protected based on user roles:

- `/login` - Public login page
- `/employee/*` - Employee-only routes
- `/reviewer/*` - Reviewer-only routes
- `/implementer/*` - Implementer-only routes
- `/admin/*` - Admin-only routes

The `ProtectedRoute` component handles:
- Redirecting unauthenticated users to login
- Redirecting unauthorized users to unauthorized page
- Role-based access control

## Next Steps

The following components need to be implemented in subsequent tasks:

- Login form and authentication UI
- Employee dashboard and idea submission
- Reviewer dashboard and assignment controls
- Implementer dashboard and status updates
- Admin dashboard and user management
- Idea detail view with comments
- Error handling and display components
