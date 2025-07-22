import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

let client;
let db;

async function connectToDatabase() {
  if (db) return { client, db };
  
  try {
    client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    db = client.db(process.env.DB_NAME || 'badwolf_ecommerce');
    console.log('Connected to MongoDB');
    return { client, db };
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// GET handler
export async function GET(request, { params }) {
  const { db } = await connectToDatabase();
  const pathSegments = params.path || [];
  const searchParams = new URL(request.url).searchParams;

  try {
    // Root endpoint
    if (pathSegments.length === 0) {
      return NextResponse.json({ 
        message: 'Bad-Wolf® E-commerce API',
        version: '1.0.0',
        endpoints: [
          '/api/products',
          '/api/categories', 
          '/api/cart',
          '/api/orders',
          '/api/users',
          '/api/admin'
        ]
      }, { headers: corsHeaders });
    }

    const [resource, id] = pathSegments;

    switch (resource) {
      case 'products':
        if (id) {
          // Get single product
          const product = await db.collection('products').findOne({ id });
          if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
          }
          return NextResponse.json(product, { headers: corsHeaders });
        } else {
          // Get all products with filtering
          const category = searchParams.get('category');
          const search = searchParams.get('search');
          const limit = parseInt(searchParams.get('limit')) || 50;
          const offset = parseInt(searchParams.get('offset')) || 0;

          let query = {};
          if (category && category !== 'all') {
            query.category = category;
          }
          if (search) {
            query.$or = [
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
            ];
          }

          const products = await db.collection('products')
            .find(query)
            .skip(offset)
            .limit(limit)
            .toArray();

          const totalCount = await db.collection('products').countDocuments(query);

          return NextResponse.json({
            products,
            pagination: {
              total: totalCount,
              limit,
              offset,
              hasMore: offset + products.length < totalCount
            }
          }, { headers: corsHeaders });
        }

      case 'categories':
        const categories = await db.collection('categories').find({}).toArray();
        return NextResponse.json(categories, { headers: corsHeaders });

      case 'cart':
        // Get cart by session ID
        const sessionId = searchParams.get('sessionId') || 'guest';
        const cart = await db.collection('carts').findOne({ sessionId });
        return NextResponse.json(cart || { sessionId, items: [], total: 0 }, { headers: corsHeaders });

      case 'orders':
        if (id) {
          const order = await db.collection('orders').findOne({ id });
          if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders });
          }
          return NextResponse.json(order, { headers: corsHeaders });
        } else {
          const userId = searchParams.get('userId');
          const query = userId ? { userId } : {};
          const orders = await db.collection('orders').find(query).sort({ createdAt: -1 }).toArray();
          return NextResponse.json(orders, { headers: corsHeaders });
        }

      case 'users':
        if (id) {
          const user = await db.collection('users').findOne({ id });
          if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
          }
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          return NextResponse.json(userWithoutPassword, { headers: corsHeaders });
        }
        break;

      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404, headers: corsHeaders });
    }
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

