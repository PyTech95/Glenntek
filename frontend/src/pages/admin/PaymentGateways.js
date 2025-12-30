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
import { Plus, Edit, Trash2, CreditCard, DollarSign } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GATEWAY_TYPES = [
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
  { value: "mbway", label: "MB WAY" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "multibanco", label: "Multibanco" },
];

export default function AdminPaymentGateways() {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    is_active: true,
    is_test_mode: true,
    config: {},
  });
  const [configJson, setConfigJson] = useState("{}");

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      const response = await axios.get(`${API}/payment-gateways`);
      setGateways(response.data);
    } catch (error) {
      toast.error("Failed to load payment gateways");
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
        config,
      };

      if (editingGateway) {
        await axios.put(`${API}/payment-gateways/${editingGateway.id}`, data);
        toast.success("Payment gateway updated successfully");
      } else {
        await axios.post(`${API}/payment-gateways`, data);
        toast.success("Payment gateway created successfully");
      }

      setDialogOpen(false);
      setEditingGateway(null);
      resetForm();
      fetchGateways();
    } catch (error) {
      toast.error("Failed to save payment gateway");
    }
  };

  const handleEdit = (gateway) => {
    setEditingGateway(gateway);
    setFormData({
      name: gateway.name,
      type: gateway.type,
      is_active: gateway.is_active,
      is_test_mode: gateway.is_test_mode,
      config: gateway.config,
    });
    setConfigJson(JSON.stringify(gateway.config || {}, null, 2));
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this payment gateway?")
    )
      return;
    try {
      await axios.delete(`${API}/payment-gateways/${id}`);
      toast.success("Payment gateway deleted");
      fetchGateways();
    } catch (error) {
      toast.error("Failed to delete payment gateway");
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await axios.put(`${API}/payment-gateways/${id}/toggle`);
      toast.success("Payment gateway status updated");
      fetchGateways();
    } catch (error) {
      toast.error("Failed to update gateway status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      is_active: true,
      is_test_mode: true,
      config: {},
    });
    setConfigJson("{}");
  };

  const getConfigTemplate = (type) => {
    const templates = {
      stripe: {
        public_key: "pk_test_...",
        secret_key: "sk_test_...",
        webhook_secret: "whsec_...",
      },
      paypal: {
        client_id: "your_client_id",
        client_secret: "your_client_secret",
        mode: "sandbox",
      },
      mbway: {
        entity: "11111",
        subentity: "111",
        api_key: "your_api_key",
      },
      bank_transfer: {
        bank_name: "Bank Name",
        account_holder: "Account Holder",
        iban: "PT50....",
        swift: "SWIFT/BIC",
      },
    };
    return JSON.stringify(templates[type] || {}, null, 2);
  };

  return (
    <AdminLayout>
      <div data-testid="admin-payment-gateways">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "Space Grotesk" }}
            >
              Payment Gateways
            </h1>
            <p className="text-gray-600">
              Manage payment methods and API integrations
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setEditingGateway(null);
                }}
                data-testid="add-gateway-button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Payment Gateway
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingGateway
                    ? "Edit Payment Gateway"
                    : "Add New Payment Gateway"}
                </DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                data-testid="gateway-form"
              >
                <div>
                  <Label htmlFor="name">Gateway Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="e.g., Stripe Payment"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Gateway Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => {
                      setFormData({ ...formData, type: value });
                      setConfigJson(getConfigTemplate(value));
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gateway type" />
                    </SelectTrigger>
                    <SelectContent>
                      {GATEWAY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-4">
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
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_test_mode"
                      checked={formData.is_test_mode}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_test_mode: checked })
                      }
                    />
                    <Label htmlFor="is_test_mode">Test Mode</Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="config">Configuration (JSON)</Label>
                  <Textarea
                    id="config"
                    value={configJson}
                    onChange={(e) => setConfigJson(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    placeholder='{"api_key": "your_key", "secret": "your_secret"}'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter API keys, credentials, and configuration in JSON
                    format
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button type="submit" data-testid="save-gateway">
                    Save Gateway
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
            ) : gateways.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No payment gateways configured
                </h3>
                <p className="text-gray-600 mb-4">
                  Add your first payment gateway to start accepting payments
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Payment Gateway
                </Button>
              </div>
            ) : (
              <Table data-testid="gateways-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gateways.map((gateway) => (
                    <TableRow
                      key={gateway.id}
                      data-testid={`gateway-row-${gateway.id}`}
                    >
                      <TableCell className="font-medium">
                        {gateway.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {gateway.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            gateway.is_test_mode ? "secondary" : "default"
                          }
                        >
                          {gateway.is_test_mode ? "Test" : "Live"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={gateway.is_active}
                            onCheckedChange={() =>
                              handleToggleActive(gateway.id)
                            }
                          />
                          <span className="text-sm">
                            {gateway.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(gateway)}
                            data-testid={`edit-gateway-${gateway.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(gateway.id)}
                            data-testid={`delete-gateway-${gateway.id}`}
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

        {gateways.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Payment Gateway Tips
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Always use test mode during development and testing</li>
              <li>• Keep API keys secure - never share them publicly</li>
              <li>• Enable webhooks for automatic payment status updates</li>
              <li>• Test all payment flows before going live</li>
              <li>
                • Have at least 2 payment methods for customer convenience
              </li>
            </ul>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
