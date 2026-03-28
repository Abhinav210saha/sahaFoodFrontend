import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { FoodCard } from "../components/FoodCard";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useCart } from "../context/CartContext";

const adminWhatsapp = (import.meta.env.VITE_ADMIN_WHATSAPP || "916202173133").replace(/\D/g, "");

const fallbackMenu = [
  {
    _id: "fallback-1",
    name: "Butter Chicken Bowl",
    description: "Creamy tomato gravy, smoky chicken and saffron rice.",
    price: 249,
    category: "Best Sellers",
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80",
    rating: 4.8,
    deliveryTime: "25 mins",
    isAvailable: true,
    isFeatured: true,
  },
  {
    _id: "fallback-2",
    name: "Paneer Tikka Wrap",
    description: "Tandoori paneer with crunchy salad and mint mayo.",
    price: 179,
    category: "Wraps",
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80",
    rating: 4.6,
    deliveryTime: "20 mins",
    isAvailable: true,
    isFeatured: true,
  },
  {
    _id: "fallback-3",
    name: "Loaded Chicken Burger",
    description: "Double chicken patty with smoky cheese and peri sauce.",
    price: 219,
    category: "Burgers",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
    rating: 4.7,
    deliveryTime: "30 mins",
    isAvailable: true,
    isFeatured: false,
  },
  {
    _id: "fallback-4",
    name: "Veg Hakka Noodles",
    description: "Wok-tossed noodles with veggies and savory sauces.",
    price: 169,
    category: "Chinese",
    image: "https://images.unsplash.com/photo-1617622141675-d3005b9067c5?auto=format&fit=crop&w=900&q=80",
    rating: 4.4,
    deliveryTime: "24 mins",
    isAvailable: true,
    isFeatured: false,
  },
];

const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const levenshtein = (a, b) => {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
};

const looseMatch = (text, query) => {
  const nText = normalize(text);
  const nQuery = normalize(query);
  if (!nQuery) return true;
  if (nText.includes(nQuery)) return true;
  const distance = levenshtein(nText, nQuery);
  return distance <= 2;
};

const formatAddress = (address) =>
  [address.line1, address.line2, `${address.city}, ${address.state} - ${address.pincode}`, address.landmark]
    .filter(Boolean)
    .join(", ");

