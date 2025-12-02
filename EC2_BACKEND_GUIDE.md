# Generator Ops Backend - EC2 Setup Guide

Your API Base URL: `http://18.222.165.218:5000`
rackRobot is running on: `:5000`
Generator Ops Backend will run on: `:5001`

---

## Step 1: SSH into Your EC2 Instance

```bash
ssh -i your-key.pem ec2-user@18.222.165.218
# or if Ubuntu:
ssh -i your-key.pem ubuntu@18.222.165.218
```

---

## Step 2: Create Project Directory

```bash
cd /home/ec2-user/projects
mkdir generator-ops-backend
cd generator-ops-backend
```

---

## Step 3: Initialize Node.js Project

```bash
npm init -y
```

---

## Step 4: Install Dependencies

```bash
npm install express cors dotenv pg multer xlsx axios bcryptjs jsonwebtoken
npm install -D typescript ts-node @types/node @types/express nodemon
```

---

## Step 5: Create Project Structure

```bash
mkdir -p src/{routes,models,middleware,utils,config}
touch src/server.ts
touch .env
touch tsconfig.json
```

---

## Step 6: Create tsconfig.json

```bash
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF
```

---

## Step 7: Create .env File

```bash
cat > .env << 'EOF'
# Server
PORT=5001
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=generator_ops
DB_USER=generator_user
DB_PASSWORD=your-secure-password-here

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CORS
FRONTEND_URL=http://18.222.165.218:3000

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
EOF
```

---

## Step 8: Set Up PostgreSQL Database

```bash
# Install PostgreSQL (if not already installed)
sudo yum install -y postgresql postgresql-devel
# or for Ubuntu:
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << 'EOF'
CREATE DATABASE generator_ops;
CREATE USER generator_user WITH PASSWORD 'your-secure-password-here';
ALTER ROLE generator_user SET client_encoding TO 'utf8';
ALTER ROLE generator_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE generator_user SET default_transaction_deferrable TO on;
ALTER ROLE generator_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE generator_ops TO generator_user;
\q
EOF

# Verify connection
psql -U generator_user -d generator_ops -h localhost
# Type \q to exit
```

---

## Step 9: Create Database Models

Create `src/models/database.ts`:

```bash
cat > src/models/database.ts << 'EOF'
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export default pool;

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255),
        brain_file_path VARCHAR(255),
        brain_uploaded BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        building_name VARCHAR(255) NOT NULL,
        generator_id VARCHAR(255) NOT NULL,
        task_title VARCHAR(255) NOT NULL,
        task_description TEXT,
        task_type VARCHAR(50),
        due_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'Current',
        assigned_to_user_id INTEGER,
        assigned_to_user_name VARCHAR(255),
        claimed_by_user_id INTEGER,
        claimed_by_user_name VARCHAR(255),
        sim_ticket_number VARCHAR(255),
        sim_ticket_link VARCHAR(255),
        recurrence_type VARCHAR(50),
        recurrence_interval INTEGER,
        recurrence_end_date DATE,
        parent_task_id INTEGER REFERENCES tasks(id),
        comments JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_building ON tasks(building_name);
      CREATE INDEX IF NOT EXISTS idx_tasks_generator ON tasks(generator_id);
    `);
    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}
EOF
```

---

## Step 10: Create Express Server

Create `src/server.ts`:

```bash
cat > src/server.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool, { initializeDatabase } from './models/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'generator-ops', timestamp: new Date() });
});

// Test database connection
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Initialize and start
async function start() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Generator Ops Backend running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
EOF
```

---

## Step 11: Update package.json Scripts

```bash
cat > package.json << 'EOF'
{
  "name": "generator-ops-backend",
  "version": "1.0.0",
  "description": "Generator Ops Backend API",
  "main": "dist/server.js",
  "scripts": {
    "dev": "ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "watch": "tsc --watch"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "pg": "^8.8.0",
    "multer": "^1.4.5-lts.1",
    "xlsx": "^0.18.5",
    "axios": "^1.3.4",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "typescript": "^4.9.5",
    "ts-node": "^10.9.1",
    "@types/node": "^18.11.18",
    "@types/express": "^4.17.17",
    "nodemon": "^2.0.20"
  }
}
EOF
```

---

## Step 12: Test Backend Locally

```bash
# Build TypeScript
npm run build

# Test with ts-node
npm run dev

# In another terminal, test the API:
curl http://localhost:5001/api/health
curl http://localhost:5001/api/db-test
```

If both return `{"status":"ok"}`, you're good!

---

## Step 13: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Start backend with PM2
pm2 start dist/server.js --name "generator-ops-backend"

# Save PM2 config to restart on reboot
pm2 startup
pm2 save

# Check status
pm2 status
```

---

## Step 14: Configure Nginx Reverse Proxy

```bash
# Create nginx config
sudo tee /etc/nginx/sites-available/generator-ops << 'EOF'
upstream generator_backend {
    server localhost:5001;
}

upstream rackrobot {
    server localhost:5000;
}

server {
    listen 80;
    server_name 18.222.165.218;

    # rackRobot API (existing)
    location /rackrobot/ {
        proxy_pass http://rackrobot/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Generator Ops API (new)
    location /api/ {
        proxy_pass http://generator_backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend (React)
    location / {
        root /home/ec2-user/projects/generator-ops/web/dist;
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/generator-ops /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

---

## Step 15: Verify Everything is Running

```bash
# Check all processes
pm2 status

# Check nginx
sudo systemctl status nginx

# Test all endpoints
curl http://18.222.165.218/api/health
curl http://18.222.165.218/rackrobot/health  # if rackRobot has this
```

---

## Step 16: View Logs

```bash
# Backend logs
pm2 logs generator-ops-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql.log
```

---

## Step 17: Update Frontend to Use Backend API

In your React app, update the API calls to use:
```
http://18.222.165.218/api/
```

Instead of localStorage, make API calls to:
- `POST /api/teams/:teamCode/upload-brain` - Upload Excel
- `GET /api/teams/:teamCode/tasks` - Get tasks
- `POST /api/tasks/:taskId/complete` - Complete task
- etc.

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 5001 is in use
sudo lsof -i :5001

# Check PM2 logs
pm2 logs generator-ops-backend

# Check database connection
psql -U generator_user -d generator_ops -h localhost
```

### Database connection failed
```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check credentials in .env
cat .env

# Test connection manually
psql -U generator_user -d generator_ops -h localhost
```

### Nginx not routing correctly
```bash
# Test nginx config
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

---

## Next Steps

1. Create API endpoints for tasks (GET, POST, PUT, DELETE)
2. Create endpoint for Excel file upload
3. Create endpoint for Excel file download
4. Implement recurring task logic
5. Add WebSocket for real-time updates
6. Update React frontend to use backend API

Your backend is now ready for API development!
