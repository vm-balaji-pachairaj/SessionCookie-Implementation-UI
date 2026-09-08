# Session Cookie & PubSub POC UI

This repository is the frontend for a role-based access control (RBAC) and session-management proof of concept. The app is built with Next.js App Router and is designed to work with a backend service exposed on `http://localhost:5000`.

The UI handles:

- login and session establishment using HttpOnly cookies
- token refresh and automatic redirect flow on auth failures
- multi-tab session coordination and same-tab locking
- idle timeout warnings and logout behavior
- dynamic menu rendering based on backend permissions
- Casbin policy bundle administration and policy checks
- Google Cloud Pub/Sub producer/subscriber testing flows

## Project overview

The codebase is primarily a portal-style administrative console used to demonstrate how a backend session cookie plus Casbin authorization matrix can drive UI access. The user signs in, the backend returns access and refresh cookies, and the frontend uses those cookies automatically for all authenticated API calls.

The app also exposes demo pages for:

- login and continue-session flows
- dashboard with role switching and menu-driven navigation
- user management pages
- admin policy bundle and role assignment screens
- enforcer checker for testing permission decisions
- Pub/Sub producer and subscriber tools

## Features

### Authentication and session flow

- login page posts credentials to `/login`
- backend sets access and refresh tokens as HttpOnly cookies
- `app/common.tsx` adds a global Axios instance with credentials enabled
- 401 responses trigger a `/refresh` call automatically for protected routes
- `/login`, `/refresh`, and some other deliberately excluded paths are skipped from the silent refresh flow so the app surfaces the real failure and redirects cleanly
- same-tab session handling prevents multiple tabs from operating independently
- idle timeout warns the user before logging them out

### Authorization model

- permission data and field permissions are stored in Redux slices
- `lib/permissions.ts` consolidates permission checks (`hasPermission`, `hasFieldPermission`, `getSectionMode`, `getFieldMode`)
- page-level access is checked in `component/pages/PageGaurd.tsx`
- menu and page rendering are routed through `component/MenuPageRenderer.tsx`
- admin tooling exposes role → bundle → policy relationships and tests enforcement via `p`, `p2`, and `p3` policies

### Admin console

- user roles and assigned bundles dashboard
- policy bundles and permission policy management dashboard
- policy hierarchy editor for selecting and updating resource permissions
- enforcer checker to validate a chosen role against a policy entry

### Pub/Sub testing UI

- producer page for publishing JSON event payloads
- subscriber page for polling and acknowledging messages
- status cards and history panels surfaced in the UI

## Tech stack

From the actual project configuration:

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Redux Toolkit
- Axios
- MUI packages for icons and UI building blocks
- ESLint via Next.js config

Package scripts in [package.json](package.json):

- `dev`: `next dev`
- `build`: `next build`
- `start`: `next start`
- `lint`: `eslint`

There is no dedicated `test` script in the repository at the moment.

## Architecture and runtime flow

### Frontend structure

The repository is organized as follows:

```text
.
├── app/                       # App Router pages and global providers
│   ├── admin/                 # Admin pages and nested bundle/role pages
│   ├── dashboard/             # Main protected dashboard shell
│   ├── login/                 # Login screen
│   ├── continue-session/      # Continue existing session flow
│   ├── pubsub/                # Pub/Sub demo page
│   ├── search/                # Search route alias to dashboard behavior
│   ├── store/                 # Redux store and slices
│   ├── common.tsx             # Shared Axios client and auth refresh logic
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # App shell, ReduxProvider, same-tab blocker
│   └── page.tsx               # Home landing page
├── component/                 # Feature-specific UI components (non-UI library)
│   ├── admin/                 # RBAC admin dashboards and modals
│   ├── pages/                 # Page-level feature components for RBAC pages
│   ├── MenuPageRenderer.tsx   # Maps menu keys to feature pages
│   ├── Sidebar.tsx            # Sidebar navigation
│   ├── ScanTagNavbar.tsx      # Header/search/role controls
│   ├── SameTabSession.tsx     # Tab blocker overlay
│   ├── PubSubProducer.tsx     # Publisher UI
│   ├── PubSubSubscriber.tsx   # Subscriber UI
│   └── ...                    # other feature view components
├── components/ui/             # Reusable UI primitives
├── hooks/                     # Custom hooks for idle timeout and permission state
├── lib/                       # Shared authorization / permission helpers
├── public/                    # Static assets
├── next.config.ts             # API rewrites to backend
├── package.json               # Scripts and dependencies
├── tsconfig.json              # TypeScript configuration
├── eslint.config.mjs          # ESLint configuration
├── README.md                  # Project documentation
└── .gitignore                 # Git ignore rules
```

### State and access control

The app keeps authorization state in Redux:

- `app/store/menuSlice.ts` stores backend menu definitions
- `app/store/permissionsSlice.ts` stores `permissions` and `fieldPermissions`
- `app/store/store.ts` is the root Redux store

The dashboard loads user, role, menus, and permissions from `/dashboard` and pushes them into the store. The selected role is then used to switch the active authorization context.

### Auth and refresh behavior

The shared Axios client in [app/common.tsx](app/common.tsx) creates a cookie-aware HTTP client and a response interceptor that:

- retries once on 401 if the request is not explicitly excluded
- calls `/refresh` to obtain a fresh access token
- redirects to `/login` if refresh fails or if the request is on a route that should not trigger auto-refresh

This is why the app can preserve user sessions without exposing tokens to JavaScript.

### Routing and page selection

