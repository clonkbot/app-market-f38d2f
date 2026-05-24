import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const createOrUpdate = mutation({
  args: {
    displayName: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    isSeller: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: args.displayName,
        bio: args.bio,
        avatarUrl: args.avatarUrl,
        isSeller: args.isSeller ?? existing.isSeller,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("profiles", {
        userId,
        displayName: args.displayName,
        bio: args.bio,
        avatarUrl: args.avatarUrl,
        isSeller: args.isSeller ?? false,
        totalSales: 0,
        totalEarnings: 0,
        createdAt: Date.now(),
      });
    }
  },
});

export const becomeSeller = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { isSeller: true });
    } else {
      const user = await ctx.db.get(userId);
      await ctx.db.insert("profiles", {
        userId,
        displayName: user?.email?.split("@")[0] || "User",
        isSeller: true,
        totalSales: 0,
        totalEarnings: 0,
        createdAt: Date.now(),
      });
    }
  },
});
