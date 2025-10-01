# Jewelry Shop Admin Panel

## Overview

This is a modern jewelry shop admin panel built with React and Express. The application allows administrators to manage multiple jewelry shops from a centralized dashboard. Admins can add shops (with their MongoDB connection details), view and manage each shop's product catalog, and perform all CRUD operations on products and categories. The application features a beautiful responsive design with golden, white, and pastel color theme.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and caching
- Tailwind CSS for styling with shadcn/ui component library
- Framer Motion for animations and transitions

**Design Decisions:**
- **Component-based UI**: Uses shadcn/ui (Radix UI primitives) for accessible, customizable components
- **Custom theming**: Golden, white, and pastel color theme throughout the application
- **Authentication flow**: Login and signup pages with protected routes
- **Responsive layout**: Mobile-first approach with responsive dashboard and forms
- **State management**: TanStack Query handles all server state, React Context for authentication
- **File organization**: Pages (Login, Signup, Dashboard, ShopForm, ShopCatalog, Settings), components, and UI components are clearly separated

**Key Pages:**
- Login/Signup: Authentication pages with golden theme and "Made by Airavata Technologies" branding
- Dashboard: Main page showing all user's shops with add/edit/delete/catalog actions, **plus live gold and silver rates for India**
- Shop Form: Add or edit shop details (name, image, MongoDB URI, description, contact info)
- Shop Catalog: View and manage products for a specific shop with full CRUD operations
- Settings: Admin account settings and profile management

### Backend Architecture

**Technology Stack:**
- Express.js with TypeScript
- MongoDB with native MongoDB driver for data persistence
- Zod for runtime validation and schema definition
- bcryptjs for password hashing
- crypto.randomUUID for secure session IDs

**API Structure:**
- RESTful API endpoints under `/api` prefix
- **Authentication**: signup, login, logout, me (current user)
- **Shop Management**: CRUD operations scoped by user ownership
- **Shop Catalog**: Fetch categories and products from shop's MongoDB
- **Product Management**: CRUD operations on products within shop catalogs
- **Metal Rates**: Public endpoint `/api/rates` that scrapes live gold and silver rates from IBJA (India Bullion & Jewellers Association)

**Design Decisions:**
- **Validation**: Zod schemas in shared directory ensure type safety between client and server
- **Authorization**: All shop operations are scoped by ownerId to ensure multi-tenant isolation
- **Error handling**: Centralized error responses with appropriate HTTP status codes
- **Session management**: In-memory session storage with UUID-based session IDs
- **Database abstraction**: Storage interface pattern for clean separation of concerns

### Data Storage

**Admin Panel Database (ADMIN_MONGODB_URI):**
- Stores admin panel data (users, shops)
- Collections: users, shops
- Indexed fields: email (unique), ownerId, createdAt, name

**Schema Design:**
- **Users**: email, password (hashed), name, createdAt
- **Shops**: ownerId, name, imageUrl, mongodbUri, description, address, phone, email, website, createdAt, updatedAt

**Shop Databases (Individual MongoDB URIs):**
- Each shop has its own MongoDB database
- Shop owners provide MongoDB connection URIs when adding shops
- Collections: categories, products
- The admin panel connects to shop databases to fetch and manage catalog data

### Security Implementation

**Authentication & Authorization:**
- Password hashing with bcryptjs
- Secure session IDs using crypto.randomUUID
- Protected routes on frontend using React Context
- Authorization middleware on all API endpoints
- Multi-tenant isolation: users can only access their own shops

**Data Validation:**
- Zod schemas validate all user inputs
- MongoDB URI validation (must start with mongodb:// or mongodb+srv://)
- Authorization checks on all shop and catalog operations

### External Dependencies

**UI Component Library:**
- @radix-ui/* components for accessible UI primitives (dialogs, dropdowns, selects, etc.)
- shadcn/ui configuration for consistent component styling

**Database Services:**
- MongoDB Atlas or compatible MongoDB service (via ADMIN_MONGODB_URI for admin panel)
- Individual shop MongoDB databases (via shop-specific URIs)

**Live Metal Rates:**
- Scrapes real-time gold rates from IBJA (India Bullion & Jewellers Association) at https://ibja.co/
- 24K Gold and 22K Gold rates (per 10 grams) updated from IBJA homepage
- Silver rate (per 1 kg) calculated based on gold-to-silver ratio
- Hourly caching to minimize scraping requests (free forever, no API keys required)
- Public API endpoint `/api/rates` accessible without authentication
- cheerio library for HTML parsing and web scraping

**Development Tools:**
- Replit-specific plugins for development experience
- Vite plugins: error overlay, cartographer, dev banner
- TypeScript for type checking across the stack

**Build and Deployment:**
- Vite builds the frontend to `dist/public`
- esbuild bundles the backend to `dist/index.js`
- Environment variables: ADMIN_MONGODB_URI (admin panel database)

## How to Use

1. **Sign Up**: Create an admin account on the signup page
2. **Login**: Sign in with your credentials
3. **Add Shops**: Click "Add New Shop" on the dashboard
   - Enter shop name, image URL, and other details
   - **Important**: Provide the shop's MongoDB connection URI (mongodb:// or mongodb+srv://)
   - The system will connect to this database to fetch products and categories
4. **Manage Catalog**: Click "Catalog" on any shop to view and manage products
   - View products by category
   - Add, edit, or delete products
   - All changes are saved to the shop's MongoDB database
5. **Settings**: Manage your admin account settings

## Branding

"Made by Airavata Technologies" branding appears on all pages of the application.

## Replit Setup Instructions

### Environment Configuration

This application has been configured to run on Replit with the following setup:

**Development Mode:**
- The application runs using `npm run dev` which starts both the backend (Express) and frontend (Vite) on port 5000
- Vite is configured to work with Replit's proxy using `allowedHosts: true`
- The server binds to `0.0.0.0:5000` to accept connections from Replit's proxy
- Environment variables are loaded from the `.env` file using `dotenv`

**Production Deployment:**
- Configured for autoscale deployment (stateless web app)
- Build command: `npm run build` (builds both frontend and backend)
- Run command: `npm run start` (runs the bundled production server)

**Database Configuration:**
The application looks for MongoDB connection URI in this order:
1. `ADMIN_MONGODB_URI` environment variable (preferred for Replit Secrets)
2. `MONGODB_URI` environment variable (fallback, used by .env file)

For production deployment, it's recommended to add `ADMIN_MONGODB_URI` to Replit Secrets instead of using the .env file.

**Important Notes:**
- The `.env` file is now in `.gitignore` to prevent accidental exposure of credentials
- For production, use Replit Secrets to securely store `ADMIN_MONGODB_URI`
- The application requires a MongoDB database - use MongoDB Atlas or any MongoDB-compatible service

### Recent Changes (Replit Setup)

**October 1, 2025:**
- Added dotenv to load environment variables from .env file
- Updated MongoDB connection to check both ADMIN_MONGODB_URI and MONGODB_URI
- Configured Vite to work with Replit's proxy (allowedHosts: true)
- Set up workflow to run on port 5000 with webview output
- Configured deployment for autoscale with proper build and run commands
- Added .env to .gitignore for security
