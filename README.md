# Lost & Found Web Application

A cloud-native Lost and Found web application with a **React frontend** and an **AWS serverless backend**.  
Users can report lost/found items, upload images, and get matched with potential owners through an intelligent algorithm.

---

## Features

### Frontend (React + TailwindCSS)
- Clean, responsive UI with modern design  
- Interactive maps with Leaflet.js for marking locations  
- Drag-and-drop image uploads with preview  
- Real-time match notifications  

### Backend (AWS Serverless)
- **API Gateway**: REST API endpoints  
- **Lambda Functions**: Serverless compute for all core operations  
- **DynamoDB**: NoSQL storage for items and users  
- **S3**: Image storage and retrieval  
- **Matching Algorithm**: ML-based description & image similarity scoring  

---

## Core Functionality
- **Lost Item Reporting**: Pin locations, add descriptions, and upload photos  
- **Found Item Reporting**: Choose to keep, leave, or hand over item to a vendor  
- **Smart Matching**: ML-powered matching of lost and found reports  
- **User Management**: Secure authentication & profiles  
- **Search**: Find items by category, description, or location  

---

## Architecture
- **Frontend**: React app (deployed via S3)  
- **Backend**: AWS Lambda functions behind API Gateway  
- **Database**: DynamoDB with indexes for fast lookups  
- **Storage**: S3 bucket for images  
- **Security**: Authentication and CORS-enabled APIs  

---

## Setup

### Prerequisites
- Node.js (v16+)  
- AWS CLI configured  
- Serverless Framework installed  

### Frontend
```bash
cd lostfound-frontend
npm install
# update src/api.js with your API Gateway URL
npm start
