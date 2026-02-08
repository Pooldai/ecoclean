# 🌿 EcoClean Waste Management Platform

Welcome to the EcoClean local setup guide. Follow these simple steps to get the application running on your computer.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
1. **Node.js**: [Download and install Node.js (LTS version)](https://nodejs.org/)
2. **A Web Browser**: Google Chrome, Firefox, or Microsoft Edge.

---

## 🚀 Quick Start Instructions

### Step 1: Open Terminal
Open your terminal (Command Prompt or PowerShell on Windows).

### Step 2: Navigate to the Project
You must be in the folder that contains the `package.json` file. 
Run this command:
```bash
cd ecoclean-main
```
*Note: If you are already inside the folder, you can skip this step.*

### Step 3: Install Dependencies
Run:
```bash
npm install
```

### Step 4: Configure the AI
1. Create a file named `.env` in the project folder.
2. Add your API key: `API_KEY=your_key_here`

### Step 5: Start the Application
Run:
```bash
npm run dev
```

---

## 🛠️ Troubleshooting "ENOENT" Error
If you see an error saying `ENOENT: no such file or directory, open 'package.json'`, it means your terminal is in the wrong folder. 

**The Solution:**
Type `ls` (on Mac/Linux) or `dir` (on Windows). If you see a folder named `ecoclean-main` in the list, type `cd ecoclean-main` and then try `npm install` again.

---
*Developed for EcoClean Waste Management Solutions.*