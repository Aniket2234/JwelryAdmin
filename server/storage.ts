import { Db, ObjectId, MongoClient } from "mongodb";
import { getDatabase, objectIdToString, stringToObjectId } from "./mongodb";
import type {
  User,
  InsertUser,
  Shop,
  InsertShop,
  UpdateShop,
  Category,
  Product,
  InsertProduct,
  UpdateProduct,
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;

  // Shop methods
  getAllShops(ownerId: string): Promise<Shop[]>;
  getShop(id: string, ownerId: string): Promise<Shop | null>;
  createShop(shop: InsertShop, ownerId: string): Promise<Shop>;
  updateShop(id: string, shop: UpdateShop, ownerId: string): Promise<Shop | null>;
  deleteShop(id: string, ownerId: string): Promise<boolean>;
}

export class MongoDBStorage implements IStorage {
  private db: Db;

  constructor(database?: Db) {
    this.db = database || getDatabase();
  }

  // User methods
  async getUser(id: string): Promise<User | null> {
    const user = await this.db
      .collection("users")
      .findOne({ _id: stringToObjectId(id) });

    if (!user) return null;

    return {
      ...user,
      _id: objectIdToString(user._id),
      createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt),
    } as User;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.db.collection("users").findOne({ email });

    if (!user) return null;

