const AWS = require('aws-sdk');

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

exports.searchItems = async (event) => {
  try {
    const query = event.queryStringParameters?.q || '';
    
    if (!query.trim()) {
      return createResponse(400, {
        error: 'Search query is required'
      });
    }

    // Search in both lost and found items
    const searchPromises = [
      // Search lost items
      dynamodb.scan({
        TableName: tableName,
        FilterExpression: 'contains(description, :query) AND #type = :lostType',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':query': query,
          ':lostType': 'lost'
        }
      }).promise(),
      
      // Search found items
      dynamodb.scan({
        TableName: tableName,
        FilterExpression: 'contains(description, :query) AND #type = :foundType',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':query': query,
          ':foundType': 'found'
        }
      }).promise()
    ];

    const [lostResults, foundResults] = await Promise.all(searchPromises);

    // Combine and format results
    const results = [
      ...(lostResults.Items || []).map(item => ({
        ...item,
        type: 'lost'
      })),
      ...(foundResults.Items || []).map(item => ({
        ...item,
        type: 'found'
      }))
    ];

    // Sort by creation date (newest first)
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return createResponse(200, results);
  } catch (error) {
    console.error('Search error:', error);
    return createResponse(500, {
      error: 'Failed to search items'
    });
  }
};