export function HomePage() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const { addToCart } = useCart();
  const [banners, setBanners] = useState([]);
  const [menu, setMenu] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [orderingItemId, setOrderingItemId] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.all([api.getBanners(), api.getMenu()])
      .then(([bannerData, menuData]) => {
        setBanners(bannerData.filter((banner) => banner.isActive));
        const liveMenu = menuData.filter((item) => item.isAvailable);
        setMenu(liveMenu.length ? liveMenu : fallbackMenu);
      })
      .catch(() => {
        setFetchError("Live menu unavailable, showing sample items.");
        setMenu(fallbackMenu);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || !token) return;
    api
      .getAddresses(token)
      .then((data) => {
        setAddresses(data);
        const preferred = data.find((address) => address.isDefault) || data[0];
        setSelectedAddressId(preferred?._id || "");
      })
      .catch(() => setAddresses([]));
  }, [user, token]);

  const categories = useMemo(() => ["All", ...new Set(menu.map((item) => item.category))], [menu]);
  const visibleMenu = menu.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const query = searchQuery.trim();
    const matchesSearch =
      !query ||
      looseMatch(item.name, query) ||
      looseMatch(item.category, query) ||
      looseMatch(item.description, query) ||
      (Array.isArray(item.keywords) && item.keywords.some((keyword) => looseMatch(keyword, query)));
    return matchesCategory && matchesSearch;
  });
  const featuredItems = menu.filter((item) => item.isFeatured).slice(0, 3);
  const heroBanner = banners[0];

  const selectedAddress = addresses.find((address) => String(address._id) === String(selectedAddressId));
  const featuredForHero = featuredItems[0] || menu[0];
  const heroImageSrc =
    heroBanner?.image ||
    (!loading ? featuredForHero?.image : "");

  const handleBannerClick = (banner) => {
    if (banner.targetCategory) {
      const matchedCategory = categories.find(
        (category) => normalize(category) === normalize(banner.targetCategory)
      );
      setActiveCategory(matchedCategory || "All");
    }
    if (banner.targetItem) {
      setSearchQuery(banner.targetItem);
    }

    const link = (banner.ctaLink || "#menu").trim();
    if (link.startsWith("http://") || link.startsWith("https://")) {
      window.open(link, "_blank", "noopener,noreferrer");
      return;
    }

    const menuSection = document.getElementById("menu");
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleOrder = async (item, quantity) => {
    if (!selectedAddressId) {
      showToast("Please add/select an address before placing order.", "warning");
      return;
    }

    setOrderingItemId(item._id);

    try {
      const result = await api.placeOrder(
        {
          itemName: item.name,
          itemPrice: item.price,
          quantity: Number(quantity) || 1,
          deliveryTime: item.deliveryTime,
          addressId: selectedAddressId,
        },
        token
      );

      const whatsappUrl = `https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(result.whatsappMessage)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      showToast("Order placed and sent on WhatsApp.", "success");
    } catch (error) {
      showToast(error.message || "Failed to place order.", "error");
    } finally {
      setOrderingItemId("");
    }
  };

  const handleAddToCart = (item, quantity) => {
    addToCart(item, quantity);
    showToast(`${item.name}: this item is added to cart.`, "success");
  };

  const handleSurpriseMe = () => {
    if (!menu.length) return;
    const randomItem = menu[Math.floor(Math.random() * menu.length)];
    setActiveCategory("All");
    setSearchQuery(randomItem.name);
    const menuSection = document.getElementById("menu");
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    showToast(`Try this today: ${randomItem.name}`, "info");
  };

  return (
    <main className="page-shell home-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Cloud kitchen crafted for everyday cravings</p>
          <h1>Order restaurant-style comfort food from Saha Food in minutes.</h1>
          <p>
            Browse chef-curated bowls, wraps, burgers and late-night specials from one fast,
            delivery-first kitchen.
          </p>
          <div className="hero-actions">
            <a href="#menu" className="primary-button">Explore menu</a>
            <button type="button" className="ghost-button" onClick={handleSurpriseMe}>
              Surprise Me
            </button>
            {!user && <a href="/register" className="ghost-button">Login or sign up</a>}
          </div>
          <div className="metric-row metric-grid">
            <div><strong>30 min</strong><span>average delivery</span></div>
            <div><strong>4.8/5</strong><span>average dish rating</span></div>
          </div>
        </div>
        <div className="hero-visual">
          {heroImageSrc ? (
            <img src={heroImageSrc} alt="Saha Food hero" />
          ) : (
            <div className="hero-image-placeholder" aria-hidden="true" />
          )}
          <div className="floating-card top">
            <span className="chip">{heroBanner?.heroBadgeText || "Trending Tonight"}</span>
            <strong>{heroBanner?.heroTitleText || featuredForHero?.name || "Butter Chicken Bowl"}</strong>
            <small>{heroBanner?.heroMetaText || `${featuredForHero?.deliveryTime || "25 mins"} delivery`}</small>
          </div>
          <div className="floating-card bottom">
            <span className="offer-label">Daily Offer</span>
            <strong>{heroBanner?.title || "Freshly cooked specials"}</strong>
            <small>{heroBanner?.subtitle || "Chef-crafted meals delivered fast."}</small>
            <button type="button" className="mini-cta" onClick={() => handleBannerClick(heroBanner || {})}>
              {heroBanner?.ctaText || "Explore Menu"}
            </button>
          </div>
        </div>
      </section>

      <section className="promo-strip">
        {banners.slice(0, 2).map((banner) => (
          <article
            key={banner._id}
            className="promo-card promo-card-clickable"
            onClick={() => handleBannerClick(banner)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleBannerClick(banner);
              }
            }}
          >
            <div>
              <p className="eyebrow">Featured campaign</p>
              <h2>{banner.title}</h2>
              <p>{banner.subtitle}</p>
              <strong>{banner.ctaText || "Order Now"}</strong>
            </div>
            <img src={banner.image} alt={banner.title} />
          </article>
        ))}
      </section>

      {user && (
        <section className="address-strip">
          <div>
            <p className="eyebrow">Delivery address</p>
            <h3>Select where you want this order delivered</h3>
            <p>{selectedAddress ? formatAddress(selectedAddress) : "No address selected"}</p>
          </div>
          <div className="address-actions">
            <select
              value={selectedAddressId}
              onChange={(event) => setSelectedAddressId(event.target.value)}
              className="address-select"
            >
              <option value="">Select address</option>
              {addresses.map((address) => (
                <option key={address._id} value={address._id}>
                  {address.label} - {address.city}
                </option>
              ))}
            </select>
            <Link className="ghost-button" to="/profile">Manage addresses</Link>
          </div>
        </section>
      )}

      <section className="menu-section" id="menu">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Menu</p>
            <h2>Order from categories people actually come back for</h2>
          </div>
        </div>
        <div className="menu-tools">
          <input
            className="search-input"
            type="text"
            placeholder="Search food items..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <div className="category-row">
            {categories.map((category) => (
              <button
                key={category}
                className={category === activeCategory ? "category-button active" : "category-button"}
                onClick={() => {
                  setActiveCategory(category);
                  setSearchQuery("");
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        {fetchError && <p className="helper-text">{fetchError}</p>}

        {loading ? (
          <p>Loading menu...</p>
        ) : visibleMenu.length ? (
          <div className="food-grid">
            {visibleMenu.map((item) => (
              <FoodCard
                key={item._id}
                item={item}
                user={user}
                onOrder={handleOrder}
                onAddToCart={handleAddToCart}
                orderingItemId={orderingItemId}
              />
            ))}
          </div>
        ) : (
          <p>No items found. Please ask admin to add menu items.</p>
        )}
      </section>
    </main>
  );
}
