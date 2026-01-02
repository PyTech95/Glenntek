import { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    compare_price: "",
    sku: "",
    stock_quantity: "",
    low_stock_threshold: "10",
    images: [],
    tags: "",
    specifications: "{}",
    seo_title: "",
    seo_description: "",
    is_active: true,
    slug: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products?limit=100`);
      setProducts(response.data);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to load categories");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name.trim(),
        slug: formData.slug?.trim() || null,
        description: formData.description.trim(),
        category: formData.category.trim(),
        price: parseFloat(formData.price) || 0,
        compare_price: formData.compare_price
          ? parseFloat(formData.compare_price)
          : null,
        sku: formData.sku.trim(),
        images: formData.images || [],
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
        tags: formData.tags
          ? formData.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        specifications: formData.specifications
          ? JSON.parse(formData.specifications)
          : {},
        variants: [],
        seo_title: formData.seo_title?.trim() || null,
        seo_description: formData.seo_description?.trim() || null,
        is_active: !!formData.is_active,
      };

      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, data);
        toast.success("Product updated successfully");
      } else {
        await axios.post(`${API}/products`, data);
        toast.success("Product created successfully");
      }

      setDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save product");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug || "",
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      compare_price: product.compare_price?.toString() || "",
      sku: product.sku,
      stock_quantity: product.stock_quantity.toString(),
      low_stock_threshold: product.low_stock_threshold.toString(),
      images: product.images || [],
      tags: product.tags?.join(", ") || "",
      specifications: JSON.stringify(product.specifications || {}),
      seo_title: product.seo_title || "",
      seo_description: product.seo_description || "",
      is_active: product.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    try {
      await axios.delete(`${API}/products/${id}`);
      toast.success("Product deleted");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      compare_price: "",
      sku: "",
      stock_quantity: "",
      low_stock_threshold: "10",
      images: [],
      tags: "",
      specifications: "{}",
      seo_title: "",
      seo_description: "",
      is_active: true,
      slug: "",
    });
    setImageUrl("");
  };
  const isValidImageUrl = (url) => /\.(jpg|jpeg|png|webp|gif)$/i.test(url);

  const handleAddImage = () => {
    if (!imageUrl.trim()) return;
    if (!isValidImageUrl(imageUrl)) {
      toast.error("Invalid image URL");
      setImageUrl("");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, imageUrl.trim()],
    }));
    setImageUrl("");
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleImageFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await axios.post(`${API}/upload-image`, formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFormData({
        ...formData,
        images: [...formData.images, response.data.url],
      });
      toast.success("Image uploaded successfully");
      e.target.value = "";
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  const clean = (v) => (v ?? "").toString().trim();

  const toFloat = (v, fallback = 0) => {
    const n = parseFloat(clean(v));
    return Number.isFinite(n) ? n : fallback;
  };

  const toNullableFloat = (v) => {
    const s = clean(v);
    if (!s) return null;
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  };

  const toInt = (v, fallback = 0) => {
    const n = parseInt(clean(v), 10);
    return Number.isFinite(n) ? n : fallback;
  };

  const toBool = (v, fallback = true) => {
    const s = clean(v).toLowerCase();
    if (!s) return fallback;
    if (["true", "1", "yes", "y"].includes(s)) return true;
    if (["false", "0", "no", "n"].includes(s)) return false;
    return fallback;
  };

  // tags/images: "a;b;c"
  const parseList = (v) => {
    const s = clean(v);
    return s
      ? s
          .split(";")
          .map((x) => x.trim())
          .filter(Boolean)
      : [];
  };

  // specifications/variants: JSON string
  const parseJSON = (v, fallback) => {
    const s = clean(v);
    if (!s) return fallback;
    try {
      return JSON.parse(s);
    } catch {
      return fallback;
    }
  };

  const getVal = (headers, values, key) => {
    const idx = headers.indexOf(key);
    return idx >= 0 ? values[idx] : "";
  };

  const handleBulkUpload = async () => {
    if (!csvFile) {
      toast.error("Please select a CSV file");
      return;
    }

    try {
      const text = await csvFile.text();

      // ✅ IMPORTANT: remove \r (windows) + trim
      const lines = text
        .split("\n")
        .map((l) => l.replace("\r", "").trim())
        .filter(Boolean);

      if (lines.length < 2) {
        toast.error("CSV file is empty or invalid");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim()); // must match CSV header exactly

      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        if (!values.length) continue;

        // ✅ Product model mapping
        const productData = {
          name: clean(getVal(headers, values, "name")),
          slug: clean(getVal(headers, values, "slug")) || null,
          description: clean(getVal(headers, values, "description")),
          category: clean(getVal(headers, values, "category")),
          price: toFloat(getVal(headers, values, "price"), 0),
          compare_price: toNullableFloat(
            getVal(headers, values, "compare_price")
          ),
          sku: clean(getVal(headers, values, "sku")),
          images: parseList(getVal(headers, values, "images")),
          variants: parseJSON(getVal(headers, values, "variants"), []),
          stock_quantity: toInt(getVal(headers, values, "stock_quantity"), 0),
          low_stock_threshold: toInt(
            getVal(headers, values, "low_stock_threshold"),
            10
          ),
          tags: parseList(getVal(headers, values, "tags")),
          specifications: parseJSON(
            getVal(headers, values, "specifications"),
            {}
          ),
          seo_title: clean(getVal(headers, values, "seo_title")) || null,
          seo_description:
            clean(getVal(headers, values, "seo_description")) || null,
          is_active: toBool(getVal(headers, values, "is_active"), true),
        };

        // ✅ basic validation
        if (!productData.name || !productData.sku) {
          errorCount++;
          continue;
        }

        try {
          await axios.post(`${API}/products`, productData);
          successCount++;
        } catch (error) {
          console.error(`Row ${i + 1} failed`, error?.response?.data || error);
          errorCount++;
        }
      }

      toast.success(
        `Imported ${successCount} products successfully. ${errorCount} errors.`
      );
      setBulkDialogOpen(false);
      setCsvFile(null);
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to process CSV file");
    }
  };

  const downloadSampleCSV = () => {
    const sample = `name,slug,description,category,price,compare_price,sku,images,stock_quantity,low_stock_threshold,tags,specifications,variants,seo_title,seo_description,is_active
"Premium Case",,"High-quality phone case",cases,29.99,39.99,CASE-001,"/img/case1.jpg;/img/case2.jpg",100,10,"premium;case;protective","{""color"":""black"",""material"":""TPU""}","[]","Premium Case SEO","Best premium phone case",true
"Fast Charger","fast-charger-65w","65W USB-C charger",chargers,44.99,,CHG-001,"/img/charger.jpg",50,10,"fast-charge;USB-C","{""watt"":65}","[]","Fast Charger SEO","65W fast charger",true`;

    const blob = new Blob([sample], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div data-testid="admin-products">
        <div className="flex justify-between items-center mb-8">
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "Space Grotesk" }}
          >
            Products
          </h1>
          <div className="flex gap-3">
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="bulk-upload-button">
                  <Plus className="mr-2 h-4 w-4" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Upload Products</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Upload CSV File</Label>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files[0])}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Upload a CSV file with columns: name, description,
                      category, price, compare_price, sku, stock_quantity,
                      low_stock_threshold, tags
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={downloadSampleCSV}
                    className="w-full"
                  >
                    Download Sample CSV Template
                  </Button>
                  <div className="flex gap-4">
                    <Button
                      onClick={handleBulkUpload}
                      className="flex-1"
                      data-testid="upload-csv"
                    >
                      Upload Products
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setBulkDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetForm();
                    setEditingProduct(null);
                  }}
                  data-testid="add-product-button"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  data-testid="product-form"
                >
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) =>
                          setFormData({ ...formData, sku: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price (€) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="compare_price">Compare Price (€)</Label>
                      <Input
                        id="compare_price"
                        type="number"
                        step="0.01"
                        value={formData.compare_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            compare_price: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stock">Stock Quantity *</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock_quantity: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="low_stock">Low Stock Threshold</Label>
                      <Input
                        id="low_stock"
                        type="number"
                        value={formData.low_stock_threshold}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            low_stock_threshold: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                      placeholder="wireless, fast-charge, premium"
                    />
                  </div>

                  {/* Image Management */}
                  <div className="border rounded-lg p-4">
                    <Label className="mb-3 block">Product Images</Label>
                    <div className="space-y-3 mb-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter image URL"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                        />
                        <Button
                          type="button"
                          onClick={handleAddImage}
                          size="icon"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 border-t"></div>
                        <span className="text-sm text-gray-500">OR</span>
                        <div className="flex-1 border-t"></div>
                      </div>
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Supported Only: JPG, JPEG, PNG, WEBP (Max 5MB)
                        </p>
                      </div>
                    </div>
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {formData.images.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={
                                img instanceof File
                                  ? URL.createObjectURL(img)
                                  : img.startsWith("http")
                                  ? img
                                  : `${BACKEND_URL}${img}`
                              }
                              alt={`Product ${index + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveImage(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" data-testid="save-product">
                      Save Product
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="search-products"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table data-testid="products-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        data-testid={`product-row-${product.id}`}
                      >
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>€{product.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.stock_quantity >
                              product.low_stock_threshold
                                ? "default"
                                : "destructive"
                            }
                          >
                            {product.stock_quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.is_active ? "default" : "secondary"
                            }
                          >
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(product)}
                              data-testid={`edit-product-${product.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(product.id)}
                              data-testid={`delete-product-${product.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
