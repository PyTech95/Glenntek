from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
# from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
import base64
from fastapi import Request

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', 10080))

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Setup static files for uploaded images
STATIC_DIR = Path("/app/backend/static")
UPLOAD_DIR = STATIC_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# ========== MODELS ==========

class UserRole(BaseModel):
    name: str
    permissions: List[str]

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str = "customer"  # customer, admin, manager
    referral_code: Optional[str] = None  # User's unique referral code
    referred_by: Optional[str] = None  # Referral code used during registration
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    referral_code: Optional[str] = None  # Referral code used during registration

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: Optional[str] = None  # URL-friendly product name
    description: str
    category: str
    price: float
    compare_price: Optional[float] = None
    sku: str
    images: List[str] = []
    variants: List[Dict[str, Any]] = []
    stock_quantity: int = 0
    low_stock_threshold: int = 10
    tags: List[str] = []
    specifications: Dict[str, Any] = {}
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    slug: Optional[str] = None  # Auto-generated from name if not provided
    description: str
    category: str
    price: float
    compare_price: Optional[float] = None
    sku: str
    images: List[str] = []
    variants: List[Dict[str, Any]] = []
    stock_quantity: int = 0
    low_stock_threshold: int = 10
    tags: List[str] = []
    specifications: Dict[str, Any] = {}
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    description: Optional[str] = None
    image: Optional[str] = None
    parent_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image: Optional[str] = None
    parent_id: Optional[str] = None

class Order(BaseModel):
    id: str
    order_number: str
    user_id: str

    items: List[Dict[str, Any]]

    subtotal: float
    shipping_cost: float
    tax: float
    total: float

    status: str = "processing"
    payment_status: str = "pending"
    payment_method: str

    shipping_address: Dict[str, Any]
    billing_address: Dict[str, Any]

    tracking_number: Optional[str] = None
    shipping_carrier: Optional[str] = None
    notes: Optional[str] = None

    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Config:
        extra = "allow" 

class OrderCreate(BaseModel):
    items: List[Dict[str, Any]]
    subtotal: float
    shipping_cost: float
    tax: float
    total: float
    payment_method: str
    shipping_address: Dict[str, Any]
    billing_address: Dict[str, Any]


