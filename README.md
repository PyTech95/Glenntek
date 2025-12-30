# Glenntek E-Commerce Platform

A complete, full-featured e-commerce platform for mobile phone accessories built with React, FastAPI, and MongoDB.

## 🚀 Features

### Customer Features
- **Product Catalog**: Browse, search, and filter products by category, price, and tags
- **Smart Search**: AI-powered product search using Emergent LLM
- **Shopping Cart**: Add, update, and remove items with real-time total calculations
- **Secure Checkout**: Multi-step checkout with shipping information
- **Multiple Payment Methods**: Credit/Debit cards, MB WAY, PayPal (test/sandbox mode)
- **Order Tracking**: Real-time order status updates with tracking numbers
- **User Accounts**: Registration, login, and order history
- **Product Recommendations**: AI-powered product suggestions
- **Responsive Design**: Optimized for mobile, tablet, and desktop

### Admin Features
- **Dashboard**: Real-time analytics (revenue, orders, products, customers)
- **Product Management**: Full CRUD operations with inventory tracking
- **Category Management**: Organize products into categories
- **Order Management**: View, update status, add tracking information
- **Content Management**: Create and manage static pages (About, Contact, etc.)
- **Blog Management**: Create and publish blog posts
- **Settings Management**: Configure site details, branding, and contact information
- **Low Stock Alerts**: Automatic notifications for low inventory
- **Bulk Operations**: CSV/Excel import ready for products

### Technical Features
- **Real-time Inventory**: Automatic stock updates on orders
- **AI Integration**: Product recommendations and smart search using GPT-4o-mini
- **Payment Gateway**: Stripe integration (test mode)
- **Shipping Integration**: CTT and international carriers support (API-ready)
- **Multi-language Ready**: Portuguese (primary) and English support
- **SEO Optimized**: Meta tags, descriptions, and structured data
- **Security**: JWT authentication, bcrypt password hashing, CORS protection
- **VAT Calculation**: Automatic 23% Portugal VAT calculation

## 📋 Tech Stack

### Frontend
- React 19
- React Router DOM
- Tailwind CSS
- Shadcn/UI Components
- Axios for API calls
- Sonner for notifications

### Backend
- FastAPI (Python)
- Motor (Async MongoDB driver)
- Pydantic for data validation
- JWT for authentication
- Passlib for password hashing
- Emergent Integrations for AI features

### Database
- MongoDB

## 🎨 Design

- **Primary Color**: #0066CC (Glenntek Blue)
- **Secondary Color**: #FF9933 (Glenntek Orange)
- **Typography**: Space Grotesk (headings), Inter (body text)
- **Design Style**: Modern, clean, professional

## 👤 Default Credentials

**Admin Account**:
- Email: admin@glenntek.pt
- Password: admin123

## 📦 Sample Products

The platform comes pre-seeded with sample products:
- Premium Silicone iPhone Case
- 65W Fast Charger USB-C
- Braided USB-C to Lightning Cable 2m
- Tempered Glass Screen Protector
- Wireless Car Mount Charger
- Leather Wallet Case

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/{id}` - Update product (Admin)
- `DELETE /api/products/{id}` - Delete product (Admin)

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/{id}` - Get order details
- `PUT /api/orders/{id}/status` - Update order status (Admin)

### AI Features
- `POST /api/ai/recommendations` - Get AI product recommendations
- `POST /api/ai/search` - AI-powered product search

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics (Admin)

## 📱 Contact Information

- **Website**: https://glenntek.pt/
- **Phone**: 00351928489086
- **Email**: info@glenntek.pt
- **Address**: Portugal, Europe

## 🔐 Security Features

- JWT-based authentication with secure token handling
- Bcrypt password hashing
- Role-based access control (Admin, Manager, Customer)
- CORS protection
- Input validation with Pydantic
- Protection against common web vulnerabilities

---

**Built with ❤️ for Glenntek - Premium Mobile Accessories**
