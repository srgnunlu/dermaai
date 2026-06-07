# Contributing to DermaAssistAI

Thanks for your interest in contributing! DermaAssistAI is an open-source clinical
decision-support tool for dermatology. Contributions of all kinds — code, tests,
documentation, accessibility, and ideas — are welcome.

> ⚠️ **Medical disclaimer:** This project is for research and educational use only.
> It is **not** a medical device and does not provide medical advice. Please keep
> this scope in mind in every contribution.

## Getting started

**Requirements:** Node.js ≥ 20 and [pnpm](https://pnpm.io) (the project pins `pnpm@10`).

```bash
git clone https://github.com/srgnunlu/dermaai.git
cd dermaai
pnpm install
cp .env.example .env     # add your OpenAI / Gemini / PostgreSQL keys
pnpm db:push
pnpm dev
```

## Development workflow

1. Create a feature branch: `git checkout -b feature/short-description`
2. Make your change in small, focused commits.
3. Before opening a Pull Request, run:
   ```bash
   pnpm check     # TypeScript type-check
   pnpm lint      # ESLint
   pnpm test      # Vitest
   ```
4. Open a PR that explains **what** changed and **why**.

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.

## Code style

- TypeScript, strict mode.
- Prefer small, single-responsibility files (aim for ~≤250 lines).
- Run `pnpm format` (Prettier) before committing.

## Security

- Never commit secrets. Keep keys in `.env` (already git-ignored); use `.env.example`
  for placeholders only.
- Found a security issue? Please **do not** open a public issue — contact the
  maintainer directly (see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)).

## Good first issues

New here? Browse the
[**good first issue**](https://github.com/srgnunlu/dermaai/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
label — those are scoped to be approachable.
