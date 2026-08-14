# Security Policy

## Supported versions

This is a static website. Security fixes are applied on the `main` branch and deployed to [blessedtxts.com](https://blessedtxts.com).

## Reporting a vulnerability

Please report vulnerabilities privately through [GitHub Security Advisories](https://github.com/montana-digital/blessedtxts-com/security/advisories/new) rather than a public issue.

Include:

- A description of the issue
- Steps to reproduce
- Impact (for example XSS, open redirect, or exposure of a deploy secret)

We will acknowledge the report and work on a fix. This project has no user accounts or private API; most issues are XSS, supply-chain, or leaked environment variables (`INDEXNOW_KEY`, analytics keys).
