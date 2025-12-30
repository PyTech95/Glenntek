#!/usr/bin/env python3
"""
Seed script to populate Glenntek database with initial data
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend'))

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_database():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["glenntek_ecommerce"]
    
    print("🌱 Starting database seeding...")
    
    # Create admin user
    admin_exists = await db.users.find_one({"email": "admin@glenntek.pt"})
    if not admin_exists:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@glenntek.pt",
            "password": pwd_context.hash("admin123"),
            "full_name": "Admin User",
            "phone": "00351928489086",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        }
        await db.users.insert_one(admin_user)
        print("✅ Admin user created (admin@glenntek.pt / admin123)")
    
    # Create categories
    categories_data = [
        {"name": "Phone Cases", "slug": "cases", "description": "Protective cases for all phone models"},
        {"name": "Chargers", "slug": "chargers", "description": "Fast and wireless chargers"},
        {"name": "Cables", "slug": "cables", "description": "USB-C, Lightning, and Micro USB cables"},
        {"name": "Screen Protectors", "slug": "screen-protectors", "description": "Tempered glass screen protectors"},
        {"name": "Accessories", "slug": "accessories", "description": "Other mobile accessories"}
    ]
    
    for cat_data in categories_data:
        exists = await db.categories.find_one({"slug": cat_data["slug"]})
        if not exists:
            category = {
                "id": str(uuid.uuid4()),
                **cat_data,
                "image": None,
                "parent_id": None,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.categories.insert_one(category)
    print("✅ Categories created")
    
    # Create sample products
    products_data = [
        {
            "name": "Premium Silicone iPhone Case",
            "description": "Soft silicone case with microfiber lining. Perfect fit and protection for your iPhone.",
            "category": "cases",
            "price": 24.99,
            "compare_price": 34.99,
            "sku": "CASE-IP-001",
            "stock_quantity": 50,
            "tags": ["silicone", "iPhone", "premium"],
            "specifications": {"Material": "Silicone", "Compatibility": "iPhone 14/15"}
        },
        {
            "name": "65W Fast Charger USB-C",
            "description": "Ultra-fast 65W charger with USB-C Power Delivery. Charge your devices in no time.",
            "category": "chargers",
            "price": 39.99,
            "compare_price": 49.99,
            "sku": "CHG-USBC-001",
            "stock_quantity": 30,
            "tags": ["fast-charge", "USB-C", "65W"],
            "specifications": {"Power": "65W", "Output": "USB-C PD"}
        },
        {
            "name": "Braided USB-C to Lightning Cable 2m",
            "description": "Durable braided cable with fast charging support. 2 meters length for maximum convenience.",
            "category": "cables",
            "price": 19.99,
            "sku": "CBL-USBC-LTG-001",
            "stock_quantity": 100,
            "tags": ["braided", "USB-C", "Lightning", "2m"],
            "specifications": {"Length": "2m", "Type": "USB-C to Lightning"}
        },
        {
            "name": "Tempered Glass Screen Protector",
            "description": "9H hardness tempered glass screen protector with oleophobic coating.",
            "category": "screen-protectors",
            "price": 12.99,
            "sku": "SCR-GLASS-001",
            "stock_quantity": 75,
            "tags": ["tempered-glass", "9H", "protection"],
            "specifications": {"Hardness": "9H", "Material": "Tempered Glass"}
        },
        {
            "name": "Wireless Car Mount Charger",
            "description": "Magnetic car mount with 15W wireless charging. Safe and convenient for driving.",
            "category": "accessories",
            "price": 44.99,
            "compare_price": 59.99,
            "sku": "ACC-CAR-001",
            "stock_quantity": 25,
            "tags": ["wireless", "car-mount", "15W"],
            "specifications": {"Power": "15W", "Type": "Magnetic"}
        },
        {
            "name": "Leather Wallet Case",
            "description": "Genuine leather wallet case with card slots. Elegant and functional.",
            "category": "cases",
            "price": 34.99,
            "sku": "CASE-WLT-001",
            "stock_quantity": 40,
            "tags": ["leather", "wallet", "premium"],
            "specifications": {"Material": "Genuine Leather", "Card Slots": "3"}
        }
    ]
    
    for prod_data in products_data:
        exists = await db.products.find_one({"sku": prod_data["sku"]})
        if not exists:
            product = {
                "id": str(uuid.uuid4()),
                **prod_data,
                "images": [],
                "variants": [],
                "low_stock_threshold": 10,
                "seo_title": None,
                "seo_description": None,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.products.insert_one(product)
    print("✅ Sample products created")
    
    # Create default pages
    pages_data = [
        {
            "title": "About Us",
            "slug": "about",
            "content": "<h2>Welcome to Glenntek</h2><p>Your trusted partner for premium mobile accessories in Portugal. We offer high-quality products at competitive prices with excellent customer service.</p>"
        },
        {
            "title": "Contact Us",
            "slug": "contact",
            "content": "<h2>Get in Touch</h2><p><strong>Phone:</strong> 00351928489086</p><p><strong>Email:</strong> info@glenntek.pt</p><p><strong>Address:</strong> Portugal, Europe</p>"
        },
        {
            "title": "Shipping Information",
            "slug": "shipping",
            "content": "<h2>Shipping Policy</h2><p>We offer free shipping on orders over €50 across Portugal. Standard delivery takes 2-5 business days.</p>"
        },
        {
            "title": "Returns Policy",
            "slug": "returns",
            "content": "<h2>Returns & Refunds</h2><p>We accept returns within 30 days of purchase. Products must be in original condition.</p>"
        }
    ]
    
    for page_data in pages_data:
        exists = await db.pages.find_one({"slug": page_data["slug"]})
        if not exists:
            page = {
                "id": str(uuid.uuid4()),
                **page_data,
                "seo_title": None,
                "seo_description": None,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.pages.insert_one(page)
    print("✅ Default pages created")
    
    # Create settings
    settings_exists = await db.settings.find_one({})
    if not settings_exists:
        settings = {
            "id": str(uuid.uuid4()),
            "site_name": "Glenntek",
            "site_logo": "https://customer-assets.emergentagent.com/job_techbazaar-80/artifacts/fru7adia_WhatsApp%20Image%202025-11-15%20at%207.43.12%20PM.jpeg",
            "site_description": "Premium Mobile Accessories Store",
            "contact_email": "info@glenntek.pt",
            "contact_phone": "00351928489086",
            "address": "Portugal, Europe",
            "social_media": {},
            "primary_color": "#0066CC",
            "secondary_color": "#FF9933",
            "currency": "EUR",
            "tax_rate": 23.0,
            "shipping_zones": [],
            "payment_methods": {},
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.settings.insert_one(settings)
    print("✅ Settings initialized")
    
    print("🎉 Database seeding completed!")
    print("\n📝 Login Credentials:")
    print("   Admin: admin@glenntek.pt / admin123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
