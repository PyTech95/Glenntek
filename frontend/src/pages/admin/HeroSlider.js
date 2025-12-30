import { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Plus,
  Edit,
  Trash2,
  MoveUp,
  MoveDown,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminHeroSlider() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image: "",
    button_text: "",
    button_link: "",
    order: 0,
  });

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const response = await axios.get(`${API}/hero-slides`);
      setSlides(response.data);
    } catch (error) {
      toast.error("Failed to load slides");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        order: parseInt(formData.order),
      };

      if (editingSlide) {
        await axios.put(`${API}/hero-slides/${editingSlide.id}`, data);
        toast.success("Slide updated successfully");
      } else {
        await axios.post(`${API}/hero-slides`, data);
        toast.success("Slide created successfully");
      }

      setDialogOpen(false);
      setEditingSlide(null);
      resetForm();
      fetchSlides();
    } catch (error) {
      toast.error("Failed to save slide");
    }
  };

  const handleEdit = (slide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || "",
      image: slide.image,
      button_text: slide.button_text || "",
      button_link: slide.button_link || "",
      order: slide.order,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this slide?")) return;
    try {
      await axios.delete(`${API}/hero-slides/${id}`);
      toast.success("Slide deleted");
      fetchSlides();
    } catch (error) {
      toast.error("Failed to delete slide");
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await axios.put(`${API}/hero-slides/${id}/toggle`);
      toast.success("Slide status updated");
      fetchSlides();
    } catch (error) {
      toast.error("Failed to update slide status");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      image: "",
      button_text: "",
      button_link: "",
      order: 0,
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await axios.post(`${API}/upload-image`, formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFormData({ ...formData, image: response.data.url });
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div data-testid="admin-hero-slider">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "Space Grotesk" }}
            >
              Hero Slider
            </h1>
            <p className="text-gray-600">
              Manage homepage hero slider images and content
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setEditingSlide(null);
                }}
                data-testid="add-slide-button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Slide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSlide ? "Edit Slide" : "Add New Slide"}
                </DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                data-testid="slide-form"
              >
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    placeholder="Premium Mobile Accessories"
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Textarea
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    rows={2}
                    placeholder="Discover our collection of high-quality products"
                  />
                </div>
                <div>
                  <Label>Image *</Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter image URL"
                        value={formData.image}
                        onChange={(e) =>
                          setFormData({ ...formData, image: e.target.value })
                        }
                        required
                      />
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
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Upload image (Max 5MB, JPG/PNG/WEBP)
                      </p>
                    </div>
                  </div>
                  {formData.image && (
                    <div className="mt-3">
                      <img
                        src={
                          formData.image instanceof File
                            ? URL.createObjectURL(formData.image)
                            : formData.image.startsWith("http")
                            ? formData.image
                            : `${BACKEND_URL}${formData.image}`
                        }
                        alt="Preview"
                        className="w-full h-48 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/800x400?text=Invalid+Image+URL";
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="button_text">Button Text</Label>
                    <Input
                      id="button_text"
                      value={formData.button_text}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          button_text: e.target.value,
                        })
                      }
                      placeholder="Shop Now"
                    />
                  </div>
                  <div>
                    <Label htmlFor="button_link">Button Link</Label>
                    <Input
                      id="button_link"
                      value={formData.button_link}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          button_link: e.target.value,
                        })
                      }
                      placeholder="/products"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: e.target.value })
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lower numbers appear first
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button type="submit" data-testid="save-slide">
                    Save Slide
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

        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : slides.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No slides yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first hero slider image
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Slide
                </Button>
              </div>
            ) : (
              <Table data-testid="slides-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Subtitle</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slides.map((slide) => (
                    <TableRow
                      key={slide.id}
                      data-testid={`slide-row-${slide.id}`}
                    >
                      <TableCell>
                        <img
                          src={
                            slide.image.startsWith("http")
                              ? slide.image
                              : `${BACKEND_URL}${slide.image}`
                          }
                          alt={slide.title}
                          className="w-24 h-16 object-cover rounded"
                          onError={(e) =>
                            (e.target.src =
                              "https://via.placeholder.com/200x100?text=Image")
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {slide.title}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {slide.subtitle || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{slide.order}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={slide.is_active}
                            onCheckedChange={() => handleToggleActive(slide.id)}
                          />
                          <span className="text-sm">
                            {slide.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(slide)}
                            data-testid={`edit-slide-${slide.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(slide.id)}
                            data-testid={`delete-slide-${slide.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {slides.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center">
              <ImageIcon className="mr-2 h-5 w-5" />
              Slider Tips
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Recommended image size: 1920x600px for best results</li>
              <li>• Use high-quality images that represent your brand</li>
              <li>• Keep titles short and impactful (5-8 words)</li>
              <li>• Order determines slide sequence (0, 1, 2, etc.)</li>
              <li>
                • Toggle active/inactive to show/hide slides without deleting
              </li>
            </ul>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
