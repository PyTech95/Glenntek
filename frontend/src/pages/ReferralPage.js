import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Layout from "@/components/Layout";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, Copy, Share2, Users, Wallet, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ReferralPage() {
  const { user } = useContext(AuthContext);
  const [referralData, setReferralData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      const [referralRes, settingsRes] = await Promise.all([
        axios.get(`${API}/referral/my-code`),
        axios.get(`${API}/referral/settings`),
      ]);
      setReferralData(referralRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      toast.error("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Glenntek",
          text: `Use my referral code ${referralData.referral_code} to get €${
            settings?.referred_reward || 5
          } off your first order!`,
          url: referralData.referral_link,
        });
      } catch (error) {
        copyToClipboard(referralData.referral_link);
      }
    } else {
      copyToClipboard(referralData.referral_link);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">
            Please login to access referrals
          </h1>
          <Button asChild>
            <Link to="/auth">Login</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1
          className="text-3xl font-bold mb-8"
          style={{ fontFamily: "Space Grotesk" }}
        >
          <Gift className="inline-block mr-3 h-8 w-8 text-purple-500" />
          Referral Program
        </h1>

        {/* Referral Hero */}
        <Card className="mb-8 bg-gradient-to-br from-purple-600 to-purple-800 text-white overflow-hidden">
          <CardContent className="p-8 relative">
            <div className="absolute top-0 right-0 opacity-10">
              <Gift className="h-48 w-48" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Invite Friends & Earn Rewards!
            </h2>
            <p className="text-purple-100 mb-6 max-w-lg">
              Share your unique referral code with friends. You'll earn €
              {settings?.referrer_reward || 5}
              and they'll get €{settings?.referred_reward || 5} when they sign
              up!
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-md">
              <p className="text-sm text-purple-200 mb-2">Your Referral Code</p>
              <div className="flex gap-2">
                <Input
                  value={referralData?.referral_code || ""}
                  readOnly
                  className="bg-white text-gray-900 font-mono text-lg font-bold"
                />
                <Button
                  variant="secondary"
                  onClick={() => copyToClipboard(referralData?.referral_code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                onClick={shareReferral}
                className="bg-white text-purple-700 hover:bg-purple-100"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Link
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                onClick={() => copyToClipboard(referralData?.referral_link)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-10 w-10 text-blue-500 mx-auto mb-3" />
              <p className="text-3xl font-bold">
                {referralData?.total_referrals || 0}
              </p>
              <p className="text-gray-600">Total Referrals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <p className="text-3xl font-bold">
                {referralData?.completed_referrals || 0}
              </p>
              <p className="text-gray-600">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Wallet className="h-10 w-10 text-purple-500 mx-auto mb-3" />
              <p className="text-3xl font-bold">
                €{(referralData?.total_earned || 0).toFixed(2)}
              </p>
              <p className="text-gray-600">Total Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">1</span>
                </div>
                <h3 className="font-semibold mb-2">Share Your Code</h3>
                <p className="text-sm text-gray-600">
                  Send your unique referral code or link to friends
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">2</span>
                </div>
                <h3 className="font-semibold mb-2">Friend Signs Up</h3>
                <p className="text-sm text-gray-600">
                  They create an account using your referral code
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="font-semibold mb-2">Both Get Rewarded</h3>
                <p className="text-sm text-gray-600">
                  You get €{settings?.referrer_reward || 5} and they get €
                  {settings?.referred_reward || 5} in wallet credits
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral History */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            {!referralData?.referrals || referralData.referrals.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  No referrals yet. Start sharing your code!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {referralData.referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          Referral #{referral.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(referral.created_at).toLocaleDateString(
                            "pt-PT"
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={
                          referral.status === "rewarded"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {referral.status}
                      </Badge>
                      {referral.status === "rewarded" && (
                        <p className="text-sm text-green-600 mt-1">
                          +€{referral.referrer_reward}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
