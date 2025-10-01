import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function ShopForm() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const { sessionId } = useAuth();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    mongodbUri: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchShop();
    }
  }, [id]);

  const fetchShop = async () => {
    try {
      const response = await fetch(`/api/shops/${id}`, {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (response.ok) {
        const shop = await response.json();
        setFormData({
          name: shop.name,
          imageUrl: shop.imageUrl,
          mongodbUri: shop.mongodbUri,
          description: shop.description || '',
          address: shop.address || '',
          phone: shop.phone || '',
          email: shop.email || '',
          website: shop.website || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch shop:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const url = isEditing ? `/api/shops/${id}` : '/api/shops';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionId}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save shop');
      }

      setLocation('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save shop');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => setLocation('/dashboard')}
          className="mb-4 text-amber-700 hover:text-amber-800 hover:bg-amber-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="border-amber-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {isEditing ? 'Edit Shop' : 'Add New Shop'}
            </CardTitle>
            <CardDescription>
              {isEditing ? 'Update your jewelry shop information' : 'Add a new jewelry shop to your admin panel'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Shop Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Golden Jewelers"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Shop Image URL *</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  placeholder="https://example.com/shop-image.jpg"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  required
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mongodbUri">MongoDB URI *</Label>
                <Input
                  id="mongodbUri"
                  name="mongodbUri"
                  type="text"
                  placeholder="mongodb+srv://username:password@cluster.mongodb.net/database"
                  value={formData.mongodbUri}
                  onChange={handleChange}
                  required
                  className="border-amber-200 focus:border-amber-500"
                />
                <p className="text-xs text-gray-500">
                  The MongoDB connection string for this shop's database
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of the shop..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="123 Main St, City, State"
                  value={formData.address}
                  onChange={handleChange}
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={handleChange}
                    className="border-amber-200 focus:border-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="shop@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="border-amber-200 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://shop.example.com"
                  value={formData.website}
                  onChange={handleChange}
                  className="border-amber-200 focus:border-amber-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/dashboard')}
                  className="flex-1 border-gray-300"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : isEditing ? 'Update Shop' : 'Add Shop'}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>

        <div className="text-center mt-4 text-xs text-gray-500">
          Made by Airavata Technologies
        </div>
      </div>
    </div>
  );
}
