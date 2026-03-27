import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const defaultMenuForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  image: "",
  rating: 4.5,
  deliveryTime: "25 mins",
  isAvailable: true,
  isFeatured: false,
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
};

export function AdminPage() {
  const { token, user } = useAuth();
  const [menu, setMenu] = useState([]);
  const [banners, setBanners] = useState([]);
  const [menuForm, setMenuForm] = useState(defaultMenuForm);
  const [bannerForm, setBannerForm] = useState(defaultBannerForm);
  const [editingMenuId, setEditingMenuId] = useState("");
  const [editingBannerId, setEditingBannerId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    const [menuData, bannerData] = await Promise.all([api.getMenu(), api.getBanners()]);
    setMenu(menuData);
    setBanners(bannerData);
  };

  useEffect(() => {
    loadData().catch((err) => setError(err.message));
  }, []);

  const stats = useMemo(
    () => ({
      totalItems: menu.length,
      availableItems: menu.filter((item) => item.isAvailable).length,
      activeBanners: banners.filter((banner) => banner.isActive).length,
    }),
    [menu, banners]
  );

  const saveMenu = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const payload = { ...menuForm, price: Number(menuForm.price), rating: Number(menuForm.rating) };
      if (editingMenuId) {
        await api.updateMenu(editingMenuId, payload, token);
        setMessage("Menu item updated successfully.");
      } else {
        await api.createMenu(payload, token);
        setMessage("Menu item created successfully.");
      }

      setMenuForm(defaultMenuForm);
      setEditingMenuId("");
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
      if (editingBannerId) {
        await api.updateBanner(editingBannerId, bannerForm, token);
        setMessage("Banner updated successfully.");
      } else {
        await api.createBanner(bannerForm, token);
        setMessage("Banner created successfully.");
      }

      setBannerForm(defaultBannerForm);
      setEditingBannerId("");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const editMenu = (item) => {
    setEditingMenuId(item._id);
    setMenuForm(item);
  };

  const editBanner = (banner) => {
    setEditingBannerId(banner._id);
    setBannerForm(banner);
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

  return (
    <main className="page-shell admin-page">
      <section className="admin-hero">
        <div>
          <p className="eyebrow">Admin panel</p>
          <h1>Welcome back, {user?.name}</h1>
          <p>Only admin users can update public banners and the food menu from this dashboard.</p>
        </div>
        <div className="admin-stats">
          <article><strong>{stats.totalItems}</strong><span>total items</span></article>
          <article><strong>{stats.availableItems}</strong><span>live dishes</span></article>
          <article><strong>{stats.activeBanners}</strong><span>active banners</span></article>
        </div>
      </section>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <section className="admin-grid">
        <form className="admin-card stack-form" onSubmit={saveMenu}>
          <div className="card-heading">
            <h2>{editingMenuId ? "Edit menu item" : "Add menu item"}</h2>
            {editingMenuId && <button type="button" className="text-button" onClick={() => { setEditingMenuId(""); setMenuForm(defaultMenuForm); }}>Cancel</button>}
          </div>
          <label>Name<input value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} /></label>
          <label>Description<textarea rows="3" value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} /></label>
          <label>Category<input value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} /></label>
          <label>Price<input type="number" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} /></label>
          <label>Image URL<input value={menuForm.image} onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })} /></label>
          <label>Rating<input type="number" step="0.1" max="5" min="0" value={menuForm.rating} onChange={(e) => setMenuForm({ ...menuForm, rating: e.target.value })} /></label>
          <label>Delivery time<input value={menuForm.deliveryTime} onChange={(e) => setMenuForm({ ...menuForm, deliveryTime: e.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={menuForm.isAvailable} onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })} />Available</label>
          <label className="checkbox-row"><input type="checkbox" checked={menuForm.isFeatured} onChange={(e) => setMenuForm({ ...menuForm, isFeatured: e.target.checked })} />Featured</label>
          <button className="primary-button wide-button">{editingMenuId ? "Update menu" : "Add menu"}</button>
        </form>

        <form className="admin-card stack-form" onSubmit={saveBanner}>
          <div className="card-heading">
            <h2>{editingBannerId ? "Edit banner" : "Add banner"}</h2>
            {editingBannerId && <button type="button" className="text-button" onClick={() => { setEditingBannerId(""); setBannerForm(defaultBannerForm); }}>Cancel</button>}
          </div>
          <label>Title<input value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} /></label>
          <label>Subtitle<textarea rows="3" value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} /></label>
          <label>Image URL<input value={bannerForm.image} onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })} /></label>
          <label>CTA text<input value={bannerForm.ctaText} onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })} /></label>
          <label>CTA link<input value={bannerForm.ctaLink} onChange={(e) => setBannerForm({ ...bannerForm, ctaLink: e.target.value })} placeholder="#menu or https://..." /></label>
          <label>Target category<input value={bannerForm.targetCategory} onChange={(e) => setBannerForm({ ...bannerForm, targetCategory: e.target.value })} placeholder="Best Sellers, Wraps..." /></label>
          <label>Target item<input value={bannerForm.targetItem} onChange={(e) => setBannerForm({ ...bannerForm, targetItem: e.target.value })} placeholder="Butter Chicken Bowl..." /></label>
          <label>Hero badge text<input value={bannerForm.heroBadgeText} onChange={(e) => setBannerForm({ ...bannerForm, heroBadgeText: e.target.value })} placeholder="Trending Tonight" /></label>
          <label>Hero title text<input value={bannerForm.heroTitleText} onChange={(e) => setBannerForm({ ...bannerForm, heroTitleText: e.target.value })} placeholder="Any dish or message..." /></label>
          <label>Hero meta text<input value={bannerForm.heroMetaText} onChange={(e) => setBannerForm({ ...bannerForm, heroMetaText: e.target.value })} placeholder="20 mins delivery" /></label>
          <label className="checkbox-row"><input type="checkbox" checked={bannerForm.isActive} onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })} />Banner active</label>
          <button className="primary-button wide-button">{editingBannerId ? "Update banner" : "Add banner"}</button>
        </form>
      </section>

      <section className="admin-list-grid">
        <div className="admin-list-card">
          <div className="card-heading"><h2>Current menu</h2></div>
          {menu.map((item) => (
            <article key={item._id} className="manage-row">
              <div>
                <strong>{item.name}</strong>
                <p>{item.category} | Rs.{item.price}</p>
              </div>
              <div className="row-actions">
                <button type="button" className="text-button" onClick={() => editMenu(item)}>Edit</button>
                <button type="button" className="text-button danger" onClick={() => removeMenu(item._id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>

        <div className="admin-list-card">
          <div className="card-heading"><h2>Current banners</h2></div>
          {banners.map((banner) => (
            <article key={banner._id} className="manage-row">
              <div>
                <strong>{banner.title}</strong>
                <p>{banner.ctaText} | {banner.targetItem || banner.targetCategory || "No target"} | {banner.heroBadgeText || "Trending"} | {banner.isActive ? "Active" : "Hidden"}</p>
              </div>
              <div className="row-actions">
                <button type="button" className="text-button" onClick={() => editBanner(banner)}>Edit</button>
                <button type="button" className="text-button danger" onClick={() => removeBanner(banner._id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
