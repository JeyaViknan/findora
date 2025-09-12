const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE;

const createResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  },
  body: JSON.stringify(body)
});

// Simple matching algorithm based on description similarity and location proximity
const calculateMatchScore = (lostItem, foundItem) => {
  let score = 0;
  
  // Category match (40 points)
  if (lostItem.category === foundItem.category) {
    score += 40;
  }
  
  // Description similarity (30 points)
  const lostDesc = lostItem.description.toLowerCase();
  const foundDesc = foundItem.description.toLowerCase();
  const commonWords = lostDesc.split(' ').filter(word => 
    foundDesc.includes(word) && word.length > 3
  );
  score += Math.min(30, (commonWords.length / lostDesc.split(' ').length) * 30);
  
  // Location proximity (30 points)
  if (lostItem.location && foundItem.location) {
    const distance = calculateDistance(
      lostItem.location.lat, lostItem.location.lng,
      foundItem.location.lat, foundItem.location.lng
    );
    // Within 1km = 30 points, within 5km = 20 points, within 10km = 10 points
    if (distance <= 1) score += 30;
    else if (distance <= 5) score += 20;
    else if (distance <= 10) score += 10;
  }
  
  return Math.min(100, score);
};

// Calculate distance between two coordinates in kilometers
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

exports.getMatches = async (event) => {
  try {
    const userEmail = event.pathParameters.userEmail;

    // Get user's lost items
    const lostItemsResult = await dynamodb.query({
      TableName: tableName,
      IndexName: 'UserEmailIndex',
      KeyConditionExpression: 'userEmail = :userEmail AND begins_with(createdAt, :type)',
      ExpressionAttributeValues: {
        ':userEmail': userEmail,
        ':type': 'lost'
      }
    }).promise();

    const lostItems = lostItemsResult.Items || [];
    const matches = [];

    // For each lost item, find potential matches
    for (const lostItem of lostItems) {
      // Get all found items from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const foundItemsResult = await dynamodb.query({
        TableName: tableName,
        IndexName: 'TypeIndex',
        KeyConditionExpression: '#type = :type AND createdAt >= :date',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':type': 'found',
          ':date': thirtyDaysAgo.toISOString()
        }
      }).promise();

      const foundItems = foundItemsResult.Items || [];

      // Calculate matches
      for (const foundItem of foundItems) {
        const score = calculateMatchScore(lostItem, foundItem);
        
        if (score >= 50) { // Only include matches with 50%+ confidence
          const matchId = uuidv4();
          const match = {
            id: matchId,
            lostItem: {
              id: lostItem.id,
              category: lostItem.category,
              description: lostItem.description,
              createdAt: lostItem.createdAt,
              imageUrl: lostItem.imageUrl
            },
            foundItem: {
              id: foundItem.id,
              category: foundItem.category,
              description: foundItem.description,
              createdAt: foundItem.createdAt,
              imageUrl: foundItem.imageUrl,
              userEmail: foundItem.userEmail,
              contactInfo: foundItem.contactInfo,
              location: foundItem.location,
              foundOption: foundItem.foundOption,
              vendorInfo: foundItem.vendorInfo
            },
            confidenceScore: Math.round(score),
            status: 'pending',
            createdAt: new Date().toISOString()
          };

          // Store match in database
          await dynamodb.put({
            TableName: tableName,
            Item: {
              id: matchId,
              type: 'match',
              userEmail: userEmail,
              lostItemId: lostItem.id,
              foundItemId: foundItem.id,
              confidenceScore: Math.round(score),
              status: 'pending',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }).promise();

          matches.push(match);
        }
      }
    }

    return createResponse(200, matches);
  } catch (error) {
    console.error('Get matches error:', error);
    return createResponse(500, {
      error: 'Failed to retrieve matches'
    });
  }
};

exports.verifyMatch = async (event) => {
  try {
    const matchId = event.pathParameters.matchId;
    const { isVerified } = JSON.parse(event.body);

    // Update match status
    await dynamodb.update({
      TableName: tableName,
      Key: { id: matchId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': isVerified ? 'verified' : 'rejected',
        ':updatedAt': new Date().toISOString()
      }
    }).promise();

    return createResponse(200, {
      message: isVerified ? 'Match verified successfully' : 'Match rejected',
      matchId,
      status: isVerified ? 'verified' : 'rejected'
    });
  } catch (error) {
    console.error('Verify match error:', error);
    return createResponse(500, {
      error: 'Failed to verify match'
    });
  }
};