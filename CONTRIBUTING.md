# Contributing to Elora Vault

Thank you for your interest in Elora Vault! This is a personal project, but contributions, feedback, and ideas are welcome.

## Code of Conduct

Be respectful, constructive, and kind. This is a learning project — all skill levels are welcome.

## How to Contribute

### 1. Issues
- Check existing issues before creating a new one
- Use descriptive titles
- Include steps to reproduce for bugs
- Suggest improvements with clear rationale

### 2. Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes with clear messages
4. Push to your fork and open a PR
5. Ensure the PR description explains what and why

### 3. Development Setup

```bash
# Clone your fork
git clone https://github.com/sparshsam/elora-bet-api.git
cd elora-bet-api

# Install dependencies
npm install

# Copy env vars
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Push database schema
npx prisma db push

# Run development server
npm run dev
```

### 4. Code Style
- TypeScript strict mode
- ESLint + Prettier conventions (see `eslint.config.mjs`)
- TailwindCSS utility classes for styling
- Framer Motion for animations
- Zustand for client-side state
- Server components where possible; "use client" only when needed

### 5. Testing
Run before submitting:
```bash
npm run lint
npm run build
npx prisma generate
```

## What We Need Help With

- Accessibility improvements
- Mobile responsiveness edge cases
- PWA / offline support
- Advanced analytics visualizations
- Documentation and screenshots
- Performance optimizations
- Test coverage

## Questions?

Open a discussion or reach out to [sparsh.sam@icloud.com](mailto:sparsh.sam@icloud.com).
