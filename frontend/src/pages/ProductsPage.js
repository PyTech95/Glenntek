import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ShoppingBag, Search, Filter } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(
    searchParams.get("category") || "all",
  );

  const [priceRange, setPriceRange] = useState([0, 200]);
  const [sortBy, setSortBy] = useState("name");

  // ✅ NEW STATES
  const [limit, setLimit] = useState(25);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchParams, limit, skip]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      toast.error("Failed to load categories");
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (searchParams.get("search"))
        params.append("search", searchParams.get("search"));
      if (searchParams.get("category"))
        params.append("category", searchParams.get("category"));
      if (searchParams.get("min_price"))
        params.append("min_price", searchParams.get("min_price"));
      if (searchParams.get("max_price"))
        params.append("max_price", searchParams.get("max_price"));

      // ✅ ADD PAGINATION PARAMS
      params.append("limit", limit);
      params.append("skip", skip);

      const response = await axios.get(
        `${API}/products/all?${params.toString()}`,
      );

      let filteredProducts = response.data.products;

      // ✅ SET TOTAL
      setTotal(response.data.total);

      // Sort products
      if (sortBy === "price-asc") {
        filteredProducts.sort((a, b) => a.price - b.price);
      } else if (sortBy === "price-desc") {
        filteredProducts.sort((a, b) => b.price - a.price);
      } else if (sortBy === "name") {
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      }

      setProducts(filteredProducts);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category && category !== "all") params.set("category", category);
    if (priceRange[0] > 0) params.set("min_price", priceRange[0].toString());
    if (priceRange[1] < 200) params.set("max_price", priceRange[1].toString());

    setSkip(0); // reset page
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setPriceRange([0, 200]);
    setSkip(0);
    setSearchParams({});
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Products</h1>
          <p className="text-gray-600">
            Discover our premium collection of mobile accessories
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24" data-testid="filters-panel">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-lg flex items-center">
                    <Filter className="mr-2 h-5 w-5" />
                    Filters
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    data-testid="clear-filters"
                  >
                    Clear
                  </Button>
                </div>

                {/* Search */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">
                    Search
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search products..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      data-testid="search-input"
                    />
                    <Button
                      size="icon"
                      onClick={handleSearch}
                      data-testid="search-button"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Category */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">
                    Category
                  </label>
                  <Select
                    value={category}
                    onValueChange={(value) => {
                      setCategory(value);
                    }}
                  >
                    <SelectTrigger data-testid="category-filter">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">
                    Price Range: €{priceRange[0]} - €{priceRange[1]}
                  </label>
                  <Slider
                    min={0}
                    max={200}
                    step={5}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mt-2"
                    data-testid="price-slider"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSearch}
                  data-testid="apply-filters"
                >
                  Apply Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Products */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              {/* ✅ PAGINATION UI */}
              <div className="flex items-center gap-3">
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => {
                    setLimit(Number(value));
                    setSkip(0);
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>

                <h6 className="text-sm text-gray-600">
                  {total === 0
                    ? "0 results"
                    : `${skip + 1} - ${Math.min(skip + limit, total)} of ${total}`}
                </h6>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={skip === 0}
                  onClick={() => setSkip((prev) => Math.max(0, prev - limit))}
                >
                  ⬅
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={skip + limit >= total}
                  onClick={() => setSkip((prev) => prev + limit)}
                >
                  ➡
                </Button>
              </div>

              {/* SORT */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price-asc">Price ↑</SelectItem>
                  <SelectItem value="price-desc">Price ↓</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* GRID */}
            {loading ? (
              <p>Loading...</p>
            ) : products.length === 0 ? (
              <p>No products found</p>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
