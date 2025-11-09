# Toyota Agent Frontend

Modern Next.js interface for the Toyota Agent experience delivered at HackUTD. This refresh focuses on a cohesive Toyota visual language while keeping the underlying data flow and Supabase integrations intact.

## Highlights

- **Toyota design system** – global palette, typography, and surface treatments aligned with brand standards.
- **Shared chrome** – reusable header and footer components with responsive navigation and official SVG branding.
- **Curated journeys** – redesigned landing, browsing, comparison, car detail, quiz, chat, auth, and test-drive flows.
- **UI consistency** – rounded button & badge primitives, card spacing, and utility helpers such as `toyota-container`, `toyota-surface`, and gradient treatments.

## NVIDIA Track Features

This project implements NVIDIA's requirements for multi-agent AI systems:

### ✅ Multi-Step Workflows
- **Orchestrator Agent** – Routes queries to appropriate agents based on intent
- **Intent Agent** – Parses natural language into structured tasks using Nemotron
- **Vehicle Agent** – Searches Toyota database with complex constraints
- **Finance Agent** – Calculates financing and leasing options
- **Report Agent** – Generates personalized narrative responses

### ✅ Tool Integration
- **searchToyotaTrims** – Real-time vehicle database search
- **displayCarRecommendations** – Visual car card display
- **estimateFinance** – Financing and leasing calculations
- **scheduleTestDrive** – Test drive booking integration
- **sendEmailHtml** – Personalized email delivery via Resend

### ✅ Real-World Applicability
- Complete car shopping experience (search, compare, finance, test drive)
- Integration with Supabase for user preferences and bookings
- Email confirmations and booking management
- Voice calling via Retell API

### ✅ Nemotron Integration
- Uses `nvidia/llama-3.3-nemotron-super-49b-v1.5` model via OpenRouter
- Multi-agent orchestration with specialized agents
- Tool calling for external API integration

## Tech Stack

- [Next.js 16](https://nextjs.org/) + React 19
- Tailwind CSS v4 (via `@import "tailwindcss"`) with custom Toyota utilities
- Supabase auth client (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Radix UI primitives, Shadcn-inspired component layer, Lucide icons
- **NVIDIA Nemotron** via OpenRouter AI SDK
- **Retell SDK** for voice calling integration

## Getting Started

```bash
# Install dependencies
cd web
npm install

# Run the development server
npm run dev

# Lint the project
npm run lint
```

Create a `.env.local` inside `web/` with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Project Layout

- `web/app/globals.css` & `web/styles/globals.css` – global tokens and Toyota utility classes.
- `web/components/layout/` – shared header and footer used across all routes.
- `web/app/*` – route-based components updated with Toyota theming.
- `web/components/ui/` – button, badge, and other primitives restyled for the new system.

## Architecture

### Multi-Agent System
- `web/app/api/chat/orchestrator.ts` – Routes queries to appropriate agents
- `web/app/api/chat/agents.ts` – Intent, Vehicle, Finance, and Report agents
- `web/app/api/chat/route.tsx` – Main chat handler with agent orchestration
- `web/app/api/chat/tools.ts` – Tool definitions for external integrations
- `web/components/chat/AgentWorkflow.tsx` – Visual workflow indicator

### Key Features
- **Vehicle Search**: Real-time database queries with filtering
- **Financing Calculator**: Loan and lease estimates
- **Test Drive Booking**: Integrated scheduling system
- **Email Integration**: Personalized HTML emails via Resend
- **Voice Calling**: Retell phone integration for voice agent

## Contributing

1. Branch from `main`.
2. Make UI-only adjustments (backend logic and API contracts are off-limits).
3. Run `npm run lint`.
4. Submit a PR describing the visual/UX improvements.

## License

MIT © Toyota Agent HackUTD Team
