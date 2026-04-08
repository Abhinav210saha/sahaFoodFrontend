import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { FoodCard } from "../components/FoodCard";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useCart } from "../context/CartContext";
import { loadRazorpaySdk } from "../utils/razorpay";

const adminWhatsapp = (import.meta.env.VITE_ADMIN_WHATSAPP || "916202173133").replace(/\D/g, "");
const USER_LOCATION_KEY = "saha_food_user_location_city";

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

const RECENT_SEARCHES_KEY = "saha_food_recent_searches";
const defaultDeliveryConfig = {
  serviceableCities: [],
  enforceServiceability: true,
  comingSoonMessage: "We are reaching your area very soon.",
};

const normalizeCity = (value) => String(value || "").trim().toLowerCase();

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
  const [deliverySlotType, setDeliverySlotType] = useState("asap");
  const [scheduledFor, setScheduledFor] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
  const [deliveryConfig, setDeliveryConfig] = useState(defaultDeliveryConfig);
  const [selectedLocationCity, setSelectedLocationCity] = useState("");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    Promise.all([api.getBanners(), api.getMenu(), api.getDeliveryConfig()])
      .then(([bannerData, menuData, deliveryData]) => {
        setBanners(bannerData.filter((banner) => banner.isActive));
        const liveMenu = menuData.filter((item) => item.isAvailable);
        setMenu(liveMenu.length ? liveMenu : fallbackMenu);
        setDeliveryConfig({
          serviceableCities: deliveryData.serviceableCities || [],
          enforceServiceability: Boolean(deliveryData.enforceServiceability),
          comingSoonMessage: deliveryData.comingSoonMessage || defaultDeliveryConfig.comingSoonMessage,
        });
      })
      .catch(() => {
        setFetchError("Live menu unavailable, showing sample items.");
        setMenu(fallbackMenu);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const savedLocation = localStorage.getItem(USER_LOCATION_KEY) || "";
    if (savedLocation) {
      setSelectedLocationCity(savedLocation);
    } else {
      setShowLocationPicker(true);
    }
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

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
      if (Array.isArray(saved)) {
        setRecentSearches(saved.filter(Boolean).slice(0, 6));
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!searchBoxRef.current?.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const saveRecentSearch = (rawQuery) => {
    const query = rawQuery.trim();
    if (!query) return;
    setRecentSearches((prev) => {
      const next = [query, ...prev.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 6);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const categories = useMemo(() => ["All", ...new Set(menu.map((item) => item.category))], [menu]);
  const searchSuggestionPool = useMemo(() => {
    const set = new Set();
    menu.forEach((item) => {
      [item.name, item.category, ...(Array.isArray(item.keywords) ? item.keywords : [])]
        .filter(Boolean)
        .forEach((value) => set.add(String(value).trim()));
    });
    return Array.from(set);
  }, [menu]);

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return searchSuggestionPool
      .filter((text) => text.toLowerCase().includes(q))
      .slice(0, 6);
  }, [searchSuggestionPool, searchQuery]);

  const activeSearchItems = useMemo(
    () => (searchQuery.trim() ? searchSuggestions : recentSearches),
    [searchQuery, searchSuggestions, recentSearches]
  );

  useEffect(() => {
    if (!isSearchFocused || activeSearchItems.length === 0) {
      setHighlightedSuggestionIndex(-1);
      return;
    }
    if (highlightedSuggestionIndex >= activeSearchItems.length) {
      setHighlightedSuggestionIndex(0);
    }
  }, [isSearchFocused, activeSearchItems, highlightedSuggestionIndex]);

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

  useEffect(() => {
    if (!selectedLocationCity && selectedAddress?.city) {
      const city = selectedAddress.city.trim();
      setSelectedLocationCity(city);
      localStorage.setItem(USER_LOCATION_KEY, city);
    }
  }, [selectedAddress, selectedLocationCity]);

  const featuredForHero = featuredItems[0] || menu[0];
  const heroImageSrc =
    heroBanner?.image ||
    (!loading ? featuredForHero?.image : "");

  const normalizedLocation = normalizeCity(selectedLocationCity);
  const normalizedServiceableCities = (deliveryConfig.serviceableCities || []).map(normalizeCity);
  const hasCoverageRules = deliveryConfig.enforceServiceability && normalizedServiceableCities.length > 0;
  const isServiceable = !hasCoverageRules || !selectedLocationCity || normalizedServiceableCities.includes(normalizedLocation);
  const orderBlockedReason = deliveryConfig.comingSoonMessage || "We are reaching your area very soon.";
  const locationOptions = Array.from(
    new Set([
      ...(deliveryConfig.serviceableCities || []),
      ...addresses.map((address) => address.city).filter(Boolean),
      selectedLocationCity,
    ].filter(Boolean))
  );

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

  const handleOrder = async (item, quantity, quickPaymentMethod) => {
    if (!selectedLocationCity) {
      setShowLocationPicker(true);
      showToast("Please select your location to continue.", "warning");
      return;
    }
    if (!isServiceable) {
      showToast(orderBlockedReason, "warning");
      return;
    }
    if (!selectedAddressId) {
      showToast("Please add/select an address before placing order.", "warning");
      return;
    }
    if (deliverySlotType === "scheduled" && !scheduledFor) {
      showToast("Please select a scheduled delivery time.", "warning");
      return;
    }

    setOrderingItemId(item._id);

    try {
      const selectedPaymentMethod = quickPaymentMethod || paymentMethod;
      let paymentPayload = { paymentMethod: "cod", paymentStatus: "pending", paymentId: "" };
      const totalAmount = Number(item.price) * (Number(quantity) || 1);

      if (selectedPaymentMethod === "online") {
        const sdkLoaded = await loadRazorpaySdk();
        if (!sdkLoaded) {
          showToast("Unable to load payment gateway.", "error");
          return;
        }

        const paymentOrder = await api.createPaymentOrder(totalAmount, token);
        const paymentResult = await new Promise((resolve, reject) => {
          const razorpay = new window.Razorpay({
            key: paymentOrder.keyId,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            order_id: paymentOrder.orderId,
            name: "Saha Food",
            description: "Food order payment",
            prefill: {
              name: user?.name || "",
              email: user?.email || "",
              contact: user?.phone || "",
            },
            handler: async (response) => {
              try {
                await api.verifyPayment(response, token);
                resolve(response);
              } catch (error) {
                reject(error);
              }
            },
            modal: {
              ondismiss: () => reject(new Error("Payment cancelled")),
            },
          });
          razorpay.open();
        });

        paymentPayload = {
          paymentMethod: "online",
          paymentStatus: "paid",
          paymentId: paymentResult.razorpay_payment_id,
        };
      }

      const result = await api.placeOrder(
        {
          menuItemId: item._id,
          itemName: item.name,
          itemPrice: item.price,
          quantity: Number(quantity) || 1,
          deliveryTime: item.deliveryTime,
          addressId: selectedAddressId,
          deliverySlotType,
          scheduledFor: deliverySlotType === "scheduled" ? scheduledFor : undefined,
          ...paymentPayload,
        },
        token
      );

      const whatsappUrl = `https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(result.whatsappMessage)}`;
      const opened = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        window.location.href = whatsappUrl;
      }
      showToast(
        selectedPaymentMethod === "online"
          ? "Online payment successful. WhatsApp opened, please tap Send."
          : "COD order placed. WhatsApp opened, please tap Send.",
        "success"
      );
    } catch (error) {
      showToast(error.message || "Failed to place order.", "error");
    } finally {
      setOrderingItemId("");
    }
  };

  const handleAddToCart = (item, quantity) => {
    if (!selectedLocationCity) {
      setShowLocationPicker(true);
      showToast("Please select your location to continue.", "warning");
      return;
    }
    if (!isServiceable) {
      showToast(orderBlockedReason, "warning");
      return;
    }
    addToCart(
      {
        ...item,
        menuItemId: item._id,
      },
      quantity
    );
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

  const applySearch = (value) => {
    setSearchQuery(value);
    saveRecentSearch(value);
    setIsSearchFocused(false);
    setHighlightedSuggestionIndex(-1);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleLocationSelect = (city) => {
    const cleanCity = String(city || "").trim();
    if (!cleanCity) {
      showToast("Please select a city to continue.", "warning");
      return;
    }
    setSelectedLocationCity(cleanCity);
    localStorage.setItem(USER_LOCATION_KEY, cleanCity);
    setShowLocationPicker(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      showToast("Location is not supported on this browser.", "error");
      return;
    }

    setCheckingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.village ||
            data?.address?.county ||
            "";

          if (!city) {
            showToast("Unable to detect city. Please select manually.", "warning");
            return;
          }
          handleLocationSelect(city);
          showToast(`Location detected: ${city}`, "success");
        } catch (_error) {
          showToast("Could not detect your city. Please select manually.", "warning");
        } finally {
          setCheckingLocation(false);
        }
      },
      () => {
        setCheckingLocation(false);
        showToast("Location permission denied. Please select manually.", "warning");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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

      <section className="location-strip">
        <div>
          <p className="eyebrow">Delivery location</p>
          <h3>{selectedLocationCity || "Set your location"}</h3>
          <p>
            {isServiceable
              ? "Great news. We deliver in this area."
              : deliveryConfig.comingSoonMessage || "We are reaching your area very soon."}
          </p>
        </div>
        <div className="address-actions">
          <select
            value={selectedLocationCity}
            onChange={(event) => handleLocationSelect(event.target.value)}
            className="address-select"
          >
            <option value="">Select city</option>
            {locationOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <button type="button" className="ghost-button" onClick={useMyLocation} disabled={checkingLocation}>
            {checkingLocation ? "Detecting..." : "Use my location"}
          </button>
          <button type="button" className="text-button" onClick={() => setShowLocationPicker(true)}>
            Change
          </button>
        </div>
      </section>

      {!isServiceable && selectedLocationCity && (
        <section className="coming-soon-banner">
          <p className="eyebrow">Not delivering here yet</p>
          <h2>We will reach {selectedLocationCity} very soon</h2>
          <p>{deliveryConfig.comingSoonMessage || "Our team is expanding quickly to your area."}</p>
        </section>
      )}

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
            <select
              value={deliverySlotType}
              onChange={(event) => setDeliverySlotType(event.target.value)}
              className="address-select"
            >
              <option value="asap">ASAP</option>
              <option value="scheduled">Scheduled</option>
            </select>
            {deliverySlotType === "scheduled" && (
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
                className="address-select"
              />
            )}
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="address-select"
            >
              <option value="cod">Cash on Delivery</option>
              <option value="online">Pay Online (Razorpay)</option>
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
          <div className="search-box" ref={searchBoxRef}>
            <input
              className="search-input"
              type="text"
              placeholder="Search food items..."
              value={searchQuery}
              onFocus={() => {
                setIsSearchFocused(true);
                setHighlightedSuggestionIndex(-1);
              }}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setHighlightedSuggestionIndex(-1);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  if (!activeSearchItems.length) return;
                  setHighlightedSuggestionIndex((prev) =>
                    prev < activeSearchItems.length - 1 ? prev + 1 : 0
                  );
                  return;
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  if (!activeSearchItems.length) return;
                  setHighlightedSuggestionIndex((prev) =>
                    prev > 0 ? prev - 1 : activeSearchItems.length - 1
                  );
                  return;
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (highlightedSuggestionIndex >= 0 && activeSearchItems[highlightedSuggestionIndex]) {
                    applySearch(activeSearchItems[highlightedSuggestionIndex]);
                    return;
                  }
                  applySearch(searchQuery);
                }
                if (event.key === "Escape") {
                  setIsSearchFocused(false);
                  setHighlightedSuggestionIndex(-1);
                }
              }}
            />
            {isSearchFocused && (
              <div className="search-suggestions">
                {searchQuery.trim() ? (
                  searchSuggestions.length ? (
                    <>
                      <p className="search-meta">Suggestions</p>
                      {searchSuggestions.map((suggestion, index) => (
                        <button
                          key={suggestion}
                          type="button"
                          className={`search-suggestion-item ${highlightedSuggestionIndex === index ? "active" : ""}`}
                          onMouseEnter={() => setHighlightedSuggestionIndex(index)}
                          onClick={() => applySearch(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </>
                  ) : (
                    <p className="search-meta">No suggestions found.</p>
                  )
                ) : (
                  <>
                    <div className="search-meta-row">
                      <p className="search-meta">Recent searches</p>
                      {recentSearches.length > 0 && (
                        <button type="button" className="text-button" onClick={clearRecentSearches}>
                          Clear
                        </button>
                      )}
                    </div>
                    {recentSearches.length ? (
                      recentSearches.map((recent, index) => (
                        <button
                          key={recent}
                          type="button"
                          className={`search-suggestion-item ${highlightedSuggestionIndex === index ? "active" : ""}`}
                          onMouseEnter={() => setHighlightedSuggestionIndex(index)}
                          onClick={() => applySearch(recent)}
                        >
                          {recent}
                        </button>
                      ))
                    ) : (
                      <p className="search-meta">No recent searches yet.</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
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
                canOrder={isServiceable && Boolean(selectedLocationCity)}
                orderBlockedReason={
                  !selectedLocationCity
                    ? "Please select your location first."
                    : orderBlockedReason
                }
              />
            ))}
          </div>
        ) : (
          <p>No items found. Please ask admin to add menu items.</p>
        )}
      </section>

      {showLocationPicker && (
        <div className="location-modal-backdrop" role="dialog" aria-modal="true">
          <div className="location-modal-card">
            <p className="eyebrow">Choose location</p>
            <h3>Where should we deliver?</h3>
            <p>Select your city to check if Saha Food is available in your area.</p>
            <select
              className="address-select"
              value={selectedLocationCity}
              onChange={(event) => setSelectedLocationCity(event.target.value)}
            >
              <option value="">Select city</option>
              {locationOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <div className="hero-actions">
              <button type="button" className="primary-button" onClick={() => handleLocationSelect(selectedLocationCity)}>
                Continue
              </button>
              <button type="button" className="ghost-button" onClick={useMyLocation} disabled={checkingLocation}>
                {checkingLocation ? "Detecting..." : "Use my location"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
