const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const MLMatchingService = require('./ml-matching');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// In-memory storage (replace with actual database in production)
let users = new Map();
let items = [];
let matches = [];

// Initialize ML matching service
const mlMatching = new MLMatchingService();

// Matching algorithm functions
const calculateTextSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;
  
  const normalize = (text) => text.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const words1 = normalize(text1).split(/\s+/);
  const words2 = normalize(text2).split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size; // Jaccard similarity
};

const calculateLocationDistance = (loc1, loc2) => {
  if (!loc1 || !loc2 || !loc1.lat || !loc1.lng || !loc2.lat || !loc2.lng) {
    return 1; // Max distance if location data is missing
  }
  
  const R = 6371; // Earth's radius in kilometers
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.min(distance / 10, 1); // Normalize to 0-1, max 10km
};

const calculateMatchScore = (lostItem, foundItem) => {
  let score = 0;
  
  // Description similarity (40% weight)
  const descriptionSimilarity = calculateTextSimilarity(lostItem.description, foundItem.description);
  score += descriptionSimilarity * 0.4;
  
  // Category match (30% weight)
  if (lostItem.category === foundItem.category) {
    score += 0.3;
  }
  
  // Location proximity (20% weight)
  const locationDistance = calculateLocationDistance(lostItem.location, foundItem.location);
  score += (1 - locationDistance) * 0.2;
  
  // Time proximity (10% weight) - items reported within 7 days get bonus
  const timeDiff = Math.abs(new Date(lostItem.createdAt) - new Date(foundItem.createdAt));
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  if (daysDiff <= 7) {
    score += 0.1;
  }
  
  return Math.min(score, 1); // Cap at 1.0
};

const findMatches = async (newItem) => {
  const matches = [];
  const threshold = 0.25; // Lower threshold for ML matching
  
  if (newItem.type === 'lost') {
    // Find matching found items
    const foundItems = items.filter(item => 
      item.type === 'found' && 
      item.userEmail !== newItem.userEmail &&
      item.status === 'active'
    );
    
    for (const foundItem of foundItems) {
      try {
        // Combine classic and ML scores; keep the stronger one to avoid regressions
        const classicScore = calculateMatchScore(newItem, foundItem);
        const mlResult = await mlMatching.calculateAdvancedSimilarity(newItem, foundItem);
        const mlScore = typeof mlResult === 'object' ? mlResult.score : mlResult;
        const score = Math.max(classicScore, mlScore);
        
        if (score >= threshold) {
          const imageSimilarity = typeof mlResult === 'object' ? mlResult.imageSimilarity : null;
          console.log(`Image similarity calculated: ${imageSimilarity} for lostItem ${newItem.id} and foundItem ${foundItem.id}`);
          const matchInfo = mlMatching.generateMatchExplanation(newItem, foundItem, score, imageSimilarity);
          matches.push({
            id: uuidv4(),
            lostItemId: newItem.id,
            foundItemId: foundItem.id,
            lostUserEmail: newItem.userEmail,
            foundUserEmail: foundItem.userEmail,
            score: score,
            imageMatchScore: imageSimilarity,
            status: 'pending',
            createdAt: new Date().toISOString(),
            matchInfo: matchInfo
          });
        }
      } catch (error) {
        console.error('Error matching items:', error);
        // Continue with next item if matching fails
      }
    }
  } else if (newItem.type === 'found') {
    // Find matching lost items
    const lostItems = items.filter(item => 
      item.type === 'lost' && 
      item.userEmail !== newItem.userEmail &&
      item.status === 'active'
    );
    
    for (const lostItem of lostItems) {
      try {
        const classicScore = calculateMatchScore(lostItem, newItem);
        const mlResult = await mlMatching.calculateAdvancedSimilarity(lostItem, newItem);
        const mlScore = typeof mlResult === 'object' ? mlResult.score : mlResult;
        const score = Math.max(classicScore, mlScore);
        
        if (score >= threshold) {
          const imageSimilarity = typeof mlResult === 'object' ? mlResult.imageSimilarity : null;
          console.log(`Image similarity calculated: ${imageSimilarity} for lostItem ${lostItem.id} and foundItem ${newItem.id}`);
          const matchInfo = mlMatching.generateMatchExplanation(lostItem, newItem, score, imageSimilarity);
          matches.push({
            id: uuidv4(),
            lostItemId: lostItem.id,
            foundItemId: newItem.id,
            lostUserEmail: lostItem.userEmail,
            foundUserEmail: newItem.userEmail,
            score: score,
            imageMatchScore: imageSimilarity,
            status: 'pending',
            createdAt: new Date().toISOString(),
            matchInfo: matchInfo
          });
        }
      } catch (error) {
        console.error('Error matching items:', error);
        // Continue with next item if matching fails
      }
    }
  }
  
  return matches;
};

