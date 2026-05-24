import { useState, useEffect } from "react";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

type View = "browse" | "my-apps" | "purchases" | "sell" | "app-detail";
type Platform = "web" | "ios" | "both" | undefined;

interface AppData {
  _id: Id<"apps">;
  title: string;
  description: string;
  longDescription?: string;
  price: number;
  platform: "web" | "ios" | "both";
  category: string;
  imageUrl?: string;
  sellerId: Id<"users">;
  sellerName: string;
  downloads: number;
  rating: number;
  featured: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

interface SaleData {
  _id: Id<"purchases">;
  appId: Id<"apps">;
  buyerId: Id<"users">;
  sellerId: Id<"users">;
  price: number;
  purchasedAt: number;
  app: AppData | null;
}

interface PurchaseData {
  _id: Id<"purchases">;
  appId: Id<"apps">;
  buyerId: Id<"users">;
  sellerId: Id<"users">;
  price: number;
  purchasedAt: number;
  app: AppData | null;
}

function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [view, setView] = useState<View>("browse");
  const [selectedAppId, setSelectedAppId] = useState<Id<"apps"> | null>(null);
  const [platformFilter, setPlatformFilter] = useState<Platform>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const seedApps = useMutation(api.seed.seedApps);

  useEffect(() => {
    if (isAuthenticated) {
      seedApps();
    }
  }, [isAuthenticated]);

  const openAppDetail = (id: Id<"apps">) => {
    setSelectedAppId(id);
    setView("app-detail");
  };

