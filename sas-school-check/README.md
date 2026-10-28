# SAS School Check

SAS School Check is a secure staff attendance and administration system for the American Section of Seeds American School.

This project is created in a separate folder under the current repository so it does not overwrite the existing website files.

## Features

- Teacher sign-in by Teacher ID and password
- Administrator-only developer console
- Temporary single-use device linking codes with expiry and revocation
- Password changes and device revocation
- Passkey/WebAuthn registration and verification
- Attendance history in Africa/Cairo time using server timestamps
- School geofence with server-side validation and disabled attendance until configured
- Audit logging and rate limiting
- SQLite-backed persistence and local development deployment scripts

## Quick start

1. Create the data directory if it does not exist:
   `mkdir -p data`
2. Copy `.env.example` to `.env` and set the required values.
3. Install dependencies:
   `npm install`
4. Start the server:
   `npm start`
5. Open `http://localhost:3000/`

## Default admin

The application will seed a default administrator account when the database is empty.

- Teacher ID: `admin`
- Password: `Admin@1234`

Change this immediately in production.

## Security notes

- Passwords are stored as bcrypt hashes.
- Device-link codes are stored as cryptographic SHA-256 hashes only.
- No biometric images or raw templates are collected or stored.
- Attendance remains disabled unless a real campus latitude and longitude are configured.
- Real WebAuthn deployment requires HTTPS and a valid relying party ID and origin.

## Debian deployment

See `DEBIAN-INSTALL.txt` and `install-debian.sh` for installation, backup, and service setup instructions.

## Project structure

- `public/index.html` — teacher portal
- `public/developer.html` — admin/developer console
- `public/teachers.html` — searchable teacher directory
- `public/teacher-details.html` — teacher details and attendance history
- `public/styles.css` — shared styles
- `public/*.js` — page-specific JavaScript
- `server.js` — Express application
- `schema.sql` — SQLite schema
- `test/*.js` — automated tests
