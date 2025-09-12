const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const tableName = process.env.DYNAMODB_TABLE;
const bucketName = process.env.S3_BUCKET;

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

// Helper function to upload image to S3
const uploadImageToS3 = async (imageBuffer, key) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: imageBuffer,
    ContentType: 'image/jpeg',
    ACL: 'public-read'
  };

  return await s3.upload(params).promise();
};

// Helper function to parse multipart form data
const parseMultipartData = (event) => {
  const boundary = event.headers['content-type']?.split('boundary=')[1];
  if (!boundary) {
    throw new Error('No boundary found in content-type header');
  }

  const body = Buffer.from(event.body, 'base64');
  const parts = body.toString().split(`--${boundary}`);
  
  const data = {};
  let imageBuffer = null;
  let imageType = null;

  for (const part of parts) {
    if (part.includes('Content-Disposition: form-data')) {
      const nameMatch = part.match(/name="([^"]+)"/);
      if (nameMatch) {
        const name = nameMatch[1];
        const valueStart = part.indexOf('\r\n\r\n') + 4;
        const value = part.substring(valueStart).replace(/\r\n$/, '');
        
        if (name === 'image') {
          // Handle image upload
          const imageStart = part.indexOf('\r\n\r\n') + 4;
          imageBuffer = Buffer.from(part.substring(imageStart), 'binary');
          imageType = part.includes('image/jpeg') ? 'jpeg' : 'png';
        } else {
          data[name] = value;
        }
      }
    }
  }

  return { data, imageBuffer, imageType };
};

exports.reportLost = async (event) => {
  try {
    const { data, imageBuffer, imageType } = parseMultipartData(event);
    
    const itemId = uuidv4();
    const location = JSON.parse(data.location);
    
    let imageUrl = null;
    if (imageBuffer) {
      const imageKey = `lost-items/${itemId}.${imageType}`;
      const uploadResult = await uploadImageToS3(imageBuffer, imageKey);
      imageUrl = uploadResult.Location;
    }

    const item = {
      id: itemId,
      type: 'lost',
      userEmail: data.userEmail,
      category: data.category,
      description: data.description,
      contactInfo: data.contactInfo,
      location: location,
      imageUrl: imageUrl,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamodb.put({
      TableName: tableName,
      Item: item
    }).promise();

    // TODO: Trigger matching algorithm
    // await triggerMatchingAlgorithm(item);

    return createResponse(201, {
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
      }
    });
  } catch (error) {
    console.error('Report lost item error:', error);
    return createResponse(500, {
      error: 'Failed to report lost item'
    });
  }
};

exports.reportFound = async (event) => {
  try {
    const { data, imageBuffer, imageType } = parseMultipartData(event);
    
    const itemId = uuidv4();
    const location = JSON.parse(data.location);
    
    let imageUrl = null;
    if (imageBuffer) {
      const imageKey = `found-items/${itemId}.${imageType}`;
      const uploadResult = await uploadImageToS3(imageBuffer, imageKey);
      imageUrl = uploadResult.Location;
    }

    const item = {
      id: itemId,
      type: 'found',
      userEmail: data.userEmail,
      category: data.category,
      description: data.description,
      contactInfo: data.contactInfo,
      location: location,
      imageUrl: imageUrl,
      foundOption: data.foundOption,
      vendorInfo: data.vendorInfo || null,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamodb.put({
      TableName: tableName,
      Item: item
    }).promise();

    // TODO: Trigger matching algorithm
    // await triggerMatchingAlgorithm(item);

    return createResponse(201, {
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
      }
    });
  } catch (error) {
    console.error('Report found item error:', error);
    return createResponse(500, {
      error: 'Failed to report found item'
    });
  }
};

exports.getLostItems = async (event) => {
  try {
    const userEmail = event.pathParameters.userEmail;

    const result = await dynamodb.query({
      TableName: tableName,
      IndexName: 'UserEmailIndex',
      KeyConditionExpression: 'userEmail = :userEmail AND begins_with(createdAt, :type)',
      ExpressionAttributeValues: {
        ':userEmail': userEmail,
        ':type': 'lost'
      }
    }).promise();

    return createResponse(200, result.Items || []);
  } catch (error) {
    console.error('Get lost items error:', error);
    return createResponse(500, {
      error: 'Failed to retrieve lost items'
    });
  }
};

exports.getFoundItems = async (event) => {
  try {
    const userEmail = event.pathParameters.userEmail;

    const result = await dynamodb.query({
      TableName: tableName,
      IndexName: 'UserEmailIndex',
      KeyConditionExpression: 'userEmail = :userEmail AND begins_with(createdAt, :type)',
      ExpressionAttributeValues: {
        ':userEmail': userEmail,
        ':type': 'found'
      }
    }).promise();

    return createResponse(200, result.Items || []);
  } catch (error) {
    console.error('Get found items error:', error);
    return createResponse(500, {
      error: 'Failed to retrieve found items'
    });
  }
};