// Helper function to create response
const createResponse = (res, statusCode, data) => {
  return res.status(statusCode).json(data);
};

// Authentication routes
app.post('/auth/signup', (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    if (users.has(email)) {
      return createResponse(res, 400, {
        error: 'User already exists with this email'
      });
    }

    // Create user
    const user = {
      id: uuidv4(),
      name,
      email,
      password, // In production, hash this
      createdAt: new Date().toISOString()
    };

    users.set(email, user);

    return createResponse(res, 201, {
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return createResponse(res, 500, {
      error: 'Internal server error'
    });
  }
});

app.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = users.get(email);
    if (!user || user.password !== password) {
      return createResponse(res, 401, {
        error: 'Invalid credentials'
      });
    }

    // Generate token (in production, use JWT)
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');

    return createResponse(res, 200, {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return createResponse(res, 500, {
      error: 'Internal server error'
    });
  }
});

// Lost item routes
app.post('/items/lost', upload.single('image'), async (req, res) => {
  try {
    const { description, category, location, userEmail, contactInfo } = req.body;
    
    const itemId = uuidv4();
    const locationObj = JSON.parse(location);
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const item = {
      id: itemId,
      type: 'lost',
      userEmail,
      category,
      description,
      contactInfo,
      location: locationObj,
      imageUrl,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    items.push(item);

    // Find matches for this lost item (non-fatal)
    try {
      const newMatches = await findMatches(item);
      matches.push(...newMatches);
      return createResponse(res, 201, {
        message: 'Lost item reported successfully',
        item: {
          id: item.id,
          type: item.type,
          category: item.category,
          description: item.description,
          location: item.location,
          imageUrl: item.imageUrl,
          status: item.status,
          createdAt: item.createdAt
        },
        matchesFound: newMatches.length
      });
    } catch (matchErr) {
      console.error('Matching error (non-fatal):', matchErr);
      return createResponse(res, 201, {
        message: 'Lost item reported successfully',
        item: {
          id: item.id,
          type: item.type,
          category: item.category,
          description: item.description,
          location: item.location,
          imageUrl: item.imageUrl,
          status: item.status,
          createdAt: item.createdAt
        },
        matchesFound: 0
      });
    }
  } catch (error) {
    console.error('Report lost item error:', error);
    return createResponse(res, 500, {
      error: 'Failed to report lost item'
    });
  }
});

// Found item routes
app.post('/items/found', upload.single('image'), async (req, res) => {
  try {
    const { description, category, location, userEmail, contactInfo, foundOption, vendorInfo } = req.body;
    
    const itemId = uuidv4();
    const locationObj = JSON.parse(location);
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const item = {
      id: itemId,
      type: 'found',
      userEmail,
      category,
      description,
      contactInfo,
      location: locationObj,
      imageUrl,
      foundOption,
      vendorInfo: vendorInfo || null,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    items.push(item);

    // Find matches for this found item (do not fail the request if matching errors)
    try {
      const newMatches = await findMatches(item);
      matches.push(...newMatches);
      return createResponse(res, 201, {
        message: 'Found item reported successfully',
        item: {
          id: item.id,
          type: item.type,
          category: item.category,
          description: item.description,
          location: item.location,
          imageUrl: item.imageUrl,
          foundOption: item.foundOption,
          vendorInfo: item.vendorInfo,
          status: item.status,
          createdAt: item.createdAt
        },
        matchesFound: newMatches.length
      });
    } catch (matchErr) {
      console.error('Matching error (non-fatal):', matchErr);
      return createResponse(res, 201, {
        message: 'Found item reported successfully',
        item: {
          id: item.id,
          type: item.type,
          category: item.category,
          description: item.description,
          location: item.location,
          imageUrl: item.imageUrl,
          foundOption: item.foundOption,
          vendorInfo: item.vendorInfo,
          status: item.status,
          createdAt: item.createdAt
        },
        matchesFound: 0
      });
    }
  } catch (error) {
    console.error('Report found item error:', error);
    return createResponse(res, 500, {
      error: 'Failed to report found item'
    });
  }
});

// Get user's lost items
app.get('/items/lost/:userEmail', (req, res) => {
  try {
    const { userEmail } = req.params;
    const userLostItems = items.filter(item => 
      item.userEmail === userEmail && item.type === 'lost'
    );
    
    return createResponse(res, 200, userLostItems);
  } catch (error) {
    console.error('Get lost items error:', error);
    return createResponse(res, 500, {
      error: 'Failed to retrieve lost items'
    });
  }
});

// Get user's found items
app.get('/items/found/:userEmail', (req, res) => {
  try {
    const { userEmail } = req.params;
    const userFoundItems = items.filter(item => 
      item.userEmail === userEmail && item.type === 'found'
    );
    
    return createResponse(res, 200, userFoundItems);
  } catch (error) {
    console.error('Get found items error:', error);
    return createResponse(res, 500, {
      error: 'Failed to retrieve found items'
    });
  }
});

// Helper function to convert relative image URLs to full URLs
const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) {
    console.log('getFullImageUrl: imageUrl is null/undefined');
    return null;
  }
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.log('getFullImageUrl: Already full URL:', imageUrl);
    return imageUrl;
  }
  // For local development, prepend the server URL
  const baseUrl = `http://localhost:${PORT}`;
  const fullUrl = imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
  console.log('getFullImageUrl: Converted', imageUrl, 'to', fullUrl);
  return fullUrl;
};