class Page(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    content: str
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PageCreate(BaseModel):
    title: str
    slug: str
    content: str
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None

class BlogPost(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    excerpt: Optional[str] = None
    images: List[str] = []   
    author_id: str
    tags: List[str] = []
    category: str
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    is_published: bool = False
    published_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BlogPostCreate(BaseModel):
    title: str
    slug: str
    excerpt: Optional[str] = None
    images: List[str] = []  
    tags: List[str] = []
    category: str
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    is_published: bool = False

class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    site_name: str = "Glenntek"
    site_logo: str = "https://customer-assets.emergentagent.com/job_techbazaar-80/artifacts/fru7adia_WhatsApp%20Image%202025-11-15%20at%207.43.12%20PM.jpeg"
    site_description: str = "Premium Mobile Accessories Store"
    contact_email: str = "info@glenntek.pt"
    contact_phone: str = "00351928489086"
    address: str = "Portugal, Europe"
    social_media: Dict[str, str] = {}
    primary_color: str = "#0066CC"
    secondary_color: str = "#FF9933"
    currency: str = "EUR"
    tax_rate: float = 23.0  # Portugal VAT
    shipping_zones: List[Dict[str, Any]] = []
    payment_methods: Dict[str, Any] = {}
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SiteSettingsUpdate(BaseModel):
    site_name: Optional[str] = None
    site_logo: Optional[str] = None
    site_description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    social_media: Optional[Dict[str, str]] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None

class PaymentGateway(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # Stripe, PayPal, MB WAY, etc.
    type: str  # stripe, paypal, mbway, bank_transfer
    is_active: bool = True
    is_test_mode: bool = True
    config: Dict[str, Any] = {}  # API keys, credentials, etc.
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentGatewayCreate(BaseModel):
    name: str
    type: str
    is_active: bool = True
    is_test_mode: bool = True
    config: Dict[str, Any] = {}

class ShippingMethod(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    carrier: str  # CTT, DHL, FedEx, etc.
    type: str  # standard, express, international
    base_rate: float
    per_kg_rate: float = 0.0
    free_shipping_threshold: Optional[float] = None
    estimated_days_min: int = 2
    estimated_days_max: int = 5
    is_active: bool = True
    zones: List[str] = []  # Portugal, Europe, International
    config: Dict[str, Any] = {}  # API credentials, tracking URL, etc.
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShippingMethodCreate(BaseModel):
    name: str
    carrier: str
    type: str
    base_rate: float
    per_kg_rate: float = 0.0
    free_shipping_threshold: Optional[float] = None
    estimated_days_min: int = 2
    estimated_days_max: int = 5
    is_active: bool = True
    zones: List[str] = []
    config: Dict[str, Any] = {}

class HeroSlide(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subtitle: Optional[str] = None
    image: str
    button_text: Optional[str] = None
    button_link: Optional[str] = None
    order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HeroSlideCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    image: str
    button_text: Optional[str] = None
    button_link: Optional[str] = None
    order: int = 0

# ========== HOMEPAGE SECTION MODELS ==========

class HomepageSection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    section_type: str  # new_arrivals, featured_products, categories, banner, custom
    title: str
    subtitle: Optional[str] = None
    is_active: bool = True
    order: int = 0
    config: Dict[str, Any] = {}  # Additional config like product_ids, limit, etc.
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HomepageSectionCreate(BaseModel):
    section_type: str
    title: str
    subtitle: Optional[str] = None
    is_active: bool = True
    order: int = 0
    config: Dict[str, Any] = {}

class HomepageSectionUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None
    config: Optional[Dict[str, Any]] = None

# ========== WISHLIST MODELS ==========

class WishlistItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WishlistItemCreate(BaseModel):
    product_id: str

# ========== WALLET MODELS ==========

class WalletTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float  # Positive for credit, negative for debit
    type: str  # credit, debit, referral_bonus, order_payment, refund
    description: str
    reference_id: Optional[str] = None  # Order ID, referral ID, etc.
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Wallet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    balance: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WalletTopUp(BaseModel):
    user_id: str
    amount: float
    description: str = "Admin top-up"

# ========== REFERRAL MODELS ==========

class Referral(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    referrer_id: str  # User who shared the code
    referred_id: str  # New user who used the code
    referral_code: str
    status: str = "pending"  # pending, completed, rewarded
    referrer_reward: float = 5.0  # Reward for referrer
    referred_reward: float = 5.0  # Reward for new user
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    rewarded_at: Optional[datetime] = None

class ReferralSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    referrer_reward: float = 5.0  # €5 default
    referred_reward: float = 5.0  # €5 default
    min_order_amount: float = 0.0  # Min order to activate referral
    is_active: bool = True
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReferralSettingsUpdate(BaseModel):
    referrer_reward: Optional[float] = None
    referred_reward: Optional[float] = None
    min_order_amount: Optional[float] = None
    is_active: Optional[bool] = None

# ========== HELPER FUNCTIONS ==========

import random
import string
import re

def generate_referral_code(length: int = 8) -> str:
    """Generate a unique referral code"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=length))

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from product name"""
    # Convert to lowercase and replace spaces with hyphens
    slug = name.lower().strip()
    # Remove special characters except hyphens
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    # Replace spaces with hyphens
    slug = re.sub(r'[\s]+', '-', slug)
    # Remove multiple consecutive hyphens
    slug = re.sub(r'-+', '-', slug)
    return slug

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user_doc is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        if isinstance(user_doc['created_at'], str):
            user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
        
        return User(**user_doc)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ========== AUTH ROUTES ==========

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate referral code if provided
    referrer = None
    if user_data.referral_code:
        referrer = await db.users.find_one({"referral_code": user_data.referral_code})
        if not referrer:
            raise HTTPException(status_code=400, detail="Invalid referral code")
    
    # Generate unique referral code for new user
    while True:
        new_referral_code = generate_referral_code()
        existing_code = await db.users.find_one({"referral_code": new_referral_code})
        if not existing_code:
            break
    
    # Create user
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        phone=user_data.phone,
        referral_code=new_referral_code,
        referred_by=user_data.referral_code if referrer else None
    )
    
    user_doc = user.model_dump()
    user_doc['password'] = hash_password(user_data.password)
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Create wallet for new user
    wallet = {
        "id": str(uuid.uuid4()),
        "user_id": user.id,
        "balance": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.wallets.insert_one(wallet)
    
    # Process referral if applicable
    if referrer:
        # Get referral settings
        settings = await db.referral_settings.find_one({})
        referrer_reward = settings.get('referrer_reward', 5.0) if settings else 5.0
        referred_reward = settings.get('referred_reward', 5.0) if settings else 5.0
        
        # Create referral record
        referral = {
            "id": str(uuid.uuid4()),
            "referrer_id": referrer['id'],
            "referred_id": user.id,
            "referral_code": user_data.referral_code,
            "status": "completed",
            "referrer_reward": referrer_reward,
            "referred_reward": referred_reward,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "rewarded_at": datetime.now(timezone.utc).isoformat()
        }
        await db.referrals.insert_one(referral)
        
        # Add reward to referrer's wallet
        referrer_wallet = await db.wallets.find_one({"user_id": referrer['id']})
        if referrer_wallet:
            await db.wallets.update_one(
                {"user_id": referrer['id']},
                {"$inc": {"balance": referrer_reward}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        else:
            await db.wallets.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": referrer['id'],
                "balance": referrer_reward,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Add referrer reward transaction
        await db.wallet_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": referrer['id'],
            "amount": referrer_reward,
            "type": "referral_bonus",
            "description": f"Referral bonus for inviting {user.full_name}",
            "reference_id": referral['id'],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Add reward to new user's wallet
        await db.wallets.update_one(
            {"user_id": user.id},
            {"$inc": {"balance": referred_reward}}
        )
        
        # Add new user reward transaction
        await db.wallet_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user.id,
            "amount": referred_reward,
            "type": "referral_bonus",
            "description": f"Welcome bonus from referral",
            "reference_id": referral['id'],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user_doc = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(login_data.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user_doc.pop('password', None)
    user = User(**user_doc)
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ========== PRODUCT ROUTES ==========

@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    tags: Optional[str] = None,
    limit: int = Query(50, le=100),
    skip: int = 0
):
    query = {"is_active": True}
    
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if min_price is not None or max_price is not None:
        query["price"] = {}
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price
    if tags:
        tag_list = tags.split(",")
        query["tags"] = {"$in": tag_list}
    
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
        if isinstance(product.get('updated_at'), str):
            product['updated_at'] = datetime.fromisoformat(product['updated_at'])
    
    return products

from fastapi import Request

@api_router.get("/products/{value}", response_model=Product)
async def get_product(value: str, request: Request):
    product = await db.products.find_one(
        {"$or": [{"id": value}, {"slug": value}]},
        {"_id": 0}
    )

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    base_url = str(request.base_url).rstrip("/")

    product["images"] = [
        img if img.startswith("http") else f"{base_url}{img}"
        for img in product.get("images", [])
    ]

    return Product(**product)


@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, admin: User = Depends(get_admin_user)):
    product_dict = product_data.model_dump()
    
    # Auto-generate slug if not provided
    if not product_dict.get('slug'):
        base_slug = generate_slug(product_dict['name'])
        slug = base_slug
        counter = 1
        # Ensure slug is unique
        while await db.products.find_one({"slug": slug}):
            slug = f"{base_slug}-{counter}"
            counter += 1
        product_dict['slug'] = slug
    
    product = Product(**product_dict)
    product_doc = product.model_dump()
    product_doc['created_at'] = product_doc['created_at'].isoformat()
    product_doc['updated_at'] = product_doc['updated_at'].isoformat()
    
    await db.products.insert_one(product_doc)
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductCreate, admin: User = Depends(get_admin_user)):
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.model_dump()
    
    # Auto-generate slug if name changed and no slug provided
    if not update_data.get('slug') or update_data['name'] != existing.get('name'):
        base_slug = generate_slug(update_data['name'])
        slug = base_slug
        counter = 1
        # Ensure slug is unique (excluding current product)
        while True:
            existing_slug = await db.products.find_one({"slug": slug, "id": {"$ne": product_id}})
            if not existing_slug:
                break
            slug = f"{base_slug}-{counter}"
            counter += 1
        update_data['slug'] = slug
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated_product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated_product.get('created_at'), str):
        updated_product['created_at'] = datetime.fromisoformat(updated_product['created_at'])
    if isinstance(updated_product.get('updated_at'), str):
        updated_product['updated_at'] = datetime.fromisoformat(updated_product['updated_at'])
    
    return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: User = Depends(get_admin_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# ========== CATEGORY ROUTES ==========

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({"is_active": True}, {"_id": 0}).to_list(100)
    for cat in categories:
        if isinstance(cat.get('created_at'), str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
    return categories

@api_router.post("/categories", response_model=Category)
async def create_category(category_data: CategoryCreate, admin: User = Depends(get_admin_user)):
    category = Category(**category_data.model_dump())
    category_doc = category.model_dump()
    category_doc['created_at'] = category_doc['created_at'].isoformat()
    
    await db.categories.insert_one(category_doc)
    return category

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category_data: CategoryCreate, admin: User = Depends(get_admin_user)):
    existing = await db.categories.find_one({"id": category_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await db.categories.update_one({"id": category_id}, {"$set": category_data.model_dump()})
    
    updated_category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if isinstance(updated_category.get('created_at'), str):
        updated_category['created_at'] = datetime.fromisoformat(updated_category['created_at'])
    
    return Category(**updated_category)

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, admin: User = Depends(get_admin_user)):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# ========== ORDER ROUTES ==========

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    order_id = str(uuid.uuid4())
    order_number = f"GLN-{await db.orders.count_documents({}) + 1:06d}"

    order = Order(
        id=order_id,                
        order_number=order_number,
        user_id=current_user.id,     
        **order_data.model_dump()
    )

    order_doc = order.model_dump()
    order_doc['created_at'] = order_doc['created_at'].isoformat()
    order_doc['updated_at'] = order_doc['updated_at'].isoformat()

    for item in order_data.items:
        product = await db.products.find_one({"id": item['product_id']})
        if product:
            new_stock = max(0, product['stock_quantity'] - item['quantity'])
            await db.products.update_one({"id": item['product_id']}, {"$set": {"stock_quantity": new_stock}})

    await db.orders.insert_one(order_doc)
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(
    current_user: User = Depends(get_current_user),
    status: Optional[str] = None,
    limit: int = Query(50, le=100),
    skip: int = 0
):
    query = {}
    
    if current_user.role not in ["admin", "manager"]:
        query["user_id"] = current_user.id
    
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for order in orders:
        # Set defaults for missing fields
        order.setdefault("order_number", "")
        order.setdefault("user_id", "")
        order.setdefault("items", [])
        order.setdefault("subtotal", 0.0)
        order.setdefault("shipping_cost", 0.0)
        order.setdefault("tax", 0.0)
        order.setdefault("total", 0.0)
        order.setdefault("payment_method", "")
        order.setdefault("shipping_address", {})
        order.setdefault("billing_address", {})
        order.setdefault("status", "processing")
        order.setdefault("payment_status", "pending")
        order.setdefault("tracking_number", None)
        order.setdefault("shipping_carrier", None)
        order.setdefault("notes", None)
        order.setdefault("created_at", datetime.utcnow())
        order.setdefault("updated_at", datetime.utcnow())

        # Convert timestamps if they are strings
        if isinstance(order.get("created_at"), str):
            order["created_at"] = datetime.fromisoformat(order["created_at"])
        if isinstance(order.get("updated_at"), str):
            order["updated_at"] = datetime.fromisoformat(order["updated_at"])

        result.append(Order(**order))
    
    return result


@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role not in ["admin", "manager"] and order['user_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    for item in order.get("items", []):
        product = await db.products.find_one(
            {"id": item["product_id"]}, {"_id": 0, "images": 1}
        )
        if product and product.get("images"):
            item["image"] = product["images"][0]  # pick first image
        else:
            item["image"] = None

    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if isinstance(order.get('updated_at'), str):
        order['updated_at'] = datetime.fromisoformat(order['updated_at'])

    return Order(**order)

@api_router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: str,
    tracking_number: Optional[str] = None,
    shipping_carrier: Optional[str] = None,
    admin: User = Depends(get_admin_user)
):
    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if tracking_number:
        update_data["tracking_number"] = tracking_number
    if shipping_carrier:
        update_data["shipping_carrier"] = shipping_carrier
    
    result = await db.orders.update_one({"id": order_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated successfully"}

# ========== PAGE ROUTES ==========

@api_router.get("/pages", response_model=List[Page])
async def get_pages(is_active: bool = True):
    pages = await db.pages.find({"is_active": is_active}, {"_id": 0}).to_list(100)
    for page in pages:
        if isinstance(page.get('created_at'), str):
            page['created_at'] = datetime.fromisoformat(page['created_at'])
        if isinstance(page.get('updated_at'), str):
            page['updated_at'] = datetime.fromisoformat(page['updated_at'])
    return pages

@api_router.get("/pages/{slug}", response_model=Page)
async def get_page_by_slug(slug: str):
    page = await db.pages.find_one({"slug": slug, "is_active": True}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    if isinstance(page.get('created_at'), str):
        page['created_at'] = datetime.fromisoformat(page['created_at'])
    if isinstance(page.get('updated_at'), str):
        page['updated_at'] = datetime.fromisoformat(page['updated_at'])
    
    return Page(**page)

@api_router.post("/pages", response_model=Page)
async def create_page(page_data: PageCreate, admin: User = Depends(get_admin_user)):
    page = Page(**page_data.model_dump())
    page_doc = page.model_dump()
    page_doc['created_at'] = page_doc['created_at'].isoformat()
    page_doc['updated_at'] = page_doc['updated_at'].isoformat()
    
    await db.pages.insert_one(page_doc)
    return page

@api_router.put("/pages/{page_id}", response_model=Page)
async def update_page(page_id: str, page_data: PageCreate, admin: User = Depends(get_admin_user)):
    existing = await db.pages.find_one({"id": page_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Page not found")
    
    update_data = page_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.pages.update_one({"id": page_id}, {"$set": update_data})
    
    updated_page = await db.pages.find_one({"id": page_id}, {"_id": 0})
    if isinstance(updated_page.get('created_at'), str):
        updated_page['created_at'] = datetime.fromisoformat(updated_page['created_at'])
    if isinstance(updated_page.get('updated_at'), str):
        updated_page['updated_at'] = datetime.fromisoformat(updated_page['updated_at'])
    
    return Page(**updated_page)

@api_router.delete("/pages/{page_id}")
async def delete_page(page_id: str, admin: User = Depends(get_admin_user)):
    result = await db.pages.delete_one({"id": page_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    return {"message": "Page deleted successfully"}

# ========== BLOG ROUTES ==========

@api_router.get("/blog", response_model=List[BlogPost])
async def get_blog_posts(category: Optional[str] = None, limit: int = Query(20, le=50), skip: int = 0):
    query = {"is_published": True}
    if category:
        query["category"] = category
    
    posts = await db.blog_posts.find(query, {"_id": 0}).sort("published_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for post in posts:
        if isinstance(post.get('created_at'), str):
            post['created_at'] = datetime.fromisoformat(post['created_at'])
        if isinstance(post.get('updated_at'), str):
            post['updated_at'] = datetime.fromisoformat(post['updated_at'])
        if isinstance(post.get('published_at'), str):
            post['published_at'] = datetime.fromisoformat(post['published_at'])
    
    return posts

@api_router.post("/blog", response_model=BlogPost)
async def create_blog_post(
    post_data: BlogPostCreate,
    admin: User = Depends(get_admin_user)
):
    post = BlogPost(
        author_id=admin.id,
        **post_data.model_dump()
    )

    if post.is_published and not post.published_at:
        post.published_at = datetime.now(timezone.utc)

    post_doc = post.model_dump()
    post_doc["created_at"] = post_doc["created_at"].isoformat()
    post_doc["updated_at"] = post_doc["updated_at"].isoformat()

    if post_doc.get("published_at"):
        post_doc["published_at"] = post_doc["published_at"].isoformat()

    await db.blog_posts.insert_one(post_doc)
    return post


# ========== SETTINGS ROUTES ==========

@api_router.get("/settings", response_model=SiteSettings)
async def get_settings():
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        # Create default settings
        default_settings = SiteSettings()
        settings_doc = default_settings.model_dump()
        settings_doc['updated_at'] = settings_doc['updated_at'].isoformat()
        await db.settings.insert_one(settings_doc)
        return default_settings
    
    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    
    return SiteSettings(**settings)

@api_router.put("/settings", response_model=SiteSettings)
async def update_settings(settings_data: SiteSettingsUpdate, admin: User = Depends(get_admin_user)):
    update_data = {k: v for k, v in settings_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.settings.update_one({}, {"$set": update_data}, upsert=True)
    
    updated_settings = await db.settings.find_one({}, {"_id": 0})
    if isinstance(updated_settings.get('updated_at'), str):
        updated_settings['updated_at'] = datetime.fromisoformat(updated_settings['updated_at'])
    
    return SiteSettings(**updated_settings)

# ========== AI ROUTES ==========

@api_router.post("/ai/recommendations")
async def get_ai_recommendations(product_id: Optional[str] = None, category: Optional[str] = None):
    try:
        # Get product context
        context = ""
        if product_id:
            product = await db.products.find_one({"id": product_id}, {"_id": 0})
            if product:
                context = f"Current product: {product['name']} - {product['description']}"
        
        # Get available products
        query = {"is_active": True}
        if category:
            query["category"] = category
        
        products = await db.products.find(query, {"_id": 0}).limit(20).to_list(20)
        
        products_info = "\n".join([
            f"- {p['name']} (€{p['price']}): {p['description'][:100]}"
            for p in products
        ])
        
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id="recommendations",
            system_message="You are a helpful e-commerce assistant. Recommend 3-5 relevant products based on the context."
        ).with_model("openai", "gpt-4o-mini")
        
        message = UserMessage(
            text=f"{context}\n\nAvailable products:\n{products_info}\n\nRecommend the best 3-5 products and explain why."
        )
        
        response = await chat.send_message(message)
        
        return {"recommendations": response}
    except Exception as e:
        return {"recommendations": "Unable to generate recommendations at this time."}

@api_router.post("/ai/search")
async def ai_search(query: str):
    try:
        # Get all products
        products = await db.products.find({"is_active": True}, {"_id": 0}).limit(50).to_list(50)
        
        products_info = "\n".join([
            f"ID: {p['id']} | {p['name']} (€{p['price']}): {p['description'][:100]}"
            for p in products
        ])
        
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id="search",
            system_message="You are a helpful search assistant. Find the most relevant products and return ONLY their IDs as a JSON array."
        ).with_model("openai", "gpt-4o-mini")
        
        message = UserMessage(
            text=f"User query: {query}\n\nProducts:\n{products_info}\n\nReturn only a JSON array of product IDs, like: [\"id1\", \"id2\"]"
        )
        
        response = await chat.send_message(message)
        
        # Try to parse IDs from response
        import re
        ids = re.findall(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', response)
        
        # Get matching products
        matching_products = [p for p in products if p['id'] in ids]
        
        return {"results": matching_products, "explanation": response}
    except Exception as e:
        return {"results": [], "explanation": "Search unavailable"}

# ========== HOMEPAGE SECTIONS ROUTES ==========

@api_router.get("/homepage-sections")
async def get_homepage_sections(active_only: bool = True):
    """Get all homepage sections"""
    query = {"is_active": True} if active_only else {}
    sections = await db.homepage_sections.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    
    # Convert ObjectId and datetime if present
    for section in sections:
        if 'config' in section and section['config'] is None:
            section['config'] = {}
    
    # If no sections exist, create default ones
    if not sections:
        default_sections = [
            {
                "id": str(uuid.uuid4()),
                "section_type": "new_arrivals",
                "title": "New Arrivals",
                "subtitle": "Check out our latest products",
                "is_active": True,
                "order": 1,
                "config": {"limit": 4, "sort_by": "created_at", "sort_order": "desc"},
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "section_type": "featured_products",
                "title": "Featured Products",
                "subtitle": "Our most popular items",
                "is_active": True,
                "order": 2,
                "config": {"limit": 8, "featured": True},
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "section_type": "categories",
                "title": "Shop by Category",
                "subtitle": "Find what you need",
                "is_active": True,
                "order": 3,
                "config": {},
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        for section in default_sections:
            await db.homepage_sections.insert_one(section)
        sections = default_sections
    
    return sections

@api_router.get("/homepage-sections/{section_id}")
async def get_homepage_section(section_id: str):
    """Get a single homepage section"""
    section = await db.homepage_sections.find_one({"id": section_id}, {"_id": 0})
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section

@api_router.post("/homepage-sections")
async def create_homepage_section(section_data: HomepageSectionCreate, admin: User = Depends(get_admin_user)):
    """Create a new homepage section"""
    section = HomepageSection(**section_data.model_dump())
    section_doc = section.model_dump()
    section_doc['created_at'] = section_doc['created_at'].isoformat()
    section_doc['updated_at'] = section_doc['updated_at'].isoformat()
    
    await db.homepage_sections.insert_one(section_doc)
    return section

@api_router.put("/homepage-sections/{section_id}")
async def update_homepage_section(section_id: str, section_data: HomepageSectionUpdate, admin: User = Depends(get_admin_user)):
    """Update a homepage section"""
    existing = await db.homepage_sections.find_one({"id": section_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Section not found")
    
    update_data = {k: v for k, v in section_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.homepage_sections.update_one({"id": section_id}, {"$set": update_data})
    
    updated = await db.homepage_sections.find_one({"id": section_id}, {"_id": 0})
    return updated

@api_router.delete("/homepage-sections/{section_id}")
async def delete_homepage_section(section_id: str, admin: User = Depends(get_admin_user)):
    """Delete a homepage section"""
    result = await db.homepage_sections.delete_one({"id": section_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    return {"message": "Section deleted successfully"}

@api_router.get("/homepage-sections/{section_id}/products")
async def get_section_products(section_id: str, limit: int = Query(8, le=20)):
    """Get products for a specific homepage section"""
    section = await db.homepage_sections.find_one({"id": section_id}, {"_id": 0})
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    config = section.get('config', {})
    query = {"is_active": True}
    sort_field = config.get('sort_by', 'created_at')
    sort_order = -1 if config.get('sort_order', 'desc') == 'desc' else 1
    
    # Handle specific product IDs if configured
    if 'product_ids' in config and config['product_ids']:
        query['id'] = {'$in': config['product_ids']}
    
    products = await db.products.find(query, {"_id": 0}).sort(sort_field, sort_order).limit(config.get('limit', limit)).to_list(limit)
    
    return products

# ========== IMAGE UPLOAD ROUTES (DATABASE STORAGE) ==========

import base64
from fastapi.responses import Response

@api_router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), admin: User = Depends(get_admin_user)):
    """Upload image and store in database as Base64"""
    try:
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Allowed: jpeg, png, gif, webp")
        
        # Read file contents
        contents = await file.read()
        
        # Check file size (limit to 5MB)
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB")
        
        # Generate unique ID for the image
        image_id = str(uuid.uuid4())
        file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else 'jpg'
        
        # Encode to Base64
        base64_data = base64.b64encode(contents).decode('utf-8')
        
        # Store in database
        image_doc = {
            "id": image_id,
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(contents),
            "data": base64_data,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "uploaded_by": admin.id
        }
        
        await db.images.insert_one(image_doc)
        
        # Return URL that points to our image serving endpoint
        base_url = os.environ.get('BACKEND_BASE_URL', '')
        image_url = f"{base_url}/api/images/{image_id}"
        
        return {"url": image_url, "filename": file.filename, "id": image_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

@api_router.get("/images/{image_id}")
async def get_image(image_id: str):
    image = await db.images.find_one({"id": image_id})
    if not image:
        raise HTTPException(status_code=404)

    return Response(
        content=base64.b64decode(image["data"]),
        media_type=image["content_type"]
    )


@api_router.delete("/images/{image_id}")
async def delete_image(image_id: str, admin: User = Depends(get_admin_user)):
    """Delete image from database"""
    result = await db.images.delete_one({"id": image_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Image not found")
    return {"message": "Image deleted successfully"}

# ========== HERO SLIDER ROUTES ==========

@api_router.get("/hero-slides", response_model=List[HeroSlide])
async def get_hero_slides():
    slides = await db.hero_slides.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(100)
    for slide in slides:
        if isinstance(slide.get('created_at'), str):
            slide['created_at'] = datetime.fromisoformat(slide['created_at'])
        if isinstance(slide.get('updated_at'), str):
            slide['updated_at'] = datetime.fromisoformat(slide['updated_at'])
    return slides

@api_router.post("/hero-slides", response_model=HeroSlide)
async def create_hero_slide(slide_data: HeroSlideCreate, admin: User = Depends(get_admin_user)):
    slide = HeroSlide(**slide_data.model_dump())
    slide_doc = slide.model_dump()
    slide_doc['created_at'] = slide_doc['created_at'].isoformat()
    slide_doc['updated_at'] = slide_doc['updated_at'].isoformat()
    
    await db.hero_slides.insert_one(slide_doc)
    return slide

@api_router.put("/hero-slides/{slide_id}", response_model=HeroSlide)
async def update_hero_slide(slide_id: str, slide_data: HeroSlideCreate, admin: User = Depends(get_admin_user)):
    existing = await db.hero_slides.find_one({"id": slide_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Slide not found")
    
    update_data = slide_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.hero_slides.update_one({"id": slide_id}, {"$set": update_data})
    
    updated_slide = await db.hero_slides.find_one({"id": slide_id}, {"_id": 0})
    if isinstance(updated_slide.get('created_at'), str):
        updated_slide['created_at'] = datetime.fromisoformat(updated_slide['created_at'])
    if isinstance(updated_slide.get('updated_at'), str):
        updated_slide['updated_at'] = datetime.fromisoformat(updated_slide['updated_at'])
    
    return HeroSlide(**updated_slide)

@api_router.delete("/hero-slides/{slide_id}")
async def delete_hero_slide(slide_id: str, admin: User = Depends(get_admin_user)):
    result = await db.hero_slides.delete_one({"id": slide_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Slide not found")
    return {"message": "Slide deleted successfully"}

@api_router.put("/hero-slides/{slide_id}/toggle")
async def toggle_hero_slide(slide_id: str, admin: User = Depends(get_admin_user)):
    slide = await db.hero_slides.find_one({"id": slide_id})
    if not slide:
        raise HTTPException(status_code=404, detail="Slide not found")
    
    new_status = not slide.get('is_active', True)
    await db.hero_slides.update_one(
        {"id": slide_id},
        {"$set": {"is_active": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Slide status updated", "is_active": new_status}

# ========== PAYMENT GATEWAY ROUTES ==========

@api_router.get("/payment-gateways", response_model=List[PaymentGateway])
async def get_payment_gateways(admin: User = Depends(get_admin_user)):
    gateways = await db.payment_gateways.find({}, {"_id": 0}).to_list(100)
    for gateway in gateways:
        if isinstance(gateway.get('created_at'), str):
            gateway['created_at'] = datetime.fromisoformat(gateway['created_at'])
        if isinstance(gateway.get('updated_at'), str):
            gateway['updated_at'] = datetime.fromisoformat(gateway['updated_at'])
    return gateways

@api_router.post("/payment-gateways", response_model=PaymentGateway)
async def create_payment_gateway(gateway_data: PaymentGatewayCreate, admin: User = Depends(get_admin_user)):
    gateway = PaymentGateway(**gateway_data.model_dump())
    gateway_doc = gateway.model_dump()
    gateway_doc['created_at'] = gateway_doc['created_at'].isoformat()
    gateway_doc['updated_at'] = gateway_doc['updated_at'].isoformat()
    
    await db.payment_gateways.insert_one(gateway_doc)
    return gateway

@api_router.put("/payment-gateways/{gateway_id}", response_model=PaymentGateway)
async def update_payment_gateway(gateway_id: str, gateway_data: PaymentGatewayCreate, admin: User = Depends(get_admin_user)):
    existing = await db.payment_gateways.find_one({"id": gateway_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Payment gateway not found")
    
    update_data = gateway_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.payment_gateways.update_one({"id": gateway_id}, {"$set": update_data})
    
    updated_gateway = await db.payment_gateways.find_one({"id": gateway_id}, {"_id": 0})
    if isinstance(updated_gateway.get('created_at'), str):
        updated_gateway['created_at'] = datetime.fromisoformat(updated_gateway['created_at'])
    if isinstance(updated_gateway.get('updated_at'), str):
        updated_gateway['updated_at'] = datetime.fromisoformat(updated_gateway['updated_at'])
    
    return PaymentGateway(**updated_gateway)

@api_router.delete("/payment-gateways/{gateway_id}")
async def delete_payment_gateway(gateway_id: str, admin: User = Depends(get_admin_user)):
    result = await db.payment_gateways.delete_one({"id": gateway_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment gateway not found")
    return {"message": "Payment gateway deleted successfully"}

@api_router.put("/payment-gateways/{gateway_id}/toggle")
async def toggle_payment_gateway(gateway_id: str, admin: User = Depends(get_admin_user)):
    gateway = await db.payment_gateways.find_one({"id": gateway_id})
    if not gateway:
        raise HTTPException(status_code=404, detail="Payment gateway not found")
    
    new_status = not gateway.get('is_active', True)
    await db.payment_gateways.update_one(
        {"id": gateway_id},
        {"$set": {"is_active": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Payment gateway status updated", "is_active": new_status}

# ========== SHIPPING ROUTES ==========

@api_router.get("/shipping-methods", response_model=List[ShippingMethod])
async def get_shipping_methods(admin: User = Depends(get_admin_user)):
    methods = await db.shipping_methods.find({}, {"_id": 0}).to_list(100)
    for method in methods:
        if isinstance(method.get('created_at'), str):
            method['created_at'] = datetime.fromisoformat(method['created_at'])
        if isinstance(method.get('updated_at'), str):
            method['updated_at'] = datetime.fromisoformat(method['updated_at'])
    return methods

@api_router.post("/shipping-methods", response_model=ShippingMethod)
async def create_shipping_method(method_data: ShippingMethodCreate, admin: User = Depends(get_admin_user)):
    method = ShippingMethod(**method_data.model_dump())
    method_doc = method.model_dump()
    method_doc['created_at'] = method_doc['created_at'].isoformat()
    method_doc['updated_at'] = method_doc['updated_at'].isoformat()
    
    await db.shipping_methods.insert_one(method_doc)
    return method

@api_router.put("/shipping-methods/{method_id}", response_model=ShippingMethod)
async def update_shipping_method(method_id: str, method_data: ShippingMethodCreate, admin: User = Depends(get_admin_user)):
    existing = await db.shipping_methods.find_one({"id": method_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Shipping method not found")
    
    update_data = method_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.shipping_methods.update_one({"id": method_id}, {"$set": update_data})
    
    updated_method = await db.shipping_methods.find_one({"id": method_id}, {"_id": 0})
    if isinstance(updated_method.get('created_at'), str):
        updated_method['created_at'] = datetime.fromisoformat(updated_method['created_at'])
    if isinstance(updated_method.get('updated_at'), str):
        updated_method['updated_at'] = datetime.fromisoformat(updated_method['updated_at'])
    
    return ShippingMethod(**updated_method)

@api_router.delete("/shipping-methods/{method_id}")
async def delete_shipping_method(method_id: str, admin: User = Depends(get_admin_user)):
    result = await db.shipping_methods.delete_one({"id": method_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shipping method not found")
    return {"message": "Shipping method deleted successfully"}

@api_router.put("/shipping-methods/{method_id}/toggle")
async def toggle_shipping_method(method_id: str, admin: User = Depends(get_admin_user)):
    method = await db.shipping_methods.find_one({"id": method_id})
    if not method:
        raise HTTPException(status_code=404, detail="Shipping method not found")
    
    new_status = not method.get('is_active', True)
    await db.shipping_methods.update_one(
        {"id": method_id},
        {"$set": {"is_active": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Shipping method status updated", "is_active": new_status}

# ========== ANALYTICS ROUTES ==========

@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(admin: User = Depends(get_admin_user)):
    # Get basic stats
    total_products = await db.products.count_documents({"is_active": True})
    total_orders = await db.orders.count_documents({})
    total_customers = await db.users.count_documents({"role": "customer"})
    
    # Get revenue
    orders = await db.orders.find({"payment_status": "paid"}, {"_id": 0}).to_list(1000)
    total_revenue = sum(order.get('total', 0) for order in orders)
    
    # Low stock products
    low_stock = await db.products.find(
        {"$expr": {"$lte": ["$stock_quantity", "$low_stock_threshold"]}},
        {"_id": 0}
    ).limit(10).to_list(10)
    
    # Recent orders
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_customers": total_customers,
        "total_revenue": total_revenue,
        "low_stock_products": low_stock,
        "recent_orders": recent_orders
    }

# ========== WISHLIST ROUTES ==========

from fastapi import Request

@api_router.get("/wishlist")
async def get_wishlist(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    wishlist_items = await db.wishlist.find(
        {"user_id": current_user.id}, {"_id": 0}
    ).to_list(100)

    product_ids = [item["product_id"] for item in wishlist_items]

    products = await db.products.find(
        {"id": {"$in": product_ids}}, {"_id": 0}
    ).to_list(100)

    base_url = str(request.base_url).rstrip("/")

    #  normalize product images
    products_map = {}
    for p in products:
        p["images"] = [
            img if img.startswith("http") else f"{base_url}{img}"
            for img in p.get("images", [])
        ]
        products_map[p["id"]] = p

    result = []
    for item in wishlist_items:
        product = products_map.get(item["product_id"])
        if product:
            result.append({
                **item,
                "product": product
            })

    return result


@api_router.post("/wishlist")
async def add_to_wishlist(item: WishlistItemCreate, current_user: User = Depends(get_current_user)):
    """Add product to wishlist"""
    # Check if product exists
    product = await db.products.find_one({"id": item.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if already in wishlist
    existing = await db.wishlist.find_one({
        "user_id": current_user.id,
        "product_id": item.product_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Product already in wishlist")
    
    wishlist_item = WishlistItem(
        user_id=current_user.id,
        product_id=item.product_id
    )
    
    item_doc = wishlist_item.model_dump()
    item_doc['created_at'] = item_doc['created_at'].isoformat()
    
    await db.wishlist.insert_one(item_doc)
    return {"message": "Added to wishlist", "item": wishlist_item}

@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, current_user: User = Depends(get_current_user)):
    """Remove product from wishlist"""
    result = await db.wishlist.delete_one({
        "user_id": current_user.id,
        "product_id": product_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found in wishlist")
    return {"message": "Removed from wishlist"}

@api_router.get("/wishlist/check/{product_id}")
async def check_wishlist(product_id: str, current_user: User = Depends(get_current_user)):
    """Check if product is in wishlist"""
    item = await db.wishlist.find_one({
        "user_id": current_user.id,
        "product_id": product_id
    })
    return {"in_wishlist": item is not None}

# ========== WALLET ROUTES ==========

@api_router.get("/wallet")
async def get_wallet(current_user: User = Depends(get_current_user)):
    """Get user's wallet balance and recent transactions"""
    wallet = await db.wallets.find_one({"user_id": current_user.id}, {"_id": 0})
    
    if not wallet:
        # Create wallet if doesn't exist
        wallet = Wallet(user_id=current_user.id)
        wallet_doc = wallet.model_dump()
        wallet_doc['created_at'] = wallet_doc['created_at'].isoformat()
        wallet_doc['updated_at'] = wallet_doc['updated_at'].isoformat()
        await db.wallets.insert_one(wallet_doc)
        wallet = wallet_doc
    
    # Get recent transactions
    transactions = await db.wallet_transactions.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    return {
        "balance": wallet.get('balance', 0),
        "transactions": transactions
    }

@api_router.get("/wallet/transactions")
async def get_wallet_transactions(
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, le=100),
    skip: int = 0
):
    """Get all wallet transactions"""
    transactions = await db.wallet_transactions.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return transactions

@api_router.post("/wallet/admin/topup")
async def admin_wallet_topup(topup: WalletTopUp, admin: User = Depends(get_admin_user)):
    """Admin: Add funds to user's wallet"""
    # Get or create wallet
    wallet = await db.wallets.find_one({"user_id": topup.user_id})
    
    if not wallet:
        wallet = {
            "id": str(uuid.uuid4()),
            "user_id": topup.user_id,
            "balance": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.wallets.insert_one(wallet)
    
    # Update balance
    new_balance = wallet.get('balance', 0) + topup.amount
    await db.wallets.update_one(
        {"user_id": topup.user_id},
        {"$set": {"balance": new_balance, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Create transaction record
    transaction = WalletTransaction(
        user_id=topup.user_id,
        amount=topup.amount,
        type="credit" if topup.amount > 0 else "debit",
        description=topup.description
    )
    trans_doc = transaction.model_dump()
    trans_doc['created_at'] = trans_doc['created_at'].isoformat()
    await db.wallet_transactions.insert_one(trans_doc)
    
    return {"message": "Wallet updated", "new_balance": new_balance}

@api_router.get("/wallet/admin/all")
async def admin_get_all_wallets(admin: User = Depends(get_admin_user)):
    """Admin: Get all user wallets"""
    wallets = await db.wallets.find({}, {"_id": 0}).to_list(1000)
    
    # Get user details
    user_ids = [w['user_id'] for w in wallets]
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "email": 1, "full_name": 1}).to_list(1000)
    users_map = {u['id']: u for u in users}
    
    result = []
    for wallet in wallets:
        user = users_map.get(wallet['user_id'], {})
        result.append({
            **wallet,
            "user_email": user.get('email'),
            "user_name": user.get('full_name')
        })
    
    return result

# ========== REFERRAL ROUTES ==========

@api_router.get("/referral/my-code")
async def get_my_referral_code(current_user: User = Depends(get_current_user)):
    """Get user's referral code (generate if doesn't exist)"""
    user_doc = await db.users.find_one({"id": current_user.id})
    
    if not user_doc.get('referral_code'):
        # Generate unique referral code
        while True:
            code = generate_referral_code()
            existing = await db.users.find_one({"referral_code": code})
            if not existing:
                break
        
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": {"referral_code": code}}
        )
        referral_code = code
    else:
        referral_code = user_doc['referral_code']
    
    # Get referral stats
    referrals = await db.referrals.find({"referrer_id": current_user.id}, {"_id": 0}).to_list(100)
    total_referrals = len(referrals)
    completed_referrals = len([r for r in referrals if r['status'] == 'rewarded'])
    total_earned = sum(r.get('referrer_reward', 0) for r in referrals if r['status'] == 'rewarded')
    
    return {
        "referral_code": referral_code,
        "referral_link": f"https://glenntek.pt/auth?ref={referral_code}",
        "total_referrals": total_referrals,
        "completed_referrals": completed_referrals,
        "total_earned": total_earned,
        "referrals": referrals
    }

@api_router.get("/referral/validate/{code}")
async def validate_referral_code(code: str):
    """Validate a referral code"""
    user = await db.users.find_one({"referral_code": code}, {"_id": 0, "id": 1, "full_name": 1})
    if not user:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    return {"valid": True, "referrer_name": user.get('full_name', 'A friend')}

@api_router.get("/referral/settings")
async def get_referral_settings():
    """Get referral program settings"""
    settings = await db.referral_settings.find_one({}, {"_id": 0})
    if not settings:
        # Create default settings
        default_settings = ReferralSettings()
        settings_doc = default_settings.model_dump()
        settings_doc['updated_at'] = settings_doc['updated_at'].isoformat()
        await db.referral_settings.insert_one(settings_doc)
        return default_settings.model_dump()
    return settings

@api_router.put("/referral/settings")
async def update_referral_settings(
    settings_update: ReferralSettingsUpdate,
    admin: User = Depends(get_admin_user)
):
    """Admin: Update referral program settings"""
    update_data = {k: v for k, v in settings_update.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.referral_settings.update_one({}, {"$set": update_data}, upsert=True)
    
    settings = await db.referral_settings.find_one({}, {"_id": 0})
    return settings

@api_router.get("/referral/admin/all")
async def admin_get_all_referrals(admin: User = Depends(get_admin_user)):
    """Admin: Get all referrals"""
    referrals = await db.referrals.find({}, {"_id": 0}).to_list(1000)
    
    # Get user details
    user_ids = set()
    for r in referrals:
        user_ids.add(r['referrer_id'])
        user_ids.add(r['referred_id'])
    
    users = await db.users.find({"id": {"$in": list(user_ids)}}, {"_id": 0, "id": 1, "email": 1, "full_name": 1}).to_list(1000)
    users_map = {u['id']: u for u in users}
    
    result = []
    for referral in referrals:
        referrer = users_map.get(referral['referrer_id'], {})
        referred = users_map.get(referral['referred_id'], {})
        result.append({
            **referral,
            "referrer_email": referrer.get('email'),
            "referrer_name": referrer.get('full_name'),
            "referred_email": referred.get('email'),
            "referred_name": referred.get('full_name')
        })
    
    return result

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()