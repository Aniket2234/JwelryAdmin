import { MongoClient, Db, ObjectId } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToMongoDB(): Promise<Db> {
  if (db) {
    return db;
  }

  const mongoUri = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error(
      "ADMIN_MONGODB_URI or MONGODB_URI environment variable is not set. Please add it to your .env file."
    );
  }

  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    
    // Extract database name from URI or use default
    const dbName = mongoUri.split('/').pop()?.split('?')[0] || 'jewelry_admin_panel';
    db = client.db(dbName);
    
    console.log(`Connected to MongoDB database: ${dbName}`);
    
    // Create indexes for better query performance
    await createIndexes(db);
    
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

async function createIndexes(database: Db) {
  try {
    // Admin users indexes
    await database.collection("users").createIndex({ email: 1 }, { unique: true });
    
    // Shops indexes
    await database.collection("shops").createIndex({ ownerId: 1 });
    await database.collection("shops").createIndex({ createdAt: -1 });
    await database.collection("shops").createIndex({ name: 1 });
    
    console.log("MongoDB indexes created successfully");
  } catch (error) {
    console.error("Error creating indexes:", error);
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error("Database not connected. Call connectToMongoDB first.");
  }
  return db;
}

export async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("MongoDB connection closed");
  }
}

// Utility to convert MongoDB ObjectId to string
export function objectIdToString(id: ObjectId | string): string {
  return id instanceof ObjectId ? id.toHexString() : id;
}

// Utility to convert string to MongoDB ObjectId
export function stringToObjectId(id: string): ObjectId {
  return new ObjectId(id);
}
