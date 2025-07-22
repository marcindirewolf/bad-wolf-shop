#!/usr/bin/env python3
"""
Bad-Wolf® E-commerce API Backend Test Suite
Tests all API endpoints for functionality, error handling, and data validation.
"""

import requests
import json
import uuid
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30

class BadWolfAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.test_results = []
        self.created_resources = {
            'products': [],
            'categories': [],
            'users': [],
            'orders': []
        }
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        
    def test_root_endpoint(self):
        """Test GET /api/ - Root endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}")
            if response.status_code == 200:
                data = response.json()
                if 'message' in data and 'Bad-Wolf®' in data['message']:
                    self.log_test("Root Endpoint", True, "Root endpoint working correctly", data)
                    return True
                else:
                    self.log_test("Root Endpoint", False, "Root endpoint response missing expected content")
            else:
                self.log_test("Root Endpoint", False, f"Root endpoint returned status {response.status_code}")
        except Exception as e:
            self.log_test("Root Endpoint", False, f"Root endpoint error: {str(e)}")
        return False
        
    def test_create_category(self):
        """Test POST /api/categories - Create new category"""
        try:
            category_data = {
                "name": "Electronics",
                "description": "Electronic devices and gadgets",
                "slug": "electronics"
            }
            
            response = self.session.post(f"{BASE_URL}/categories", json=category_data)
            if response.status_code == 201:
                data = response.json()
                if 'id' in data and data['name'] == category_data['name']:
                    self.created_resources['categories'].append(data['id'])
                    self.log_test("Create Category", True, "Category created successfully", data)
                    return data
                else:
                    self.log_test("Create Category", False, "Category creation response missing expected fields")
            else:
                self.log_test("Create Category", False, f"Category creation failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Create Category", False, f"Category creation error: {str(e)}")
        return None
        
    def test_get_categories(self):
        """Test GET /api/categories - List all categories"""
        try:
            response = self.session.get(f"{BASE_URL}/categories")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Categories", True, f"Retrieved {len(data)} categories", {'count': len(data)})
                    return data
                else:
                    self.log_test("Get Categories", False, "Categories response is not a list")
            else:
                self.log_test("Get Categories", False, f"Get categories failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Get Categories", False, f"Get categories error: {str(e)}")
        return []
        
    def test_create_product(self):
        """Test POST /api/products - Create new product"""
        try:
            product_data = {
                "name": "Bad-Wolf® Smartphone",
                "description": "Latest smartphone with advanced features",
                "price": 699.99,
                "category": "Electronics",
                "image": "https://example.com/smartphone.jpg",
                "stock": 50,
                "variants": [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "64GB Black",
                        "price": 699.99,
                        "stock": 25
                    },
                    {
                        "id": str(uuid.uuid4()),
                        "name": "128GB White",
                        "price": 799.99,
                        "stock": 25
                    }
                ]
            }
            
            response = self.session.post(f"{BASE_URL}/products", json=product_data)
            if response.status_code == 201:
                data = response.json()
                if 'id' in data and data['name'] == product_data['name']:
                    self.created_resources['products'].append(data['id'])
                    self.log_test("Create Product", True, "Product created successfully", data)
                    return data
                else:
                    self.log_test("Create Product", False, "Product creation response missing expected fields")
            else:
                self.log_test("Create Product", False, f"Product creation failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Create Product", False, f"Product creation error: {str(e)}")
        return None
        
    def test_get_products(self):
        """Test GET /api/products - List all products with filtering"""
        try:
            # Test basic product listing
            response = self.session.get(f"{BASE_URL}/products")
            if response.status_code == 200:
                data = response.json()
                if 'products' in data and 'pagination' in data:
                    self.log_test("Get Products", True, f"Retrieved {len(data['products'])} products", 
                                {'count': len(data['products']), 'pagination': data['pagination']})
                    
                    # Test filtering by category
                    response = self.session.get(f"{BASE_URL}/products?category=Electronics")
                    if response.status_code == 200:
                        filtered_data = response.json()
                        self.log_test("Filter Products by Category", True, 
                                    f"Retrieved {len(filtered_data['products'])} electronics products")
                    
                    # Test search functionality
                    response = self.session.get(f"{BASE_URL}/products?search=smartphone")
                    if response.status_code == 200:
                        search_data = response.json()
                        self.log_test("Search Products", True, 
                                    f"Search returned {len(search_data['products'])} products")
                    
                    return data
                else:
                    self.log_test("Get Products", False, "Products response missing expected structure")
            else:
                self.log_test("Get Products", False, f"Get products failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Get Products", False, f"Get products error: {str(e)}")
        return None
        
    def test_cart_operations(self):
        """Test cart operations - add, update, clear, get"""
        session_id = f"test_session_{uuid.uuid4()}"
        
        # First, ensure we have a product to add to cart
        if not self.created_resources['products']:
            self.log_test("Cart Operations", False, "No products available for cart testing")
            return False
            
        product_id = self.created_resources['products'][0]
        
        try:
            # Test add to cart
            add_data = {
                "sessionId": session_id,
                "productId": product_id,
                "quantity": 2
            }
            
            response = self.session.post(f"{BASE_URL}/cart/add", json=add_data)
            if response.status_code == 200:
                cart_data = response.json()
                if 'items' in cart_data and len(cart_data['items']) > 0:
                    self.log_test("Add to Cart", True, "Item added to cart successfully", cart_data)
                    
                    # Test get cart
                    response = self.session.get(f"{BASE_URL}/cart?sessionId={session_id}")
                    if response.status_code == 200:
                        get_cart_data = response.json()
                        self.log_test("Get Cart", True, f"Retrieved cart with {len(get_cart_data['items'])} items")
                        
                        # Test update cart
                        update_data = {
                            "sessionId": session_id,
                            "productId": product_id,
                            "quantity": 3
                        }
                        
                        response = self.session.post(f"{BASE_URL}/cart/update", json=update_data)
                        if response.status_code == 200:
                            updated_cart = response.json()
                            self.log_test("Update Cart", True, "Cart updated successfully")
                            
                            # Test clear cart
                            clear_data = {"sessionId": session_id}
                            response = self.session.post(f"{BASE_URL}/cart/clear", json=clear_data)
                            if response.status_code == 200:
                                cleared_cart = response.json()
                                if len(cleared_cart['items']) == 0:
                                    self.log_test("Clear Cart", True, "Cart cleared successfully")
                                    return True
                                else:
                                    self.log_test("Clear Cart", False, "Cart not properly cleared")
                            else:
                                self.log_test("Clear Cart", False, f"Clear cart failed with status {response.status_code}")
                        else:
                            self.log_test("Update Cart", False, f"Update cart failed with status {response.status_code}")
                    else:
                        self.log_test("Get Cart", False, f"Get cart failed with status {response.status_code}")
                else:
                    self.log_test("Add to Cart", False, "Cart response missing items")
            else:
                self.log_test("Add to Cart", False, f"Add to cart failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Cart Operations", False, f"Cart operations error: {str(e)}")
        return False
        
    def test_user_registration_login(self):
        """Test user registration and login"""
        try:
            # Test user registration
            user_data = {
                "name": "John Doe",
                "email": f"john.doe.{uuid.uuid4()}@badwolf.com",
                "password": "SecurePassword123!",
                "phone": "+1234567890"
            }
            
            response = self.session.post(f"{BASE_URL}/users/register", json=user_data)
            if response.status_code == 201:
                user_response = response.json()
                if 'id' in user_response and user_response['email'] == user_data['email']:
                    self.created_resources['users'].append(user_response['id'])
                    self.log_test("User Registration", True, "User registered successfully", user_response)
                    
                    # Test user login
                    login_data = {
                        "email": user_data['email'],
                        "password": user_data['password']
                    }
                    
                    response = self.session.post(f"{BASE_URL}/users/login", json=login_data)
                    if response.status_code == 200:
                        login_response = response.json()
                        if 'user' in login_response and 'token' in login_response:
                            self.log_test("User Login", True, "User login successful", login_response)
                            return login_response
                        else:
                            self.log_test("User Login", False, "Login response missing expected fields")
                    else:
                        self.log_test("User Login", False, f"Login failed with status {response.status_code}")
                else:
                    self.log_test("User Registration", False, "Registration response missing expected fields")
            else:
                self.log_test("User Registration", False, f"Registration failed with status {response.status_code}")
                
            # Test duplicate email registration
            response = self.session.post(f"{BASE_URL}/users/register", json=user_data)
            if response.status_code == 400:
                self.log_test("Duplicate Email Registration", True, "Duplicate email properly rejected")
            else:
                self.log_test("Duplicate Email Registration", False, "Duplicate email not properly handled")
                
        except Exception as e:
            self.log_test("User Registration/Login", False, f"User operations error: {str(e)}")
        return None
        
    def test_order_operations(self):
        """Test order creation and retrieval"""
        try:
            # Create an order
            order_data = {
                "sessionId": f"test_session_{uuid.uuid4()}",
                "userId": self.created_resources['users'][0] if self.created_resources['users'] else None,
                "items": [
                    {
                        "productId": self.created_resources['products'][0] if self.created_resources['products'] else str(uuid.uuid4()),
                        "name": "Bad-Wolf® Smartphone",
                        "price": 699.99,
                        "quantity": 1
                    }
                ],
                "total": 699.99,
                "shippingAddress": {
                    "name": "John Doe",
                    "street": "123 Main St",
                    "city": "New York",
                    "state": "NY",
                    "zipCode": "10001",
                    "country": "USA"
                },
                "paymentMethod": "credit_card"
            }
            
            response = self.session.post(f"{BASE_URL}/orders", json=order_data)
            if response.status_code == 201:
                order_response = response.json()
                if 'id' in order_response and order_response['status'] == 'pending':
                    self.created_resources['orders'].append(order_response['id'])
                    self.log_test("Create Order", True, "Order created successfully", order_response)
                    
                    # Test get orders
                    response = self.session.get(f"{BASE_URL}/orders")
                    if response.status_code == 200:
                        orders_data = response.json()
                        if isinstance(orders_data, list):
                            self.log_test("Get Orders", True, f"Retrieved {len(orders_data)} orders")
                            return True
                        else:
                            self.log_test("Get Orders", False, "Orders response is not a list")
                    else:
                        self.log_test("Get Orders", False, f"Get orders failed with status {response.status_code}")
                else:
                    self.log_test("Create Order", False, "Order creation response missing expected fields")
            else:
                self.log_test("Create Order", False, f"Order creation failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Order Operations", False, f"Order operations error: {str(e)}")
        return False
        
    def test_error_handling(self):
        """Test error handling for various scenarios"""
        try:
            # Test invalid endpoint
            response = self.session.get(f"{BASE_URL}/invalid-endpoint")
            if response.status_code == 404:
                self.log_test("Invalid Endpoint Error", True, "404 error properly returned for invalid endpoint")
            else:
                self.log_test("Invalid Endpoint Error", False, f"Expected 404, got {response.status_code}")
                
            # Test invalid product ID
            response = self.session.get(f"{BASE_URL}/products/invalid-id")
            if response.status_code == 404:
                self.log_test("Invalid Product ID Error", True, "404 error properly returned for invalid product ID")
            else:
                self.log_test("Invalid Product ID Error", False, f"Expected 404, got {response.status_code}")
                
            # Test invalid login credentials
            login_data = {
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
            response = self.session.post(f"{BASE_URL}/users/login", json=login_data)
            if response.status_code == 401:
                self.log_test("Invalid Login Error", True, "401 error properly returned for invalid credentials")
            else:
                self.log_test("Invalid Login Error", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Error Handling", False, f"Error handling test error: {str(e)}")
            
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Bad-Wolf® E-commerce API Backend Tests")
        print("=" * 60)
        
        # Test sequence
        self.test_root_endpoint()
        self.test_create_category()
        self.test_get_categories()
        self.test_create_product()
        self.test_get_products()
        self.test_cart_operations()
        self.test_user_registration_login()
        self.test_order_operations()
        self.test_error_handling()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['message']}")
        
        print("\n📋 CREATED RESOURCES:")
        for resource_type, resources in self.created_resources.items():
            if resources:
                print(f"  • {resource_type}: {len(resources)} created")
        
        return passed, failed

if __name__ == "__main__":
    tester = BadWolfAPITester()
    passed, failed = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if failed == 0 else 1)