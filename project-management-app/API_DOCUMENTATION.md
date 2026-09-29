# API Documentation

Base URL: `http://localhost:5000/api` (local) — interactive Swagger UI at `/api/docs`.

All endpoints except `/auth/register` and `/auth/login` require:
```
Authorization: Bearer <jwt_token>
```

All responses follow the shape:
```json
{ "success": true, "data": ... }
```
or on error:
```json
{ "success": false, "message": "..." }
```

---

## Auth

### POST /auth/register
Register a new user. Self-registration is limited to `TeamMember` or `ProjectManager` roles.

**Body**
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "password123", "role": "TeamMember" }
```
**Response `201`**
```json
{ "success": true, "data": { "user": { "_id": "...", "name": "...", "role": "..." }, "token": "..." } }
```

### POST /auth/login
**Body**: `{ "email": "...", "password": "..." }`
**Response `200`**: same shape as register.

### GET /auth/me
Returns the authenticated user's profile. Requires token.

---

## Users *(Admin / Project Manager)*

### GET /users?search=&role=&page=&limit=
List users — used to populate assignee/member pickers.

### PATCH /users/:id *(Admin only)*
Update a user's `role` or `isActive` status.
```json
{ "role": "ProjectManager", "isActive": true }
```

---

## Projects

### GET /projects?search=&status=&page=&limit=
List projects. Admins see all; others see only projects they own/manage/are a member of.

### POST /projects *(Admin, Project Manager)*
```json
{ "name": "Website Revamp", "description": "...", "deadline": "2026-12-01", "projectManager": "<userId>", "members": ["<userId>"] }
```

### GET /projects/:id
Get a single project (populated with owner, PM, members).

### PUT /projects/:id *(Admin, assigned PM, owner)*
Partial update: `name`, `description`, `status`, `deadline`, `projectManager`, `members`.

### DELETE /projects/:id *(Admin, owner)*
Deletes the project and all of its tasks.

### POST /projects/:id/members *(Admin, PM of that project)*
```json
{ "userId": "<userId>" }
```

---

## Tasks

### GET /tasks?project=&status=&priority=&assignedTo=&search=&page=&limit=&sortBy=
List tasks. Team Members without a `project` filter only see tasks assigned to or created by them.

### POST /tasks *(Admin, Project Manager)*
```json
{ "title": "Build auth module", "description": "...", "project": "<projectId>", "assignedTo": "<userId>", "priority": "High", "status": "ToDo", "dueDate": "2026-10-15" }
```

### GET /tasks/:id
Get a single task with comments and attachments populated.

### PUT /tasks/:id
- Admin/PM can edit any field.
- The assigned Team Member may only change `status`.

### DELETE /tasks/:id *(Admin, Project Manager)*

### POST /tasks/:id/comments
```json
{ "text": "Started on this, ETA Friday." }
```

### POST /tasks/:id/attachments
`multipart/form-data` with a `file` field (max 10MB; images, PDF, Word, text, zip).

---

## Dashboard

### GET /dashboard
Returns, scoped to the caller's visibility (Admin/PM see org-wide, Team Members see their own):
```json
{
  "taskStatistics": { "total": 0, "toDo": 0, "inProgress": 0, "completed": 0, "pending": 0 },
  "projectProgress": [{ "projectId": "...", "name": "...", "percentComplete": 0, "totalTasks": 0, "completedTasks": 0 }],
  "upcomingDeadlines": [ { "title": "...", "dueDate": "...", "project": {...}, "assignedTo": {...} } ],
  "teamPerformance": [ { "userId": "...", "name": "...", "totalTasks": 0, "completedTasks": 0, "completionRate": 0 } ]
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400  | Validation error / bad request |
| 401  | Missing/invalid/expired token, or bad credentials |
| 403  | Authenticated but not permitted (role/ownership check failed) |
| 404  | Resource not found |
| 500  | Unhandled server error |
