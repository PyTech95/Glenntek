import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "@/components/Layout";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Plus,
  Minus,
  ArrowLeft,
  Package,
  ShoppingBag,
  Heart,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, user } = useContext(AuthContext);
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (user && id) {
      checkWishlist();
    }
  }, [user, id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/products/${id}`);
      setProduct(response.data);
      setLoading(false);

      // Fetch recommendations in background (non-blocking)
      fetchRecommendations(response.data.category);
    } catch (error) {
      toast.error("Product not found");
      navigate("/products");
      setLoading(false);
    }
  };

  const fetchRecommendations = async (category) => {
    try {
      // Fetch products from same category as recommendations
      const response = await axios.get(
        `${API}/products?category=${category}&limit=5`
      );
      setRecommendations(
        response.data.filter((p) => p.id !== id && p.slug !== id).slice(0, 4)
      );
    } catch (err) {
      console.log("Failed to fetch recommendations");
    }
  };

  const checkWishlist = async () => {
    try {
      const response = await axios.get(`${API}/wishlist/check/${id}`);
      setInWishlist(response.data.in_wishlist);
    } catch (error) {
      console.log("Failed to check wishlist");
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast.error("Please login to add to wishlist");
      navigate("/auth");
      return;
    }
    try {
      if (inWishlist) {
        await axios.delete(`${API}/wishlist/${id}`);
        setInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        await axios.post(`${API}/wishlist`, { product_id: id });
        setInWishlist(true);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error("Failed to update wishlist");
    }
  };

  const handleAddToCart = () => {
    if (product.stock_quantity === 0) {
      toast.error("Product out of stock");
      return;
    }
    addToCart(product, quantity);
    toast.success("Added to cart!");
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
            <div className="h-8 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
          data-testid="back-button"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div data-testid="product-images">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              {product.images && product.images.length > 0 ? (
                <img
                  src={
                    product.images[selectedImage]?.startsWith("http")
                      ? product.images[selectedImage]
                      : `${BACKEND_URL}${product.images[selectedImage]}`
                  }
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="h-24 w-24 text-gray-300" />
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === idx
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={
                        img.startsWith("http") ? img : `${BACKEND_URL}${img}`
                      }
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div data-testid="product-details">
            <p className="text-sm text-gray-500 mb-2">{product.category}</p>
            <h1
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "Space Grotesk" }}
              data-testid="product-name"
            >
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <p
                className="text-3xl font-bold text-primary"
                data-testid="product-price"
              >
                €{product.price.toFixed(2)}
              </p>
              {product.compare_price && (
                <p className="text-xl text-gray-400 line-through">
                  €{product.compare_price.toFixed(2)}
                </p>
              )}
            </div>

            <div className="mb-6">
              {product.stock_quantity > 0 ? (
                <Badge
                  className="bg-green-100 text-green-800"
                  data-testid="stock-status"
                >
                  <Package className="mr-1 h-3 w-3" />
                  In Stock ({product.stock_quantity} available)
                </Badge>
              ) : (
                <Badge variant="destructive" data-testid="stock-status">
                  Out of Stock
                </Badge>
              )}
            </div>

            <p
              className="text-gray-700 mb-8 leading-relaxed"
              data-testid="product-description"
            >
              {product.description}
            </p>

            {/* Specifications */}
            {product.specifications &&
              Object.keys(product.specifications).length > 0 && (
                <Card className="mb-8">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">
                      Specifications
                    </h3>
                    <dl className="space-y-2">
                      {Object.entries(product.specifications).map(
                        ([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <dt className="text-gray-600">{key}:</dt>
                            <dd className="font-medium">{value}</dd>
                          </div>
                        )
                      )}
                    </dl>
                  </CardContent>
                </Card>
              )}

            {/* Add to Cart */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  data-testid="decrease-quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span
                  className="px-6 font-semibold"
                  data-testid="quantity-display"
                >
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setQuantity(Math.min(product.stock_quantity, quantity + 1))
                  }
                  disabled={quantity >= product.stock_quantity}
                  data-testid="increase-quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="lg"
                className="flex-1 text-lg"
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
                data-testid="add-to-cart-button"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant={inWishlist ? "default" : "outline"}
                onClick={toggleWishlist}
                data-testid="wishlist-button"
                className={inWishlist ? "bg-red-500 hover:bg-red-600" : ""}
              >
                <Heart
                  className={`h-5 w-5 ${inWishlist ? "fill-white" : ""}`}
                />
              </Button>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section data-testid="recommendations-section">
            <h2
              className="text-2xl font-bold mb-6"
              style={{ fontFamily: "Space Grotesk" }}
            >
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map((rec) => (
                <Card
                  key={rec.id}
                  className="overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/products/${rec.slug || rec.id}`)}
                  data-testid={`recommendation-${rec.id}`}
                >
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    {rec.images && rec.images[0] ? (
                      <img
                        src={
                          rec.images[0].startsWith("http")
                            ? rec.images[0]
                            : `${BACKEND_URL}${rec.images[0]}`
                        }
                        alt={rec.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">
                      {rec.name}
                    </h3>
                    <p className="text-lg font-bold text-primary">
                      €{rec.price.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
