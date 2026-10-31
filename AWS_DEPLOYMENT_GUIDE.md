# AegisLedger: Supabase & AWS Production Deployment Guide

This guide provides end-to-end instructions for deploying the **AegisLedger** system using **Supabase** (Managed PostgreSQL) as the persistent database and **AWS** for cloud hosting, matching the requirements of the Full Stack Group Interview Assessment.

> **Automated Deployments:** If you want zero-touch automated deployments on every `git push` via GitHub Actions, see the companion guide: [**`CI_CD_GITHUB_ACTIONS.md`**](./CI_CD_GITHUB_ACTIONS.md).

---

## 1. High-Level Production Architecture

```
                    ┌────────────────────────┐
                    │    End Users / Web     │
                    └───────────┬────────────┘
                                │ HTTPS
                                ▼
       ┌─────────────────────────────────────────────────┐
       │             Frontend Hosting (SPA)              │
       │    AWS Amplify  /  S3 + CloudFront  /  Netlify   │
       │    (React 18 + Vite Production Build)           │
       └────────────────────────┬────────────────────────┘
                                │ API Requests (/api/v1/...)
                                ▼
       ┌─────────────────────────────────────────────────┐
       │             Backend Application Tier            │
       │     AWS App Runner  /  ECS Fargate  /  EC2      │
       │     (FastAPI Python 3.12 Container on :8000)    │
       └────────────────────────┬────────────────────────┘
                                │ TLS (SSL Mode Required)
                                │ Port 6543 (PgBouncer Pooler)
                                ▼
       ┌─────────────────────────────────────────────────┐
       │                 Database Tier                   │
       │              Supabase PostgreSQL               │
       │  (ACID Ledger Tables, Constraints & B-Tree Idx) │
       └─────────────────────────────────────────────────┘
```

---

## 2. Step 1: Set Up Supabase Database

