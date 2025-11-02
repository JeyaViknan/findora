# Lost & Found Web Application

A comprehensive Lost and Found web application built with React frontend and AWS serverless backend. Users can report lost items, found items, and get matched with potential owners through an intelligent matching algorithm.

## 🚀 Features

### Frontend (React)
- **Modern UI**: Clean, professional interface built with TailwindCSS
- **Interactive Maps**: Leaflet.js integration for location selection
- **Image Upload**: Drag-and-drop image upload with preview
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live notifications for matches

### Backend (AWS Serverless)
- **API Gateway**: RESTful API endpoints
- **Lambda Functions**: Serverless compute for all operations
- **DynamoDB**: NoSQL database for data storage
- **S3**: Image storage and management
- **Matching Algorithm**: Intelligent item matching based on description and location

### Core Functionality
- **Lost Item Reporting**: Users can report lost items with location pins and photos
- **Found Item Reporting**: Three options for handling found items:
  - Keep with themselves
  - Leave at found location
  - Give to nearby vendor/shop
- **Smart Matching**: Automatic matching between lost and found items
- **User Management**: Secure authentication and user profiles
- **Search**: Advanced search functionality across all items

## 📁 Project Structure

```
lostfound-frontend/
├── src/
│   ├── components/
│   │   ├── Home.js              # Main dashboard
│   │   ├── Login.js             # User authentication
│   │   ├── Signup.js            # User registration
│   │   ├── LostReport.js        # Lost item reporting
│   │   ├── FoundReport.js       # Found item reporting
│   │   ├── Matches.js           # Match viewing and verification
│   │   ├── MyLostItems.js       # User's lost items
│   │   ├── MyFoundItems.js      # User's found items
│   │   └── Search.js            # Search functionality
│   ├── api.js                   # API service layer
│   ├── App.js                   # Main app component
│   └── index.css                # Global styles with TailwindCSS
├── backend/
│   ├── handlers/
│   │   ├── auth.js              # Authentication handlers
│   │   ├── items.js             # Item management handlers
│   │   ├── matches.js           # Matching algorithm handlers
│   │   ├── search.js            # Search handlers
│   │   └── upload.js            # Image upload handlers
│   ├── serverless.yml           # Serverless configuration
│   └── package.json             # Backend dependencies
└── README.md                    # This file
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- AWS CLI configured
- Serverless Framework

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd /Users/jeyaviknan/Documents/lostfound-frontend
   npm install
   ```

2. **Update API Configuration**
   - Open `src/api.js`
   - Replace the placeholder API URL with your actual API Gateway URL:
   ```javascript
   // TODO: Replace with your actual API Gateway URL
   const API_BASE_URL = "https://your-api-gateway-url.execute-api.region.amazonaws.com/dev";
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

### Backend Setup (AWS)

1. **Install Serverless Framework**
   ```bash
   npm install -g serverless
   ```

2. **Configure AWS Credentials**
   ```bash
   aws configure
   ```

3. **Deploy Backend**
   ```bash
   cd backend
   npm install
   serverless deploy
   ```

4. **Note the API Gateway URL**
   - After deployment, copy the API Gateway URL from the output
   - Update the frontend `src/api.js` file with this URL

### AWS Resources Created

The Serverless deployment will create:

1. **DynamoDB Table**: `LostFoundItems`
   - Primary key: `id` (String)
   - Global Secondary Indexes:
     - `UserEmailIndex`: For querying by user email
     - `TypeIndex`: For querying by item type (lost/found)

2. **S3 Bucket**: `lost-found-images-dev`
   - Stores uploaded images
   - Configured with CORS for web access

3. **Lambda Functions**:
   - `signup`: User registration
   - `login`: User authentication
   - `reportLostItem`: Lost item reporting
   - `reportFoundItem`: Found item reporting
   - `getLostItems`: Retrieve user's lost items
   - `getFoundItems`: Retrieve user's found items
   - `getMatches`: Get potential matches
   - `verifyMatch`: Verify or reject matches
   - `searchItems`: Search functionality
   - `uploadImage`: Image upload

4. **API Gateway**: RESTful API endpoints

## 🔧 Configuration

### Environment Variables
The backend uses the following environment variables (automatically set by Serverless):
- `DYNAMODB_TABLE`: DynamoDB table name
- `S3_BUCKET`: S3 bucket name

### API Endpoints

#### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login

#### Items
- `POST /items/lost` - Report lost item
- `POST /items/found` - Report found item
- `GET /items/lost/{userEmail}` - Get user's lost items
- `GET /items/found/{userEmail}` - Get user's found items

#### Matches
- `GET /matches/{userEmail}` - Get potential matches
- `POST /matches/{matchId}/verify` - Verify or reject match

#### Search
- `GET /search?q={query}` - Search items

#### Upload
- `POST /upload` - Upload image

## 🎯 Usage

### For Users

1. **Sign Up/Login**: Create an account or sign in
2. **Report Lost Item**:
   - Click "Report Lost Item" on the dashboard
   - Fill in item details (category, description, contact info)
   - Click on the map to mark where you lost the item
   - Upload a photo (optional)
   - Submit the report

3. **Report Found Item**:
   - Click "Report Found Item" on the dashboard
   - Fill in item details
   - Choose how you'll handle the item (keep, leave, or give to vendor)
   - Mark the found location on the map
   - Upload a photo (optional)
   - Submit the report

4. **View Matches**:
   - Check the "Matches" section for potential matches
   - Review match details and confidence scores
   - Verify or reject matches

5. **Search Items**:
   - Use the search functionality to find specific items
   - Filter by category, type, and date range

### Matching Algorithm

The system uses an intelligent matching algorithm that considers:
- **Category Match** (40 points): Exact category match
- **Description Similarity** (30 points): Common words and phrases
- **Location Proximity** (30 points): Distance between lost and found locations

Matches with 50%+ confidence are shown to users.

## 🔒 Security Features

- **Authentication**: Secure user authentication
- **Data Privacy**: Only users who report lost items see potential matches
- **Input Validation**: All inputs are validated and sanitized
- **CORS Configuration**: Properly configured for web access

## 🚀 Deployment

### Frontend Deployment
1. Build the production version:
   ```bash
   npm run build
   ```
2. Deploy to your preferred hosting service (Netlify, Vercel, AWS S3, etc.)

### Backend Deployment
The backend is already configured for AWS deployment using Serverless Framework. Simply run:
```bash
cd backend
serverless deploy
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your API Gateway has CORS enabled
2. **Image Upload Issues**: Check S3 bucket permissions
3. **Map Not Loading**: Verify Leaflet.js is properly imported
4. **API Connection Issues**: Check the API Gateway URL in `src/api.js`

### Debug Mode
Enable debug logging by setting the environment variable:
```bash
export DEBUG=true
```

## 📝 TODO

- [ ] Implement JWT authentication
- [ ] Add email notifications
- [ ] Implement AWS Rekognition for image similarity
- [ ] Add push notifications
- [ ] Implement user profiles
- [ ] Add item categories management
- [ ] Implement item status updates
- [ ] Add reporting and analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please contact [your-email@example.com] or create an issue in the repository.

---

**Note**: This is a production-ready application template. Make sure to:
1. Replace placeholder URLs with your actual AWS endpoints
2. Configure proper security settings
3. Set up monitoring and logging
4. Test thoroughly before production deployment