// POST handler
export async function POST(request, { params }) {
  const { db } = await connectToDatabase();
  const pathSegments = params.path || [];
  const [resource, action] = pathSegments;

  try {
    const body = await request.json();

    switch (resource) {
      case 'products':
        // Create new product (admin only)
        const productId = uuidv4();
        const newProduct = {
          id: productId,
          ...body,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.collection('products').insertOne(newProduct);
        return NextResponse.json(newProduct, { status: 201, headers: corsHeaders });

      case 'categories':
        // Create new category
        const categoryId = uuidv4();
        const newCategory = {
          id: categoryId,
          ...body,
          createdAt: new Date()
        };
        
        await db.collection('categories').insertOne(newCategory);
        return NextResponse.json(newCategory, { status: 201, headers: corsHeaders });

      case 'cart':
        if (action === 'add') {
          // Add item to cart
          const { sessionId = 'guest', productId, variantId, quantity = 1 } = body;
          
          // Get product details
          const product = await db.collection('products').findOne({ id: productId });
          if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
          }

          // Find variant if specified
          let variant = null;
          let price = product.price;
          if (variantId && product.variants) {
            variant = product.variants.find(v => v.id === variantId);
            if (variant) {
              price = variant.price;
            }
          }

          // Get or create cart
          let cart = await db.collection('carts').findOne({ sessionId });
          if (!cart) {
            cart = { sessionId, items: [], total: 0, updatedAt: new Date() };
          }

          // Check if item already exists in cart
          const existingItemIndex = cart.items.findIndex(item => 
            item.productId === productId && item.variantId === variantId
          );

          if (existingItemIndex >= 0) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
          } else {
            // Add new item
            cart.items.push({
              productId,
              variantId,
              name: product.name,
              variant: variant?.name || 'Default',
              price,
              image: product.image,
              quantity
            });
          }

          // Recalculate total
          cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          cart.updatedAt = new Date();

          await db.collection('carts').replaceOne({ sessionId }, cart, { upsert: true });
          return NextResponse.json(cart, { headers: corsHeaders });
        }

        if (action === 'update') {
          // Update cart item quantity
          const { sessionId = 'guest', productId, variantId, quantity } = body;
          
          const cart = await db.collection('carts').findOne({ sessionId });
          if (!cart) {
            return NextResponse.json({ error: 'Cart not found' }, { status: 404, headers: corsHeaders });
          }

          if (quantity <= 0) {
            // Remove item
            cart.items = cart.items.filter(item => 
              !(item.productId === productId && item.variantId === variantId)
            );
          } else {
            // Update quantity
            const itemIndex = cart.items.findIndex(item => 
              item.productId === productId && item.variantId === variantId
            );
            if (itemIndex >= 0) {
              cart.items[itemIndex].quantity = quantity;
            }
          }

          // Recalculate total
          cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          cart.updatedAt = new Date();

          await db.collection('carts').replaceOne({ sessionId }, cart);
          return NextResponse.json(cart, { headers: corsHeaders });
        }

        if (action === 'clear') {
          // Clear cart
          const { sessionId = 'guest' } = body;
          const cart = { sessionId, items: [], total: 0, updatedAt: new Date() };
          await db.collection('carts').replaceOne({ sessionId }, cart, { upsert: true });
          return NextResponse.json(cart, { headers: corsHeaders });
        }
        break;

      case 'orders':
        // Create new order
        const orderId = uuidv4();
        const newOrder = {
          id: orderId,
          ...body,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.collection('orders').insertOne(newOrder);
        
        // Clear cart after successful order
        if (body.sessionId) {
          await db.collection('carts').replaceOne(
            { sessionId: body.sessionId },
            { sessionId: body.sessionId, items: [], total: 0, updatedAt: new Date() },
            { upsert: true }
          );
        }
        
        return NextResponse.json(newOrder, { status: 201, headers: corsHeaders });

      case 'users':
        if (action === 'register') {
          // User registration
          const userId = uuidv4();
          const newUser = {
            id: userId,
            ...body,
            createdAt: new Date(),
            updatedAt: new Date(),
            loyaltyPoints: 0
          };
          
          // Check if email already exists
          const existingUser = await db.collection('users').findOne({ email: body.email });
          if (existingUser) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 400, headers: corsHeaders });
          }
          
          await db.collection('users').insertOne(newUser);
          
          // Remove password from response
          const { password, ...userWithoutPassword } = newUser;
          return NextResponse.json(userWithoutPassword, { status: 201, headers: corsHeaders });
        }

        if (action === 'login') {
          // User login
          const { email, password } = body;
          const user = await db.collection('users').findOne({ email, password });
          
          if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: corsHeaders });
          }
          
          // Remove password from response
          const { password: _, ...userWithoutPassword } = user;
          return NextResponse.json({ 
            user: userWithoutPassword,
            token: 'jwt-token-placeholder' // In real app, generate JWT
          }, { headers: corsHeaders });
        }
        break;

      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404, headers: corsHeaders });
    }
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

// PUT handler
export async function PUT(request, { params }) {
  const { db } = await connectToDatabase();
  const pathSegments = params.path || [];
  const [resource, id] = pathSegments;

  try {
    const body = await request.json();

    switch (resource) {
      case 'products':
        if (!id) {
          return NextResponse.json({ error: 'Product ID required' }, { status: 400, headers: corsHeaders });
        }
        
        const updatedProduct = {
          ...body,
          updatedAt: new Date()
        };
        
        const result = await db.collection('products').updateOne(
          { id },
          { $set: updatedProduct }
        );
        
        if (result.matchedCount === 0) {
          return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
        }
        
        return NextResponse.json({ id, ...updatedProduct }, { headers: corsHeaders });

      case 'orders':
        if (!id) {
          return NextResponse.json({ error: 'Order ID required' }, { status: 400, headers: corsHeaders });
        }
        
        const updatedOrder = {
          ...body,
          updatedAt: new Date()
        };
        
        const orderResult = await db.collection('orders').updateOne(
          { id },
          { $set: updatedOrder }
        );
        
        if (orderResult.matchedCount === 0) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders });
        }
        
        return NextResponse.json({ id, ...updatedOrder }, { headers: corsHeaders });

      case 'users':
        if (!id) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400, headers: corsHeaders });
        }
        
        const updatedUser = {
          ...body,
          updatedAt: new Date()
        };
        
        const userResult = await db.collection('users').updateOne(
          { id },
          { $set: updatedUser }
        );
        
        if (userResult.matchedCount === 0) {
          return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
        }
        
        return NextResponse.json({ id, ...updatedUser }, { headers: corsHeaders });

      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404, headers: corsHeaders });
    }
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

// DELETE handler
export async function DELETE(request, { params }) {
  const { db } = await connectToDatabase();
  const pathSegments = params.path || [];
  const [resource, id] = pathSegments;

  try {
    switch (resource) {
      case 'products':
        if (!id) {
          return NextResponse.json({ error: 'Product ID required' }, { status: 400, headers: corsHeaders });
        }
        
        const deleteResult = await db.collection('products').deleteOne({ id });
        
        if (deleteResult.deletedCount === 0) {
          return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
        }
        
        return NextResponse.json({ message: 'Product deleted successfully' }, { headers: corsHeaders });

      case 'orders':
        if (!id) {
          return NextResponse.json({ error: 'Order ID required' }, { status: 400, headers: corsHeaders });
        }
        
        const orderDeleteResult = await db.collection('orders').deleteOne({ id });
        
        if (orderDeleteResult.deletedCount === 0) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders });
        }
        
        return NextResponse.json({ message: 'Order deleted successfully' }, { headers: corsHeaders });

      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404, headers: corsHeaders });
    }
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}