    return {
      ...user,
      _id: objectIdToString(user._id),
      createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt),
    } as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.collection("users").insertOne({
      ...user,
      createdAt: new Date(),
    });

    return {
      ...user,
      _id: objectIdToString(result.insertedId),
      createdAt: new Date(),
    } as User;
  }

  // Shop methods
  async getAllShops(ownerId: string): Promise<Shop[]> {
    const shops = await this.db
      .collection("shops")
      .find({ ownerId })
      .sort({ createdAt: -1 })
      .toArray();

    return shops.map((shop) => ({
      ...shop,
      _id: objectIdToString(shop._id),
      createdAt: shop.createdAt instanceof Date ? shop.createdAt : new Date(shop.createdAt),
      updatedAt: shop.updatedAt instanceof Date ? shop.updatedAt : new Date(shop.updatedAt),
    })) as Shop[];
  }

  async getShop(id: string, ownerId: string): Promise<Shop | null> {
    const shop = await this.db
      .collection("shops")
      .findOne({ _id: stringToObjectId(id), ownerId });

    if (!shop) return null;

    return {
      ...shop,
      _id: objectIdToString(shop._id),
      createdAt: shop.createdAt instanceof Date ? shop.createdAt : new Date(shop.createdAt),
      updatedAt: shop.updatedAt instanceof Date ? shop.updatedAt : new Date(shop.updatedAt),
    } as Shop;
  }

  async createShop(shop: InsertShop, ownerId: string): Promise<Shop> {
    const now = new Date();
    const result = await this.db.collection("shops").insertOne({
      ...shop,
      ownerId,
      createdAt: now,
      updatedAt: now,
    });

    return {
      ...shop,
      _id: objectIdToString(result.insertedId),
      ownerId,
      createdAt: now,
      updatedAt: now,
    } as Shop;
  }

  async updateShop(id: string, shop: UpdateShop, ownerId: string): Promise<Shop | null> {
    const result = await this.db.collection("shops").findOneAndUpdate(
      { _id: stringToObjectId(id), ownerId },
      { $set: { ...shop, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    const value = result ? (result as any).value || result : null;
    if (!value) return null;

    return {
      ...value,
      _id: objectIdToString(value._id),
      createdAt: value.createdAt instanceof Date ? value.createdAt : new Date(value.createdAt),
      updatedAt: value.updatedAt instanceof Date ? value.updatedAt : new Date(value.updatedAt),
    } as Shop;
  }

  async deleteShop(id: string, ownerId: string): Promise<boolean> {
    const result = await this.db
      .collection("shops")
      .deleteOne({ _id: stringToObjectId(id), ownerId });

    return result.deletedCount > 0;
  }
}

// Helper function to connect to a shop's MongoDB
export async function connectToShopDB(mongoUri: string): Promise<Db> {
  const client = new MongoClient(mongoUri);
  await client.connect();
  
  // Extract database name from URI
  // URI format: mongodb+srv://...mongodb.net/DATABASE_NAME?params
  const uriParts = mongoUri.split('/');
  const lastPart = uriParts[uriParts.length - 1];
  let dbName = lastPart?.split('?')[0] || '';
  
  // If database name is empty or missing, use the default database from the connection
  if (!dbName || dbName.trim() === '') {
    console.warn('⚠️  No database name found in MongoDB URI. Using default database.');
    console.warn('💡 Please update your shop MongoDB URI to include the database name:');
    console.warn('   mongodb+srv://...mongodb.net/DATABASE_NAME?params');
    // Let MongoDB driver use the default database (admin or test)
    // This will likely fail to find collections
    dbName = 'test';
  }
  
  console.log(`🔌 Connecting to shop database: "${dbName}"`);
  return client.db(dbName);
}

// Helper function to get categories from shop's MongoDB
export async function getShopCategories(mongoUri: string): Promise<Category[]> {
  const db = await connectToShopDB(mongoUri);
  const categories = await db
    .collection("categories")
    .find()
    .sort({ displayOrder: 1 })
    .toArray();

  return categories.map((cat) => ({
    ...cat,
    _id: objectIdToString(cat._id),
  })) as Category[];
}

// Helper function to get products from shop's MongoDB
export async function getShopProducts(mongoUri: string, category?: string): Promise<Product[]> {
  const db = await connectToShopDB(mongoUri);
  const filter = category && category !== "all" ? { category } : {};
  
  const products = await db
    .collection("products")
    .find(filter)
    .sort({ displayOrder: 1 })
    .toArray();

  return products.map((prod) => ({
    ...prod,
    _id: objectIdToString(prod._id),
  })) as Product[];
}

// Helper function to get a product by ID from shop's MongoDB
export async function getShopProductById(mongoUri: string, productId: string): Promise<Product | null> {
  const db = await connectToShopDB(mongoUri);
  const product = await db
    .collection("products")
    .findOne({ _id: stringToObjectId(productId) });

  if (!product) return null;

  return {
    ...product,
    _id: objectIdToString(product._id),
  } as Product;
}

// Helper function to create a product in shop's MongoDB
export async function createShopProduct(mongoUri: string, product: InsertProduct): Promise<Product> {
  const db = await connectToShopDB(mongoUri);
  const result = await db.collection("products").insertOne({
    ...product,
    tags: product.tags || [],
    featured: product.featured || false,
    inStock: product.inStock !== false,
    displayOrder: product.displayOrder || 0,
  });

  return {
    ...product,
    _id: objectIdToString(result.insertedId),
  } as Product;
}

// Helper function to update a product in shop's MongoDB
export async function updateShopProduct(mongoUri: string, productId: string, product: UpdateProduct): Promise<Product | null> {
  const db = await connectToShopDB(mongoUri);
  const result = await db.collection("products").findOneAndUpdate(
    { _id: stringToObjectId(productId) },
    { $set: product },
    { returnDocument: "after" }
  );

  const value = result ? (result as any).value || result : null;
  if (!value) return null;

  return {
    ...value,
    _id: objectIdToString(value._id),
  } as Product;
}

// Helper function to delete a product from shop's MongoDB
export async function deleteShopProduct(mongoUri: string, productId: string): Promise<boolean> {
  const db = await connectToShopDB(mongoUri);
  const result = await db.collection("products").deleteOne({ _id: stringToObjectId(productId) });
  return result.deletedCount > 0;
}

let storageInstance: MongoDBStorage | null = null;

export function getStorage(): MongoDBStorage {
  if (!storageInstance) {
    storageInstance = new MongoDBStorage();
  }
  return storageInstance;
}
