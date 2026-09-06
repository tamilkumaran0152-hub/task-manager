# Task Manager 2.0
Made with the help og chatgpt

A full-stack task management web application with user authentication, task management, priorities, search/filtering, dark mode, and user-specific data protection.

## 🚀 Live Demo

**Frontend:**  
https://task-manager-frontend-e62j.onrender.com

**Backend:**  
https://task-manager-backend-w4hm.onrender.com

---

## 📌 About the Project

Task Manager 2.0 is a full-stack web application designed to help users manage their tasks efficiently.

Users can create an account, log in securely, and manage their own tasks. Each task is associated with the authenticated user's ID, ensuring that users can only access and modify their own data.

The project was built to understand how a modern full-stack application works from frontend to backend, database, authentication, security, and deployment.

---

## ✨ Features

- 🔐 User Signup and Login
- 🚪 Logout functionality
- 👤 User-specific tasks
- ➕ Create tasks
- ✏️ Edit tasks
- 🗑️ Delete tasks
- ✅ Mark tasks as completed/incomplete
- ⭐ Task priority levels
  - Low
  - Medium
  - High
- 🔎 Search tasks
- 🔽 Filter tasks
- 🌙 Dark mode
- 💾 Persistent task storage
- 🔒 Protected backend API
- 🛡️ User authorization and task ownership
- 📱 Responsive user interface
- ⚠️ Error handling
- ☁️ Production deployment

---

## 🏗️ Architecture

```text
                    Task Manager 2.0

                         Browser
                            │
                            ▼
                  React + Tailwind CSS
                            │
                     HTTP + JWT
                            │
                            ▼
                    Express Backend
                            │
                     Verify JWT
                            │
                            ▼
                    Supabase Auth
                            │
                     User Identity
                            │
                            ▼
                      PostgreSQL
                            │
                         user_id
                            │
                            ▼
                    User's Own Tasks
```

---

## 🛠️ Technology Stack

### Frontend

- React
- JavaScript
- Vite
- Tailwind CSS
- HTML
- CSS

### Backend

- Node.js
- Express.js
- REST API
- CORS
- dotenv

### Authentication

- Supabase Auth
- JWT / Access Tokens

### Database

- PostgreSQL
- SQL
- `pg` (node-postgres)

### Development & Deployment

- VS Code
- npm
- Git
- GitHub
- Render

---

## 🔐 Authentication & Security

Authentication is handled using Supabase Auth.

After a successful login, the authenticated user receives an access token.

The frontend sends this token with protected API requests:

```text
Authorization: Bearer <access-token>
```

The Express backend verifies the token before allowing access to protected routes.

The authenticated user's ID is obtained from the verified token:

```javascript
req.user.id
```

The backend does not trust a user ID supplied by the frontend.

Instead, database operations use the authenticated user's ID to enforce ownership.

For example:

```sql
SELECT *
FROM tasks
WHERE user_id = $1;
```

Update and delete operations also verify both the task ID and authenticated user ID:

```sql
WHERE id = $1
AND user_id = $2;
```

This prevents one authenticated user from accessing or modifying another user's tasks.

---

## 🔄 Application Flow

### Login

```text
User
 ↓
React
 ↓
Supabase Auth
 ↓
Authentication
 ↓
Session + Access Token
 ↓
React
```

### Fetching Tasks

```text
React
 ↓
GET /tasks
 ↓
JWT
 ↓
Express
 ↓
Authenticate User
 ↓
Get req.user.id
 ↓
PostgreSQL
 ↓
Return user's tasks
 ↓
React
```

### Creating a Task

```text
User
 ↓
React
 ↓
POST /tasks
 ↓
JWT
 ↓
Express
 ↓
Verify User
 ↓
Get User ID
 ↓
INSERT task + user_id
 ↓
PostgreSQL
 ↓
JSON Response
 ↓
React
```

---

## 📂 Project Structure

```text
task-manager/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   └── supabaseClient.js
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .gitignore
│
└── README.md
```

---

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd task-manager
```

### 2. Setup the Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL=your_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret_key
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
node server.js
```

The backend will run on:

```text
http://localhost:5000
```

---

### 3. Setup the Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

---

## 🗄️ Database

The application uses PostgreSQL to store task data.

The main `tasks` table contains fields such as:

```text
id
title
completed
priority
user_id
```

The `user_id` field associates each task with its authenticated owner.

This allows the backend to retrieve and modify only the tasks belonging to the current user.

---

## 🌐 Deployment

The application is deployed using Render.

### Frontend

```text
React + Vite
      ↓
Render
      ↓
Live Frontend
```

### Backend

```text
Node.js + Express
      ↓
Render
      ↓
Live API
```

The frontend communicates with the production backend through an environment variable:

```env
VITE_API_URL=<production-backend-url>
```

---

## 🔒 Environment Variables

Sensitive credentials are not stored directly in the source code.

Environment files are excluded from Git using `.gitignore`.

### Frontend

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_API_URL
```

### Backend

```text
DATABASE_URL
SUPABASE_URL
SUPABASE_SECRET_KEY
FRONTEND_URL
```

**Never commit secret keys, database credentials, or `.env` files to GitHub.**

---

## 📚 What I Learned

This project helped me understand how a modern full-stack application works as a complete system.

Key concepts learned:

- React component-based development
- React state management
- REST APIs
- HTTP requests
- Express middleware
- Authentication vs Authorization
- JWT-based authentication
- Supabase Auth
- PostgreSQL
- SQL CRUD operations
- User data isolation
- API security
- CORS
- Environment variables
- Git and GitHub
- Frontend/backend deployment
- Production configuration
- Local vs production environments

---

## 🔮 Future Improvements

Possible future improvements include:

- Task due dates
- Categories and tags
- Task sorting
- Drag-and-drop task organization
- Notifications and reminders
- Real-time task updates
- Task sharing and collaboration
- Better backend validation
- Rate limiting
- API documentation
- AI-powered task planning

---

## 🎯 Project Goal

The main goal of this project was not only to build a task manager, but to understand the complete lifecycle of a modern web application:

```text
Idea
 ↓
Frontend
 ↓
API
 ↓
Authentication
 ↓
Authorization
 ↓
Database
 ↓
Security
 ↓
Git/GitHub
 ↓
Deployment
 ↓
Production Application
```

---

## 📄 License

This project was created for learning and educational purposes.