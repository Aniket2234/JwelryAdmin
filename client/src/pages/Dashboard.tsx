import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { Store, Plus, Settings, LogOut, BookOpen, TrendingUp, Package, Tag, Activity, TrendingDown } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface MetalRates {
  gold_24k: string;
  gold_22k: string;
  silver: string;
  lastUpdated: string;
}

interface Shop {
  _id: string;
  name: string;
  imageUrl: string;
  mongodbUri: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  totalShops: number;
  totalProducts: number;
  totalCategories: number;
  uniqueCategories: number;
  recentShops: Shop[];
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  // Fetch shops using react-query
  const { data: shops = [], isLoading: shopsLoading } = useQuery<Shop[]>({
    queryKey: ['/api/shops'],
  });

  // Fetch analytics using react-query
  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ['/api/analytics'],
  });

  // Fetch live metal rates (no authentication required)
  const { data: metalRates, isLoading: ratesLoading } = useQuery<MetalRates>({
    queryKey: ['/api/rates'],
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  });

  const isLoading = shopsLoading || analyticsLoading;

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  // Delete shop mutation
  const deleteShopMutation = useMutation({
    mutationFn: async (shopId: string) => {
      return await apiRequest('DELETE', `/api/shops/${shopId}`);
    },
    onSuccess: () => {
      // Invalidate both shops and analytics queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/shops'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    },
  });

  const handleDeleteShop = async (shopId: string) => {
    if (!confirm('Are you sure you want to delete this shop?')) {
      return;
    }
    deleteShopMutation.mutate(shopId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="border-b border-amber-200 bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Jewelry Shop Admin Panel
            </h1>
            <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/settings')}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Live Metal Rates Section */}
        {metalRates && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-amber-600" />
              Live Gold & Silver Rates (India)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="border-amber-300 bg-gradient-to-br from-yellow-50 via-amber-50 to-white shadow-lg" data-testid="card-gold-24k">
                <CardHeader className="pb-3">
                  <CardDescription className="text-gray-600 font-medium">24K Gold</CardDescription>
                  <CardTitle className="text-4xl font-bold text-amber-600 flex items-center gap-2">
                    <TrendingUp className="w-8 h-8 text-amber-500" />
                    {metalRates.gold_24k}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Per 10 grams</p>
                  <p className="text-xs text-gray-400 mt-1">
                    IBJA Rates • {new Date(metalRates.lastUpdated).toLocaleTimeString('en-IN', { 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-orange-300 bg-gradient-to-br from-orange-50 via-amber-50 to-white shadow-lg" data-testid="card-gold-22k">
                <CardHeader className="pb-3">
                  <CardDescription className="text-gray-600 font-medium">22K Gold</CardDescription>
                  <CardTitle className="text-4xl font-bold text-orange-600 flex items-center gap-2">
                    <TrendingUp className="w-8 h-8 text-orange-500" />
                    {metalRates.gold_22k}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Per 10 grams</p>
                  <p className="text-xs text-gray-400 mt-1">
                    IBJA Rates • {new Date(metalRates.lastUpdated).toLocaleTimeString('en-IN', { 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-300 bg-gradient-to-br from-gray-50 via-slate-50 to-white shadow-lg" data-testid="card-silver">
                <CardHeader className="pb-3">
                  <CardDescription className="text-gray-600 font-medium">Silver</CardDescription>
                  <CardTitle className="text-4xl font-bold text-gray-600 flex items-center gap-2">
                    <TrendingDown className="w-8 h-8 text-gray-500" />
                    {metalRates.silver}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Per 1 kilogram</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Estimated • {new Date(metalRates.lastUpdated).toLocaleTimeString('en-IN', { 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {analytics && analytics.totalShops > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-amber-600" />
              Analytics Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white" data-testid="card-analytics-shops">
                <CardHeader className="pb-2">
                  <CardDescription className="text-gray-600">Total Shops</CardDescription>
                  <CardTitle className="text-3xl text-amber-600 flex items-center gap-2">
                    <Store className="w-6 h-6" />
                    {analytics.totalShops}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500">Actively managed</p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white" data-testid="card-analytics-products">
                <CardHeader className="pb-2">
                  <CardDescription className="text-gray-600">Total Products</CardDescription>
                  <CardTitle className="text-3xl text-orange-600 flex items-center gap-2">
                    <Package className="w-6 h-6" />
                    {analytics.totalProducts}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500">Across all shops</p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white" data-testid="card-analytics-categories">
                <CardHeader className="pb-2">
                  <CardDescription className="text-gray-600">Total Categories</CardDescription>
                  <CardTitle className="text-3xl text-amber-600 flex items-center gap-2">
                    <Tag className="w-6 h-6" />
                    {analytics.totalCategories}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500">{analytics.uniqueCategories} unique types</p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white" data-testid="card-analytics-activity">
                <CardHeader className="pb-2">
                  <CardDescription className="text-gray-600">Average Products</CardDescription>
                  <CardTitle className="text-3xl text-orange-600 flex items-center gap-2">
                    <Activity className="w-6 h-6" />
                    {analytics.totalShops > 0 ? Math.round(analytics.totalProducts / analytics.totalShops) : 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500">Per shop</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Section */}
            {analytics.recentShops.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-amber-600" />
                  Recent Activity
                </h2>
                <Card className="border-amber-200">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {analytics.recentShops.map((shop) => (
                        <div
                          key={shop._id}
                          className="flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                          onClick={() => setLocation(`/shops/${shop._id}/catalog`)}
                          data-testid={`activity-shop-${shop._id}`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={shop.imageUrl}
                              alt={shop.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <h3 className="font-semibold text-gray-800">{shop.name}</h3>
                              <p className="text-sm text-gray-600">
                                Added {new Date(shop.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-300 text-amber-700 hover:bg-amber-200"
                            data-testid={`button-view-shop-${shop._id}`}
                          >
                            View Catalog
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Your Jewelry Shops</h2>
          <Button
            onClick={() => setLocation('/shops/new')}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            data-testid="button-add-shop"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Shop
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            <p className="mt-4 text-gray-600">Loading shops...</p>
          </div>
        ) : shops.length === 0 ? (
          <Card className="border-amber-200" data-testid="card-empty-shops">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Store className="w-16 h-16 text-amber-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No shops yet</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first jewelry shop</p>
              <Button
                onClick={() => setLocation('/shops/new')}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                data-testid="button-add-first-shop"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Shop
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <Card key={shop._id} className="border-amber-200 hover:shadow-lg transition-shadow" data-testid={`card-shop-${shop._id}`}>
                <CardHeader>
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100 mb-4">
                    <img
                      src={shop.imageUrl}
                      alt={shop.name}
                      className="w-full h-full object-cover"
                      data-testid={`img-shop-${shop._id}`}
                    />
                  </div>
                  <CardTitle className="text-xl text-gray-800" data-testid={`text-shop-name-${shop._id}`}>{shop.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {shop.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    {shop.address && (
                      <p className="truncate">📍 {shop.address}</p>
                    )}
                    {shop.phone && (
                      <p className="truncate">📞 {shop.phone}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setLocation(`/shops/${shop._id}/catalog`)}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                      data-testid={`button-catalog-${shop._id}`}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Catalog
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/shops/${shop._id}/edit`)}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      data-testid={`button-edit-${shop._id}`}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteShop(shop._id)}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      data-testid={`button-delete-${shop._id}`}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-white/80 px-3 py-1 rounded-full shadow">
        Made by Airavata Technologies
      </div>
    </div>
  );
}