### 2.1 Create Supabase Project
1. Log in to [supabase.com](https://supabase.com).
2. Click **New Project**.
3. Choose a project name (e.g., `aegis-ledger`), generate/save a secure database password, and select your preferred AWS region (e.g., `us-east-1` or `ap-south-1`).
4. Wait 1–2 minutes for the database cluster to provision.

### 2.2 Retrieve Connection String
1. Go to **Project Settings** (gear icon) -> **Database**.
2. Scroll to **Connection string**.
3. Select the **URI** tab.
4. Supabase provides two connection modes:
   - **Connection Pooler (Recommended for AWS Serverless / App Runner)**:
     ```
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
     ```
   - **Direct Connection (Port 5432)**:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require
     ```
   > **Note**: AegisLedger automatically normalizes `postgres://` into `postgresql+psycopg2://` at runtime.

### 2.3 Initialize Schema & Tables
You can initialize the schema using either of the following methods:

#### Method A: Automated Migration via CLI (Fastest)
From your local terminal, point `DATABASE_URL` to your Supabase instance and run the initialization script:
```bash
# Set your Supabase connection string temporarily
export DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"

# On Windows PowerShell:
$env:DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"

# Run database synchronization
python backend/init_db.py
```
Output:
```
============================================================
 AegisLedger Database Initialization Tool
============================================================
[*] Probing database target: postgresql+psycopg2://postgres.xyz:****@...
[+] SUCCESS: Database connection established and verified.
[*] Synchronizing SQLAlchemy schema metadata...
[+] SUCCESS: All database tables synchronized successfully.
[+] Detected tables in database: ['accounts', 'transactions', 'transfers']
============================================================
```

#### Method B: Manual Supabase SQL Editor
1. In the Supabase Dashboard, click **SQL Editor** from the left navigation.
2. Click **New Query**.
3. Copy and paste the contents of [`supabase_schema.sql`](file:///c:/Users/HP/TransactionLedger/supabase_schema.sql).
4. Click **Run**.
5. Check **Table Editor** to confirm `accounts`, `transactions`, and `transfers` are created.

---

## 3. Step 2: Deploy Backend to AWS

### Option A: AWS App Runner (Recommended — Fastest & Zero Server Ops)
AWS App Runner provides managed container execution, automated TLS certificate provisioning, auto-scaling, and health checking.

#### 1. Push Container Image to Amazon ECR
```bash
# 1. Authenticate Docker with Amazon ECR
aws ecr get-login-password --region <YOUR_AWS_REGION> | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.<YOUR_AWS_REGION>.amazonaws.com

# 2. Create an ECR repository
aws ecr create-repository --repository-name aegis-ledger-backend --region <YOUR_AWS_REGION>

# 3. Build and tag the Docker image
docker build -t aegis-ledger-backend:latest .
docker tag aegis-ledger-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.<YOUR_AWS_REGION>.amazonaws.com/aegis-ledger-backend:latest

# 4. Push the image to ECR
docker push <AWS_ACCOUNT_ID>.dkr.ecr.<YOUR_AWS_REGION>.amazonaws.com/aegis-ledger-backend:latest
```

#### 2. Create App Runner Service
1. In the AWS Management Console, open **AWS App Runner**.
2. Click **Create service**.
3. **Source**: Select **Container registry** -> **Amazon ECR**.
4. Browse and select `aegis-ledger-backend:latest`.
5. Under **Deployment settings**, choose **Automatic** or **Manual**.
6. **Configure service**:
   - Service name: `aegis-ledger-api`
   - CPU: `1 vCPU`, Memory: `8 GB`
   - Port: `8000`
   - Environment variables:
     - `DATABASE_URL`: `postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require`
     - `APP_NAME`: `AegisLedger`
     - `DEBUG`: `False`
   - Health check:
     - Protocol: `HTTP`
     - Path: `/health`
     - Interval: `10` seconds, Timeout: `5` seconds
7. Click **Create & deploy**.
8. After 2–3 minutes, AWS App Runner will provide your live HTTPS default domain:
   `https://<hash>.<region>.awsapprunner.com`

---

### Option B: AWS EC2 / Lightsail (Docker Compose)
If you prefer running a dedicated virtual machine on the AWS Free Tier (e.g., `t2.micro` or Lightsail $3.50/mo):

1. **Launch an EC2 Instance**:
   - Ubuntu 22.04 LTS (`t2.micro` free-tier eligible).
   - In Security Group: Allow Inbound Ports `80` (HTTP), `443` (HTTPS), `22` (SSH), and optionally `8000`.
2. **SSH into the instance**:
   ```bash
   ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
   ```
3. **Install Docker & Docker Compose**:
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose-plugin git
   sudo usermod -aG docker ubuntu
   ```
4. **Clone and Configure**:
   ```bash
   git clone https://github.com/<YOUR_GITHUB_USER>/TransactionLedger.git
   cd TransactionLedger
   
   # Create production .env file
   cat << 'EOF' > .env
   APP_NAME=AegisLedger
   APP_VERSION=1.0.0
   DEBUG=False
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
   EOF
   ```
5. **Start Application**:
   ```bash
   docker compose up -d --build
   ```
6. Verify containers:
   ```bash
   docker compose ps
   curl http://localhost:8000/health
   ```

---

### Option C: Render (Quick-Deploy Fallback from Interview Guide)
If your AWS account is pending credit/card approval, the setup guide allows Render:
1. Log in to [render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Set:
   - Environment: `Python 3`
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variable:
   - `DATABASE_URL`: Your Supabase connection string.
6. Click **Deploy Web Service**.

---

## 4. Step 3: Deploy Frontend to AWS

### Option A: AWS Amplify Hosting (Recommended)
1. Open **AWS Amplify** in the AWS Console.
2. Click **Host web app** -> **GitHub**.
3. Select your repository and `main` branch.
4. Configure build settings:
   - App root: `frontend`
   - Build commands:
     ```yaml
     version: 1
     frontend:
       phases:
         preBuild:
           commands:
             - cd frontend
             - npm ci
         build:
           commands:
             - npm run build
       artifacts:
         baseDirectory: frontend/dist
         files:
           - '**/*'
       cache:
         paths:
           - frontend/node_modules/**/*
     ```
5. Add Environment Variable in Amplify Console:
   - `VITE_API_URL`: Your deployed backend API URL (e.g., `https://<hash>.<region>.awsapprunner.com`).
6. Click **Save and deploy**.

### Option B: Netlify (Alternative from Interview Guide)
1. Log in to [netlify.com](https://netlify.com).
2. Click **Add new site** -> **Import an existing project**.
3. Connect GitHub repository.
4. Base directory: `frontend`
5. Build command: `npm run build`
6. Publish directory: `frontend/dist`
7. Environment variable:
   - `VITE_API_URL`: `<BACKEND_API_URL>`
8. Click **Deploy Site**.

---

## 5. Step 4: Verification & Smoke Testing

Once both backend and frontend are live:

### 1. Backend Health Check
```bash
curl -i https://<YOUR_BACKEND_URL>/health
```
Expected Response:
```json
HTTP/2 200
{"status":"healthy","app":"AegisLedger","version":"1.0.0"}
```

### 2. Verify Database Persistence (Supabase)
Create a test account:
```bash
curl -X POST https://<YOUR_BACKEND_URL>/api/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{"name": "Production Verification Account"}'
```
Inspect the account in your **Supabase Dashboard** under `Table Editor` -> `accounts` to verify real-time persistence.

### 3. Frontend End-to-End
1. Open your deployed frontend URL.
2. Click **Launch Console**.
3. Create an account, execute a Credit and Debit transaction, and trigger a **Reconciliation Audit**.
4. Confirm 100% mathematical integrity badge.

---

## 6. Security & Production Checklist

| Category | Item | Implementation |
| :--- | :--- | :--- |
| **Data Integrity** | Strict `Decimal` / `NUMERIC(18, 4)` | Enforced in models and database schema; zero float rounding. |
| **Concurrency** | Row-level locking & deterministic sort | Avoids cross-account transfer deadlocks via `min(id_A, id_B)` lock order. |
| **Idempotency** | Composite unique constraints | `(account_id, reference_id)` rejects duplicate transactions. |
| **Security** | SSL Mode Required | `sslmode=require` encrypts all database traffic in transit to Supabase. |
| **Connection Pooling** | PgBouncer port 6543 | Handles serverless connection scaling without exhausting Postgres connections. |
| **Disaster Recovery** | Supabase automated backups | Daily point-in-time recovery and snapshot support. |