// Match routes
app.get('/matches/:userEmail', (req, res) => {
  try {
    const { userEmail } = req.params;
    const { itemId } = req.query;
    const userMatches = matches.filter(match => 
      match.lostUserEmail === userEmail || match.foundUserEmail === userEmail
    );
    
    // Enhance matches with item details
    const enhancedMatches = userMatches.map(match => {
      const lostItem = items.find(item => item.id === match.lostItemId);
      const foundItem = items.find(item => item.id === match.foundItemId);
      
      const enhancedMatch = {
        ...match,
        lostItem: lostItem ? {
          id: lostItem.id,
          description: lostItem.description,
          category: lostItem.category,
          location: lostItem.location,
          imageUrl: getFullImageUrl(lostItem.imageUrl),
          createdAt: lostItem.createdAt
        } : null,
        foundItem: foundItem ? {
          id: foundItem.id,
          description: foundItem.description,
          category: foundItem.category,
          location: foundItem.location,
          imageUrl: getFullImageUrl(foundItem.imageUrl),
          createdAt: foundItem.createdAt
        } : null
      };
      
      // Log match data for debugging
      console.log('Enhanced match:', {
        matchId: enhancedMatch.id,
        lostItemImage: enhancedMatch.lostItem?.imageUrl,
        foundItemImage: enhancedMatch.foundItem?.imageUrl,
        imageMatchScore: enhancedMatch.imageMatchScore,
        matchInfoImageSimilarity: enhancedMatch.matchInfo?.imageSimilarity
      });
      
      return enhancedMatch;
    });
    
    // If an itemId is provided, filter matches to only those related to that item
    const filteredMatches = itemId
      ? enhancedMatches.filter(m => m.lostItemId === itemId || m.foundItemId === itemId)
      : enhancedMatches;
    
    return createResponse(res, 200, filteredMatches);
  } catch (error) {
    console.error('Get matches error:', error);
    return createResponse(res, 500, {
      error: 'Failed to retrieve matches'
    });
  }
});

