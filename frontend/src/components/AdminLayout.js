import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Package, ShoppingCart, FolderTree, FileText, Newspaper, Settings, LogOut, Store, CreditCard, Truck, Wallet, Gift, Home } from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/homepage', label: 'Homepage Sections', icon: Home },
    { path: '/admin/hero-slider', label: 'Hero Slider', icon: Store },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/admin/categories', label: 'Categories', icon: FolderTree },
    { path: '/admin/pages', label: 'Pages', icon: FileText },
    { path: '/admin/blog', label: 'Blog', icon: Newspaper },
    { path: '/admin/payment-gateways', label: 'Payment Gateways', icon: CreditCard },
    { path: '/admin/shipping', label: 'Shipping Methods', icon: Truck },
    { path: '/admin/wallets', label: 'Wallets', icon: Wallet },
    { path: '/admin/referrals', label: 'Referrals', icon: Gift },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full">
        <div className="p-6 border-b border-gray-200">
          <Link to="/" className="flex items-center justify-center">
            <img
              src="https://customer-assets.emergentagent.com/job_techbazaar-80/artifacts/fru7adia_WhatsApp%20Image%202025-11-15%20at%207.43.12%20PM.jpeg"
              alt="Glenntek"
              className="h-[56px] w-[56px] object-contain"
            />
          </Link>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    data-testid={`admin-nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild className="flex-1" data-testid="view-store">
              <Link to="/">
                <Store className="mr-2 h-4 w-4" />
                View Store
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="admin-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}