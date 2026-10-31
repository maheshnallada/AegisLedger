# AegisLedger: Automated CI/CD Pipeline with GitHub Actions

This document details the automated Continuous Integration and Continuous Deployment (CI/CD) architecture for **AegisLedger**, orchestrating automated test verification, database migrations on **Supabase**, and containerized zero-downtime deployment on **AWS**.

---

## 1. CI/CD Architecture Overview

```
                                  Git Push / Pull Request
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │            GitHub Actions Runner             │
                      └──────────────────────┬───────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
                       ▼                                           ▼
             [ Backend Tests ]                           [ Frontend Build ]
          - Python 3.12                               - Node.js 20
          - 36 Pytest tests (Concurrency,             - Vite Production Build
            Deadlock, Financial Precision)            - Asset Optimization
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                                 [ Docker Smoke Test ]
                              - Backend Container Build
                              - Frontend Container Build
                                             │
                    ═════════════════════════╪═════════════════════════
                                 MERGE TO MAIN BRANCH
                    ═════════════════════════╪═════════════════════════
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
                       ▼                                           ▼
            [ Supabase Auto-Migrate ]                   [ AWS Backend Deploy ]
          - Connects via Pooler (6543)                - Authenticate AWS ECR
          - Executes backend/init_db.py               - Build & Tag Docker Image
          - Ensures schema consistency                - Push to Amazon ECR
                                                      - Trigger AWS App Runner
                                                                   │
                                                                   ▼
                                                        [ AWS Frontend Deploy ]
                                                      - Sync dist to S3 Bucket
                                                      - Invalidate CloudFront Cache
```

---

## 2. Workflows Included

The repository contains two production-grade GitHub Actions workflow files in [`.github/workflows/`](file:///c:/Users/HP/TransactionLedger/.github/workflows/):

| Workflow | File | Triggers | Description |
| :--- | :--- | :--- | :--- |
| **CI (Continuous Integration)** | [`.github/workflows/ci.yml`](file:///c:/Users/HP/TransactionLedger/.github/workflows/ci.yml) | Every `pull_request` and `push` to any branch | Runs 36 unit/concurrency tests on Python 3.12, verifies Vite production bundle, and smoke-tests Docker images. |
| **CD (Continuous Deployment)** | [`.github/workflows/deploy-aws.yml`](file:///c:/Users/HP/TransactionLedger/.github/workflows/deploy-aws.yml) | `push` to `main` branch or manual `workflow_dispatch` | Auto-migrates Supabase DB, builds & pushes container to Amazon ECR, triggers App Runner deployment, and deploys frontend to S3/CloudFront. |

---

## 3. Required GitHub Repository Secrets

To configure automated deployment, go to your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

### Essential Credentials
| Secret Name | Required For | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | Supabase Migration | `postgresql://postgres.xxx:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require` | Supabase connection string. |
| `AWS_ACCESS_KEY_ID` | AWS Deployment | `AKIAIOSFODNN7EXAMPLE` | IAM User access key with ECR/AppRunner/S3 permissions. |
| `AWS_SECRET_ACCESS_KEY` | AWS Deployment | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | IAM User secret key. |
| `AWS_REGION` | AWS Deployment | `us-east-1` | AWS deployment region (defaults to `us-east-1` if omitted). |

### Backend App Runner Secrets
| Secret Name | Required For | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `ECR_REPOSITORY` | Backend Image | `aegis-ledger-backend` | Amazon ECR repository name. |
| `AWS_APP_RUNNER_ARN` | Backend Auto-Deploy | `arn:aws:apprunner:us-east-1:123456789012:service/aegis-ledger-api/...` | App Runner Service ARN to trigger deployment. |

### Frontend S3 & CloudFront Secrets
| Secret Name | Required For | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Frontend API Target | `https://xyz.us-east-1.awsapprunner.com` | Deployed backend URL baked into frontend at build time. |
| `AWS_S3_BUCKET` | Frontend Hosting | `aegis-ledger-frontend-prod` | S3 bucket name configured for static website hosting. |
| `CLOUDFRONT_DISTRIBUTION_ID` | CDN Cache Busting | `E1A2B3C4D5E6F7` | CloudFront Distribution ID to invalidate cache on release. |

> **Graceful Degradation Note:** If frontend secrets (`AWS_S3_BUCKET`) or App Runner ARN are not set, the workflow safely skips those specific jobs without failing the rest of the pipeline.

---

## 4. Minimum IAM Policy for GitHub Actions (Least Privilege)

Create an IAM User in AWS (e.g. `github-actions-aegis-ledger`) and attach the following custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRAuth",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECRPushOperations",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "arn:aws:ecr:*:*:repository/aegis-ledger-backend"
    },
    {
      "Sid": "AppRunnerDeploy",
      "Effect": "Allow",
      "Action": [
        "apprunner:StartDeployment",
        "apprunner:DescribeService"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3FrontendDeploy",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::aegis-ledger-frontend-*",
        "arn:aws:s3:::aegis-ledger-frontend-*/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 5. How It Operates in Daily Workflow

1. **Working on a Feature / Bug Fix:**
   - Commit code to a feature branch or open a Pull Request to `main`.
   - GitHub Actions automatically runs `ci.yml`:
     - Executes 36 tests (unit, concurrency, double-spending prevention).
     - Compiles the React frontend.
     - Tests container builds.
   - Status checks appear directly on the Pull Request.

2. **Merging to Production:**
   - When PR is approved and merged into `main`, `deploy-aws.yml` triggers:
     - Automatically connects to Supabase and applies any pending schema migrations via `backend/init_db.py`.
     - Builds Docker container, tags it with the Git commit SHA, and pushes to Amazon ECR.
     - Triggers AWS App Runner to roll out the new image without downtime.
     - Compiles the frontend with the live API URL, syncs to S3, and purges the CloudFront CDN edge cache.

3. **Manual Trigger (`workflow_dispatch`):**
   - You can also run deployments manually from the **Actions** tab in GitHub at any time, with an option to skip the database migration step if desired.
