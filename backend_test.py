import requests
import sys
import json
from datetime import datetime

class GlenntekAPITester:
    def __init__(self, base_url="https://glennshop.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.customer_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@glenntek.pt", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            return True
        return False

    def test_customer_registration(self):
        """Test customer registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        customer_data = {
            "email": f"test_customer_{timestamp}@test.com",
            "password": "TestPass123!",
            "full_name": "Test Customer",
            "phone": "123456789"
        }
        
        success, response = self.run_test(
            "Customer Registration",
            "POST",
            "auth/register",
            200,
            data=customer_data
        )
        if success and 'access_token' in response:
            self.customer_token = response['access_token']
            return True
        return False

    def test_products_api(self):
        """Test products endpoints"""
        # Get products
        success, products_response = self.run_test("Get Products", "GET", "products", 200)
        
        # Test getting a specific product by ID (Critical Fix)
        if success and products_response and isinstance(products_response, list) and len(products_response) > 0:
            first_product = products_response[0]
            if 'id' in first_product:
                product_id = first_product['id']
                success, product_response = self.run_test(
                    f"Get Product by ID (Critical Fix)", 
                    "GET", 
                    f"products/{product_id}", 
                    200
                )
                if success and product_response:
                    # Verify the response contains expected fields
                    required_fields = ['id', 'name', 'description', 'price', 'category']
                    missing_fields = [field for field in required_fields if field not in product_response]
                    if missing_fields:
                        self.log_test(
                            "Product Detail Response Validation", 
                            False, 
                            f"Missing fields: {missing_fields}"
                        )
                    else:
                        self.log_test(
                            "Product Detail Response Validation", 
                            True, 
                            "All required fields present"
                        )
            else:
                self.log_test("Get Product by ID (Critical Fix)", False, "No product ID found in products list")
        else:
            self.log_test("Get Product by ID (Critical Fix)", False, "No products available to test with")
        
        # Get products with filters
        self.run_test("Get Products with Search", "GET", "products?search=case", 200)
        self.run_test("Get Products with Category", "GET", "products?category=cases", 200)
        self.run_test("Get Products with Price Range", "GET", "products?min_price=10&max_price=50", 200)

        # Admin-only tests
        if self.admin_token:
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            
            # Create product
            product_data = {
                "name": "Test Phone Case",
                "description": "A test phone case for testing",
                "category": "cases",
                "price": 29.99,
                "sku": f"TEST-CASE-{datetime.now().strftime('%H%M%S')}",
                "stock_quantity": 100,
                "tags": ["test", "phone", "case"]
            }
            
            success, response = self.run_test(
                "Create Product (Admin)",
                "POST",
                "products",
                200,
                data=product_data,
                headers=headers
            )
            
            if success and 'id' in response:
                product_id = response['id']
                
                # Get specific product
                self.run_test(f"Get Product by ID", "GET", f"products/{product_id}", 200)
                
                # Update product
                update_data = {**product_data, "price": 39.99}
                self.run_test(
                    "Update Product (Admin)",
                    "PUT",
                    f"products/{product_id}",
                    200,
                    data=update_data,
                    headers=headers
                )
                
                # Delete product
                self.run_test(
                    "Delete Product (Admin)",
                    "DELETE",
                    f"products/{product_id}",
                    200,
                    headers=headers
                )

    def test_categories_api(self):
        """Test categories endpoints"""
        # Get categories
        self.run_test("Get Categories", "GET", "categories", 200)

        if self.admin_token:
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            
            # Create category
            category_data = {
                "name": "Test Category",
                "slug": f"test-category-{datetime.now().strftime('%H%M%S')}",
                "description": "A test category"
            }
            
            success, response = self.run_test(
                "Create Category (Admin)",
                "POST",
                "categories",
                200,
                data=category_data,
                headers=headers
            )
            
            if success and 'id' in response:
                category_id = response['id']
                
                # Update category
                update_data = {**category_data, "description": "Updated test category"}
                self.run_test(
                    "Update Category (Admin)",
                    "PUT",
                    f"categories/{category_id}",
                    200,
                    data=update_data,
                    headers=headers
                )
                
                # Delete category
                self.run_test(
                    "Delete Category (Admin)",
                    "DELETE",
                    f"categories/{category_id}",
                    200,
                    headers=headers
                )

    def test_orders_api(self):
        """Test orders endpoints"""
        if self.customer_token:
            headers = {'Authorization': f'Bearer {self.customer_token}'}
            
            # Get customer orders (should be empty initially)
            self.run_test("Get Customer Orders", "GET", "orders", 200, headers=headers)
            
            # Create order
            order_data = {
                "user_id": "test-user-id",  # This will be overridden by the backend
                "items": [
                    {
                        "product_id": "test-product-id",
                        "name": "Test Product",
                        "price": 29.99,
                        "quantity": 2
                    }
                ],
                "subtotal": 59.98,
                "shipping_cost": 5.00,
                "tax": 13.80,
                "total": 78.78,
                "payment_method": "card",
                "shipping_address": {
                    "full_name": "Test Customer",
                    "address": "123 Test Street",
                    "city": "Lisbon",
                    "postal_code": "1000-001",
                    "country": "Portugal",
                    "phone": "123456789"
                },
                "billing_address": {
                    "full_name": "Test Customer",
                    "address": "123 Test Street",
                    "city": "Lisbon",
                    "postal_code": "1000-001",
                    "country": "Portugal",
                    "phone": "123456789"
                }
            }
            
            success, response = self.run_test(
                "Create Order",
                "POST",
                "orders",
                200,
                data=order_data,
                headers=headers
            )
            
            if success and 'id' in response:
                order_id = response['id']
                
                # Get specific order
                self.run_test(f"Get Order by ID", "GET", f"orders/{order_id}", 200, headers=headers)
                
                # Admin update order status
                if self.admin_token:
                    admin_headers = {'Authorization': f'Bearer {self.admin_token}'}
                    self.run_test(
                        "Update Order Status (Admin)",
                        "PUT",
                        f"orders/{order_id}/status?status=shipped&tracking_number=TEST123",
                        200,
                        headers=admin_headers
                    )

    def test_pages_api(self):
        """Test pages endpoints"""
        # Get pages
        self.run_test("Get Pages", "GET", "pages", 200)

        if self.admin_token:
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            
            # Create page
            page_data = {
                "title": "Test Page",
                "slug": f"test-page-{datetime.now().strftime('%H%M%S')}",
                "content": "This is a test page content",
                "seo_title": "Test Page SEO",
                "seo_description": "Test page for SEO"
            }
            
            success, response = self.run_test(
                "Create Page (Admin)",
                "POST",
                "pages",
                200,
                data=page_data,
                headers=headers
            )
            
            if success and 'id' in response:
                page_id = response['id']
                slug = response['slug']
                
                # Get page by slug
                self.run_test(f"Get Page by Slug", "GET", f"pages/{slug}", 200)
                
                # Delete page
                self.run_test(
                    "Delete Page (Admin)",
                    "DELETE",
                    f"pages/{page_id}",
                    200,
                    headers=headers
                )

    def test_settings_api(self):
        """Test settings endpoints"""
        # Get settings
        self.run_test("Get Settings", "GET", "settings", 200)

        if self.admin_token:
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            
            # Update settings
            settings_data = {
                "site_name": "Glenntek Test",
                "site_description": "Test description"
            }
            
            self.run_test(
                "Update Settings (Admin)",
                "PUT",
                "settings",
                200,
                data=settings_data,
                headers=headers
            )

    def test_analytics_api(self):
        """Test analytics endpoints"""
        if self.admin_token:
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            
            self.run_test(
                "Get Dashboard Analytics (Admin)",
                "GET",
                "analytics/dashboard",
                200,
                headers=headers
            )

    def test_ai_endpoints(self):
        """Test AI endpoints"""
        # Test AI recommendations
        self.run_test("Get AI Recommendations", "POST", "ai/recommendations", 200)
        
        # Test AI search
        success, response = self.run_test(
            "AI Search",
            "POST",
            "ai/search?query=phone case",
            200
        )

    def test_image_upload(self):
        """Test image upload functionality - Critical Fix"""
        if not self.admin_token:
            self.log_test("Image Upload (Admin)", False, "No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Create a simple test image (1x1 pixel PNG)
        import base64
        import io
        
        # Minimal PNG data for a 1x1 transparent pixel
        png_data = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=='
        )
        
        try:
            url = f"{self.api_url}/upload-image"
            files = {'file': ('test_image.png', io.BytesIO(png_data), 'image/png')}
            
            # Remove Content-Type header for multipart/form-data
            upload_headers = {'Authorization': f'Bearer {self.admin_token}'}
            
            response = requests.post(url, files=files, headers=upload_headers)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                try:
                    response_data = response.json()
                    if 'url' in response_data:
                        image_url = response_data['url']
                        details += f", URL: {image_url}"
                        
                        # Verify the URL format contains the expected base URL
                        expected_base = "https://glennshop.preview.emergentagent.com/static/uploads/"
                        if image_url.startswith(expected_base):
                            details += " (URL format correct)"
                            
                            # Test if the uploaded image is accessible
                            try:
                                img_response = requests.get(image_url)
                                if img_response.status_code == 200:
                                    details += " (Image accessible)"
                                else:
                                    success = False
                                    details += f" (Image not accessible: {img_response.status_code})"
                            except Exception as e:
                                success = False
                                details += f" (Image access error: {str(e)})"
                        else:
                            success = False
                            details += f" (Incorrect URL format, expected to start with {expected_base})"
                    else:
                        success = False
                        details += " (No URL in response)"
                except Exception as e:
                    success = False
                    details += f" (JSON parse error: {str(e)})"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test("Image Upload (Admin)", success, details)
            return success
            
        except Exception as e:
            self.log_test("Image Upload (Admin)", False, f"Exception: {str(e)}")
            return False

    def test_hero_slides_api(self):
        """Test hero slides endpoints"""
        # Get hero slides
        self.run_test("Get Hero Slides", "GET", "hero-slides", 200)

        if self.admin_token:
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            
            # Create hero slide
            slide_data = {
                "title": "Test Hero Slide",
                "subtitle": "Test subtitle",
                "image": "https://example.com/test-image.jpg",
                "button_text": "Shop Now",
                "button_link": "/products",
                "order": 1
            }
            
            success, response = self.run_test(
                "Create Hero Slide (Admin)",
                "POST",
                "hero-slides",
                200,
                data=slide_data,
                headers=headers
            )
            
            if success and 'id' in response:
                slide_id = response['id']
                
                # Update hero slide
                update_data = {**slide_data, "title": "Updated Test Hero Slide"}
                self.run_test(
                    "Update Hero Slide (Admin)",
                    "PUT",
                    f"hero-slides/{slide_id}",
                    200,
                    data=update_data,
                    headers=headers
                )
                
                # Toggle hero slide
                self.run_test(
                    "Toggle Hero Slide (Admin)",
                    "PUT",
                    f"hero-slides/{slide_id}/toggle",
                    200,
                    headers=headers
                )
                
                # Delete hero slide
                self.run_test(
                    "Delete Hero Slide (Admin)",
                    "DELETE",
                    f"hero-slides/{slide_id}",
                    200,
                    headers=headers
                )

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        if self.customer_token:
            headers = {'Authorization': f'Bearer {self.customer_token}'}
            self.run_test("Get Current User", "GET", "auth/me", 200, headers=headers)

    def test_wishlist_api(self):
        """Test wishlist endpoints"""
        if not self.customer_token:
            self.log_test("Wishlist API", False, "No customer token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.customer_token}'}
        
        # Get initial wishlist (should be empty)
        success, wishlist_response = self.run_test("Get Empty Wishlist", "GET", "wishlist", 200, headers=headers)
        
        # Get a product to add to wishlist
        success, products_response = self.run_test("Get Products for Wishlist", "GET", "products", 200)
        
        if success and products_response and isinstance(products_response, list) and len(products_response) > 0:
            product_id = products_response[0]['id']
            
            # Add product to wishlist
            wishlist_data = {"product_id": product_id}
            success, add_response = self.run_test(
                "Add Product to Wishlist", 
                "POST", 
                "wishlist", 
                200, 
                data=wishlist_data, 
                headers=headers
            )
            
            if success:
                # Check if product is in wishlist
                self.run_test(
                    f"Check Product in Wishlist", 
                    "GET", 
                    f"wishlist/check/{product_id}", 
                    200, 
                    headers=headers
                )
                
                # Get wishlist with added product
                success, updated_wishlist = self.run_test("Get Wishlist with Product", "GET", "wishlist", 200, headers=headers)
                
                if success and updated_wishlist and len(updated_wishlist) > 0:
                    self.log_test("Wishlist Contains Product", True, f"Found {len(updated_wishlist)} items")
                else:
                    self.log_test("Wishlist Contains Product", False, "Wishlist is empty after adding product")
                
                # Remove product from wishlist
                self.run_test(
                    "Remove Product from Wishlist", 
                    "DELETE", 
                    f"wishlist/{product_id}", 
                    200, 
                    headers=headers
                )
                
                # Verify wishlist is empty after removal
                success, final_wishlist = self.run_test("Get Empty Wishlist After Removal", "GET", "wishlist", 200, headers=headers)
                
                if success and (not final_wishlist or len(final_wishlist) == 0):
                    self.log_test("Wishlist Empty After Removal", True, "Wishlist is empty")
                else:
                    self.log_test("Wishlist Empty After Removal", False, f"Wishlist still contains {len(final_wishlist) if final_wishlist else 0} items")
            
            # Test adding non-existent product
            fake_product_data = {"product_id": "non-existent-product-id"}
            self.run_test(
                "Add Non-existent Product to Wishlist", 
                "POST", 
                "wishlist", 
                404, 
                data=fake_product_data, 
                headers=headers
            )
        else:
            self.log_test("Wishlist API", False, "No products available to test wishlist functionality")

    def test_wallet_api(self):
        """Test wallet endpoints"""
        if not self.customer_token:
            self.log_test("Wallet API", False, "No customer token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.customer_token}'}
        
        # Get wallet balance
        success, wallet_response = self.run_test("Get Wallet Balance", "GET", "wallet", 200, headers=headers)
        
        if success and 'balance' in wallet_response:
            initial_balance = wallet_response['balance']
            self.log_test("Wallet Balance Retrieved", True, f"Initial balance: €{initial_balance}")
        else:
            self.log_test("Wallet Balance Retrieved", False, "No balance field in response")
            initial_balance = 0
        
        # Get wallet transactions
        self.run_test("Get Wallet Transactions", "GET", "wallet/transactions", 200, headers=headers)
        
        # Admin wallet operations
        if self.admin_token:
            admin_headers = {'Authorization': f'Bearer {self.admin_token}'}
            
            # Get current user ID for admin operations
            success, user_response = self.run_test("Get Current User for Wallet", "GET", "auth/me", 200, headers=headers)
            
            if success and 'id' in user_response:
                user_id = user_response['id']
                
                # Admin top-up wallet
                topup_data = {
                    "user_id": user_id,
                    "amount": 10.0,
                    "description": "Test top-up from admin"
                }
                
                success, topup_response = self.run_test(
                    "Admin Wallet Top-up", 
                    "POST", 
                    "wallet/admin/topup", 
                    200, 
                    data=topup_data, 
                    headers=admin_headers
                )
                
                if success:
                    # Verify balance increased
                    success, updated_wallet = self.run_test("Get Updated Wallet Balance", "GET", "wallet", 200, headers=headers)
                    
                    if success and 'balance' in updated_wallet:
                        new_balance = updated_wallet['balance']
                        expected_balance = initial_balance + 10.0
                        
                        if abs(new_balance - expected_balance) < 0.01:  # Allow for floating point precision
                            self.log_test("Wallet Balance Increased", True, f"Balance: €{initial_balance} → €{new_balance}")
                        else:
                            self.log_test("Wallet Balance Increased", False, f"Expected €{expected_balance}, got €{new_balance}")
                    
                    # Verify transaction was recorded
                    success, transactions = self.run_test("Get Transactions After Top-up", "GET", "wallet/transactions", 200, headers=headers)
                    
                    if success and transactions and len(transactions) > 0:
                        latest_transaction = transactions[0]  # Should be sorted by date desc
                        if latest_transaction.get('amount') == 10.0 and latest_transaction.get('type') == 'credit':
                            self.log_test("Top-up Transaction Recorded", True, "Found credit transaction for €10")
                        else:
                            self.log_test("Top-up Transaction Recorded", False, f"Transaction details don't match: {latest_transaction}")
                    else:
                        self.log_test("Top-up Transaction Recorded", False, "No transactions found")
                
                # Admin get all wallets
                self.run_test("Admin Get All Wallets", "GET", "wallet/admin/all", 200, headers=admin_headers)
            else:
                self.log_test("Admin Wallet Operations", False, "Could not get user ID for admin operations")

    def test_referral_api(self):
        """Test referral endpoints"""
        if not self.customer_token:
            self.log_test("Referral API", False, "No customer token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.customer_token}'}
        
        # Get user's referral code
        success, referral_response = self.run_test("Get My Referral Code", "GET", "referral/my-code", 200, headers=headers)
        
        referral_code = None
        if success and 'referral_code' in referral_response:
            referral_code = referral_response['referral_code']
            self.log_test("Referral Code Retrieved", True, f"Code: {referral_code}")
            
            # Validate the referral code
            success, validate_response = self.run_test(
                f"Validate Referral Code", 
                "GET", 
                f"referral/validate/{referral_code}", 
                200
            )
            
            if success and validate_response.get('valid'):
                self.log_test("Referral Code Validation", True, f"Referrer: {validate_response.get('referrer_name', 'Unknown')}")
            else:
                self.log_test("Referral Code Validation", False, "Code validation failed")
        else:
            self.log_test("Referral Code Retrieved", False, "No referral code in response")
        
        # Test invalid referral code
        self.run_test("Validate Invalid Referral Code", "GET", "referral/validate/INVALID123", 404)
        
        # Get referral settings
        success, settings_response = self.run_test("Get Referral Settings", "GET", "referral/settings", 200)
        
        if success:
            referrer_reward = settings_response.get('referrer_reward', 0)
            referred_reward = settings_response.get('referred_reward', 0)
            self.log_test("Referral Settings Retrieved", True, f"Referrer: €{referrer_reward}, Referred: €{referred_reward}")
        
        # Admin referral operations
        if self.admin_token:
            admin_headers = {'Authorization': f'Bearer {self.admin_token}'}
            
            # Update referral settings
            new_settings = {
                "referrer_reward": 7.5,
                "referred_reward": 7.5,
                "min_order_amount": 25.0,
                "is_active": True
            }
            
            success, update_response = self.run_test(
                "Update Referral Settings (Admin)", 
                "PUT", 
                "referral/settings", 
                200, 
                data=new_settings, 
                headers=admin_headers
            )
            
            if success:
                # Verify settings were updated
                success, updated_settings = self.run_test("Get Updated Referral Settings", "GET", "referral/settings", 200)
                
                if success and updated_settings.get('referrer_reward') == 7.5:
                    self.log_test("Referral Settings Updated", True, "Settings updated successfully")
                else:
                    self.log_test("Referral Settings Updated", False, "Settings not updated correctly")
            
            # Get all referrals
            self.run_test("Admin Get All Referrals", "GET", "referral/admin/all", 200, headers=admin_headers)
        
        return referral_code

    def test_registration_with_referral(self):
        """Test user registration with referral code"""
        # First get admin's referral code
        if not self.admin_token:
            self.log_test("Registration with Referral", False, "No admin token available")
            return False
            
        admin_headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Get admin's referral code
        success, admin_referral = self.run_test("Get Admin Referral Code", "GET", "referral/my-code", 200, headers=admin_headers)
        
        if not success or 'referral_code' not in admin_referral:
            self.log_test("Registration with Referral", False, "Could not get admin referral code")
            return False
        
        admin_referral_code = admin_referral['referral_code']
        self.log_test("Admin Referral Code Retrieved", True, f"Code: {admin_referral_code}")
        
        # Get admin's initial wallet balance
        success, admin_wallet_before = self.run_test("Get Admin Wallet Before Referral", "GET", "wallet", 200, headers=admin_headers)
        admin_balance_before = admin_wallet_before.get('balance', 0) if success else 0
        
        # Register new user with referral code
        timestamp = datetime.now().strftime('%H%M%S')
        new_user_data = {
            "email": f"referral_test_{timestamp}@test.com",
            "password": "TestPass123!",
            "full_name": "Referral Test User",
            "phone": "987654321",
            "referral_code": admin_referral_code
        }
        
        success, register_response = self.run_test(
            "Register User with Referral Code", 
            "POST", 
            "auth/register", 
            200, 
            data=new_user_data
        )
        
        if success and 'access_token' in register_response:
            new_user_token = register_response['access_token']
            new_user_headers = {'Authorization': f'Bearer {new_user_token}'}
            
            # Verify new user has referral code
            success, new_user_referral = self.run_test("Get New User Referral Code", "GET", "referral/my-code", 200, headers=new_user_headers)
            
            if success and 'referral_code' in new_user_referral:
                new_user_code = new_user_referral['referral_code']
                if new_user_code != admin_referral_code:  # Should have different code
                    self.log_test("New User Has Own Referral Code", True, f"Code: {new_user_code}")
                else:
                    self.log_test("New User Has Own Referral Code", False, "New user has same code as admin")
            
            # Check new user's wallet balance (should have referral bonus)
            success, new_user_wallet = self.run_test("Get New User Wallet", "GET", "wallet", 200, headers=new_user_headers)
            
            if success and 'balance' in new_user_wallet:
                new_user_balance = new_user_wallet['balance']
                if new_user_balance > 0:
                    self.log_test("New User Referral Bonus", True, f"Balance: €{new_user_balance}")
                else:
                    self.log_test("New User Referral Bonus", False, f"No bonus received, balance: €{new_user_balance}")
            
            # Check admin's wallet balance (should have increased)
            success, admin_wallet_after = self.run_test("Get Admin Wallet After Referral", "GET", "wallet", 200, headers=admin_headers)
            
            if success and 'balance' in admin_wallet_after:
                admin_balance_after = admin_wallet_after['balance']
                balance_increase = admin_balance_after - admin_balance_before
                
                if balance_increase > 0:
                    self.log_test("Admin Referral Reward", True, f"Balance increased by €{balance_increase}")
                else:
                    self.log_test("Admin Referral Reward", False, f"No reward received, balance change: €{balance_increase}")
            
            # Verify referral record was created
            success, all_referrals = self.run_test("Get All Referrals After Registration", "GET", "referral/admin/all", 200, headers=admin_headers)
            
            if success and all_referrals:
                # Look for the referral record
                found_referral = False
                for referral in all_referrals:
                    if referral.get('referral_code') == admin_referral_code and referral.get('status') == 'completed':
                        found_referral = True
                        self.log_test("Referral Record Created", True, f"Status: {referral.get('status')}")
                        break
                
                if not found_referral:
                    self.log_test("Referral Record Created", False, "No matching referral record found")
            else:
                self.log_test("Referral Record Created", False, "Could not retrieve referral records")
        else:
            self.log_test("Registration with Referral", False, "User registration failed")

def main():
    print("🚀 Starting Glenntek E-commerce API Tests")
    print("=" * 50)
    
    tester = GlenntekAPITester()
    
    # Test authentication first
    print("\n📝 Testing Authentication...")
    if not tester.test_admin_login():
        print("❌ Admin login failed - stopping admin tests")
    
    if not tester.test_customer_registration():
        print("❌ Customer registration failed - stopping customer tests")
    
    tester.test_auth_endpoints()
    
    # Test core APIs
    print("\n📦 Testing Products API...")
    tester.test_products_api()
    
    print("\n📂 Testing Categories API...")
    tester.test_categories_api()
    
    print("\n🛒 Testing Orders API...")
    tester.test_orders_api()
    
    print("\n📄 Testing Pages API...")
    tester.test_pages_api()
    
    print("\n⚙️ Testing Settings API...")
    tester.test_settings_api()
    
    print("\n📊 Testing Analytics API...")
    tester.test_analytics_api()
    
    print("\n🤖 Testing AI Endpoints...")
    tester.test_ai_endpoints()
    
    print("\n🖼️ Testing Image Upload (Critical Fix)...")
    tester.test_image_upload()
    
    print("\n🎠 Testing Hero Slides API...")
    tester.test_hero_slides_api()
    
    # Test new features: Wishlist, Wallet, and Referral
    print("\n❤️ Testing Wishlist API...")
    tester.test_wishlist_api()
    
    print("\n💰 Testing Wallet API...")
    tester.test_wallet_api()
    
    print("\n🔗 Testing Referral API...")
    tester.test_referral_api()
    
    print("\n👥 Testing Registration with Referral Code...")
    tester.test_registration_with_referral()
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Summary: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"✨ Success Rate: {success_rate:.1f}%")
    
    # Print failed tests
    failed_tests = [t for t in tester.test_results if not t['success']]
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"  - {test['test']}: {test['details']}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())