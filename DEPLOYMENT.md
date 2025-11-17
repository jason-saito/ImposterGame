# Deployment Guide for Render

This guide will help you deploy your Imposter game to Render so you can play online.

## Prerequisites

1. A GitHub account
2. A Render account (sign up at https://render.com)
3. Your code pushed to a GitHub repository

## Step 1: Push Your Code to GitHub

1. Initialize git (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub

3. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy Backend to Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the backend service:
   - **Name**: `imposter-backend` (or any name you prefer)
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free (or choose a paid plan)

5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render automatically sets this, but good to be explicit)
   - `CORS_ORIGIN` = (Leave empty for now, we'll set this after frontend is deployed)

6. Click "Create Web Service"
7. Wait for deployment to complete
8. **Copy the backend URL** (e.g., `https://imposter-backend.onrender.com`)

## Step 3: Deploy Frontend to Render

1. In Render dashboard, click "New +" → "Static Site"
2. Connect the same GitHub repository
3. Configure the frontend service:
   - **Name**: `imposter-frontend` (or any name you prefer)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

4. Add Environment Variables:
   - `VITE_API_URL` = Your backend URL (e.g., `https://imposter-backend.onrender.com`)
   - `VITE_SOCKET_URL` = Your backend URL (same as above)

5. Click "Create Static Site"
6. Wait for deployment to complete
7. **Copy the frontend URL** (e.g., `https://imposter-frontend.onrender.com`)

## Step 4: Update Backend CORS

1. Go back to your backend service in Render
2. Go to "Environment" tab
3. Update `CORS_ORIGIN` to your frontend URL (e.g., `https://imposter-frontend.onrender.com`)
4. Click "Save Changes"
5. Render will automatically redeploy

## Step 5: Test Your Deployment

1. Open your frontend URL in a browser
2. Try creating a game and joining with another browser/device
3. Make sure WebSocket connections work (check browser console for errors)

## Troubleshooting

### WebSocket Connection Issues

If you see WebSocket connection errors:
- Make sure `CORS_ORIGIN` in backend matches your frontend URL exactly
- Make sure `VITE_SOCKET_URL` in frontend matches your backend URL exactly
- Check that both services are running (not sleeping)

### Render Free Tier Limitations

- Services on the free tier will "spin down" after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds to wake up
- Consider upgrading to a paid plan for better performance

### Environment Variables Not Working

- Make sure environment variables are set in Render dashboard
- For frontend, variables must start with `VITE_` to be accessible in the app
- After changing environment variables, the service will automatically redeploy

## Alternative: Using render.yaml

You can also use the `render.yaml` file included in this repo:

1. In Render dashboard, click "New +" → "Blueprint"
2. Connect your GitHub repository
3. Render will automatically detect `render.yaml` and create both services
4. You'll still need to set the environment variables manually in the dashboard

## Notes

- The backend uses in-memory storage, so game data is lost when the server restarts
- For production, consider adding a database (Redis, MongoDB, etc.)
- Make sure to keep your `.env.example` files but never commit actual `.env` files with secrets

