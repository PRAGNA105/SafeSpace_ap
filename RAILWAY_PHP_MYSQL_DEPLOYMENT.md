# Railway Docker Deployment

This setup deploys the PHP API and a MySQL database as two Docker-backed Railway services from the same repository.

## Services

### 1. MySQL service

- Create a new Railway service from this repo.
- Set the root directory to `backend-mysql`.
- Railway will detect [backend-mysql/Dockerfile](C:/Users/DELL/Downloads/dep_final_deploy/dep_1/backend-mysql/Dockerfile).
- Add a volume mounted at `/var/lib/mysql`.

Set these variables on the MySQL service:

```env
MYSQL_DATABASE=safespace
MYSQL_ROOT_PASSWORD=choose_a_strong_root_password
MYSQL_USER=safespace_user
MYSQL_PASSWORD=choose_a_strong_app_password
```

The seed schema in [backend-mysql/init.sql](C:/Users/DELL/Downloads/dep_final_deploy/dep_1/backend-mysql/init.sql) loads automatically the first time the volume is empty.

### 2. PHP API service

- Create another Railway service from this repo.
- Set the root directory to `backend`.
- Railway will detect [backend/Dockerfile](C:/Users/DELL/Downloads/dep_final_deploy/dep_1/backend/Dockerfile).
- Set the health check path to `/api/health.php`.

Add these variables to the PHP service:

```env
SAFESPACE_FRONTEND_ORIGIN=https://dep1-ten.vercel.app
SAFESPACE_FRONTEND_ORIGINS=https://dep1-ten.vercel.app
SAFESPACE_DB_HOST=${{mysql.MYSQLHOST}}
SAFESPACE_DB_PORT=${{mysql.MYSQLPORT}}
SAFESPACE_DB_NAME=${{mysql.MYSQLDATABASE}}
SAFESPACE_DB_USER=${{mysql.MYSQLUSER}}
SAFESPACE_DB_PASS=${{mysql.MYSQLPASSWORD}}
SAFESPACE_DB_CA=
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
```

If your MySQL service has a different Railway service name, replace `mysql` in the reference variables with that exact service name.

## Verify

After both services deploy:

1. Open the PHP service public URL.
2. Test:

```text
https://your-railway-api-domain/api/health.php
```

Expected response:

```json
{"success":true,"status":"ok","database":"connected"}
```

## Connect Vercel

After the PHP API is live, set this in Vercel and redeploy the frontend:

```env
VITE_API_URL=https://your-railway-api-domain/api
```
