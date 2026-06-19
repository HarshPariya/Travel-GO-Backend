# Travel Agency App 🌍✈️

**Live Demo**: [https://travelgo-by-hp01.netlify.app/](https://travelgo-by-hp01.netlify.app/)

A full-stack, production-ready Travel Agency application built to provide a modern, responsive user experience for booking tours and managing travel itineraries.

## 🚀 Features
- **Modern UI/UX**: Built with Next.js App Router and styled with Tailwind CSS for a beautiful, responsive design across all devices.
- **Robust API**: Powered by a Node.js and Express backend, providing secure and efficient data handling.
- **Database Management**: MongoDB Atlas with Mongoose for scalable and flexible data storage.
- **Admin Dashboard & Auth**: Secure JWT-based authentication for administrative endpoints.
- **Email Notifications**: Automated booking confirmation emails using Nodemailer.
- **Monorepo Structure**: Neatly organized into `frontend` and `backend` directories for easy development and deployment.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Atlas)
- **Authentication**: JSON Web Tokens (JWT)
- **Email**: Nodemailer

---

## 🏗️ Project Structure
The repository is set up as a monorepo containing both the client application and the API server:
- `/frontend`: Next.js frontend application (Runs on port 3000)
- `/backend`: Express.js backend API (Runs on port 4000)

---

## 💻 Local Development Setup

### Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string
- SMTP credentials for emails (Ethereal test accounts can be used for development)

### 1. Installation
Clone the repository and install all dependencies:
```bash
# Install dependencies in the root (if applicable), and in both frontend and backend
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..
```

### 2. Environment Variables
You need to configure environment variables for both the frontend and backend.
- **Backend**: Copy `backend/.env.example` to `backend/.env` and fill in your MongoDB URI, JWT Secret, and SMTP credentials.
- **Frontend**: Copy `frontend/.env.local.example` to `frontend/.env.local` and set `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api`

### 3. Seed the Database (Optional)
Populate your database with sample tours to get started quickly:
```bash
npm run seed
```

### 4. Running the Application
Start both the frontend and backend development servers concurrently:
```bash
npm run dev
```
- **Frontend**: Accessible at `http://localhost:3000`
- **Backend API**: Accessible at `http://localhost:4000/api`

---

## 🚀 Deployment Guide

### Backend Deployment (Render, Railway, or Fly.io)
The backend is a pure Express API. It should be deployed as a Web Service.
1. Connect your repository to your chosen hosting provider (e.g., Render).
2. Set the Root Directory to `backend` or use a custom start command: `cd backend && npm install && npm start`.
3. Add the required environment variables from your `.env` file to the hosting provider's dashboard.
4. Once deployed, note the live API URL (e.g., `https://my-travel-api.onrender.com/api`).

### Frontend Deployment (Vercel or Netlify)
1. Connect your repository to Vercel or Netlify.
2. Set the framework preset to Next.js.
3. Configure the Root Directory to `frontend` if requested.
   - **Build Command**: `cd frontend && npm install --no-audit --no-fund && npm run build`
   - **Publish Directory**: `frontend/.next` (Netlify) or let Vercel handle it automatically.
4. **Crucial Step**: Add the environment variable `NEXT_PUBLIC_API_BASE_URL` and set it to your live backend API URL.
5. Deploy the application.

---

## 🔐 Admin Authentication
To access admin endpoints:
1. Create a user via `POST /api/auth/register` and manually set `isAdmin: true` in your MongoDB database for that user.
2. Login via `POST /api/auth/login` to receive a JWT.
3. Include the token in the headers for admin requests: `Authorization: Bearer <token>`

---

## 📜 License
This project is licensed under the [MIT License](LICENSE).
