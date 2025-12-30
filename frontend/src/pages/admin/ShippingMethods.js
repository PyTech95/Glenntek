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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Truck, PackageCheck } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CARRIERS = [
  { value: "CTT", label: "CTT - Correios de Portugal" },
  { value: "DHL", label: "DHL Express" },
  { value: "FedEx", label: "FedEx" },
  { value: "UPS", label: "UPS" },
  { value: "DPD", label: "DPD Portugal" },
  { value: "GLS", label: "GLS" },
];

const SHIPPING_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "express", label: "Express" },
  { value: "international", label: "International" },
  { value: "pickup", label: "Pickup Point" },
];

const ZONES = [
  { value: "Portugal", label: "Portugal" },
  { value: "Europe", label: "Europe" },
  { value: "International", label: "International" },
];

export default function AdminShippingMethods() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    carrier: "",
    type: "standard",
    base_rate: "",
    per_kg_rate: "",
    free_shipping_threshold: "",
    estimated_days_min: "2",
    estimated_days_max: "5",
    is_active: true,
    zones: [],
    config: {},
  });
  const [configJson, setConfigJson] = useState("{}");

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const response = await axios.get(`${API}/shipping-methods`);
      setMethods(response.data);
    } catch (error) {
      toast.error("Failed to load shipping methods");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let config = {};
      try {
        config = JSON.parse(configJson);
      } catch {
        toast.error("Invalid JSON in configuration");
        return;
      }

      const data = {
        ...formData,
        base_rate: parseFloat(formData.base_rate),
        per_kg_rate: parseFloat(formData.per_kg_rate) || 0,
        free_shipping_threshold: formData.free_shipping_threshold
          ? parseFloat(formData.free_shipping_threshold)
          : null,
        estimated_days_min: parseInt(formData.estimated_days_min),
        estimated_days_max: parseInt(formData.estimated_days_max),
        config,
      };

      if (editingMethod) {
        await axios.put(`${API}/shipping-methods/${editingMethod.id}`, data);
        toast.success("Shipping method updated successfully");
      } else {
        await axios.post(`${API}/shipping-methods`, data);
        toast.success("Shipping method created successfully");
      }

      setDialogOpen(false);
      setEditingMethod(null);
      resetForm();
      fetchMethods();
    } catch (error) {
      toast.error("Failed to save shipping method");
    }
  };

  const handleEdit = (method) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      carrier: method.carrier,
      type: method.type,
      base_rate: method.base_rate.toString(),
      per_kg_rate: method.per_kg_rate.toString(),
      free_shipping_threshold: method.free_shipping_threshold?.toString() || "",
      estimated_days_min: method.estimated_days_min.toString(),
      estimated_days_max: method.estimated_days_max.toString(),
      is_active: method.is_active,
      zones: method.zones || [],
      config: method.config,
    });
    setConfigJson(JSON.stringify(method.config || {}, null, 2));
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this shipping method?")
    )
      return;
    try {
      await axios.delete(`${API}/shipping-methods/${id}`);
      toast.success("Shipping method deleted");
      fetchMethods();
    } catch (error) {
      toast.error("Failed to delete shipping method");
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await axios.put(`${API}/shipping-methods/${id}/toggle`);
      toast.success("Shipping method status updated");
      fetchMethods();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      carrier: "",
      type: "standard",
      base_rate: "",
      per_kg_rate: "",
      free_shipping_threshold: "",
      estimated_days_min: "2",
      estimated_days_max: "5",
      is_active: true,
      zones: [],
      config: {},
    });
    setConfigJson("{}");
  };

  const handleZoneToggle = (zone) => {
    const zones = formData.zones.includes(zone)
      ? formData.zones.filter((z) => z !== zone)
      : [...formData.zones, zone];
    setFormData({ ...formData, zones });
  };

  const getCTTTemplate = () => {
    return JSON.stringify(
      {
        api_key: "your_ctt_api_key",
        api_url: "https://api.ctt.pt/v1",
        tracking_url:
          "https://www.ctt.pt/feapl_2/app/open/objectSearch/objectSearch.jspx?objects={tracking_number}",
        client_id: "your_client_id",
        contract_number: "your_contract_number",
      },
      null,
      2
    );
  };

  return (
    <AdminLayout>
      <div data-testid="admin-shipping-methods">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "Space Grotesk" }}
            >
              Shipping Methods
            </h1>
            <p className="text-gray-600">
              Configure shipping carriers and rates (CTT & International)
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setEditingMethod(null);
                }}
                data-testid="add-method-button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Shipping Method
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMethod
                    ? "Edit Shipping Method"
                    : "Add New Shipping Method"}
                </DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                data-testid="method-form"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Method Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      placeholder="e.g., CTT Express"
                    />
                  </div>
                  <div>
                    <Label htmlFor="carrier">Carrier *</Label>
                    <Select
                      value={formData.carrier}
                      onValueChange={(value) => {
                        setFormData({ ...formData, carrier: value });
                        if (value === "CTT") {
                          setConfigJson(getCTTTemplate());
                        }
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        {CARRIERS.map((carrier) => (
                          <SelectItem key={carrier.value} value={carrier.value}>
                            {carrier.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="type">Shipping Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIPPING_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="base_rate">Base Rate (€) *</Label>
                    <Input
                      id="base_rate"
                      type="number"
                      step="0.01"
                      value={formData.base_rate}
                      onChange={(e) =>
                        setFormData({ ...formData, base_rate: e.target.value })
                      }
                      required
                      placeholder="5.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="per_kg_rate">Per KG Rate (€)</Label>
                    <Input
                      id="per_kg_rate"
                      type="number"
                      step="0.01"
                      value={formData.per_kg_rate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          per_kg_rate: e.target.value,
                        })
                      }
                      placeholder="1.50"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="free_threshold">
                    Free Shipping Threshold (€)
                  </Label>
                  <Input
                    id="free_threshold"
                    type="number"
                    step="0.01"
                    value={formData.free_shipping_threshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        free_shipping_threshold: e.target.value,
                      })
                    }
                    placeholder="50.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for no free shipping
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="days_min">Est. Delivery (Min Days) *</Label>
                    <Input
                      id="days_min"
                      type="number"
                      value={formData.estimated_days_min}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimated_days_min: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="days_max">Est. Delivery (Max Days) *</Label>
                    <Input
                      id="days_max"
                      type="number"
                      value={formData.estimated_days_max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimated_days_max: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Shipping Zones</Label>
                  <div className="space-y-2">
                    {ZONES.map((zone) => (
                      <div
                        key={zone.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={zone.value}
                          checked={formData.zones.includes(zone.value)}
                          onCheckedChange={() => handleZoneToggle(zone.value)}
                        />
                        <Label htmlFor={zone.value} className="cursor-pointer">
                          {zone.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div>
                  <Label htmlFor="config">API Configuration (JSON)</Label>
                  <Textarea
                    id="config"
                    value={configJson}
                    onChange={(e) => setConfigJson(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                    placeholder='{"api_key": "your_key", "tracking_url": "..."}'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    API credentials, tracking URLs, and carrier-specific
                    settings
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" data-testid="save-method">
                    Save Method
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
            ) : methods.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No shipping methods configured
                </h3>
                <p className="text-gray-600 mb-4">
                  Add your first shipping method to enable deliveries
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Shipping Method
                </Button>
              </div>
            ) : (
              <Table data-testid="methods-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Base Rate</TableHead>
                    <TableHead>Zones</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {methods.map((method) => (
                    <TableRow
                      key={method.id}
                      data-testid={`method-row-${method.id}`}
                    >
                      <TableCell className="font-medium">
                        {method.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{method.carrier}</Badge>
                      </TableCell>
                      <TableCell>{method.type}</TableCell>
                      <TableCell>€{method.base_rate.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {method.zones.map((zone) => (
                            <Badge
                              key={zone}
                              variant="secondary"
                              className="text-xs"
                            >
                              {zone}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {method.estimated_days_min}-{method.estimated_days_max}{" "}
                        days
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={method.is_active}
                            onCheckedChange={() =>
                              handleToggleActive(method.id)
                            }
                          />
                          <span className="text-sm">
                            {method.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(method)}
                            data-testid={`edit-method-${method.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(method.id)}
                            data-testid={`delete-method-${method.id}`}
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

        {methods.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center">
              <PackageCheck className="mr-2 h-5 w-5" />
              CTT Integration Tips
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                • Get CTT API credentials from:{" "}
                <a
                  href="https://www.ctt.pt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  www.ctt.pt
                </a>
              </li>
              <li>
                • Configure API key, client ID, and contract number in settings
              </li>
              <li>• Test shipping calculations before going live</li>
              <li>
                • Set realistic delivery estimates (2-5 days for Portugal
                standard)
              </li>
              <li>
                • Enable free shipping thresholds to encourage larger orders
              </li>
            </ul>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
