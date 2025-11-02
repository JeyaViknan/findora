# Lost & Found - Local Development Setup

This application has been converted to run locally instead of on AWS for development purposes.

## Quick Start

### Option 1: Using the startup script (Recommended)
```bash
./start-local.sh
```

### Option 2: Manual setup

1. **Start the backend server:**
   ```bash
   cd backend
   npm install
   npm start
   ```
   The backend will run on http://localhost:3001

2. **Start the frontend (in a new terminal):**
   ```bash
   npm install
   npm start
   ```
   The frontend will run on http://localhost:3000

## What's Changed

- **Backend**: Converted from AWS Lambda functions to Express.js server
- **Database**: Replaced DynamoDB with in-memory storage (data resets on server restart)
- **File Storage**: Replaced S3 with local file system storage in `backend/uploads/`
- **API**: Updated frontend to point to local server instead of AWS API Gateway

## API Endpoints

- **Health Check**: GET http://localhost:3001/health
- **Authentication**: 
  - POST http://localhost:3001/auth/signup
  - POST http://localhost:3001/auth/login
- **Items**:
  - POST http://localhost:3001/items/lost
  - POST http://localhost:3001/items/found
  - GET http://localhost:3001/items/lost/:userEmail
  - GET http://localhost:3001/items/found/:userEmail
- **Search**: GET http://localhost:3001/search?q=query
- **Matches**: 
  - GET http://localhost:3001/matches/:userEmail
  - POST http://localhost:3001/matches/:matchId/verify
- **Upload**: POST http://localhost:3001/upload

## Notes

- All data is stored in memory and will be lost when the server restarts
- Images are stored in `backend/uploads/` directory
- CORS is enabled for local development
- The application is ready for immediate testing and development

## Troubleshooting

- Make sure ports 3000 and 3001 are available
- If you get permission errors, run `chmod +x start-local.sh`
- Check the console output for any error messages
