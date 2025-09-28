#!/bin/bash
echo "Starting development servers..."
cd backend-py && nohup ./venv/bin/python run.py > ../backend.log 2>&1 & echo $! > ../backend.pid
cd frontend && nohup npm start > ../frontend.log 2>&1 & echo $! > ../frontend.pid
echo "Development servers started!"
echo "Backend:  http://localhost:3000"
echo "Frontend: http://localhost:3001"
