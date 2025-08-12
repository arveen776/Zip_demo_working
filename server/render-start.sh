#!/bin/bash

# Render startup script for handling database migrations and server startup
set -e

echo "🚀 Starting Render deployment process..."

# Navigate to the server directory
cd /opt/render/project/src/server

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Initialize database and start server
echo "🔧 Initializing database..."
node startup.js

echo "🚀 Starting server..."
node index.js 