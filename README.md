# CivicTrack — Community Issue Reporting and Resolution Tracker

CivicTrack is a beginner-friendly full-stack web application for reporting and tracking local community issues such as damaged roads, garbage accumulation, water supply problems, drainage issues, and broken streetlights.

## 1. Problem statement

Community members may not know how to report local problems or how to follow up on them. CivicTrack provides a simple place to submit an issue and check its public status. An administrator can review submissions and update their status.

## 2. Objectives

- Make community issue reporting simple.
- Show public issue status transparently.
- Allow an administrator to update progress and add a resolution note.
- Demonstrate HTML, CSS, Vanilla JavaScript, Node.js, Express, and Supabase PostgreSQL working together.

## 3. Users and features

**Community members (no account required):**
- Submit an issue with title, category, location, and description.
- Optionally add their name/contact details.
- Search and filter the public issue list.
- See whether issues are Pending, In Progress, or Resolved.

**Administrator:**
- Sign in with a server-configured password.
- View all issue details, including optional reporter information.
- Update status and add a resolution note.
- Log out.

This is a college-project MVP. It does not send notifications, verify issue locations, upload photographs, or provide separate accounts for every citizen.

## 4. Technology stack

- HTML5, CSS3, Vanilla JavaScript
- Node.js and Express.js
- Supabase PostgreSQL
- Git and GitHub

## 5. Folder structure

```text
community-issue-reporting-tracker/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── routes/
│   │   ├── issues.js
│   │   └── admin.js
│   ├── middleware/
│   │   └── adminAuth.js
│   ├── utils/
│   │   └── limiters.js
│   ├── server.js
│   ├── supabase.js
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

`package-lock.json` is created by `npm install` on your computer.

## 6. Prerequisites

Install:
- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js LTS](https://nodejs.org/) (npm is included)
- [Git](https://git-scm.com/)
- A free [Supabase](https://supabase.com/) account

Verify in a new VS Code terminal:

```bash
node --version
npm --version
git --version
```

Node should be version 20 or newer.

## 7. Set up Supabase

1. Sign in to Supabase and create a new project.
2. Choose a project name and a strong database password. Save the database password privately; this project connects using the Supabase API, not that database password.
3. Wait for the project to finish provisioning.
4. Open **SQL Editor**, choose **New query**, and paste the entire contents of `database/schema.sql`.
5. Run the query.
6. Open **Table Editor** and verify that the `issues` table exists.
7. Open **Project Settings → API** (the exact menu wording may change) and copy the Project URL and the server-side `service_role` key. Do not share or publish the service-role key.

RLS is enabled on `issues` and no direct browser-access policies are created. The Express server uses the service-role key and is responsible for public input validation and admin authorization.

## 8. Configure environment variables

Open `backend/.env`. Replace the placeholders:

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
ADMIN_PASSWORD=choose_a_long_unique_password
SESSION_SECRET=replace_with_a_random_secret
```

Generate a session secret from the project root or any terminal:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copy the generated output into `SESSION_SECRET`. Use a different strong value for `ADMIN_PASSWORD`. The `.env.example` file is a template only; its example values do not connect to a real database.

**Security:** never put the service-role key or admin password in `frontend/`, screenshots, GitHub, or a public report. `.env` is ignored by Git. The built-in Express session store is suitable only for local demonstration, not production deployment.

## 9. Install and run

Open VS Code, choose **File → Open Folder**, and open the project root.

Open **Terminal → New Terminal**, then run:

```bash
cd backend
npm install
npm run check
npm start
```

- `npm install` installs the packages and creates `backend/package-lock.json`.
- `npm run check` checks JavaScript syntax.
- `npm start` starts the API and website.

Expected terminal message:

```text
CivicTrack is running at http://localhost:3000
Health check: http://localhost:3000/api/health
```

Open `http://localhost:3000` in a browser. Keep the terminal running while you use the website.

## 10. How the application works

1. The browser displays HTML styled with CSS.
2. `frontend/app.js` uses `fetch()` to send JSON requests to Express.
3. Express validates input and runs database queries using the Supabase client.
4. Supabase PostgreSQL stores the reports between visits.
5. The administrator-only endpoints check the server session before returning private report details or updating a status.

