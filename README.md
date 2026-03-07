# saneatsu.me

Personal portfolio and blog site.

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, shadcn/ui, next-intl
- **Backend**: Hono, Drizzle ORM
- **Database**: Turso (libSQL)
- **Infrastructure**: Cloudflare Workers, Cloudflare Images
- **Testing**: Vitest, Storybook, Playwright
- **Linter/Formatter**: Biome
- **Other**: Google Gemini API (article translation)

## Project Structure

```
.
├── apps/
│   ├── backend/     # Backend API (Hono on Cloudflare Workers)
│   ├── frontend/    # Frontend (Next.js)
│   └── docs/        # Documentation (Docusaurus)
├── packages/
│   ├── db/          # Database schema & utilities
│   ├── i18n/        # Internationalization utilities & translations
│   └── schemas/     # Shared schema definitions (Zod)
└── scripts/         # Build & deploy scripts
```

## Setup

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/backend/.env.example apps/backend/.env
```

**Important**: After creating `apps/backend/.env`, set the following environment variables:

- `TURSO_DATABASE_URL`: Turso database URL
- `TURSO_AUTH_TOKEN`: Turso auth token
- `ADMIN_EMAILS`: Admin email addresses (comma-separated)

### Environment Variables

Set the following in `apps/backend/.env`:

```bash
# Turso Database
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Google Gemini API (for article translation)
GEMINI_API_KEY=your-gemini-api-key

# Admin Emails (for Google Auth)
# Comma-separated for multiple admins
ADMIN_EMAILS=your-admin-email@example.com
```

## Development

```bash
# Start dev servers (all apps)
pnpm dev

# Frontend only
pnpm --filter @saneatsu/frontend dev

# Backend only
pnpm --filter @saneatsu/backend dev

# Build
pnpm build

# Run tests
pnpm vitest

# Type check
pnpm type-check

# Lint & format
pnpm check
```

## Testing

```bash
# Vitest (unit & integration tests)
pnpm vitest

# Storybook tests
cd apps/frontend && pnpm test-storybook:smart

# E2E tests (Playwright)
cd apps/frontend && pnpm e2e

# E2E tests in UI mode
cd apps/frontend && pnpm e2e:ui
```

## Database

```bash
# Generate migrations
pnpm --filter @saneatsu/db db:generate

# Run migrations
pnpm --filter @saneatsu/db db:push

# Seed data
pnpm seed

# Drizzle Studio (GUI)
pnpm --filter @saneatsu/db db:studio
```

## Deploy

```bash
# Deploy to development
pnpm deploy:dev

# Deploy to preview
pnpm deploy:preview

# Deploy to production
pnpm deploy:prod
```

## Commit Convention

Follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

```
feat: Add new feature
fix: Fix a bug
docs: Update documentation
style: Code style changes
refactor: Refactoring
test: Add or update tests
chore: Build process or tooling changes
```

## License

Private

## Author

saneatsu
