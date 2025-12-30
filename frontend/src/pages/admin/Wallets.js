import { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet, Plus, Search } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminWallets() {
  const [wallets, setWallets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    user_id: "",
    amount: "",
    description: "Admin top-up",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [walletsRes, usersRes] = await Promise.all([
        axios.get(`${API}/wallet/admin/all`),
        axios.get(`${API}/analytics/dashboard`).then((res) => res.data),
      ]);
      setWallets(walletsRes.data);

      // Fetch all customers
      const customersRes = await axios
        .get(`${API}/orders`)
        .catch(() => ({ data: [] }));
    } catch (error) {
      toast.error("Failed to load wallets");
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/wallet/admin/topup`, {
        user_id: formData.user_id,
        amount: parseFloat(formData.amount),
        description: formData.description,
      });
      toast.success("Wallet updated successfully");
      setDialogOpen(false);
      setFormData({ user_id: "", amount: "", description: "Admin top-up" });
      fetchData();
    } catch (error) {
      toast.error("Failed to update wallet");
    }
  };

  const filteredWallets = wallets.filter(
    (wallet) =>
      wallet.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "Space Grotesk" }}
            >
              <Wallet className="inline-block mr-3 h-8 w-8" />
              Wallet Management
            </h1>
            <p className="text-gray-600">Manage customer wallet balances</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add/Deduct Balance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Wallet Balance</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTopUp} className="space-y-4">
                <div>
                  <Label>Select User</Label>
                  <Select
                    value={formData.user_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, user_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.user_id} value={wallet.user_id}>
                          {wallet.user_email} ({wallet.user_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="Enter amount (use negative for deduction)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use negative values to deduct balance
                  </p>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Reason for adjustment"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <Button type="submit">Update Balance</Button>
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

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">
                Total Users with Wallet
              </p>
              <p className="text-3xl font-bold">{wallets.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">
                Total Balance Outstanding
              </p>
              <p className="text-3xl font-bold text-primary">
                €{totalBalance.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">Average Balance</p>
              <p className="text-3xl font-bold">
                €
                {wallets.length > 0
                  ? (totalBalance / wallets.length).toFixed(2)
                  : "0.00"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by email or name..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Wallets Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredWallets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No wallets found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWallets.map((wallet) => (
                    <TableRow key={wallet.id}>
                      <TableCell className="font-medium">
                        {wallet.user_name || "N/A"}
                      </TableCell>
                      <TableCell>{wallet.user_email || "N/A"}</TableCell>
                      <TableCell className="text-right font-bold">
                        <span
                          className={wallet.balance > 0 ? "text-green-600" : ""}
                        >
                          €{(wallet.balance || 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {wallet.updated_at
                          ? new Date(wallet.updated_at).toLocaleDateString(
                              "pt-PT"
                            )
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              user_id: wallet.user_id,
                            });
                            setDialogOpen(true);
                          }}
                        >
                          Adjust
                        </Button>
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