## 11. API endpoints

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/health` | API health check | Public |
| GET | `/api/issues` | List up to 200 public issue fields | Public |
| POST | `/api/issues` | Submit an issue | Public, rate-limited |
| POST | `/api/admin/login` | Start admin session | Password required, rate-limited |
| POST | `/api/admin/logout` | End admin session | Session |
| GET | `/api/admin/issues` | View full issue records | Admin session |
| PATCH | `/api/admin/issues/:id` | Update status and resolution note | Admin session |

`POST /api/issues` JSON body example:

```json
{
  "title": "Streetlight not working",
  "category": "Streetlights",
  "location": "Park Road",
  "description": "The streetlight near the park entrance is not working.",
  "reporter_name": "",
  "contact": ""
}
```

Successful creation returns HTTP `201` and an `issue` object. Invalid input returns HTTP `400`. Admin endpoints return HTTP `401` when no admin session is present. An unknown issue ID returns HTTP `404`.

## 12. Test the features

1. Open the home page. The issue list and summary numbers should load from Supabase.
2. Submit a valid report. It should appear with status **Pending**.
3. Search for part of its title or location. The list should filter.
4. Choose a status filter. Only matching reports should appear.
5. Select **Admin login** and enter the password from `.env`.
6. Change an issue to **In Progress**, add a note, and save. The public list should update.
7. Change it to **Resolved** and verify the summary count.
8. Try submitting an empty form. Browser validation should prevent it.
9. Try a very long value or invalid category with an API client. The server should reject it.
10. Sign out and verify that the admin issue endpoint no longer returns data.
11. Resize the browser to mobile width and check that the form and issue list remain readable.

Syntax check command:

```bash
cd backend
npm run check
```

This checks syntax only. You must run the application with your own Supabase project to verify the live database connection.

## 13. Troubleshooting

- **Could not load issues:** confirm the backend is running, `.env` values are correct, and the SQL schema has been executed.
- **Supabase error:** confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` belong to the same project. Do not paste keys into public chat or GitHub.
- **Admin password is not configured:** replace the placeholder `ADMIN_PASSWORD` in `backend/.env`, then restart the server.
- **Login does not work:** use the exact password configured in `.env`; restart after editing it.
- **Port already in use:** change `PORT=3001` in `.env`, restart, and visit `http://localhost:3001`.
- **Changes do not appear:** refresh the page and check the VS Code terminal for server errors.
- **`npm` is not recognized:** install Node.js LTS, then close and reopen the terminal.
- **Missing package error:** run `npm install` from the `backend` directory.

## 14. GitHub upload

Create an empty repository on GitHub, then from the project root run:

```bash
git init
git status
git add .
git status
git commit -m "Build CivicTrack community issue tracker"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your repository URL. If Git requests your identity, configure it with the name and email you use for GitHub.

Before committing, make sure `.env` is not staged and `node_modules/` is ignored. `.env.example` should be included. If a secret is accidentally committed, removing the file later is not enough: rotate the exposed credential immediately and clean the repository history as needed.

## 15. Security and limitations

- The service-role key is used only by the backend and bypasses RLS, so every privileged endpoint must enforce authorization. The admin routes do so using a server-side session.
- Public issue descriptions and locations are visible to all visitors. Do not submit private or sensitive information.
- The administrator password is a simple single-admin demonstration mechanism. It is not a replacement for a production identity provider or multi-user role management.
- Express's default in-memory session store loses sessions on server restart and is not intended for production.
- For production, use HTTPS, a persistent session store, stronger identity management, privacy/retention rules, monitoring, and additional abuse protection.

## 16. Future improvements

- Supabase Auth with separate citizen and authority accounts.
- Photo attachments and map-based location.
- Email or SMS notifications.
- Duplicate issue detection and issue voting.
- Reports by category and resolution time.
- A persistent production-grade session store.

## 17. Final checklist

- [ ] Supabase project created and `issues` table exists.
- [ ] `backend/.env` contains your private credentials.
- [ ] `npm install` completed in `backend/`.
- [ ] `npm run check` completed successfully.
- [ ] `npm start` runs without configuration errors.
- [ ] Website opens at `http://localhost:3000`.
- [ ] Creating an issue persists it in Supabase.
- [ ] Admin can update issue status.
- [ ] `.env` and `node_modules/` are not committed to GitHub.
