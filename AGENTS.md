# Agent Guidelines for Checkmate Project

## Commands
- **Build**: `npm run build`
- **Dev**: `npm run dev`
- **Lint**: `npm run lint`
- **Start**: `npm run start`
- **Test**: No test framework configured

## Code Style
- **Language**: TypeScript with strict mode enabled
- **Framework**: Next.js 15, React 19
- **Imports**: Use `@/` alias for src directory
- **Components**: Functional components with hooks, PascalCase naming
- **Client Components**: Add `"use client"` directive at top
- **Types**: Explicit TypeScript types, avoid `any` when possible
- **Error Handling**: API routes use NextResponse.json() with status codes
- **Styling**: Tailwind CSS with custom colors (jet, royal, lime)
- **Fonts**: Montserrat for headers, Inter for body text
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Formatting**: ESLint with Next.js rules, no semicolons after statements