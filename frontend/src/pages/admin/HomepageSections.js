import { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LayoutDashboard,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SECTION_TYPES = [
  {
    value: "new_arrivals",
    label: "New Arrivals",
    description: "Shows latest products sorted by date",
  },
  {
    value: "featured_products",
    label: "Featured Products",
    description: "Shows selected featured products",
  },
  {
    value: "categories",
    label: "Categories",
    description: "Displays product categories",
  },
  {
    value: "best_sellers",
    label: "Best Sellers",
    description: "Shows most sold products",
  },
  {
    value: "on_sale",
    label: "On Sale",
    description: "Shows discounted products",
  },
  {
    value: "custom",
    label: "Custom Products",
    description: "Manually select products to display",
  },
];

export default function AdminHomepageSections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({
    section_type: "new_arrivals",
    title: "",
    subtitle: "",
    is_active: true,
    order: 0,
    config: { limit: 4 },
  });

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await axios.get(
        `${API}/homepage-sections?active_only=false`
      );
      setSections(response.data);
    } catch (error) {
      toast.error("Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSection) {
        await axios.put(
          `${API}/homepage-sections/${editingSection.id}`,
          formData
        );
        toast.success("Section updated successfully");
      } else {
        await axios.post(`${API}/homepage-sections`, formData);
        toast.success("Section created successfully");
      }
      setDialogOpen(false);
      resetForm();
      fetchSections();
    } catch (error) {
      toast.error("Failed to save section");
    }
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    setFormData({
      section_type: section.section_type,
      title: section.title,
      subtitle: section.subtitle || "",
      is_active: section.is_active,
      order: section.order,
      config: section.config || { limit: 4 },
    });
    setDialogOpen(true);
  };

  const handleDelete = async (sectionId) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    try {
      await axios.delete(`${API}/homepage-sections/${sectionId}`);
      toast.success("Section deleted");
      fetchSections();
    } catch (error) {
      toast.error("Failed to delete section");
    }
  };

  const handleToggleActive = async (section) => {
    try {
      await axios.put(`${API}/homepage-sections/${section.id}`, {
        is_active: !section.is_active,
      });
      toast.success(`Section ${section.is_active ? "hidden" : "shown"}`);
      fetchSections();
    } catch (error) {
      toast.error("Failed to update section");
    }
  };

  const resetForm = () => {
    setEditingSection(null);
    setFormData({
      section_type: "new_arrivals",
      title: "",
      subtitle: "",
      is_active: true,
      order: sections.length,
      config: { limit: 4 },
    });
  };

  const getSectionTypeLabel = (type) => {
    const found = SECTION_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "Space Grotesk" }}
            >
              <LayoutDashboard className="inline-block mr-3 h-8 w-8" />
              Homepage Sections
            </h1>
            <p className="text-gray-600">
              Manage the sections displayed on your homepage
            </p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingSection ? "Edit Section" : "Add New Section"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Section Type</Label>
                  <Select
                    value={formData.section_type}
                    onValueChange={(value) => {
                      const type = SECTION_TYPES.find((t) => t.value === value);
                      setFormData({
                        ...formData,
                        section_type: value,
                        title: formData.title || type?.label || "",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <p className="font-medium">{type.label}</p>
                            <p className="text-xs text-gray-500">
                              {type.description}
                            </p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Section title"
                    required
                  />
                </div>

                <div>
                  <Label>Subtitle (Optional)</Label>
                  <Input
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    placeholder="Brief description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Products to Show</Label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.config.limit || 4}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            limit: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>Active</Label>
                    <p className="text-xs text-gray-500">
                      Show this section on homepage
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    {editingSection ? "Update Section" : "Create Section"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Preview Info */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Drag sections to reorder them, or use the
              order number. Active sections will appear on the homepage in the
              specified order.
            </p>
          </CardContent>
        </Card>

        {/* Sections Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : sections.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <LayoutDashboard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No sections configured. Add your first section!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Order</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <TableRow
                        key={section.id}
                        className={!section.is_active ? "opacity-50" : ""}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                            <span className="font-mono text-sm">
                              {section.order}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{section.title}</p>
                            {section.subtitle && (
                              <p className="text-sm text-gray-500">
                                {section.subtitle}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getSectionTypeLabel(section.section_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {section.config?.limit || 4} items
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              section.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {section.is_active ? "Active" : "Hidden"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(section)}
                              title={
                                section.is_active
                                  ? "Hide section"
                                  : "Show section"
                              }
                            >
                              {section.is_active ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(section)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(section.id)}
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
      </div>
    </AdminLayout>
  );
}
