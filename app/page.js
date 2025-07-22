'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ShoppingCart, Search, Filter, Star, Heart, Menu, User, Package, Settings, LogOut, LogIn, UserPlus } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

export default function App() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Sample data for immediate demo (will be replaced with API calls)
  useEffect(() => {
    const sampleProducts = [
      {
        id: '1',
        name: 'Premium Luxury Watch',
        price: 2499.99,
        originalPrice: 2999.99,
        category: 'watches',
        image: 'https://images.unsplash.com/photo-1610888968213-4f6d2068108',
        description: 'Exquisite timepiece crafted with precision and elegance',
        rating: 4.8,
        reviews: 124,
        variants: [
          { id: '1-silver', name: 'Silver', price: 2499.99, stock: 15 },
          { id: '1-gold', name: 'Gold', price: 2799.99, stock: 8 }
        ],
        inStock: true,
        isNew: true
      },
      {
        id: '2',
        name: 'Premium Skincare Set',
        price: 149.99,
        originalPrice: 199.99,
        category: 'beauty',
        image: 'https://images.unsplash.com/photo-1740490278517-21ec451914f6',
        description: 'Luxury skincare collection for radiant, healthy skin',
        rating: 4.9,
        reviews: 89,
        variants: [
          { id: '2-normal', name: 'Normal Skin', price: 149.99, stock: 25 },
          { id: '2-sensitive', name: 'Sensitive Skin', price: 159.99, stock: 12 }
        ],
        inStock: true,
        isNew: false
      },
      {
        id: '3',
        name: 'Designer Home Collection',
        price: 899.99,
        category: 'home',
        image: 'https://images.unsplash.com/photo-1700713041101-0b2a46417c15',
        description: 'Transform your space with our premium home collection',
        rating: 4.7,
        reviews: 67,
        variants: [
          { id: '3-modern', name: 'Modern Style', price: 899.99, stock: 6 },
          { id: '3-classic', name: 'Classic Style', price: 949.99, stock: 4 }
        ],
        inStock: true,
        isNew: true
      },
      {
        id: '4',
        name: 'Luxury Lifestyle Accessories',
        price: 299.99,
        originalPrice: 399.99,
        category: 'accessories',
        image: 'https://images.unsplash.com/photo-1698612059658-7ca81326a140',
        description: 'Elevate your everyday with our premium accessories',
        rating: 4.6,
        reviews: 156,
        variants: [
          { id: '4-black', name: 'Midnight Black', price: 299.99, stock: 20 },
          { id: '4-brown', name: 'Cognac Brown', price: 319.99, stock: 15 }
        ],
        inStock: true,
        isNew: false
      }
    ]

    const sampleCategories = [
      { id: 'all', name: 'All Products', count: 4 },
      { id: 'watches', name: 'Luxury Watches', count: 1 },
      { id: 'beauty', name: 'Beauty & Skincare', count: 1 },
      { id: 'home', name: 'Home & Living', count: 1 },
      { id: 'accessories', name: 'Accessories', count: 1 }
    ]

    setProducts(sampleProducts)
    setCategories(sampleCategories)
    setIsLoading(false)
  }, [])

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const addToCart = (product, variant = null) => {
    const cartItem = {
      id: variant ? variant.id : product.id,
      productId: product.id,
      name: product.name,
      variant: variant?.name || 'Default',
      price: variant?.price || product.price,
      image: product.image,
      quantity: 1
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === cartItem.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.id === cartItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, cartItem]
    })
  }

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(itemId)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">Bad-Wolf®</span>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search premium products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-4">
            <UserMenu />
            
            <Button variant="ghost" size="icon" onClick={() => window.open('/admin', '_blank')}>
              <Settings className="h-5 w-5" />
            </Button>
            
            {/* Shopping Cart */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemsCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs">
                      {cartItemsCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Shopping Cart ({cartItemsCount})</SheetTitle>
                  <SheetDescription>
                    Review your selected items
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-8">
                  {cart.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center space-x-4 border-b pb-4">
                            <img src={item.image} alt={item.name} className="h-16 w-16 rounded-md object-cover" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">{item.variant}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                >
                                  -
                                </Button>
                                <span className="px-2">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.id)}
                                className="text-destructive"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-4" />
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-lg font-semibold">
                          <span>Total: ${cartTotal.toFixed(2)}</span>
                        </div>
                        <Button className="w-full" size="lg">
                          Proceed to Checkout
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden border-t p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search premium products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-96 md:h-[500px] bg-gradient-to-r from-primary/10 to-secondary/10">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1725121688291-ed19354b618b')`
          }}
        />
        <div className="relative container h-full flex items-center justify-center text-center text-white">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Discover Premium
              <span className="block text-primary">Bad-Wolf® Collection</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Elevate your lifestyle with our curated selection of luxury products
            </p>
            <Button size="lg" className="text-lg px-8 py-3">
              Shop Now
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories & Filters */}
          <aside className="lg:w-64 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                    <Badge variant="secondary" className="ml-auto">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {selectedCategory === 'all' ? 'All Products' : 
                  categories.find(c => c.id === selectedCategory)?.name || 'Products'}
              </h2>
              <Select defaultValue="featured">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-square bg-muted rounded-t-lg" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                      />
                      {product.isNew && (
                        <Badge className="absolute top-2 left-2">
                          New
                        </Badge>
                      )}
                      {product.originalPrice && (
                        <Badge variant="destructive" className="absolute top-2 right-2">
                          Sale
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(product.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ({product.reviews})
                        </span>
                      </div>
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">
                            ${product.price}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              ${product.originalPrice}
                            </span>
                          )}
                        </div>
                        {product.inStock ? (
                          <Badge variant="secondary">In Stock</Badge>
                        ) : (
                          <Badge variant="destructive">Out of Stock</Badge>
                        )}
                      </div>
                      
                      {/* Product Variants */}
                      {product.variants && product.variants.length > 1 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium mb-2">Variants:</p>
                          <div className="flex flex-wrap gap-1">
                            {product.variants.map((variant) => (
                              <Button
                                key={variant.id}
                                variant="outline"
                                size="sm"
                                onClick={() => addToCart(product, variant)}
                                disabled={variant.stock === 0}
                              >
                                {variant.name} - ${variant.price}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button 
                        className="w-full" 
                        onClick={() => addToCart(product)}
                        disabled={!product.inStock}
                      >
                        Add to Cart
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredProducts.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-12">
        <div className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Package className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-primary">Bad-Wolf®</span>
              </div>
              <p className="text-muted-foreground">
                Premium e-commerce experience with luxury products and exceptional service.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About Us</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
                <li><a href="#" className="hover:text-foreground">Shipping</a></li>
                <li><a href="#" className="hover:text-foreground">Returns</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Luxury Watches</a></li>
                <li><a href="#" className="hover:text-foreground">Beauty & Skincare</a></li>
                <li><a href="#" className="hover:text-foreground">Home & Living</a></li>
                <li><a href="#" className="hover:text-foreground">Accessories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">FAQ</a></li>
                <li><a href="#" className="hover:text-foreground">Size Guide</a></li>
                <li><a href="#" className="hover:text-foreground">Track Order</a></li>
                <li><a href="#" className="hover:text-foreground">Customer Service</a></li>
              </ul>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2025 Bad-Wolf®. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-foreground">Privacy Policy</a>
              <a href="#" className="hover:text-foreground">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}