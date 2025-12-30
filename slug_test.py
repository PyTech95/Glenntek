#!/usr/bin/env python3
"""
Product Slug Functionality Test
Tests the specific slug endpoints as requested in the review.
"""

import requests
import sys
import json
import re
from datetime import datetime

class ProductSlugTester:
    def __init__(self, base_url="https://glennshop.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
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

    def validate_slug_format(self, slug):
        """Validate slug format: lowercase, hyphens, no special chars"""
        if not slug:
            return False, "Slug is empty"
        
        # Check if slug matches expected pattern: lowercase letters, numbers, hyphens only
        pattern = r'^[a-z0-9-]+$'
        if not re.match(pattern, slug):
            return False, f"Slug '{slug}' contains invalid characters (should be lowercase letters, numbers, hyphens only)"
        
        # Check for consecutive hyphens
        if '--' in slug:
            return False, f"Slug '{slug}' contains consecutive hyphens"
        
        # Check if starts or ends with hyphen
        if slug.startswith('-') or slug.endswith('-'):
            return False, f"Slug '{slug}' starts or ends with hyphen"
        
        return True, "Valid slug format"

    def test_products_have_slug_field(self):
        """Test 1: GET /api/products - Verify products have slug field"""
        try:
            url = f"{self.api_url}/products"
            response = requests.get(url)
            
            if response.status_code != 200:
                self.log_test("GET /api/products", False, f"Status: {response.status_code}")
                return []
            
            products = response.json()
            
            if not isinstance(products, list):
                self.log_test("GET /api/products", False, "Response is not a list")
                return []
            
            if len(products) == 0:
                self.log_test("GET /api/products", False, "No products found")
                return []
            
            # Check if products have slug field
            products_with_slug = 0
            products_without_slug = 0
            invalid_slugs = []
            
            for product in products:
                if 'slug' in product and product['slug']:
                    products_with_slug += 1
                    # Validate slug format
                    is_valid, message = self.validate_slug_format(product['slug'])
                    if not is_valid:
                        invalid_slugs.append(f"{product.get('name', 'Unknown')}: {message}")
                else:
                    products_without_slug += 1
            
            # Log results
            if products_without_slug > 0:
                self.log_test(
                    "Products have slug field", 
                    False, 
                    f"{products_without_slug}/{len(products)} products missing slug field"
                )
            else:
                self.log_test(
                    "Products have slug field", 
                    True, 
                    f"All {len(products)} products have slug field"
                )
            
            # Validate slug formats
            if invalid_slugs:
                self.log_test(
                    "Slug format validation", 
                    False, 
                    f"Invalid slugs found: {'; '.join(invalid_slugs[:3])}" + ("..." if len(invalid_slugs) > 3 else "")
                )
            else:
                self.log_test(
                    "Slug format validation", 
                    True, 
                    f"All {products_with_slug} slugs have correct format"
                )
            
            self.log_test("GET /api/products", True, f"Found {len(products)} products")
            return products
            
        except Exception as e:
            self.log_test("GET /api/products", False, f"Exception: {str(e)}")
            return []

    def test_get_product_by_slug(self, slug, test_name=None):
        """Test getting a product by slug"""
        if not test_name:
            test_name = f"GET /api/products/{slug}"
        
        try:
            # Try the specific slug endpoint first
            url = f"{self.api_url}/products/by-slug/{slug}"
            response = requests.get(url)
            
            if response.status_code == 200:
                product = response.json()
                self.log_test(
                    f"{test_name} (by-slug endpoint)", 
                    True, 
                    f"Found product: {product.get('name', 'Unknown')}"
                )
                return True, product
            
            # Try the general products endpoint that can handle slugs
            url = f"{self.api_url}/products/{slug}"
            response = requests.get(url)
            
            if response.status_code == 200:
                product = response.json()
                self.log_test(
                    f"{test_name} (general endpoint)", 
                    True, 
                    f"Found product: {product.get('name', 'Unknown')}"
                )
                return True, product
            elif response.status_code == 404:
                self.log_test(
                    test_name, 
                    False, 
                    f"Product not found (404) - slug '{slug}' may not exist"
                )
                return False, {}
            else:
                self.log_test(
                    test_name, 
                    False, 
                    f"Status: {response.status_code}"
                )
                return False, {}
                
        except Exception as e:
            self.log_test(test_name, False, f"Exception: {str(e)}")
            return False, {}

    def test_specific_slugs(self):
        """Test the specific slugs mentioned in the review request"""
        # Test specific slugs from the review request
        test_slugs = [
            "premium-silicone-iphone-case",
            "65w-fast-charger-usb-c"
        ]
        
        for slug in test_slugs:
            self.test_get_product_by_slug(slug)

    def test_slug_functionality_with_existing_products(self, products):
        """Test slug functionality with existing products"""
        if not products:
            self.log_test("Slug functionality test", False, "No products available to test")
            return
        
        # Test first few products with slugs
        tested_count = 0
        for product in products[:5]:  # Test first 5 products
            if 'slug' in product and product['slug']:
                slug = product['slug']
                success, retrieved_product = self.test_get_product_by_slug(
                    slug, 
                    f"GET existing product by slug '{slug}'"
                )
                
                if success:
                    # Verify the retrieved product matches
                    if retrieved_product.get('id') == product.get('id'):
                        self.log_test(
                            f"Slug retrieval accuracy for '{slug}'", 
                            True, 
                            "Retrieved correct product"
                        )
                    else:
                        self.log_test(
                            f"Slug retrieval accuracy for '{slug}'", 
                            False, 
                            "Retrieved different product"
                        )
                
                tested_count += 1
        
        if tested_count == 0:
            self.log_test("Slug functionality test", False, "No products with slugs found to test")

    def run_all_tests(self):
        """Run all slug-related tests"""
        print("🔗 Testing Product Slug Functionality")
        print("=" * 50)
        
        # Test 1: Get products and verify slug field
        print("\n1️⃣ Testing GET /api/products - Verify slug field...")
        products = self.test_products_have_slug_field()
        
        # Test 2: Test specific slugs from review request
        print("\n2️⃣ Testing specific slugs from review request...")
        self.test_specific_slugs()
        
        # Test 3: Test slug functionality with existing products
        print("\n3️⃣ Testing slug functionality with existing products...")
        self.test_slug_functionality_with_existing_products(products)
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Slug Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        # Print failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        else:
            print("\n🎉 All slug tests passed!")
        
        return self.tests_passed == self.tests_run

def main():
    """Main function to run slug tests"""
    tester = ProductSlugTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())