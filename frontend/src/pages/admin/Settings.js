import { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    site_name: "",
    site_logo: "",
    site_description: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    primary_color: "",
    secondary_color: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
      setFormData({
        site_name: response.data.site_name,
        site_logo: response.data.site_logo,
        site_description: response.data.site_description,
        contact_email: response.data.contact_email,
        contact_phone: response.data.contact_phone,
        address: response.data.address,
        primary_color: response.data.primary_color,
        secondary_color: response.data.secondary_color,
      });
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/settings`, formData);
      toast.success("Settings updated successfully");
      fetchSettings();
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div data-testid="admin-settings">
        <h1
          className="text-3xl font-bold mb-8"
          style={{ fontFamily: "Space Grotesk" }}
        >
          Settings
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="site_name">Site Name</Label>
                <Input
                  id="site_name"
                  value={formData.site_name}
                  onChange={(e) =>
                    setFormData({ ...formData, site_name: e.target.value })
                  }
                  data-testid="input-site-name"
                />
              </div>
              <div>
                <Label htmlFor="site_logo">Site Logo URL</Label>
                <Input
                  id="site_logo"
                  value={formData.site_logo}
                  onChange={(e) =>
                    setFormData({ ...formData, site_logo: e.target.value })
                  }
                  data-testid="input-site-logo"
                />
                {formData.site_logo && (
                  <div className="mt-2">
                    <img
                      src={formData.site_logo}
                      alt="Logo preview"
                      className="h-16 w-16 object-contain"
                    />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="site_description">Site Description</Label>
                <Textarea
                  id="site_description"
                  value={formData.site_description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      site_description: e.target.value,
                    })
                  }
                  rows={3}
                  data-testid="input-site-description"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  data-testid="input-contact-email"
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_phone: e.target.value })
                  }
                  data-testid="input-contact-phone"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  data-testid="input-address"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      value={formData.primary_color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primary_color: e.target.value,
                        })
                      }
                      data-testid="input-primary-color"
                    />
                    <div
                      className="w-12 h-10 rounded border"
                      style={{ backgroundColor: formData.primary_color }}
                    ></div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      value={formData.secondary_color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          secondary_color: e.target.value,
                        })
                      }
                      data-testid="input-secondary-color"
                    />
                    <div
                      className="w-12 h-10 rounded border"
                      style={{ backgroundColor: formData.secondary_color }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" data-testid="save-settings">
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
