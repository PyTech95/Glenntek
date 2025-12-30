import React, { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";

// Import pages
import HomePage from "@/pages/HomePage";
import ProductsPage from "@/pages/ProductsPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrdersPage from "@/pages/OrdersPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import AuthPage from "@/pages/AuthPage";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminHeroSlider from "@/pages/admin/HeroSlider";
import AdminProducts from "@/pages/admin/Products";
import AdminOrders from "@/pages/admin/Orders";
import AdminCategories from "@/pages/admin/Categories";
import AdminPages from "@/pages/admin/Pages";
import AdminBlog from "@/pages/admin/Blog";
import AdminPaymentGateways from "@/pages/admin/PaymentGateways";
import AdminShippingMethods from "@/pages/admin/ShippingMethods";
import AdminSettings from "@/pages/admin/Settings";
import AdminWallets from "@/pages/admin/Wallets";
import AdminReferrals from "@/pages/admin/Referrals";
import AdminHomepageSections from "@/pages/admin/HomepageSections";
import ContentPage from "@/pages/ContentPage";
import BlogPage from "@/pages/BlogPage";
import WishlistPage from "@/pages/WishlistPage";
import WalletPage from "@/pages/WalletPage";
import ReferralPage from "@/pages/ReferralPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const addToCart = (product, quantity = 1) => {
    const existingItem = cart.find(item => item.id === product.id);
    let newCart;
    
    if (existingItem) {
      newCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity }];
    }
    
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const updateCartItem = (productId, quantity) => {
    const newCart = cart.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeFromCart = (productId) => {
    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, cart, addToCart, updateCartItem, removeFromCart, clearCart }}>
      <div className="App">
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/pages/:slug" element={<ContentPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/referral" element={<ReferralPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={user?.role === 'admin' || user?.role === 'manager' ? <AdminDashboard /> : <Navigate to="/auth" />} />
            <Route path="/admin/hero-slider" element={user?.role === 'admin' || user?.role === 'manager' ? <AdminHeroSlider /> : <Navigate to="/auth" />} />
            <Route path="/admin/products" element={user?.role === 'admin' || user?.role === 'manager' ? <AdminProducts /> : <Navigate to="/auth" />} />
            <Route path="/admin/orders" element={user?.role === 'admin' || user?.role === 'manager' ? <AdminOrders /> : <Navigate to="/auth" />} />
            <Route path="/admin/categories" element={user?.role === 'admin' || user?.role === 'manager' ? <AdminCategories /> : <Navigate to="/auth" />} />
            <Route path="/admin/pages" element={user?.role === 'admin' || user?.role === 'manager' ? <AdminPages /> : <Navigate to="/auth" />} />
            <Route path="/admin/blog" element={user?.role === 'admin' || user?.role === 'manager' ? <AdminBlog /> : <Navigate to="/auth" />} />
            <Route path="/admin/payment-gateways" element={user?.role === 'admin' || user?.role === 'manager' ? <AdminPaymentGateways /> : <Navigate to="/auth" />} />
            <Route path="/admin/shipping" element={user?.role === 'admin' || user?.role === 'manager' ? <AdminShippingMethods /> : <Navigate to="/auth" />} />
            <Route path="/admin/settings" element={user?.role === 'admin' || user?.role === 'manager' ? <AdminSettings /> : <Navigate to="/auth" />} />
            <Route path="/admin/wallets" element={user?.role === 'admin' || user?.role === 'manager' ? <AdminWallets /> : <Navigate to="/auth" />} />
            <Route path="/admin/referrals" element={user?.role === 'admin' || user?.role === 'manager' ? <AdminReferrals /> : <Navigate to="/auth" />} />
            <Route path="/admin/homepage" element={user?.role === 'admin' || user?.role === 'manager' ? <AdminHomepageSections /> : <Navigate to="/auth" />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </AuthContext.Provider>
  );
}

export default App;