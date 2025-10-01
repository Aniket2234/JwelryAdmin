import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage, getShopCategories, getShopProducts, getShopProductById, createShopProduct, updateShopProduct, deleteShopProduct } from "./storage";
import { connectToMongoDB } from "./mongodb";
import {
  insertUserSchema,
  loginSchema,
  insertShopSchema,
  updateShopSchema,
  insertProductSchema,
  updateProductSchema,
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// In-memory session storage (replace with proper session management in production)
const sessions = new Map<string, string>(); // sessionId -> userId

export async function registerRoutes(app: Express): Promise<Server> {
  // Connect to MongoDB before registering routes
  try {
    await connectToMongoDB();
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    const sessionId = req.headers.authorization?.replace("Bearer ", "");
    if (!sessionId || !sessions.has(sessionId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.userId = sessions.get(sessionId);
    next();
  };

  // Authentication endpoints
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await getStorage().getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Create user
      const user = await getStorage().createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Create session
      const sessionId = randomUUID();
      sessions.set(sessionId, user._id);

      res.status(201).json({ 
        sessionId,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid signup data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Find user
      const user = await getStorage().getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session
      const sessionId = randomUUID();
      sessions.set(sessionId, user._id);

      res.json({ 
        sessionId,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req: any, res) => {
    const sessionId = req.headers.authorization?.replace("Bearer ", "");
    if (sessionId) {
      sessions.delete(sessionId);
    }
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    try {
      const user = await getStorage().getUser(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        _id: user._id,
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Analytics endpoint - get dashboard statistics
  app.get("/api/analytics", requireAuth, async (req: any, res) => {
    try {
      const shops = await getStorage().getAllShops(req.userId);
      
      let totalProducts = 0;
      let totalCategories = 0;
      const categorySet = new Set<string>();
      
      // Fetch product and category counts from each shop
      for (const shop of shops) {
        try {
          const products = await getShopProducts(shop.mongodbUri);
          totalProducts += products.length;
          
          const categories = await getShopCategories(shop.mongodbUri);
          categories.forEach(cat => categorySet.add(cat.name));
          totalCategories += categories.length;
        } catch (error) {
          console.error(`Failed to fetch data for shop ${shop.name}:`, error);
        }
      }

      // Sort shops by createdAt descending to get most recent first
      const recentShops = [...shops]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      res.json({
        totalShops: shops.length,
        totalProducts,
        totalCategories,
        uniqueCategories: categorySet.size,
        recentShops,
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Shop management endpoints
  app.get("/api/shops", requireAuth, async (req: any, res) => {
    try {
      const shops = await getStorage().getAllShops(req.userId);
      res.json(shops);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shops" });
    }
  });

  app.get("/api/shops/:id", requireAuth, async (req: any, res) => {
    try {
      const shop = await getStorage().getShop(req.params.id, req.userId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.json(shop);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shop" });
    }
  });

  app.post("/api/shops", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertShopSchema.parse(req.body);
      const shop = await getStorage().createShop(validatedData, req.userId);
      res.status(201).json(shop);
    } catch (error) {
      res.status(400).json({ message: "Invalid shop data" });
    }
  });

  app.put("/api/shops/:id", requireAuth, async (req: any, res) => {
    try {
      const validatedData = updateShopSchema.parse(req.body);
      const shop = await getStorage().updateShop(req.params.id, validatedData, req.userId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.json(shop);
    } catch (error) {
      res.status(400).json({ message: "Invalid shop data" });
    }
  });

  app.delete("/api/shops/:id", requireAuth, async (req: any, res) => {
    try {
      const success = await getStorage().deleteShop(req.params.id, req.userId);
      if (!success) {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.json({ message: "Shop deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete shop" });
    }
  });

  // Shop catalog endpoints (fetch data from shop's MongoDB)
  app.get("/api/shops/:id/categories", requireAuth, async (req: any, res) => {
    try {
      const shop = await getStorage().getShop(req.params.id, req.userId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      const categories = await getShopCategories(shop.mongodbUri);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/shops/:id/products", requireAuth, async (req: any, res) => {
    try {
      const shop = await getStorage().getShop(req.params.id, req.userId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      const category = req.query.category as string | undefined;
      const products = await getShopProducts(shop.mongodbUri, category);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/shops/:id/products/:productId", requireAuth, async (req: any, res) => {
    try {
      const shop = await getStorage().getShop(req.params.id, req.userId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      const product = await getShopProductById(shop.mongodbUri, req.params.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/shops/:id/products", requireAuth, async (req: any, res) => {
    try {
      const shop = await getStorage().getShop(req.params.id, req.userId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      const validatedData = insertProductSchema.parse(req.body);
      const product = await createShopProduct(shop.mongodbUri, validatedData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.put("/api/shops/:id/products/:productId", requireAuth, async (req: any, res) => {
    try {
      const shop = await getStorage().getShop(req.params.id, req.userId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      const validatedData = updateProductSchema.parse(req.body);
      const product = await updateShopProduct(shop.mongodbUri, req.params.productId, validatedData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.delete("/api/shops/:id/products/:productId", requireAuth, async (req: any, res) => {
    try {
      const shop = await getStorage().getShop(req.params.id, req.userId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      const success = await deleteShopProduct(shop.mongodbUri, req.params.productId);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
