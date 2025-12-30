import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, Search, Menu, LogOut, Package, Heart, Wallet, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Layout({ children }) {
  const { user, logout, cart } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                src="https://customer-assets.emergentagent.com/job_techbazaar-80/artifacts/fru7adia_WhatsApp%20Image%202025-11-15%20at%207.43.12%20PM.jpeg"
                alt="Glenntek"
                className="h-[67px] w-[67px] object-contain"
                data-testid="site-logo"
              />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-primary transition-colors font-medium" data-testid="nav-home">
                Home
              </Link>
              <Link to="/products?new=true" className="text-gray-700 hover:text-primary transition-colors font-medium" data-testid="nav-new-arrival">
                New Arrival
              </Link>
              <Link to="/products" className="text-gray-700 hover:text-primary transition-colors font-medium" data-testid="nav-products">
                Products
              </Link>
              <Link to="/pages/about" className="text-gray-700 hover:text-primary transition-colors font-medium" data-testid="nav-about">
                About
              </Link>
              <Link to="/pages/contact" className="text-gray-700 hover:text-primary transition-colors font-medium" data-testid="nav-contact">
                Contact
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate('/cart')}
                data-testid="cart-button"
              >
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-secondary text-white" data-testid="cart-count">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </Badge>
                )}
              </Button>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid="user-menu-trigger">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-2 text-sm">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <DropdownMenuItem onClick={() => navigate('/orders')} data-testid="user-orders">
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/wishlist')} data-testid="user-wishlist">
                      <Heart className="mr-2 h-4 w-4" />
                      Wishlist
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/wallet')} data-testid="user-wallet">
                      <Wallet className="mr-2 h-4 w-4" />
                      Wallet
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/referral')} data-testid="user-referral">
                      <Gift className="mr-2 h-4 w-4" />
                      Refer Friends
                    </DropdownMenuItem>
                    {(user.role === 'admin' || user.role === 'manager') && (
                      <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="admin-dashboard">
                        <Menu className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout} data-testid="logout-button">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate('/auth')} data-testid="login-button">
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Glenntek</h3>
              <p className="text-sm">Premium mobile accessories for your lifestyle.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link to="/products?category=cases" className="hover:text-white transition-colors">Phone Cases</Link></li>
                <li><Link to="/products?category=chargers" className="hover:text-white transition-colors">Chargers</Link></li>
                <li><Link to="/products?category=cables" className="hover:text-white transition-colors">Cables</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Information</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/pages/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/pages/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/pages/shipping" className="hover:text-white transition-colors">Shipping Info</Link></li>
                <li><Link to="/pages/returns" className="hover:text-white transition-colors">Returns Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>00351928489086</li>
                <li>info@glenntek.pt</li>
                <li>Portugal, Europe</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 Glenntek. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}