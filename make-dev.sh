#!/bin/bash
echo "🔥 Starting development servers..."
make kill-ports
cd backend-py && nohup python run.py > ../backend.log 2>&1 & echo $! > ../backend.pid