The dashboard keeps `activeNav` state and renders feature pages via [component/MenuPageRenderer.tsx](component/MenuPageRenderer.tsx). The menu arrays are returned by the backend, meaning the UI is not hard-coded to a single static nav; it adapts to the user’s assigned roles and backend menu definitions.

## Environment and backend contract

This repository does not contain checked-in `.env` files. The actual code uses backend URLs hard-coded to `http://localhost:5000` in multiple places, for example:

- [app/common.tsx](app/common.tsx)
- [next.config.ts](next.config.ts)
- admin components under [component/admin](component/admin)
- [component/pages](component/pages)

Optional frontend env overrides are used in a few places:

- `NEXT_PUBLIC_API_URL` — used by the Pub/Sub demo components when available
- `NEXT_PUBLIC_ADMIN_API_URL` — used by admin dashboard components when available

If these are not defined, the code falls back to the default `http://localhost:5000` contract.

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Start the backend

This UI expects a backend service to be running on the default API port before it can authenticate or fetch protected data.

Typical workflow:

```bash
# from the backend project folder
npm run start:dev
```

### 3) Start the UI

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### 4) Production build

```bash
npm run build
npm run start
```

## Development and build commands

Available commands from [package.json](package.json):

```bash
npm run dev      # local development server
npm run build    # production build
npm run start    # run the built app
npm run lint     # eslint validation
```

No dedicated test command is configured in this repo.

## Major UI flows

### Login flow

1. User enters username/password on the login page.
2. Client posts to `/login` using cookie-aware Axios.
3. On success, app redirects to `/dashboard`.
4. If the backend rejects because another session exists, the app stores the credentials temporarily and sends the user to `/continue-session`.

### Dashboard flow

1. `/dashboard` calls `/dashboard` and receives roles, menus, permissions, and field permissions.
2. Redux slices are populated.
3. Sidebar nav is driven by backend-provided menu definitions.
4. Role switching calls `/changerole` and updates the permissions and menu set in memory.
5. Idle timeout warns as the user becomes inactive; if the timer expires, the app logs out and redirects to `/login`.

### Permission-driven page rendering

The app does not rely on a single static route tree. Instead:

- menu keys normalize and match against route groups in `MenuPageRenderer`
- backend permission objects determine whether a page or field is visible or editable
- `PageGuard` blocks forbidden page access
- `lib/permissions.ts` centralizes the evaluation logic

### Admin flow

- Admin console loads roles, bundles, and policy metadata from `/api/admin`
- role assignment dashboard lets the user assign/remove bundles to/from a role
- policy bundles dashboard lets the user create bundles, inspect policies, and manage the policy resource hierarchy
- enforcer checker validates a role against a selected permission entry

### Pub/Sub flow

- producer tab publishes JSON payloads to `/api/pubsub/publish`
- subscriber tab polls `/api/pubsub/messages`
- ACK and NACK calls are submitted to the backend from the frontend

## Important modules

### `app/common.tsx`

This is the shared API client. It covers:

- cookie credentials
- request middleware to append cache-busting params on GET requests
- response interceptor for 401 handling and automatic refresh
- redirect logic for login-related failures and expired sessions

### `hooks/useIdleTimeout.tsx`

Tracks keyboard and mouse activity, transitions to a warning state, and eventually logs the user out after a configured inactivity period.

### `hooks/useSameTabSession.tsx`

Uses a tab-specific ID and `BroadcastChannel`/`localStorage` fallback to ensure only one browser tab remains active at a time.

### `lib/permissions.ts`

This is the canonical permission helper layer for:

- exact permission checks
- section access checks (`edit` / `view` / `none`)
- field-level permission checks
- fallback behavior when the backend does not provide a fine-grained field rule

### `component/MenuPageRenderer.tsx`

Maps backend menu keys to actual feature pages such as sales, user management, reports, search, and settings.

## Integrations and API assumptions

The frontend assumes the following backend endpoints are available:

- `/login`
- `/continue-session`
- `/refresh`
- `/logout`
- `/dashboard`
- `/changerole`
- `/api/admin/...`
- `/api/pubsub/...`
- `/api/user-management/...`
- `/api/sales/...`

The rewrite in [next.config.ts](next.config.ts) forwards `/api/:path*` to `http://localhost:5000/:path*`, so these backend routes are expected to live behind the same host and port unless changed by environment variables.

## Deployment information

This is a standard Next.js application and can be deployed as a typical server-rendered or static Next.js app. The actual repository does not include deployment-specific infrastructure files or hosting configuration.

For a simple production deployment, use:

```bash
npm run build
npm run start
```

If the backend is not at the default host, update the backend URL contract or set the relevant public env values before running the app.

## Troubleshooting

### Backend unreachable

Symptoms:

- login fails with `ERR_NETWORK`
- browser console shows failed API connection

Checks:

- confirm the backend is running on `http://localhost:5000`
- confirm the backend port and route names match the frontend contract
- check `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_ADMIN_API_URL` if you have custom host settings

### Redirected to `/login`

Common causes:

- `/refresh` failed or session is expired
- 401 during a protected request when the refresh attempt was not allowed
- same-tab session guard blocked the tab from continuing

### Stale permissions or menus

If the active role or permission matrix changes, use the dashboard’s refresh tools or reload the page to refetch `/dashboard` and recalculate Redux state.

### Pub/Sub tools not working

- make sure the backend Pub/Sub service is running
- verify the backend topic/subscription names match the expected configuration
- confirm the app is still pointing to the correct backend host and port

## Notes

This repository is a UI and workflow demo, not a backend implementation. Most business logic, permission rules, and session state are enforced by the backend service behind the API that the frontend talks to.

The frontend focuses on UI composition, session handling, permission-driven rendering, and admin tooling around those backend decisions.
