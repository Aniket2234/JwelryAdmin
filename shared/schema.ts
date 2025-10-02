import { z } from "zod";

// Admin User Schema
export const userSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  password: z.string(),
  name: z.string(),
  createdAt: z.date(),
});

export const insertUserSchema = userSchema.omit({ _id: true, createdAt: true });
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;

// Shop Schema
export const shopSchema = z.object({
  _id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  mongodbUri: z.string().refine((uri) => {
    // Basic validation: must be a mongodb or mongodb+srv URI
    return uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
  }, { message: "MongoDB URI must start with mongodb:// or mongodb+srv://" }),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertShopSchema = shopSchema.omit({ _id: true, ownerId: true, createdAt: true, updatedAt: true });
export const updateShopSchema = insertShopSchema.partial();

export type Shop = z.infer<typeof shopSchema>;
export type InsertShop = z.infer<typeof insertShopSchema>;
export type UpdateShop = z.infer<typeof updateShopSchema>;

// Category Schema (from shop's MongoDB)
export const categorySchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  icon: z.string().optional(),
  displayOrder: z.number().default(0),
});

export type Category = z.infer<typeof categorySchema>;

// Product Schema (from shop's MongoDB)
export const productSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  originalPrice: z.number().optional(),
  imageUrl: z.string(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  inStock: z.boolean().default(true),
  displayOrder: z.number().default(0),
  // New fields
  subImages: z.array(z.string()).default([]),
  isNewArrival: z.boolean().default(false),
  isNewTrend: z.boolean().default(false),
  gender: z.string().optional(),
  occasion: z.string().optional(),
  purity: z.string().optional(),
  stone: z.string().optional(),
  weight: z.string().optional(),
});

export const insertProductSchema = productSchema.omit({ _id: true });
export const updateProductSchema = insertProductSchema.partial();

export type Product = z.infer<typeof productSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