  const goBack = () => {
    setView("browse");
    setSelectedAppId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header
        view={view}
        setView={setView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-6 md:py-8">
        {view === "browse" && (
          <BrowseView
            platformFilter={platformFilter}
            setPlatformFilter={setPlatformFilter}
            searchQuery={searchQuery}
            onAppClick={openAppDetail}
          />
        )}
        {view === "my-apps" && <MyAppsView onAppClick={openAppDetail} />}
        {view === "purchases" && <PurchasesView onAppClick={openAppDetail} />}
        {view === "sell" && <SellView onSuccess={() => setView("my-apps")} />}
        {view === "app-detail" && selectedAppId && (
          <AppDetailView appId={selectedAppId} onBack={goBack} />
        )}
      </main>

      <Footer />
    </div>
  );
}

function AuthScreen() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      await signIn("password", formData);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-medium text-gray-900 tracking-tight">AppMarket</h1>
          <p className="mt-2 text-sm text-gray-500">Buy and sell web & iOS apps</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400"
            />
          </div>
          <div>
            <input
              name="password"
              type="password"
              placeholder="Password"
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400"
            />
          </div>
          <input name="flow" type="hidden" value={flow} />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? "..." : flow === "signIn" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {flow === "signIn" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <button
            onClick={() => signIn("anonymous")}
            className="w-full py-2.5 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Continue as guest
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Header({
  view,
  setView,
  searchQuery,
  setSearchQuery,
  mobileMenuOpen,
  setMobileMenuOpen
}: {
  view: View;
  setView: (v: View) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}) {
  const { signOut } = useAuthActions();
  const profile = useQuery(api.profiles.get);

  const navItems: { key: View; label: string }[] = [
    { key: "browse", label: "Browse" },
    { key: "my-apps", label: "My Apps" },
    { key: "purchases", label: "Purchases" },
    { key: "sell", label: "Sell" },
  ];

  return (
    <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          <button
            onClick={() => setView("browse")}
            className="text-lg font-medium text-gray-900 tracking-tight"
          >
            AppMarket
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  view === item.key
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {view === "browse" && (
              <input
                type="text"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hidden sm:block w-40 lg:w-56 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400"
              />
            )}

            <div className="hidden md:flex items-center gap-3">
              {profile && (
                <span className="text-sm text-gray-500">{profile.displayName}</span>
              )}
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sign out
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3">
            {view === "browse" && (
              <input
                type="text"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full mb-3 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400"
              />
            )}
            <nav className="flex flex-col gap-1">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => {
                    setView(item.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2 text-sm rounded-md text-left transition-colors ${
                    view === item.key
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              {profile && (
                <span className="text-sm text-gray-500">{profile.displayName}</span>
              )}
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function BrowseView({
  platformFilter,
  setPlatformFilter,
  searchQuery,
  onAppClick
}: {
  platformFilter: Platform;
  setPlatformFilter: (p: Platform) => void;
  searchQuery: string;
  onAppClick: (id: Id<"apps">) => void;
}) {
  const apps = useQuery(api.apps.list, { platform: platformFilter });
  const searchResults = useQuery(api.apps.search, { query: searchQuery });
  const featuredApps = useQuery(api.apps.getFeatured);

  const displayApps = searchQuery ? searchResults : apps;

  return (
    <div className="space-y-8">
      {!searchQuery && featuredApps && featuredApps.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Featured</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredApps.slice(0, 3).map((app: AppData) => (
              <AppCard key={app._id} app={app} onClick={() => onAppClick(app._id)} featured />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {searchQuery ? `Results for "${searchQuery}"` : "All Apps"}
          </h2>

          <div className="flex gap-2 flex-wrap">
            {(["all", "web", "ios"] as const).map(platform => (
              <button
                key={platform}
                onClick={() => setPlatformFilter(platform === "all" ? undefined : platform)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  (platform === "all" && !platformFilter) || platformFilter === platform
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {platform === "all" ? "All" : platform === "web" ? "Web" : "iOS"}
              </button>
            ))}
          </div>
        </div>

        {displayApps === undefined ? (
          <div className="text-sm text-gray-400">Loading...</div>
        ) : displayApps.length === 0 ? (
          <div className="text-sm text-gray-400 py-12 text-center">No apps found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayApps.map((app: AppData) => (
              <AppCard key={app._id} app={app} onClick={() => onAppClick(app._id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AppCard({
  app,
  onClick,
  featured
}: {
  app: AppData;
  onClick: () => void;
  featured?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group text-left w-full border border-gray-100 rounded-lg overflow-hidden hover:border-gray-200 transition-colors ${
        featured ? "bg-gray-50" : "bg-white"
      }`}
    >
      {app.imageUrl && (
        <div className="aspect-video bg-gray-100 overflow-hidden">
          <img
            src={app.imageUrl}
            alt={app.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 truncate">{app.title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{app.sellerName}</p>
          </div>
          <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
            ${app.price}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{app.description}</p>
        <div className="flex items-center gap-3 mt-3">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            app.platform === "web"
              ? "bg-blue-50 text-blue-600"
              : app.platform === "ios"
              ? "bg-purple-50 text-purple-600"
              : "bg-gray-100 text-gray-600"
          }`}>
            {app.platform === "both" ? "Web + iOS" : app.platform === "web" ? "Web" : "iOS"}
          </span>
          <span className="text-xs text-gray-400">{app.downloads} downloads</span>
          {app.rating > 0 && (
            <span className="text-xs text-gray-400">★ {app.rating.toFixed(1)}</span>
          )}
        </div>
      </div>
    </button>
  );
}

function AppDetailView({
  appId,
  onBack
}: {
  appId: Id<"apps">;
  onBack: () => void;
}) {
  const app = useQuery(api.apps.get, { id: appId });
  const hasPurchased = useQuery(api.purchases.hasPurchased, { appId });
  const purchase = useMutation(api.purchases.purchase);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("");

  const handlePurchase = async () => {
    setPurchasing(true);
    setError("");
    try {
      await purchase({ appId });
    } catch (err: any) {
      setError(err.message || "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  if (!app) {
    return <div className="text-sm text-gray-400">Loading...</div>;
  }

  return (
    <div className="max-w-3xl">
      <button
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {app.imageUrl && (
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-6">
          <img src={app.imageUrl} alt={app.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">{app.title}</h1>
          <p className="text-gray-500 mt-1">by {app.sellerName}</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-2xl font-medium text-gray-900">${app.price}</div>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <span>{app.downloads} downloads</span>
            {app.rating > 0 && <span>★ {app.rating.toFixed(1)}</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <span className={`text-xs px-2.5 py-1 rounded-full ${
          app.platform === "web"
            ? "bg-blue-50 text-blue-600"
            : app.platform === "ios"
            ? "bg-purple-50 text-purple-600"
            : "bg-gray-100 text-gray-600"
        }`}>
          {app.platform === "both" ? "Web + iOS" : app.platform === "web" ? "Web" : "iOS"}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
          {app.category}
        </span>
        {app.tags?.map((tag: string) => (
          <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-500">
            {tag}
          </span>
        ))}
      </div>

      <div className="prose prose-sm prose-gray mb-8">
        <p className="text-gray-600 leading-relaxed">{app.description}</p>
        {app.longDescription && (
          <p className="text-gray-600 leading-relaxed mt-4">{app.longDescription}</p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>
      )}

      {hasPurchased ? (
        <div className="p-4 bg-green-50 rounded-md">
          <p className="text-sm text-green-700 font-medium">You own this app</p>
          <p className="text-sm text-green-600 mt-1">Check your purchases to access download links.</p>
        </div>
      ) : (
        <button
          onClick={handlePurchase}
          disabled={purchasing}
          className="w-full sm:w-auto px-8 py-3 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {purchasing ? "Processing..." : `Purchase for $${app.price}`}
        </button>
      )}
    </div>
  );
}

function MyAppsView({ onAppClick }: { onAppClick: (id: Id<"apps">) => void }) {
  const myApps = useQuery(api.apps.getByUser);
  const sales = useQuery(api.purchases.getMySales);
  const profile = useQuery(api.profiles.get);

  const totalEarnings = sales?.reduce((sum: number, sale: SaleData) => sum + sale.price, 0) || 0;

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-4 border border-gray-100 rounded-lg">
          <div className="text-2xl font-medium text-gray-900">{myApps?.length || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Listed Apps</div>
        </div>
        <div className="p-4 border border-gray-100 rounded-lg">
          <div className="text-2xl font-medium text-gray-900">{sales?.length || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Total Sales</div>
        </div>
        <div className="col-span-2 sm:col-span-1 p-4 border border-gray-100 rounded-lg">
          <div className="text-2xl font-medium text-gray-900">${totalEarnings}</div>
          <div className="text-sm text-gray-500 mt-1">Total Earnings</div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Your Listings</h2>

        {myApps === undefined ? (
          <div className="text-sm text-gray-400">Loading...</div>
        ) : myApps.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500">No apps listed yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first listing to start selling</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myApps.map((app: AppData) => (
              <AppCard key={app._id} app={app} onClick={() => onAppClick(app._id)} />
            ))}
          </div>
        )}
      </section>

      {sales && sales.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Recent Sales</h2>
          <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
            {sales.slice(0, 5).map((sale: SaleData) => (
              <div key={sale._id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{sale.app?.title || "Unknown App"}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(sale.purchasedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-sm font-medium text-green-600">+${sale.price}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PurchasesView({ onAppClick }: { onAppClick: (id: Id<"apps">) => void }) {
  const purchases = useQuery(api.purchases.getMyPurchases);

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Your Purchases</h2>

      {purchases === undefined ? (
        <div className="text-sm text-gray-400">Loading...</div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500">No purchases yet</p>
          <p className="text-sm text-gray-400 mt-1">Browse the marketplace to find apps</p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
          {purchases.map((purchase: PurchaseData) => (
            <button
              key={purchase._id}
              onClick={() => purchase.app && onAppClick(purchase.appId)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                {purchase.app?.imageUrl && (
                  <img
                    src={purchase.app.imageUrl}
                    alt={purchase.app?.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <div className="font-medium text-gray-900">{purchase.app?.title || "Unknown App"}</div>
                  <div className="text-sm text-gray-500">
                    Purchased {new Date(purchase.purchasedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">${purchase.price}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SellView({ onSuccess }: { onSuccess: () => void }) {
  const createApp = useMutation(api.apps.create);
  const becomeSeller = useMutation(api.profiles.becomeSeller);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await becomeSeller();
      await createApp({
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        longDescription: formData.get("longDescription") as string || undefined,
        price: parseFloat(formData.get("price") as string),
        platform: formData.get("platform") as "web" | "ios" | "both",
        category: formData.get("category") as string,
        imageUrl: formData.get("imageUrl") as string || undefined,
        tags: (formData.get("tags") as string).split(",").map(t => t.trim()).filter(Boolean),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-medium text-gray-900 mb-6">Create a Listing</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
          <input
            name="title"
            type="text"
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400"
            placeholder="My Awesome App"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
          <input
            name="description"
            type="text"
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400"
            placeholder="A brief one-line description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
          <textarea
            name="longDescription"
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 resize-none"
            placeholder="Detailed description of features, benefits, etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input
              name="price"
              type="number"
              min="0"
              step="1"
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400"
              placeholder="29"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select
              name="platform"
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="web">Web</option>
              <option value="ios">iOS</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            name="category"
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 bg-white"
          >
            <option value="Productivity">Productivity</option>
            <option value="Design">Design</option>
            <option value="Developer Tools">Developer Tools</option>
            <option value="Finance">Finance</option>
            <option value="Health">Health</option>
            <option value="Education">Education</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Social">Social</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <input
            name="imageUrl"
            type="url"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400"
            placeholder="https://example.com/screenshot.png"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <input
            name="tags"
            type="text"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400"
            placeholder="productivity, saas, tool (comma-separated)"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Listing"}
        </button>
      </form>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 py-4 mt-auto">
      <p className="text-center text-xs text-gray-400">
        Requested by @flipflipyy · Built by @clonkbot
      </p>
    </footer>
  );
}

export default App;
