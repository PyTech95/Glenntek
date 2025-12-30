import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "@/components/Layout";
import { AuthContext } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, Truck, CheckCircle, MapPin } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusSteps = ["pending", "processing", "shipped", "delivered"];

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrder();
    }
  }, [user, id]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      toast.error("Order not found");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">
            Please login to view this order
          </h1>
          <Button onClick={() => navigate("/auth?redirect=/orders")}>
            Login
          </Button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) return null;

  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/orders")}
          className="mb-6"
          data-testid="back-to-orders"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: "Space Grotesk" }}
              data-testid="order-detail-title"
            >
              Order #{order.order_number}
            </h1>
            <Badge
              className={statusColors[order.status]}
              data-testid="order-detail-status"
            >
              {order.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-gray-600">
            Placed on{" "}
            {new Date(order.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Order Status Timeline */}
        <Card className="mb-8" data-testid="status-timeline">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step} className="flex-1 relative">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                          isCompleted
                            ? "bg-primary text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {step === "pending" && <Package className="h-6 w-6" />}
                        {step === "processing" && (
                          <Package className="h-6 w-6" />
                        )}
                        {step === "shipped" && <Truck className="h-6 w-6" />}
                        {step === "delivered" && (
                          <CheckCircle className="h-6 w-6" />
                        )}
                      </div>
                      <p
                        className={`text-sm font-medium ${
                          isCurrent
                            ? "text-primary"
                            : isCompleted
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {step.charAt(0).toUpperCase() + step.slice(1)}
                      </p>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`absolute top-6 left-1/2 w-full h-0.5 ${
                          isCompleted ? "bg-primary" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card data-testid="order-items">
              <CardContent className="p-6">
                <h2 className="font-semibold text-xl mb-6">Order Items</h2>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-4"
                      data-testid={`order-item-${index}`}
                    >
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img
                            src={
                              item.image.startsWith("http")
                                ? item.image
                                : `${BACKEND_URL}${item.image}`
                            }
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          €{item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold">
                        €{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card data-testid="shipping-address">
              <CardContent className="p-6">
                <h2 className="font-semibold text-xl mb-4 flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Shipping Address
                </h2>
                <div className="text-gray-700">
                  <p className="font-medium">
                    {order.shipping_address.full_name}
                  </p>
                  <p>{order.shipping_address.address}</p>
                  <p>
                    {order.shipping_address.city},{" "}
                    {order.shipping_address.postal_code}
                  </p>
                  <p>{order.shipping_address.country}</p>
                  <p className="mt-2">{order.shipping_address.phone}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24" data-testid="order-summary">
              <CardContent className="p-6">
                <h2 className="font-semibold text-xl mb-6">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span
                      className="font-semibold"
                      data-testid="summary-subtotal"
                    >
                      €{order.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span
                      className="font-semibold"
                      data-testid="summary-shipping"
                    >
                      €{order.shipping_cost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">VAT</span>
                    <span className="font-semibold" data-testid="summary-tax">
                      €{order.tax.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold">Total</span>
                  <span
                    className="text-2xl font-bold text-primary"
                    data-testid="summary-total"
                  >
                    €{order.total.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium">
                      {order.payment_method.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status</span>
                    <Badge variant="outline" data-testid="payment-status">
                      {order.payment_status.toUpperCase()}
                    </Badge>
                  </div>
                  {order.tracking_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking Number</span>
                      <span
                        className="font-medium"
                        data-testid="tracking-number"
                      >
                        {order.tracking_number}
                      </span>
                    </div>
                  )}
                  {order.shipping_carrier && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Carrier</span>
                      <span className="font-medium">
                        {order.shipping_carrier}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
