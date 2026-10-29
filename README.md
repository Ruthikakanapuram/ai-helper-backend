# AI Learning Platform — NestJS + MySQL + Swagger

A working REST CRUD **starter** with separate NestJS modules for Users, Activities, Chat Sessions, and Chat Messages, plus JWT authentication. The Chat Messages table stores a prompt and its response in **the same row**.

## Requirements
- Node.js 20+
- MySQL 8.0+
- An empty database and MySQL user with privileges to create tables (development mode)

## Setup

```bash
npm install
cp .env.example .env
# Fill in your MySQL details in .env, including JWT_SECRET
# Create database once, using your own privileged MySQL account:
# CREATE DATABASE ai_learning CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
npm run start:dev
```

Swagger: **http://localhost:3000/docs**
All REST routes are prefixed **/api**.

## First-time users / teacher account
1. `POST /api/auth/register` creates a **STUDENT** account (role cannot be supplied publicly).
2. To bootstrap a teacher for local testing, register the teacher account normally then promote it **manually in MySQL** using a trusted DBA account:
   ```sql
   UPDATE users SET role='TEACHER' WHERE email='teacher@example.com';
   ```
3. `POST /api/auth/login` with email/password returns `access_token`.
4. In Swagger, click **Authorize**, then paste the token (without `Bearer` prefix).
5. As TEACHER, `POST /api/activities` creates an activity. Publish it by PATCHing its `status` to `PUBLISHED`.
6. Register/login as STUDENT and `POST /api/chat-sessions` with `{ "activityId": 1 }`.
7. `POST /api/chat-messages` with `{ "sessionId": 1, "turnNumber": 1, "clientRequestId": "0b5035cf-3150-4d67-9a11-023ab2d8a008", "prompt": "Explain a BST" }`.
8. `GET /api/chat-messages?sessionId=1` retrieves the combined prompt/response rows (response is initially null).
9. As ADMIN, PATCH a message to manually record a response for CRUD testing. In the later OpenAI integration, a trusted backend service will do this automatically.

## Modules and routes
- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Users: `POST/GET /api/users`, `GET/PATCH/DELETE /api/users/:id` (admin-managed; users may GET own ID)
- Activities: `POST/GET /api/activities`, `GET/PATCH/DELETE /api/activities/:id`
- Chat Sessions: `POST/GET /api/chat-sessions`, `GET/PATCH/DELETE /api/chat-sessions/:id`
- Chat Messages: `POST/GET /api/chat-messages`, `GET/PATCH/DELETE /api/chat-messages/:id`

## Security and access
- JWT authentication on all CRUD endpoints. Public register/login endpoints are not protected.
- Public registration can only create STUDENT accounts.
- Teachers can create/update their own activities and read chat sessions/messages associated with those activities.
- Students create their own sessions and read their own messages.
- Only admin can manually update/delete message data. The OpenAI request execution endpoint is **not included** in this CRUD starter.
- No student-to-activity enrollments are implemented yet. Activities must be published before students can create sessions. Add enrollment checks for production.
- This is a foundation, **not production hardened**: add rate limiting, refresh tokens, account verification, audited admin bootstrap, DB migrations, testing, structured logging, and authorization for enrollment/course membership.

## Database notes
`DB_SYNCHRONIZE=true` is intended **only for local development**. Before using real data, switch it off and introduce versioned TypeORM migrations. Tables are managed by TypeORM entities. Existing schema from another project should not be combined with auto synchronize.

The ZIP deliberately does **not** include real MySQL credentials, OpenAI keys, `node_modules`, or `.env`. You can provide the MySQL host, port, database name and username later, and only local `.env` values need to change.
