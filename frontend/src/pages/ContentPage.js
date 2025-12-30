import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Layout from "@/components/Layout";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ContentPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    try {
      const response = await axios.get(`${API}/pages/${slug}`);
      setPage(response.data);
    } catch (error) {
      // Create default pages if they don't exist
      const defaultPages = {
        about: {
          title: "About Us",
          content:
            "<h2>Welcome to Glenntek</h2><p>Your trusted partner for premium mobile accessories in Portugal.</p>",
        },
        contact: {
          title: "Contact Us",
          content:
            "<h2>Get in Touch</h2><p>Phone: 00351928489086</p><p>Email: info@glenntek.pt</p><p>Address: Portugal, Europe</p>",
        },
        shipping: {
          title: "Shipping Information",
          content:
            "<h2>Shipping Policy</h2><p>We offer free shipping on orders over €50 across Portugal.</p>",
        },
        returns: {
          title: "Returns Policy",
          content:
            "<h2>Returns & Refunds</h2><p>We accept returns within 30 days of purchase.</p>",
        },
      };

      if (defaultPages[slug]) {
        setPage(defaultPages[slug]);
      } else {
        toast.error("Page not found");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!page) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto" data-testid="content-page">
          <h1
            className="text-4xl font-bold mb-8"
            style={{ fontFamily: "Space Grotesk" }}
            data-testid="page-title"
          >
            {page.title}
          </h1>
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
            data-testid="page-content"
          />
        </article>
      </div>
    </Layout>
  );
}
