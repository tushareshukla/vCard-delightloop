import mongoose from "mongoose";
// Define the type for our cached mongoose connection
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};
// This tells TypeScript that we'll have a global variable called mongoose
// It will store our connection and connection attempt
declare global {
  var mongoose: MongooseCache | undefined;
}

// Get the database connection string from .env.local file
const MONGODB_URI = process.env.MONGODB_URI!;

// // If no connection string is provided, stop the app and show error
// if (!MONGODB_URI) {
//   throw new Error(
//     "Please define the MONGODB_URI environment variable inside .env.local"
//   );
// }
// Get our existing connection info from global variable
let cached = global.mongoose || { conn: null, promise: null };

if (!cached.conn) {
  cached = { conn: null, promise: null };
}

async function dbConnect() {
  // STEP 1: Check if we already have a connection
  // If yes, reuse it to avoid creating unnecessary connections
  if (cached.conn) {
    console.log("😄 😄 😄 Using existing MongoDB connection 😄 😄 😄 ");
    return cached.conn;
  }

  // STEP 2: Check if a connection attempt is already in progress
  // This prevents multiple simultaneous connection attempts
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Allows MongoDB to queue operations if not connected
    };

    // STEP 3: Create new connection promise
    // This is where we actually try to connect to MongoDB
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        // Connection successful - log it and return the connection
        console.log("🚴‍♀️ 🚴‍♀️ 🚴‍♀️ New MongoDB connection established 🚴‍♀️ 🚴‍♀️ 🚴‍♀️");
        return mongoose;
      })
      .catch((error) => {
        // Connection failed - log error and throw it
        console.error("❌ ❌ ❌ MongoDB connection error: ❌ ❌ ❌", error);
        throw error;
      });
  }

  // STEP 4: Wait for the connection promise to resolve
  try {
    // Store the successful connection in our cache
    cached.conn = await cached.promise;
    console.log("Database connected successfully");
  } catch (e) {
    // If connection fails, reset the promise so we can try again
    cached.promise = null;
    throw e;
  }

  // Return the successful connection
  return cached.conn;
}
export default dbConnect;
