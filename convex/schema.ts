import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  apps: defineTable({
    title: v.string(),
    description: v.string(),
    longDescription: v.optional(v.string()),
    price: v.number(),
    platform: v.union(v.literal("web"), v.literal("ios"), v.literal("both")),
    category: v.string(),
    imageUrl: v.optional(v.string()),
    sellerId: v.id("users"),
    sellerName: v.string(),
    downloads: v.number(),
    rating: v.number(),
    featured: v.boolean(),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_seller", ["sellerId"])
    .index("by_platform", ["platform"])
    .index("by_category", ["category"])
    .index("by_featured", ["featured"])
    .searchIndex("search_apps", {
      searchField: "title",
      filterFields: ["platform", "category"],
    }),

  purchases: defineTable({
    appId: v.id("apps"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    price: v.number(),
    purchasedAt: v.number(),
  })
    .index("by_buyer", ["buyerId"])
    .index("by_seller", ["sellerId"])
    .index("by_app", ["appId"])
    .index("by_buyer_and_app", ["buyerId", "appId"]),

  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    isSeller: v.boolean(),
    totalSales: v.number(),
    totalEarnings: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
