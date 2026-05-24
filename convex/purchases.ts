import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const purchase = mutation({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const app = await ctx.db.get(args.appId);
    if (!app) throw new Error("App not found");

    // Check if already purchased
    const existing = await ctx.db
      .query("purchases")
      .withIndex("by_buyer_and_app", (q) =>
        q.eq("buyerId", userId).eq("appId", args.appId)
      )
      .first();

    if (existing) throw new Error("Already purchased");

    // Can't purchase your own app
    if (app.sellerId === userId) throw new Error("Cannot purchase your own app");

    // Create purchase
    await ctx.db.insert("purchases", {
      appId: args.appId,
      buyerId: userId,
      sellerId: app.sellerId,
      price: app.price,
      purchasedAt: Date.now(),
    });

    // Update app downloads
    await ctx.db.patch(args.appId, {
      downloads: app.downloads + 1,
    });

    // Update seller earnings
    const sellerProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", app.sellerId))
      .first();

    if (sellerProfile) {
      await ctx.db.patch(sellerProfile._id, {
        totalSales: sellerProfile.totalSales + 1,
        totalEarnings: sellerProfile.totalEarnings + app.price,
      });
    }

    return { success: true };
  },
});

export const getMyPurchases = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_buyer", (q) => q.eq("buyerId", userId))
      .order("desc")
      .collect();

    const purchasesWithApps = await Promise.all(
      purchases.map(async (purchase) => {
        const app = await ctx.db.get(purchase.appId);
        return { ...purchase, app };
      })
    );

    return purchasesWithApps;
  },
});

export const getMySales = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const sales = await ctx.db
      .query("purchases")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId))
      .order("desc")
      .collect();

    const salesWithApps = await Promise.all(
      sales.map(async (sale) => {
        const app = await ctx.db.get(sale.appId);
        return { ...sale, app };
      })
    );

    return salesWithApps;
  },
});

export const hasPurchased = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_buyer_and_app", (q) =>
        q.eq("buyerId", userId).eq("appId", args.appId)
      )
      .first();

    return !!purchase;
  },
});
