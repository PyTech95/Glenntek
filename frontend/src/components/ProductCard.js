import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProductCard({ product, showActions = true }) {
  const { user, addToCart } = useContext(AuthContext);
  const navigate = useNavigate();
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Check wishlist status on mount
  useState(() => {
    if (user && product?.id) {
      axios
        .get(`${API}/wishlist/check/${product.id}`)
        .then((res) => setInWishlist(res.data.in_wishlist))
        .catch(() => {});
    }
  }, [user, product?.id]);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock_quantity === 0) {
      toast.error("Product out of stock");
      return;
    }
    addToCart(product, 1);
    toast.success("Added to cart!");
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to add to wishlist");
      navigate("/auth");
      return;
    }

    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await axios.delete(`${API}/wishlist/${product.id}`);
        setInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        await axios.post(`${API}/wishlist`, { product_id: product.id });
        setInWishlist(true);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error("Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  const productUrl = `/products/${product.slug || product.id}`;

  return (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 h-full group">
      <Link to={productUrl} data-testid={`product-${product.id}`}>
        <div className="aspect-square overflow-hidden bg-gray-100 relative">
          {product.images && product.images[0] ? (
            <img
              src={
                product.images?.[0]?.startsWith("http")
                  ? product.images[0]
                  : `${BACKEND_URL}${product.images[0]}`
              }
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-gray-300" />
            </div>
          )}

          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold">Out of Stock</span>
            </div>
          )}
          {product.compare_price && product.compare_price > product.price && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              {Math.round((1 - product.price / product.compare_price) * 100)}%
              OFF
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link to={productUrl}>
          <h3 className="font-semibold mb-1 line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-lg font-bold text-primary">
            €{product.price.toFixed(2)}
          </p>
          {product.compare_price && product.compare_price > product.price && (
            <p className="text-sm text-gray-400 line-through">
              €{product.compare_price.toFixed(2)}
            </p>
          )}
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              data-testid={`add-to-cart-${product.id}`}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add to Cart
            </Button>
            <Button
              size="sm"
              variant={inWishlist ? "default" : "outline"}
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className={inWishlist ? "bg-red-500 hover:bg-red-600" : ""}
              data-testid={`wishlist-${product.id}`}
            >
              <Heart className={`h-4 w-4 ${inWishlist ? "fill-white" : ""}`} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
