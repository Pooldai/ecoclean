#!/bin/bash
echo "Installing dependencies..."
npm install
echo "Starting EcoClean..."
# Open browser (macOS/Linux)
(sleep 2 && (open http://localhost:5173 || xdg-open http://localhost:5173)) &
npm run dev
