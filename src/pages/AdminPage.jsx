import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const defaultMenuForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  keywords: "",
  rating: 4.5,
  deliveryTime: "25 mins",
  isAvailable: true,
  isFeatured: false,
  trackInventory: false,
  stockQty: 0,
  lowStockThreshold: 5,
};

const defaultBannerForm = {
  title: "",
  subtitle: "",
  image: "",
  ctaText: "Order Now",
  ctaLink: "#menu",
  targetCategory: "",
  targetItem: "",
  heroBadgeText: "Trending Tonight",
  heroTitleText: "",
  heroMetaText: "",
  isActive: true,
  startsAt: "",
  endsAt: "",
};

const ORDER_STATUS_OPTIONS = ["placed", "preparing", "out_for_delivery", "delivered", "cancelled"];

const toDateTimeInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const statusLabel = (status) =>
  String(status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export function AdminPage() {
  const { token, user } = useAuth();
  const [menu, setMenu] = useState([]);
  const [banners, setBanners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dashboard, setDashboard] = useState({ todayOrders: 0, todayRevenue: 0, topItems: [] });
  const [menuForm, setMenuForm] = useState(defaultMenuForm);
  const [bannerForm, setBannerForm] = useState(defaultBannerForm);
  const [editingMenuId, setEditingMenuId] = useState("");
  const [editingBannerId, setEditingBannerId] = useState("");
  const [menuImageFile, setMenuImageFile] = useState(null);
  const [menuImagePreview, setMenuImagePreview] = useState("");
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    const [menuData, bannerData, orderData, dashboardData] = await Promise.all([
      api.getMenu(),
      api.getBanners(true),
      api.getAllOrders(token),
      api.getAdminDashboard(token),
    ]);
    setMenu(menuData);
    setBanners(bannerData);
    setOrders(orderData);
    setDashboard(dashboardData);
  };

  useEffect(() => {
    loadData().catch((err) => setError(err.message));
  }, [token]);

  useEffect(() => {
    return () => {
      if (menuImagePreview && menuImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(menuImagePreview);
      }
      if (bannerImagePreview && bannerImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(bannerImagePreview);
      }
    };
  }, [menuImagePreview, bannerImagePreview]);

  const stats = useMemo(
    () => ({
      totalItems: menu.length,
      availableItems: menu.filter((item) => item.isAvailable).length,
      lowStockItems: menu.filter(
        (item) => item.trackInventory && item.stockQty <= (item.lowStockThreshold ?? 5)
      ).length,
      activeBanners: banners.filter((banner) => banner.isCurrentlyLive).length,
    }),
    [menu, banners]
  );

  const saveMenu = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const payload = new FormData();
      payload.append("name", menuForm.name);
      payload.append("description", menuForm.description);
      payload.append("category", menuForm.category);
      payload.append("price", String(Number(menuForm.price)));
      payload.append("keywords", menuForm.keywords || "");
      payload.append("rating", String(Number(menuForm.rating)));
      payload.append("deliveryTime", menuForm.deliveryTime);
      payload.append("isAvailable", String(Boolean(menuForm.isAvailable)));
      payload.append("isFeatured", String(Boolean(menuForm.isFeatured)));
      payload.append("trackInventory", String(Boolean(menuForm.trackInventory)));
      payload.append("stockQty", String(Number(menuForm.stockQty || 0)));
      payload.append("lowStockThreshold", String(Number(menuForm.lowStockThreshold || 0)));
      if (menuImageFile) {
        payload.append("image", menuImageFile);
      }

      if (editingMenuId) {
        await api.updateMenu(editingMenuId, payload, token);
        setMessage("Menu item updated successfully.");
      } else {
        await api.createMenu(payload, token);
        setMessage("Menu item created successfully.");
      }

      setMenuForm(defaultMenuForm);
      setEditingMenuId("");
      setMenuImageFile(null);
      setMenuImagePreview("");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveBanner = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const payload = new FormData();
      payload.append("title", bannerForm.title);
      payload.append("subtitle", bannerForm.subtitle);
      payload.append("ctaText", bannerForm.ctaText);
      payload.append("ctaLink", bannerForm.ctaLink);
      payload.append("targetCategory", bannerForm.targetCategory || "");
      payload.append("targetItem", bannerForm.targetItem || "");
      payload.append("heroBadgeText", bannerForm.heroBadgeText || "");
      payload.append("heroTitleText", bannerForm.heroTitleText || "");
      payload.append("heroMetaText", bannerForm.heroMetaText || "");
      payload.append("isActive", String(Boolean(bannerForm.isActive)));
      payload.append("startsAt", bannerForm.startsAt || "");
      payload.append("endsAt", bannerForm.endsAt || "");
      if (bannerImageFile) {
        payload.append("image", bannerImageFile);
      }

      if (editingBannerId) {
        await api.updateBanner(editingBannerId, payload, token);
        setMessage("Banner updated successfully.");
      } else {
        await api.createBanner(payload, token);
        setMessage("Banner created successfully.");
      }

      setBannerForm(defaultBannerForm);
      setEditingBannerId("");
      setBannerImageFile(null);
      setBannerImagePreview("");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const editMenu = (item) => {
    setEditingMenuId(item._id);
    setMenuForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price || "",
      category: item.category || "",
      keywords: Array.isArray(item.keywords) ? item.keywords.join(", ") : "",
      rating: item.rating || 4.5,
      deliveryTime: item.deliveryTime || "25 mins",
      isAvailable: Boolean(item.isAvailable),
      isFeatured: Boolean(item.isFeatured),
      trackInventory: Boolean(item.trackInventory),
      stockQty: item.stockQty ?? 0,
      lowStockThreshold: item.lowStockThreshold ?? 5,
    });
    setMenuImageFile(null);
    setMenuImagePreview(item.image || "");
  };

  const editBanner = (banner) => {
    setEditingBannerId(banner._id);
    setBannerForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      image: banner.image || "",
      ctaText: banner.ctaText || "Order Now",
      ctaLink: banner.ctaLink || "#menu",
      targetCategory: banner.targetCategory || "",
      targetItem: banner.targetItem || "",
      heroBadgeText: banner.heroBadgeText || "Trending Tonight",
      heroTitleText: banner.heroTitleText || "",
      heroMetaText: banner.heroMetaText || "",
      isActive: Boolean(banner.isActive),
      startsAt: toDateTimeInputValue(banner.startsAt),
      endsAt: toDateTimeInputValue(banner.endsAt),
    });
    setBannerImageFile(null);
    setBannerImagePreview(banner.image || "");
  };

  const removeMenu = async (id) => {
    try {
      await api.deleteMenu(id, token);
      setMessage("Menu item removed.");
      setError("");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeBanner = async (id) => {
    try {
      await api.deleteBanner(id, token);
      setMessage("Banner removed.");
      setError("");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.updateOrderStatus(orderId, status, token);
      setMessage(`Order status set to ${statusLabel(status)}.`);
      setError("");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="page-shell admin-page">
      <section className="admin-hero">
        <div>
          <p className="eyebrow">Admin panel</p>
          <h1>Welcome back, {user?.name}</h1>
          <p>Manage inventory, orders, banner schedules and daily sales in one place.</p>
        </div>
        <div className="admin-stats">
          <article><strong>{stats.totalItems}</strong><span>total items</span></article>
          <article><strong>{stats.availableItems}</strong><span>live dishes</span></article>
          <article><strong>{stats.lowStockItems}</strong><span>low stock alerts</span></article>
          <article><strong>{stats.activeBanners}</strong><span>active banners</span></article>
          <article><strong>{dashboard.todayOrders}</strong><span>today orders</span></article>
          <article><strong>Rs.{dashboard.todayRevenue}</strong><span>today revenue</span></article>
        </div>
      </section>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <section className="admin-list-grid">
        <div className="admin-list-card">
          <div className="card-heading"><h2>Top selling items</h2></div>
          {dashboard.topItems?.length ? (
            dashboard.topItems.map((item) => (
              <article key={item.itemName} className="manage-row">
                <div>
                  <strong>{item.itemName}</strong>
                  <p>{item.quantitySold} sold | Rs.{item.revenue}</p>
                </div>
              </article>
            ))
          ) : (
            <p className="helper-text">No sales yet.</p>
          )}
        </div>
      </section>

      <section className="admin-grid">
        <form className="admin-card stack-form" onSubmit={saveMenu}>
          <div className="card-heading">
            <h2>{editingMenuId ? "Edit menu item" : "Add menu item"}</h2>
            {editingMenuId && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setEditingMenuId("");
                  setMenuForm(defaultMenuForm);
                  setMenuImageFile(null);
                  setMenuImagePreview("");
                }}
              >
                Cancel
              </button>
            )}
          </div>
          <label>Name<input value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} /></label>
          <label>Description<textarea rows="3" value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} /></label>
          <label>Category<input value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} /></label>
          <label>
            Keywords (comma separated)
            <input
              value={menuForm.keywords}
              onChange={(e) => setMenuForm({ ...menuForm, keywords: e.target.value })}
              placeholder="pizza, burger, spicy, chicken roll"
            />
          </label>
          <label>Price<input type="number" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} /></label>
          <label>
            Upload image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setMenuImageFile(file);
                if (file) setMenuImagePreview(URL.createObjectURL(file));
              }}
              required={!editingMenuId}
            />
          </label>
          {menuImagePreview && (
            <div className="menu-upload-preview">
              <p className="helper-text">Image preview</p>
              <img src={menuImagePreview} alt="Menu item preview" />
            </div>
          )}
          <label>Rating<input type="number" step="0.1" max="5" min="0" value={menuForm.rating} onChange={(e) => setMenuForm({ ...menuForm, rating: e.target.value })} /></label>
          <label>Delivery time<input value={menuForm.deliveryTime} onChange={(e) => setMenuForm({ ...menuForm, deliveryTime: e.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={menuForm.isAvailable} onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })} />Available</label>
          <label className="checkbox-row"><input type="checkbox" checked={menuForm.isFeatured} onChange={(e) => setMenuForm({ ...menuForm, isFeatured: e.target.checked })} />Featured</label>
          <label className="checkbox-row"><input type="checkbox" checked={menuForm.trackInventory} onChange={(e) => setMenuForm({ ...menuForm, trackInventory: e.target.checked })} />Track inventory</label>
          {menuForm.trackInventory && (
            <>
              <label>Stock quantity<input type="number" min="0" value={menuForm.stockQty} onChange={(e) => setMenuForm({ ...menuForm, stockQty: e.target.value })} /></label>
              <label>Low stock threshold<input type="number" min="0" value={menuForm.lowStockThreshold} onChange={(e) => setMenuForm({ ...menuForm, lowStockThreshold: e.target.value })} /></label>
            </>
          )}
          <button className="primary-button wide-button">{editingMenuId ? "Update menu" : "Add menu"}</button>
        </form>

        <form className="admin-card stack-form" onSubmit={saveBanner}>
          <div className="card-heading">
            <h2>{editingBannerId ? "Edit banner" : "Add banner"}</h2>
            {editingBannerId && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setEditingBannerId("");
                  setBannerForm(defaultBannerForm);
                  setBannerImageFile(null);
                  setBannerImagePreview("");
                }}
              >
                Cancel
              </button>
            )}
          </div>
          <label>Title<input value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} /></label>
          <label>Subtitle<textarea rows="3" value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} /></label>
          <label>
            Upload image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setBannerImageFile(file);
                if (file) setBannerImagePreview(URL.createObjectURL(file));
              }}
              required={!editingBannerId}
            />
          </label>
          {bannerImagePreview && (
            <div className="menu-upload-preview">
              <p className="helper-text">Banner preview</p>
              <img src={bannerImagePreview} alt="Banner preview" />
            </div>
          )}
          <label>CTA text<input value={bannerForm.ctaText} onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })} /></label>
          <label>CTA link<input value={bannerForm.ctaLink} onChange={(e) => setBannerForm({ ...bannerForm, ctaLink: e.target.value })} placeholder="#menu or https://..." /></label>
          <label>Target category<input value={bannerForm.targetCategory} onChange={(e) => setBannerForm({ ...bannerForm, targetCategory: e.target.value })} placeholder="Best Sellers, Wraps..." /></label>
          <label>Target item<input value={bannerForm.targetItem} onChange={(e) => setBannerForm({ ...bannerForm, targetItem: e.target.value })} placeholder="Butter Chicken Bowl..." /></label>
          <label>Hero badge text<input value={bannerForm.heroBadgeText} onChange={(e) => setBannerForm({ ...bannerForm, heroBadgeText: e.target.value })} placeholder="Trending Tonight" /></label>
          <label>Hero title text<input value={bannerForm.heroTitleText} onChange={(e) => setBannerForm({ ...bannerForm, heroTitleText: e.target.value })} placeholder="Any dish or message..." /></label>
          <label>Hero meta text<input value={bannerForm.heroMetaText} onChange={(e) => setBannerForm({ ...bannerForm, heroMetaText: e.target.value })} placeholder="20 mins delivery" /></label>
          <label>Start time<input type="datetime-local" value={bannerForm.startsAt} onChange={(e) => setBannerForm({ ...bannerForm, startsAt: e.target.value })} /></label>
          <label>End time<input type="datetime-local" value={bannerForm.endsAt} onChange={(e) => setBannerForm({ ...bannerForm, endsAt: e.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={bannerForm.isActive} onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })} />Banner active</label>
          <button className="primary-button wide-button">{editingBannerId ? "Update banner" : "Add banner"}</button>
        </form>
      </section>

      <section className="admin-list-grid">
        <div className="admin-list-card">
          <div className="card-heading"><h2>Current menu</h2></div>
          {menu.map((item) => {
            const lowStock = item.trackInventory && item.stockQty <= (item.lowStockThreshold ?? 5);
            return (
              <article key={item._id} className="manage-row">
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.category} | Rs.{item.price}</p>
                  {item.trackInventory && (
                    <p className={lowStock ? "error-text" : "helper-text"}>
                      Stock: {item.stockQty} | Low stock alert at {item.lowStockThreshold}
                    </p>
                  )}
                </div>
                <div className="row-actions">
                  <button type="button" className="text-button" onClick={() => editMenu(item)}>Edit</button>
                  <button type="button" className="text-button danger" onClick={() => removeMenu(item._id)}>Delete</button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="admin-list-card">
          <div className="card-heading"><h2>Current banners</h2></div>
          {banners.map((banner) => (
            <article key={banner._id} className="manage-row">
              <div>
                <strong>{banner.title}</strong>
                <p>
                  {banner.ctaText} | {banner.targetItem || banner.targetCategory || "No target"} |{" "}
                  {banner.isCurrentlyLive ? "Live now" : "Not live"}
                </p>
                <p className="helper-text">
                  {banner.startsAt ? `Starts: ${new Date(banner.startsAt).toLocaleString()}` : "Starts: Immediate"} |{" "}
                  {banner.endsAt ? `Ends: ${new Date(banner.endsAt).toLocaleString()}` : "Ends: No end date"}
                </p>
              </div>
              <div className="row-actions">
                <button type="button" className="text-button" onClick={() => editBanner(banner)}>Edit</button>
                <button type="button" className="text-button danger" onClick={() => removeBanner(banner._id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-list-grid">
        <div className="admin-list-card">
          <div className="card-heading"><h2>Order management</h2></div>
          {orders.map((order) => (
            <article key={order._id} className="manage-row">
              <div>
                <strong>{order.itemName} x {order.quantity}</strong>
                <p>Rs.{order.totalPrice} | {statusLabel(order.status)}</p>
                <p className="helper-text">
                  {order.deliverySlotType === "scheduled" && order.scheduledFor
                    ? `Scheduled: ${new Date(order.scheduledFor).toLocaleString()}`
                    : "ASAP"}
                </p>
              </div>
              <div className="row-actions">
                <select
                  value={order.status}
                  onChange={(event) => updateStatus(order._id, event.target.value)}
                >
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
