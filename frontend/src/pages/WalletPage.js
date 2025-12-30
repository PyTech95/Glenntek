import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Layout from "@/components/Layout";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  ShoppingBag,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function WalletPage() {
  const { user } = useContext(AuthContext);
  const [walletData, setWalletData] = useState({
    balance: 0,
    transactions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWallet();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchWallet = async () => {
    try {
      const response = await axios.get(`${API}/wallet`);
      setWalletData(response.data);
    } catch (error) {
      toast.error("Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "credit":
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
      case "debit":
      case "order_payment":
        return <ArrowUpRight className="h-5 w-5 text-red-500" />;
      case "referral_bonus":
        return <Gift className="h-5 w-5 text-purple-500" />;
      case "refund":
        return <ArrowDownLeft className="h-5 w-5 text-blue-500" />;
      default:
        return <Wallet className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTransactionBadge = (type) => {
    const variants = {
      credit: "bg-green-100 text-green-800",
      debit: "bg-red-100 text-red-800",
      referral_bonus: "bg-purple-100 text-purple-800",
      order_payment: "bg-orange-100 text-orange-800",
      refund: "bg-blue-100 text-blue-800",
    };
    return variants[type] || "bg-gray-100 text-gray-800";
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">
            Please login to view your wallet
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
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
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
          <Wallet className="inline-block mr-3 h-8 w-8 text-primary" />
          My Wallet
        </h1>

        {/* Balance Card */}
        <Card className="mb-8 bg-gradient-to-br from-primary to-primary/80 text-white">
          <CardContent className="p-8">
            <p className="text-sm opacity-80 mb-2">Available Balance</p>
            <h2 className="text-4xl font-bold mb-4">
              €{walletData.balance.toFixed(2)}
            </h2>
            <p className="text-sm opacity-80">
              Use your wallet balance at checkout to pay for orders
            </p>
          </CardContent>
        </Card>

        {/* How to earn */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-500" />
              How to Earn Wallet Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Gift className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Refer Friends</h4>
                  <p className="text-sm text-gray-600">
                    Earn €5 for every friend who signs up using your referral
                    code
                  </p>
                  <Button variant="link" className="p-0 h-auto" asChild>
                    <Link to="/referral">Go to Referrals →</Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-full">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Promotions & Refunds</h4>
                  <p className="text-sm text-gray-600">
                    Get credits from special promotions and order refunds
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {walletData.transactions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {walletData.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString(
                            "pt-PT",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          transaction.amount > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}€
                        {transaction.amount.toFixed(2)}
                      </p>
                      <Badge className={getTransactionBadge(transaction.type)}>
                        {transaction.type.replace("_", " ")}
                      </Badge>
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
