# 🤝 EcoClean Project Handover Guide

This guide is for the client to set up and run the EcoClean Waste Management Platform on their local system.

## 1. Prerequisites
- **Node.js (v18 or higher)**: [Download here](https://nodejs.org/)
- **Supabase Account**: To store and manage application data.
- **Git**: To clone the repository (optional if files are provided as a ZIP).

## 2. Local Setup Instructions

### Step 1: Install Dependencies
Open your terminal in the project root directory and run:
```bash
npm install
```

### Step 2: Database Setup (Supabase)
1. Create a new project on [Supabase](https://supabase.com/).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of the `SCHEMA.sql` file (found in the project root) and paste them into the SQL Editor.
4. Run the query to create the necessary tables (`profiles`, `reports`, `feedback`).

### Step 3: Environment Configuration
1. Create a file named `.env` in the project root.
2. Open `.env.example` for reference.
3. Replace the values with your actual keys from Supabase:
   - **VITE_SUPABASE_URL**: Found in Project Settings > API.
   - **VITE_SUPABASE_ANON_KEY**: Found in Project Settings > API (anon public).
   - **API_KEY**: Your Google Gemini API Key for AI features.

### Step 4: Run the Application
Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## 3. Key Credentials
For testing purposes, a system administrator account is pre-configured:
- **Admin Email**: `admin@ecoclean.com`
- **Admin Password**: `Ecoclean@123`

## 4. Troubleshooting
- **Network Errors**: Ensure your `.env` file has the correct Supabase URL and keys.
- **Database Errors**: Verify that all commands in `SCHEMA.sql` were executed successfully in the Supabase SQL Editor.
