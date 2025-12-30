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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Gift, Users, Wallet, Settings, Save } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState([]);
  const [settings, setSettings] = useState({
    referrer_reward: 5.0,
    referred_reward: 5.0,
    min_order_amount: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [referralsRes, settingsRes] = await Promise.all([
        axios.get(`${API}/referral/admin/all`),
        axios.get(`${API}/referral/settings`),
      ]);
      setReferrals(referralsRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      toast.error("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/referral/settings`, settings);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const totalReferrals = referrals.length;
  const completedReferrals = referrals.filter(
    (r) => r.status === "rewarded"
  ).length;
  const totalPaidOut = referrals
    .filter((r) => r.status === "rewarded")
    .reduce(
      (sum, r) => sum + (r.referrer_reward || 0) + (r.referred_reward || 0),
      0
    );

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: "Space Grotesk" }}
          >
            <Gift className="inline-block mr-3 h-8 w-8 text-purple-500" />
            Referral Program
          </h1>
          <p className="text-gray-600">
            Manage referral settings and track referrals
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <Users className="h-8 w-8 text-blue-500 mb-2" />
              <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
              <p className="text-3xl font-bold">{totalReferrals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Gift className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold">{completedReferrals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Wallet className="h-8 w-8 text-purple-500 mb-2" />
              <p className="text-sm text-gray-600 mb-1">Total Paid Out</p>
              <p className="text-3xl font-bold">€{totalPaidOut.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Settings className="h-8 w-8 text-gray-500 mb-2" />
              <p className="text-sm text-gray-600 mb-1">Program Status</p>
              <Badge
                className={
                  settings.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {settings.is_active ? "Active" : "Inactive"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Referral Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Referrer Reward (€)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={settings.referrer_reward}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      referrer_reward: parseFloat(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Amount given to the person who refers
                </p>
              </div>
              <div>
                <Label>New User Reward (€)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={settings.referred_reward}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      referred_reward: parseFloat(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Amount given to the new user who signs up
                </p>
              </div>
              <div>
                <Label>Minimum Order Amount (€)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={settings.min_order_amount}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      min_order_amount: parseFloat(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum order to activate referral (0 = immediate)
                </p>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Program Active</Label>
                  <p className="text-xs text-gray-500">
                    Enable or disable the referral program
                  </p>
                </div>
                <Switch
                  checked={settings.is_active}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, is_active: checked })
                  }
                />
              </div>
            </div>
            <Button onClick={saveSettings} disabled={saving} className="mt-6">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>

        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Referrals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : referrals.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No referrals yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>New User</TableHead>
                    <TableHead>Code Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Rewards</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {referral.referrer_name || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {referral.referrer_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {referral.referred_name || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {referral.referred_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {referral.referral_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            referral.status === "rewarded"
                              ? "bg-green-100 text-green-800"
                              : referral.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {referral.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="text-sm">
                          Referrer:{" "}
                          <span className="font-medium">
                            €{referral.referrer_reward}
                          </span>
                        </p>
                        <p className="text-sm">
                          New User:{" "}
                          <span className="font-medium">
                            €{referral.referred_reward}
                          </span>
                        </p>
                      </TableCell>
                      <TableCell>
                        {new Date(referral.created_at).toLocaleDateString(
                          "pt-PT"
                        )}
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
