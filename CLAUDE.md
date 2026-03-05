# CLAUDE.md

## Language

- All code, comments, commit messages, PR descriptions, and documentation must be in English.

## Tech stack

- TypeScript, ESM modules (imports use `.js` extension)
- Drizzle ORM + SQLite, schema in `src/db/schema.ts`
- Env variables validated with zod in `src/config.ts` — add new variables there
- Logging via pino (`logger` from `src/utils/logger.ts`) — never use `console.log`
- Deploy target: Railway

## Commands

- `npm run dev` — run locally (tsx watch)
- `npm run lint` — ESLint
- `npm run typecheck` — tsc --noEmit
- `npm run test:unit` — vitest
- `npm run format` — Prettier

## Code conventions

- Use `type` imports (`consistent-type-imports` enforced by ESLint)
- Prettier: single quotes, trailing commas, semicolons, 100 char width
- Prefix unused function args with `_`

## Before committing

- Run `npm run lint` and `npm run typecheck` to catch errors.
