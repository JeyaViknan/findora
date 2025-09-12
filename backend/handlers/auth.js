const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE;

// Simple in-memory user storage (in production, use a proper user service)
const users = new Map();

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

exports.signup = async (event) => {
  try {
    const { name, email, password } = JSON.parse(event.body);

    // Check if user already exists
    if (users.has(email)) {
      return createResponse(400, {
        error: 'User already exists with this email'
      });
    }

    // Create user (in production, hash password)
    const user = {
      id: uuidv4(),
      name,
      email,
      password, // In production, hash this
      createdAt: new Date().toISOString()
    };

    users.set(email, user);

    return createResponse(201, {
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return createResponse(500, {
      error: 'Internal server error'
    });
  }
};

exports.login = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);

    // Check if user exists
    const user = users.get(email);
    if (!user || user.password !== password) {
      return createResponse(401, {
        error: 'Invalid credentials'
      });
    }

    // Generate token (in production, use JWT)
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');

    return createResponse(200, {
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
    return createResponse(500, {
      error: 'Internal server error'
    });
  }
};