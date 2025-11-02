#!/bin/bash

echo "🚀 Setting up Lost & Found Backend on AWS"
echo "=========================================="

# Check if serverless is installed
if ! command -v serverless &> /dev/null; then
    echo "❌ Serverless Framework not found. Installing..."
    npm install -g serverless
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ Prerequisites checked"

# Navigate to backend directory
cd backend

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Deploy to AWS
echo "🚀 Deploying to AWS..."
serverless deploy

echo ""
echo "🎉 Backend deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the API Gateway URL from the output above"
echo "2. Update src/api.js with your actual API Gateway URL"
echo "3. Test the application by running 'npm start'"
echo ""
echo "🔗 Your API endpoints will be available at:"
echo "   https://your-api-gateway-url.execute-api.region.amazonaws.com/dev"