import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { Store, Plus, Settings, LogOut, BookOpen } from 'lucide-react';

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

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, sessionId, logout } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/shops', {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShops(data);
      }
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const handleDeleteShop = async (shopId: string) => {
    if (!confirm('Are you sure you want to delete this shop?')) {
      return;
    }

    try {
      const response = await fetch(`/api/shops/${shopId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (response.ok) {
        setShops(shops.filter(shop => shop._id !== shopId));
      }
    } catch (error) {
      console.error('Failed to delete shop:', error);
    }
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Your Jewelry Shops</h2>
          <Button
            onClick={() => setLocation('/shops/new')}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
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
          <Card className="border-amber-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Store className="w-16 h-16 text-amber-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No shops yet</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first jewelry shop</p>
              <Button
                onClick={() => setLocation('/shops/new')}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Shop
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <Card key={shop._id} className="border-amber-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100 mb-4">
                    <img
                      src={shop.imageUrl}
                      alt={shop.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle className="text-xl text-gray-800">{shop.name}</CardTitle>
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
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Catalog
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/shops/${shop._id}/edit`)}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteShop(shop._id)}
                      className="border-red-300 text-red-700 hover:bg-red-50"
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
