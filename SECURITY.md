# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | ✅ Active          |
| 0.2.x   | ✅ Supported       |
| < 0.2   | ❌ Not supported   |

## Reporting a Vulnerability

Elora is a personal savings tool and does not handle real money or financial transactions. However, if you discover a security vulnerability, please report it responsibly.

- **Email**: [sparsh.sam@icloud.com](mailto:sparsh.sam@icloud.com)
- **Do not** open public GitHub issues for security vulnerabilities
- **Do not** share the vulnerability publicly until it has been addressed

### What to include
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response time
You can expect an initial response within 48 hours. We will keep you informed of progress toward a fix.

## Security Considerations

- All user data is stored in Supabase (PostgreSQL) with row-level security
- Authentication is handled by Supabase Auth (SSR)
- No real financial data is stored or processed
- Session tokens are managed via HTTP-only cookies
- API routes authenticate via Supabase session validation
- Environment variables are required for all secrets — never hardcoded
- The virtual house balance ($1B) has no real-world value

## Best Practices for Self-Hosters

1. Never commit `.env.local` to version control
2. Rotate Supabase service role keys regularly
3. Enable Supabase RLS on all tables
4. Use strong passwords for Supabase database access
5. Keep dependencies up to date with `npm audit`
