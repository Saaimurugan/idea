#!/usr/bin/env node

/**
 * Create an admin user in DynamoDB
 * Uses proper bcrypt password hashing
 */

const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');

const PROFILE = process.env.AWS_PROFILE || 'employee-ideas';
const REGION = process.env.AWS_REGION || 'us-east-2';
const ENVIRONMENT = process.env.ENVIRONMENT || 'prod';
const USERS_TABLE = `${ENVIRONMENT}-Users`;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    
    stdout.write(prompt);
    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    
    let password = '';
    
    const onData = (char) => {
      char = char.toString('utf8');
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl-D
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl-C
          process.exit();
          break;
        case '\u007f': // Backspace
        case '\b':
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.clearLine(0);
            stdout.cursorTo(0);
            stdout.write(prompt + '*'.repeat(password.length));
          }
          break;
        default:
          password += char;
          stdout.write('*');
          break;
      }
    };
    
    stdin.on('data', onData);
  });
}

async function createAdminUser() {
  console.log('==========================================');
  console.log('Create Admin User');
  console.log('==========================================');
  console.log('');
  console.log(`Region: ${REGION}`);
  console.log(`Table: ${USERS_TABLE}`);
  console.log('');

  try {
    // Get user input
    const username = await question('Enter admin username: ');
    const email = await question('Enter admin email: ');
    const password = await questionHidden('Enter admin password: ');
    
    rl.close();
    
    // Validate input
    if (!username || !email || !password) {
      console.error('\nError: All fields are required');
      process.exit(1);
    }
    
    if (password.length < 8) {
      console.error('\nError: Password must be at least 8 characters');
      process.exit(1);
    }
    
    console.log('\nCreating admin user...');
    
    // Generate user ID and timestamps
    const userId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Hash password using bcrypt (same as backend)
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create DynamoDB client
    const client = new DynamoDBClient({
      region: REGION,
      credentials: undefined // Use AWS CLI profile
    });
    
    // Create user item
    const params = {
      TableName: USERS_TABLE,
      Item: {
        userId: { S: userId },
        username: { S: username },
        email: { S: email },
        passwordHash: { S: passwordHash },
        role: { S: 'Admin' },
        createdAt: { S: timestamp },
        updatedAt: { S: timestamp }
      }
    };
    
    // Put item in DynamoDB
    await client.send(new PutItemCommand(params));
    
    console.log('\n✓ Admin user created successfully!');
    console.log('');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Role: Admin`);
    console.log('');
    console.log('You can now log in to the application with these credentials.');
    
  } catch (error) {
    console.error('\nError creating admin user:', error.message);
    process.exit(1);
  }
}

// Run the script
createAdminUser();
