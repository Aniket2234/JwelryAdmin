import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  displayOrder: number;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  tags: string[];
  featured: boolean;
  inStock: boolean;
  displayOrder: number;
  subImages: string[];
  isNewArrival: boolean;
  isNewTrend: boolean;
  gender?: string;
  occasion?: string;
  purity?: string;
  stone?: string;
  weight?: string;
}

export default function ShopCatalog() {
  const [, setLocation] = useLocation();
  const { id: shopId } = useParams();
  const { sessionId } = useAuth();

  const [shop, setShop] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    imageUrl: '',
    category: '',
    tags: '',
    featured: false,
    inStock: true,
    displayOrder: 0,
    subImages: ['', '', '', ''],
    isNewArrival: false,
    isNewTrend: false,
    gender: '',
    occasion: '',
    purity: '',
    stone: '',
    weight: '',
  });

  useEffect(() => {
    fetchShopData();
  }, [shopId]);

  useEffect(() => {
    if (categories.length > 0) {
      fetchProducts();
    }
  }, [selectedCategory, categories]);

  const fetchShopData = async () => {
    try {
      const [shopRes, categoriesRes] = await Promise.all([
        fetch(`/api/shops/${shopId}`, {
          headers: { Authorization: `Bearer ${sessionId}` },
        }),
        fetch(`/api/shops/${shopId}/categories`, {
          headers: { Authorization: `Bearer ${sessionId}` },
        }),
      ]);

      if (shopRes.ok) {
        const shopData = await shopRes.json();
        setShop(shopData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Failed to fetch shop data:', error);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const url = selectedCategory === 'all'
        ? `/api/shops/${shopId}/products`
        : `/api/shops/${shopId}/products?category=${selectedCategory}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${sessionId}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      // Find matching category (case-insensitive) to ensure dropdown shows correct value
      const matchingCategory = categories.find(
        cat => cat.name.toLowerCase() === product.category.toLowerCase()
      );
      
      setProductForm({
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice || 0,
        imageUrl: product.imageUrl,
        category: matchingCategory?.name || product.category,
        tags: product.tags.join(', '),
        featured: product.featured,
        inStock: product.inStock,
        displayOrder: product.displayOrder,
        subImages: [
          product.subImages?.[0] || '',
          product.subImages?.[1] || '',
          product.subImages?.[2] || '',
          product.subImages?.[3] || '',
        ],
        isNewArrival: product.isNewArrival || false,
        isNewTrend: product.isNewTrend || false,
        gender: product.gender || '',
        occasion: product.occasion || '',
        purity: product.purity || '',
        stone: product.stone || '',
        weight: product.weight || '',
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: 0,
        originalPrice: 0,
        imageUrl: '',
        category: categories[0]?.name || '',
        tags: '',
        featured: false,
        inStock: true,
        displayOrder: 0,
        subImages: ['', '', '', ''],
        isNewArrival: false,
        isNewTrend: false,
        gender: '',
        occasion: '',
        purity: '',
        stone: '',
        weight: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    try {
      const productData = {
        ...productForm,
        tags: productForm.tags.split(',').map(t => t.trim()).filter(t => t),
        price: Number(productForm.price),
        originalPrice: Number(productForm.originalPrice) || undefined,
        displayOrder: Number(productForm.displayOrder),
        subImages: productForm.subImages.filter(img => img.trim() !== ''),
        gender: productForm.gender || undefined,
        occasion: productForm.occasion || undefined,
        purity: productForm.purity || undefined,
        stone: productForm.stone || undefined,
        weight: productForm.weight || undefined,
      };

      const url = editingProduct
        ? `/api/shops/${shopId}/products/${editingProduct._id}`
        : `/api/shops/${shopId}/products`;
      
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionId}`,
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`/api/shops/${shopId}/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionId}` },
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-8">
      <div className="container mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => setLocation('/dashboard')}
          className="mb-4 text-amber-700 hover:text-amber-800 hover:bg-amber-50"
          data-testid="button-back-dashboard"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {shop?.name} - Catalog
            </h1>
            <p className="text-gray-600 mt-1">Manage products and categories</p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            data-testid="button-add-product"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        <div className="mb-6">
          <Label className="text-gray-700">Filter by Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-64 border-amber-200 mt-2" data-testid="select-category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="selectitem-category-all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category._id} value={category.name} data-testid={`selectitem-category-${category._id}`}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <Card className="border-amber-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">Add products to this shop's catalog</p>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                data-testid="button-add-first-product"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product._id} className="border-amber-200 hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-gray-100">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      data-testid={`img-product-${product._id}`}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg mb-2" data-testid={`text-product-name-${product._id}`}>{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mb-3" data-testid={`text-product-description-${product._id}`}>
                    {product.description}
                  </CardDescription>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl font-bold text-amber-600" data-testid={`text-product-price-${product._id}`}>
                      ${product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-3 text-xs">
                    <span className={`px-2 py-1 rounded ${product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} data-testid={`status-stock-${product._id}`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                    {product.featured && (
                      <span className="px-2 py-1 rounded bg-amber-100 text-amber-700" data-testid={`status-featured-${product._id}`}>
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(product)}
                      className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                      data-testid={`button-edit-${product._id}`}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteProduct(product._id)}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      data-testid={`button-delete-${product._id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product information' : 'Add a new product to the catalog'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="border-amber-200"
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="border-amber-200"
                rows={3}
                data-testid="textarea-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                  className="border-amber-200"
                  data-testid="input-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  value={productForm.originalPrice}
                  onChange={(e) => setProductForm({ ...productForm, originalPrice: parseFloat(e.target.value) })}
                  className="border-amber-200"
                  data-testid="input-originalprice"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL *</Label>
              <Input
                id="imageUrl"
                value={productForm.imageUrl}
                onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                className="border-amber-200"
                data-testid="input-imageurl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={productForm.category}
                onValueChange={(value) => setProductForm({ ...productForm, category: value })}
              >
                <SelectTrigger className="border-amber-200" data-testid="select-product-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category.name} data-testid={`selectitem-product-category-${category._id}`}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={productForm.tags}
                onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                placeholder="gold, ring, diamond"
                className="border-amber-200"
                data-testid="input-tags"
              />
            </div>

            <div className="space-y-2">
              <Label>Sub Images (up to 4 additional images)</Label>
              {productForm.subImages.map((subImage, index) => (
                <Input
                  key={index}
                  placeholder={`Sub Image ${index + 1} URL`}
                  value={subImage}
                  onChange={(e) => {
                    const newSubImages = [...productForm.subImages];
                    newSubImages[index] = e.target.value;
                    setProductForm({ ...productForm, subImages: newSubImages });
                  }}
                  className="border-amber-200"
                  data-testid={`input-subimage-${index}`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Input
                  id="gender"
                  value={productForm.gender}
                  onChange={(e) => setProductForm({ ...productForm, gender: e.target.value })}
                  placeholder="e.g., Women, Men, Unisex"
                  className="border-amber-200"
                  data-testid="input-gender"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occasion">Occasion</Label>
                <Input
                  id="occasion"
                  value={productForm.occasion}
                  onChange={(e) => setProductForm({ ...productForm, occasion: e.target.value })}
                  placeholder="e.g., Bridal, Casual, Party"
                  className="border-amber-200"
                  data-testid="input-occasion"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purity">Purity</Label>
                <Input
                  id="purity"
                  value={productForm.purity}
                  onChange={(e) => setProductForm({ ...productForm, purity: e.target.value })}
                  placeholder="e.g., 18K, 22K, 24K"
                  className="border-amber-200"
                  data-testid="input-purity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stone">Stone</Label>
                <Input
                  id="stone"
                  value={productForm.stone}
                  onChange={(e) => setProductForm({ ...productForm, stone: e.target.value })}
                  placeholder="e.g., Diamond, Ruby, Emerald"
                  className="border-amber-200"
                  data-testid="input-stone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                value={productForm.weight}
                onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })}
                placeholder="e.g., 20g+, 15g"
                className="border-amber-200"
                data-testid="input-weight"
              />
            </div>

            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="inStock"
                  checked={productForm.inStock}
                  onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                  className="border-amber-300"
                  data-testid="checkbox-instock"
                />
                <Label htmlFor="inStock">In Stock</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={productForm.featured}
                  onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                  className="border-amber-300"
                  data-testid="checkbox-featured"
                />
                <Label htmlFor="featured">Featured</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isNewArrival"
                  checked={productForm.isNewArrival}
                  onChange={(e) => setProductForm({ ...productForm, isNewArrival: e.target.checked })}
                  className="border-amber-300"
                  data-testid="checkbox-newarrival"
                />
                <Label htmlFor="isNewArrival">New Arrival</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isNewTrend"
                  checked={productForm.isNewTrend}
                  onChange={(e) => setProductForm({ ...productForm, isNewTrend: e.target.checked })}
                  className="border-amber-300"
                  data-testid="checkbox-newtrend"
                />
                <Label htmlFor="isNewTrend">New Trend</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                value={productForm.displayOrder}
                onChange={(e) => setProductForm({ ...productForm, displayOrder: parseInt(e.target.value) })}
                className="border-amber-200"
                data-testid="input-displayorder"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleSaveProduct}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              data-testid="button-save-product"
            >
              {editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-white/80 px-3 py-1 rounded-full shadow">
        Made by Airavata Technologies
      </div>
    </div>
  );
}
