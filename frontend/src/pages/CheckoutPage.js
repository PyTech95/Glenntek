import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "@/components/Layout";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CheckoutPage() {
  const { user, cart, clearCart } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    postal_code: "",
    country: "Portugal",
    notes: "",
  });

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal > 50 ? 0 : 5;
  const tax = subtotal * 0.23;
  const total = subtotal + shipping + tax;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to place an order");
      navigate("/auth");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      navigate("/products");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        user_id: user.id,
        items: cart.map((item) => ({
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal,
        shipping_cost: shipping,
        tax,
        total,
        payment_method: paymentMethod,
        shipping_address: {
          full_name: formData.full_name,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          country: formData.country,
          phone: formData.phone,
        },
        billing_address: {
          full_name: formData.full_name,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          country: formData.country,
          phone: formData.phone,
        },
      };

      const token = localStorage.getItem("token");

      const response = await axios.post(`${API}/orders`, orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      clearCart();
      toast.success("Order placed successfully!");
      navigate(`/orders/${response.data.id}`);
    } catch (error) {
      toast.error("Failed to place order. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/cart")}
          className="mb-6"
          data-testid="back-to-cart"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Button>

        <h1
          className="text-3xl md:text-4xl font-bold mb-8"
          style={{ fontFamily: "Space Grotesk" }}
          data-testid="checkout-title"
        >
          Checkout
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card data-testid="shipping-form">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-xl mb-6">
                    Shipping Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                        data-testid="input-full-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        data-testid="input-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        data-testid="input-phone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        data-testid="input-address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        data-testid="input-city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postal_code">Postal Code *</Label>
                      <Input
                        id="postal_code"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                        required
                        data-testid="input-postal-code"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="notes">Order Notes (Optional)</Label>
                      <Input
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Any special instructions..."
                        data-testid="input-notes"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card data-testid="payment-method">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-xl mb-6">Payment Method</h2>

                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <div
                      className="flex items-center space-x-3 border rounded-lg p-4 mb-3 cursor-pointer hover:border-primary"
                      data-testid="payment-card"
                    >
                      <RadioGroupItem value="card" id="card" />
                      <Label
                        htmlFor="card"
                        className="flex items-center cursor-pointer flex-1"
                      >
                        <CreditCard className="mr-2 h-5 w-5" />
                        Credit/Debit Card
                      </Label>
                    </div>
                    <div
                      className="flex items-center space-x-3 border rounded-lg p-4 mb-3 cursor-pointer hover:border-primary"
                      data-testid="payment-mbway"
                    >
                      <RadioGroupItem value="mbway" id="mbway" />
                      <Label htmlFor="mbway" className="cursor-pointer flex-1">
                        MB WAY
                      </Label>
                    </div>
                    <div
                      className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:border-primary"
                      data-testid="payment-paypal"
                    >
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="cursor-pointer flex-1">
                        PayPal
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
                    <p className="text-blue-800">
                      This is a test environment. Payment processing is
                      simulated.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24" data-testid="checkout-summary">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-xl mb-6">Order Summary</h2>

                  <div className="space-y-3 mb-6">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-600">
                          {item.name} x {item.quantity}
                        </span>
                        <span className="font-semibold">
                          €{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span
                        className="font-semibold"
                        data-testid="summary-subtotal"
                      >
                        €{subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span
                        className="font-semibold"
                        data-testid="summary-shipping"
                      >
                        {shipping === 0 ? "FREE" : `€${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">VAT (23%)</span>
                      <span className="font-semibold" data-testid="summary-tax">
                        €{tax.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total</span>
                      <span
                        className="text-2xl font-bold text-primary"
                        data-testid="summary-total"
                      >
                        €{total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-lg py-6"
                    disabled={loading}
                    data-testid="place-order-button"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
