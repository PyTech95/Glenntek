import { useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export default function CartPage() {
  const { cart, updateCartItem, removeFromCart } = useContext(AuthContext);
  const navigate = useNavigate();

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 50 ? 0 : 5;
  const tax = subtotal * 0.23; // 23% VAT
  const total = subtotal + shipping + tax;

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    updateCartItem(productId, newQuantity);
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
    toast.success("Item removed from cart");
  };

  if (cart.length === 0) {
    return (
      <Layout>
        <div
          className="container mx-auto px-4 py-20 text-center"
          data-testid="empty-cart"
        >
          <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h1
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "Space Grotesk" }}
          >
            Your cart is empty
          </h1>
          <p className="text-gray-600 mb-8">
            Start shopping and add items to your cart!
          </p>
          <Button asChild data-testid="continue-shopping-button">
            <Link to="/products">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1
          className="text-3xl md:text-4xl font-bold mb-8"
          style={{ fontFamily: "Space Grotesk" }}
          data-testid="cart-title"
        >
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4" data-testid="cart-items">
            {cart.map((item) => (
              <Card key={item.id} data-testid={`cart-item-${item.id}`}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.images && item.images[0] ? (
                        <img
                          src={
                            item.images?.[0]?.startsWith("http")
                              ? item.images[0]
                              : `${BACKEND_URL}${item.images[0]}`
                          }
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {item.category}
                      </p>
                      <p className="text-lg font-bold text-primary">
                        €{item.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        data-testid={`remove-item-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>

                      <div className="flex items-center border rounded-lg">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          data-testid={`decrease-${item.id}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span
                          className="px-4 font-semibold"
                          data-testid={`quantity-${item.id}`}
                        >
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity + 1)
                          }
                          data-testid={`increase-${item.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <p
                        className="font-semibold"
                        data-testid={`item-total-${item.id}`}
                      >
                        €{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24" data-testid="order-summary">
              <CardContent className="p-6">
                <h2 className="font-semibold text-xl mb-6">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold" data-testid="subtotal">
                      €{subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold" data-testid="shipping">
                      {shipping === 0 ? "FREE" : `€${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">VAT (23%)</span>
                    <span className="font-semibold" data-testid="tax">
                      €{tax.toFixed(2)}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                      Free shipping on orders over €50
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span
                      className="text-2xl font-bold text-primary"
                      data-testid="total"
                    >
                      €{total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full text-lg py-6"
                  onClick={() => navigate("/checkout")}
                  data-testid="checkout-button"
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full mt-3"
                  asChild
                  data-testid="continue-shopping-link"
                >
                  <Link to="/products">Continue Shopping</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
