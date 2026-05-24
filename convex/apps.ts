import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    platform: v.optional(v.union(v.literal("web"), v.literal("ios"), v.literal("both"))),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let apps = await ctx.db.query("apps").order("desc").collect();

    if (args.platform) {
      apps = apps.filter(app => app.platform === args.platform || app.platform === "both");
    }
    if (args.category) {
      apps = apps.filter(app => app.category === args.category);
    }

    return apps;
  },
});

export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("apps")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("apps") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("apps")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    longDescription: v.optional(v.string()),
    price: v.number(),
    platform: v.union(v.literal("web"), v.literal("ios"), v.literal("both")),
    category: v.string(),
    imageUrl: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const sellerName = profile?.displayName || user?.email || "Anonymous";

    return await ctx.db.insert("apps", {
      ...args,
      sellerId: userId,
      sellerName,
      downloads: 0,
      rating: 0,
      featured: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("apps"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    longDescription: v.optional(v.string()),
    price: v.optional(v.number()),
    platform: v.optional(v.union(v.literal("web"), v.literal("ios"), v.literal("both"))),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const app = await ctx.db.get(args.id);
    if (!app || app.sellerId !== userId) throw new Error("Not authorized");

    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("apps") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const app = await ctx.db.get(args.id);
    if (!app || app.sellerId !== userId) throw new Error("Not authorized");

    await ctx.db.delete(args.id);
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];

    const results = await ctx.db
      .query("apps")
      .withSearchIndex("search_apps", (q) => q.search("title", args.query))
      .collect();

    return results;
  },
});
