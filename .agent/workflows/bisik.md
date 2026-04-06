---
description: Start the full GoGon stack (Mongo, Server, Client)
---

This workflow starts the MongoDB database, the Backend Server, and the Frontend Client.

1. Start MongoDB (Local)
// turbo
mkdir -p mongodb_data && mongod --dbpath ./mongodb_data --bind_ip 127.0.0.1 --port 27017 &

2. Start Backend Server
// turbo
cd server && npm start &

3. Start Frontend Client
// turbo
cd client && npm run dev &
