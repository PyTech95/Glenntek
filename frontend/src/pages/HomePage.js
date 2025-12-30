import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Calendar,
  ShoppingBag,
  Truck,
  Shield,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import useEmblaCarousel from "embla-carousel-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function HomePage() {
  const [newArrivals, setNewArrivals] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [homepageSections, setHomepageSections] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Auto-advance slides
  useEffect(() => {
    if (!emblaApi || heroSlides.length <= 1) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [emblaApi, heroSlides]);

  useEffect(() => {
    fetchData();
  }, []);

const fetchData = async () => {
  try {
    const [categoriesRes, slidesRes, sectionsRes, blogRes] = await Promise.all([
      axios.get(`${API}/categories`),
      axios.get(`${API}/hero-slides`),
      axios.get(`${API}/homepage-sections`),
      axios.get(`${API}/blog`), // fetch blogs
    ]);

    setCategories(categoriesRes.data);
    setHeroSlides(slidesRes.data);
    setHomepageSections(sectionsRes.data);
    setBlogs(blogRes.data); // save blogs

    // Fetch products for each section
    const sections = sectionsRes.data;
    for (const section of sections) {
      if (section.section_type === "new_arrivals") {
        const res = await axios.get(
          `${API}/products?limit=${section.config?.limit || 4}`
        );
        const sorted = res.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setNewArrivals(sorted.slice(0, section.config?.limit || 4));
      } else if (section.section_type === "featured_products") {
        const res = await axios.get(
          `${API}/products?limit=${section.config?.limit || 8}`
        );
        setFeaturedProducts(res.data);
      }
    }
  } catch (error) {
    toast.error("Failed to load data");
  } finally {
    setLoading(false);
  }
};


  // Get section config by type
  const getSection = (type) =>
    homepageSections.find((s) => s.section_type === type && s.is_active);

  return (
    <Layout>
      {/* Hero Slider Section */}
      {heroSlides.length > 0 ? (
        <section className="relative overflow-hidden" data-testid="hero-slider">
          <div className="embla" ref={emblaRef}>
            <div className="embla__container flex">
              {heroSlides.map((slide) => (
                <div
                  key={slide.id}
                  className="embla__slide flex-[0_0_100%] min-w-0 relative"
                >
                  <div
                    className="relative h-[500px] md:h-[600px] bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${
                        slide.image.startsWith("http")
                          ? slide.image
                          : `${BACKEND_URL}${slide.image}`
                      })`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/40"></div>
                    <div className="container mx-auto px-4 h-full flex items-center relative z-10">
                      <div className="max-w-2xl text-white">
                        <h1
                          className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
                          style={{ fontFamily: "Space Grotesk" }}
                          data-testid={`slide-title-${slide.id}`}
                        >
                          {slide.title}
                        </h1>
                        {slide.subtitle && (
                          <p className="text-lg sm:text-xl mb-8 text-gray-100">
                            {slide.subtitle}
                          </p>
                        )}
                        {slide.button_text && slide.button_link && (
                          <Button
                            size="lg"
                            asChild
                            className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-full"
                          >
                            <Link to={slide.button_link}>
                              {slide.button_text}
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {heroSlides.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="embla__prev absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 hover:bg-white"
                onClick={scrollPrev}
                data-testid="slider-prev"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="embla__next absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 hover:bg-white"
                onClick={scrollNext}
                data-testid="slider-next"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </section>
      ) : (
        <section
          className="relative bg-gradient-to-br from-blue-50 via-white to-orange-50 py-20 md:py-32"
          data-testid="hero-section"
        >
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Premium Mobile Accessories
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8">
                Discover our collection of high-quality cases, chargers, and
                accessories for your mobile devices.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  asChild
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-full"
                  data-testid="shop-now-button"
                >
                  <Link to="/products">
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="px-8 py-6 text-lg rounded-full border-2"
                  data-testid="learn-more-button"
                >
                  <Link to="/pages/about">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card
              className="border-0 shadow-sm hover:shadow-lg transition-all duration-300"
              data-testid="feature-shipping"
            >
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Free Shipping</h3>
                <p className="text-gray-600 text-sm">
                  On orders over €50 across Portugal
                </p>
              </CardContent>
            </Card>
            <Card
              className="border-0 shadow-sm hover:shadow-lg transition-all duration-300"
              data-testid="feature-quality"
            >
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  Quality Guarantee
                </h3>
                <p className="text-gray-600 text-sm">
                  Premium products with warranty
                </p>
              </CardContent>
            </Card>
            <Card
              className="border-0 shadow-sm hover:shadow-lg transition-all duration-300"
              data-testid="feature-support"
            >
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Customer Support</h3>
                <p className="text-gray-600 text-sm">
                  24/7 assistance for all your needs
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 bg-gray-50" data-testid="categories-section">
          <div className="container mx-auto px-4">
            <h2
              className="text-3xl font-bold text-center mb-12"
              style={{ fontFamily: "Space Grotesk" }}
            >
              Shop by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.slice(0, 4).map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.slug}`}
                  className="group"
                  data-testid={`category-${category.slug}`}
                >
                  <Card className="overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300">
                    {category.image && (
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-4 text-center">
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      {getSection("new_arrivals") && newArrivals.length > 0 && (
        <section
          className="py-16 bg-gradient-to-r from-purple-50 to-pink-50"
          data-testid="new-arrivals-section"
        >
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2
                  className="text-3xl font-bold"
                  style={{ fontFamily: "Space Grotesk" }}
                >
                  {getSection("new_arrivals").title}
                </h2>
                {getSection("new_arrivals").subtitle && (
                  <p className="text-gray-600 mt-2">
                    {getSection("new_arrivals").subtitle}
                  </p>
                )}
              </div>
              <Button variant="outline" asChild>
                <Link to="/products?new=true">View All New</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showActions={true}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {getSection("featured_products") && (
        <section
          className="py-16 bg-white"
          data-testid="featured-products-section"
        >
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2
                  className="text-3xl font-bold"
                  style={{ fontFamily: "Space Grotesk" }}
                >
                  {getSection("featured_products")?.title ||
                    "Featured Products"}
                </h2>
                {getSection("featured_products")?.subtitle && (
                  <p className="text-gray-600 mt-2">
                    {getSection("featured_products").subtitle}
                  </p>
                )}
              </div>
              <Button variant="outline" asChild>
                <Link to="/products">View All</Link>
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square bg-gray-200 animate-pulse"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showActions={true}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
{/* Blogs Section */}
{blogs.length > 0 && (
<section className="py-16 bg-gray-50">
  <div className="container mx-auto px-4">
    <div className="mb-12 text-center">
      <h1
        className="text-4xl font-bold mb-4"
        style={{ fontFamily: "Space Grotesk" }}
      >
        Blog & News
      </h1>
      <p className="text-gray-600 text-lg">
        Stay updated with the latest from Glenntek
      </p>
    </div>

    {loading ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <div className="aspect-video bg-gray-200 animate-pulse"></div>
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    ) : blogs.length === 0 ? (
      <div className="text-center py-20">
        <p className="text-gray-600 mb-4">No blog posts yet. Check back soon!</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogs.map((post) => (
          <Card
            key={post._id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            {post.images && post.images.length > 0 && (
              <div className=" bg-gray-100">
                <img
                  src={
                    post.images[0].startsWith("http")
                      ? post.images[0]
                      : `${BACKEND_URL}${post.images[0]}`
                  }
                  alt={post.title}
                  className="w-full h-auto object-contain"
                />
              </div>
            )}
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <Calendar className="h-4 w-4" />
                {new Date(post.published_at || post.created_at).toLocaleDateString()}
              </div>
              <h3 className="font-semibold text-xl mb-3 line-clamp-2">{post.title}</h3>
              {post.excerpt && (
                <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
              )}
              <Link to={`/blog/${post.slug}`}>
                <Button variant="link" className="p-0">
                  Read More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    )}
  </div>
</section>
)}

      {/* CTA Section */}
      <section
        className="py-20 bg-primary text-white"
        data-testid="cta-section"
      >
        <div className="container mx-auto px-4 text-center">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: "Space Grotesk" }}
          >
            Ready to upgrade your mobile experience?
          </h2>
          <p className="text-lg mb-8 text-blue-100">
            Browse our full collection and find the perfect accessories for your
            devices.
          </p>
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="px-8 py-6 text-lg rounded-full"
            data-testid="browse-collection-button"
          >
            <Link to="/products">
              Browse Collection
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
