# SAS School Check

A secure teacher attendance and administration system for Seeds American School, American Section.

## Security overview

- Passwords are stored as bcrypt hashes.
- Device-link codes are hashed before storage.
- WebAuthn challenges are short-lived and validated server-side.
- Real attendance remains disabled until verified campus coordinates are configured.
- No biometric images or raw fingerprint/face data are collected.

## Requirements

- Node.js 18+
- SQLite 3
- An environment file based on `.env.example`

## Local development

1. `mkdir -p data`
2. `cp .env.example .env`
3. `npm install`
4. `npm start`
5. Visit http://localhost:3000/

## Initial administrator

On first startup, an administrator account is created automatically using the configured `ADMIN_TEACHER_ID` and `ADMIN_PASSWORD` values if the database is empty.

The default values in `.env.example` are placeholders only and must be changed before real use.

## Pages

- `/` Teacher portal
- `/developer` Administrator console
- `/teachers` Admin teacher directory
- `/teacher-details` Individual teacher detail page

## Deployment

See `DEBIAN-INSTALL.txt`, `install-debian.sh`, and `start-debian.sh` for Debian 13 service setup, backup guidance, and update flow.

## Security notes

- Configure HTTPS for production passkeys.
- Do not expose the database file over HTTP.
- Never store raw passwords, device-link codes, or biometric data.
- Keep geofence coordinates verified before enabling attendance.
