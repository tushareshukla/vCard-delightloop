/**
 * This script creates a test short URL in the database
 * Run with: node scripts/create-test-short-url.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

// Define the ShortUrl schema
const ShortUrlSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    longUrl: {
      type: String,
      required: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Create the model
const ShortUrl = mongoose.models.ShortUrl || mongoose.model('ShortUrl', ShortUrlSchema);

// Create a test short URL
async function createTestShortUrl() {
  try {
    // Check if the test URL already exists
    const existingUrl = await ShortUrl.findOne({ shortCode: 'L6AEKa' });
    
    if (existingUrl) {
      console.log('Test URL already exists:', existingUrl);
      return existingUrl;
    }
    
    // Create a new test URL
    const shortUrl = await ShortUrl.create({
      shortCode: 'L6AEKa',
      longUrl: 'https://sandbox-app.delightloop.ai/public-landing-2/3?token=eyJyZWNpcGllbnRfaWQiOiI2N2NiNDg2NDQxYWM0ZGYzYTYyYzU2ZjIiLCJwbGF5Ym9va19pZCI6IjY3Y2I0ODU3NDFhYzRkZjNhNjJjNTZlZSIsInBsYXlib29rX3J1bl9pZCI6IjY3Y2I0ODU3NDFhYzRkZjNhNjJjNTZlZSJ9.SNgA8j%2BVwRbpOTOs9EpJN9A8oB83yET5wAjyM4p62NI%3D',
    });
    
    console.log('Created test short URL:', shortUrl);
    return shortUrl;
  } catch (error) {
    console.error('Error creating test short URL:', error);
  }
}

// Run the function and close the connection when done
createTestShortUrl()
  .then(() => {
    console.log('Done!');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.connection.close();
  }); 