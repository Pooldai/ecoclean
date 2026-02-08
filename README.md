# 🌿 EcoClean Waste Management Platform

Welcome to the EcoClean local setup guide. Follow these simple steps to get the application running on your computer.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
1. **Node.js**: [Download and install Node.js (LTS version)](https://nodejs.org/)
2. **A Web Browser**: Google Chrome, Firefox, or Microsoft Edge.

---

## 🚀 Quick Start Instructions

### Step 1: Extract the Project
Unzip the project folder to a location on your computer (e.g., your Desktop).

### Step 2: Open Terminal/Command Prompt
1. Open your computer's terminal (Command Prompt on Windows, Terminal on Mac).
2. Type `cd` followed by a space, then drag the project folder into the terminal window.
3. Press **Enter**.

### Step 3: Install Dependencies
Copy and paste the following command and press **Enter**:
```bash
npm install
```
*Wait for the process to finish. It will download all necessary libraries.*

### Step 4: Configure the AI (Optional but Recommended)
To enable the AI Image Analysis features:
1. Create a new file in the folder named `.env`
2. Open it with Notepad or any text editor.
3. Paste the following line:
   `API_KEY=YOUR_GEMINI_API_KEY_HERE`
   *(Replace the text after the `=` with your actual key from [Google AI Studio](https://aistudio.google.com/app/apikey))*

### Step 5: Start the Application
Run this final command:
```bash
npm run dev
```

---

## 🌐 Accessing the App
Once the command finishes, your browser should open automatically to:
**http://localhost:3000**

### Default Login for Testing:
- **Email**: `admin@ecoclean.com`
- **Password**: `admin` (or any text, as it is a demo account)

## 🛠️ Troubleshooting
- **Command not found**: Ensure Node.js is installed correctly.
- **Port 3000 in use**: The app will automatically try another port (like 3001). Check the terminal output for the correct link.
- **AI Analysis failing**: Ensure your API key in the `.env` file is valid and has no spaces around it.

---
*Developed for EcoClean Waste Management Solutions.*