# HPC SSH Key Portal

A secure web portal to manage SSH keys for HPC hosts: import/generate keys, enforce policy, apply keys to managed hosts, and audit actions.

## Stack
- Backend: FastAPI, SQLAlchemy, JWT, LDAP (optional), Paramiko (SSH apply)
- Frontend: React (CRA), TypeScript, Tailwind styles
- DB: SQLite (dev) or PostgreSQL (prod)

---
## 1) Quick Start (Development / Demo)
### Backend
Create a local env file and run the API.
```bash
cd backend-py
cat > .env <<'EOF'
ENV=development
ALLOW_TEST_LOGIN=true
JWT_SECRET=dev-secret
SYSGEN_ENCRYPTION_KEY=dev-sysgen
APPLY_SSH_USER=root
APPLY_SSH_KEY_PATH=~/.ssh/id_rsa
APPLY_STRICT_HOST_KEY_CHECK=false
EOF

python3 -m pip install --break-system-packages -r requirements.txt
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 3000
```

### Frontend
```bash
cd frontend
cat > .env <<'EOF'
REACT_APP_ALLOW_TEST_LOGIN=true
EOF
npm install --legacy-peer-deps
npm start
```
Open http://localhost:3001

### Demo credentials
- User: demo / demo
- Admin: admin / admin
- Auditor: auditor / auditor

### What you can do
- Users: Import or Generate key (system-side generation gives a one-time private key download link)
- Admins: Click “Admin” → Add managed hosts → Apply to all hosts (writes authorized_keys via SSH)

---
## 2) Production Setup (Handoff)
Use PostgreSQL, LDAP login, and real SSH automation.

### Backend .env (example)
```bash
ENV=production
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST:5432/DBNAME
JWT_SECRET=change-me-strong
ALLOW_TEST_LOGIN=false
LDAP_URL=ldap://your-ldap:389
LDAP_BASE_DN=dc=example,dc=com
LDAP_USER_FILTER=(cn={username})
SYSGEN_ENCRYPTION_KEY=change-me-strong
FRONTEND_URL=https://your-frontend
APPLY_SSH_USER=automation
APPLY_SSH_KEY_PATH=/etc/portal/ssh_automation_key
APPLY_STRICT_HOST_KEY_CHECK=true
```
Install Postgres driver and run:
```bash
cd backend-py
python3 -m pip install --break-system-packages psycopg2-binary
python3 -m pip install --break-system-packages -r requirements.txt
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 3000
```

### Frontend build
```bash
cd frontend
npm run build
```
Serve `frontend/build` with your reverse proxy; proxy `/api` to the backend (port 3000).

---
## 3) Admin Apply (SSH)
- The portal renders authorized_keys from all active keys and writes atomically to each host.
- Configure `APPLY_SSH_USER` and `APPLY_SSH_KEY_PATH` to an account/key permitted to manage files for target users.
- In UI: Admin → Trigger Apply (enter the target Linux username).

---
## 4) Tips & Troubleshooting
- Stuck on login loop: clear browser storage
```js
localStorage.clear(); sessionStorage.clear(); location.reload();
```
- One-time private key link: can be used only once and expires (default 10 min). Generate again if expired or already used.
- SSH apply errors: verify SSH reachability/port 22, key permissions, and that the target user exists. Check backend logs.
- Dev DB: SQLite file `hpc_ssh_portal.db` in repo root. Prod DB: set `DATABASE_URL` to Postgres.

---
## 5) API Health
Backend health: `GET http://localhost:3000/health` → `{ success: true }`

That’s it. For any deployment detail you want automated (systemd, Nginx config), ask to generate the files.
