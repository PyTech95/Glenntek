import { useState, useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Layout from "@/components/Layout";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Gift } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [referralCode, setReferralCode] = useState("");
  const [referrerName, setReferrerName] = useState("");
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    referral_code: "",
  });

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
      setRegisterData((prev) => ({ ...prev, referral_code: ref }));
      validateReferralCode(ref);
    }
  }, [searchParams]);

  const validateReferralCode = async (code) => {
    try {
      const response = await axios.get(`${API}/referral/validate/${code}`);
      setReferrerName(response.data.referrer_name);
    } catch (error) {
      setReferrerName("");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      login(response.data.access_token, response.data.user);
      toast.success("Login successful!");

      const redirect = searchParams.get("redirect");
      navigate(redirect || "/");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/register`, registerData);
      login(response.data.access_token, response.data.user);
      toast.success("Registration successful!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <h1
            className="text-3xl font-bold text-center mb-8"
            style={{ fontFamily: "Space Grotesk" }}
            data-testid="auth-title"
          >
            Welcome to Glenntek
          </h1>

          <Card data-testid="auth-card">
            <CardContent className="p-6">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" data-testid="login-tab">
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="register" data-testid="register-tab">
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" data-testid="login-form">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                        required
                        data-testid="login-email-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
                            password: e.target.value,
                          })
                        }
                        required
                        data-testid="login-password-input"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                      data-testid="login-submit"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register" data-testid="register-form">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="register-name">Full Name</Label>
                      <Input
                        id="register-name"
                        value={registerData.full_name}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            full_name: e.target.value,
                          })
                        }
                        required
                        data-testid="register-name-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            email: e.target.value,
                          })
                        }
                        required
                        data-testid="register-email-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-phone">Phone</Label>
                      <Input
                        id="register-phone"
                        value={registerData.phone}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            phone: e.target.value,
                          })
                        }
                        data-testid="register-phone-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            password: e.target.value,
                          })
                        }
                        required
                        data-testid="register-password-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-referral">
                        Referral Code (Optional)
                      </Label>
                      <Input
                        id="register-referral"
                        value={registerData.referral_code}
                        onChange={(e) => {
                          setRegisterData({
                            ...registerData,
                            referral_code: e.target.value,
                          });
                          if (e.target.value.length >= 6) {
                            validateReferralCode(e.target.value);
                          } else {
                            setReferrerName("");
                          }
                        }}
                        placeholder="Enter referral code"
                        data-testid="register-referral-input"
                      />
                      {referrerName && (
                        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          Referred by {referrerName} - You'll get €5 bonus!
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                      data-testid="register-submit"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