app.post('/matches/:matchId/verify', (req, res) => {
  try {
    const { matchId } = req.params;
    const { isVerified } = req.body;
    
    const matchIndex = matches.findIndex(match => match.id === matchId);
    if (matchIndex === -1) {
      return createResponse(res, 404, {
        error: 'Match not found'
      });
    }
    
    matches[matchIndex].isVerified = isVerified;
    matches[matchIndex].verifiedAt = new Date().toISOString();
    
    return createResponse(res, 200, {
      message: 'Match verification updated',
      match: matches[matchIndex]
    });
  } catch (error) {
    console.error('Verify match error:', error);
    return createResponse(res, 500, {
      error: 'Failed to verify match'
    });
  }
});

// Search route
app.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return createResponse(res, 400, {
        error: 'Search query is required'
      });
    }
    
    const searchResults = items.filter(item => 
      item.description.toLowerCase().includes(q.toLowerCase()) ||
      item.category.toLowerCase().includes(q.toLowerCase())
    );
    
    return createResponse(res, 200, searchResults);
  } catch (error) {
    console.error('Search error:', error);
    return createResponse(res, 500, {
      error: 'Failed to search items'
    });
  }
});

// Image upload route
app.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return createResponse(res, 400, {
        error: 'No image file provided'
      });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    
    return createResponse(res, 200, {
      message: 'Image uploaded successfully',
      imageUrl
    });
  } catch (error) {
    console.error('Upload error:', error);
    return createResponse(res, 500, {
      error: 'Failed to upload image'
    });
  }
});

// Serve uploaded files - make sure this is after other routes
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, path) => {
    // Allow CORS for images
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Log when static files are being served
console.log(`Serving static files from: ${uploadsDir}`);
console.log(`Uploads available at: http://localhost:${PORT}/uploads/`);

// Manual matching trigger (for testing and re-running matches with images)
app.post('/matches/trigger', async (req, res) => {
  try {
    const { userEmail, recalculate = false } = req.body;
    
    if (!userEmail) {
      return createResponse(res, 400, {
        error: 'User email is required'
      });
    }
    
    // Find all items for this user
    const userItems = items.filter(item => item.userEmail === userEmail);
    let totalMatches = 0;
    let recalculatedCount = 0;
    
    // If recalculate is true, remove existing matches and re-run
    if (recalculate) {
      matches = matches.filter(m => 
        m.lostUserEmail !== userEmail && m.foundUserEmail !== userEmail
      );
    }
    
    for (const item of userItems) {
      const newMatches = await findMatches(item);
      // Filter out duplicates
      const uniqueMatches = newMatches.filter(newMatch => 
        !matches.some(existingMatch => 
          existingMatch.lostItemId === newMatch.lostItemId && 
          existingMatch.foundItemId === newMatch.foundItemId
        )
      );
      matches.push(...uniqueMatches);
      totalMatches += uniqueMatches.length;
      recalculatedCount += newMatches.length;
    }
    
    return createResponse(res, 200, {
      message: 'Matching completed',
      newMatchesFound: totalMatches,
      recalculatedMatches: recalculatedCount,
      totalMatches: matches.length
    });
  } catch (error) {
    console.error('Trigger matching error:', error);
    return createResponse(res, 500, {
      error: 'Failed to trigger matching'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Local server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
