const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3();
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

// Helper function to parse multipart form data
const parseMultipartData = (event) => {
  const boundary = event.headers['content-type']?.split('boundary=')[1];
  if (!boundary) {
    throw new Error('No boundary found in content-type header');
  }

  const body = Buffer.from(event.body, 'base64');
  const parts = body.toString().split(`--${boundary}`);
  
  let imageBuffer = null;
  let imageType = null;

  for (const part of parts) {
    if (part.includes('Content-Disposition: form-data') && part.includes('name="image"')) {
      const imageStart = part.indexOf('\r\n\r\n') + 4;
      imageBuffer = Buffer.from(part.substring(imageStart), 'binary');
      imageType = part.includes('image/jpeg') ? 'jpeg' : 'png';
      break;
    }
  }

  return { imageBuffer, imageType };
};

exports.uploadImage = async (event) => {
  try {
    const { imageBuffer, imageType } = parseMultipartData(event);
    
    if (!imageBuffer) {
      return createResponse(400, {
        error: 'No image provided'
      });
    }

    const imageId = uuidv4();
    const imageKey = `uploads/${imageId}.${imageType}`;

    const uploadResult = await s3.upload({
      Bucket: bucketName,
      Key: imageKey,
      Body: imageBuffer,
      ContentType: `image/${imageType}`,
      ACL: 'public-read'
    }).promise();

    return createResponse(200, {
      message: 'Image uploaded successfully',
      imageUrl: uploadResult.Location,
      imageId: imageId
    });
  } catch (error) {
    console.error('Upload error:', error);
    return createResponse(500, {
      error: 'Failed to upload image'
    });
  }
};