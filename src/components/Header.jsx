import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import logoMark from "../assets/saha-food-mark.svg";
import { reverseGeocodeLocation } from "../utils/location";

const USER_LOCATION_KEY = "saha_food_user_location_city";
const USER_PINCODE_KEY = "saha_food_user_location_pincode";
const USER_LOCATION_LABEL_KEY = "saha_food_user_location_label";
const USER_LOCATION_SUBTITLE_KEY = "saha_food_user_location_subtitle";

export function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");
  const [locationSubtitle, setLocationSubtitle] = useState("");
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const isAdmin = user?.role === "admin";

  const syncLocationFromStorage = () => {
    const label = localStorage.getItem(USER_LOCATION_LABEL_KEY) || "";
    const subtitle = localStorage.getItem(USER_LOCATION_SUBTITLE_KEY) || "";
    const city = localStorage.getItem(USER_LOCATION_KEY) || "";
    const pincode = localStorage.getItem(USER_PINCODE_KEY) || "";

    setLocationLabel(label || city || "Set location");
    setLocationSubtitle(subtitle || [city, pincode].filter(Boolean).join(", "));
  };

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation || isLocationLoading) return;
    setIsLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const location = await reverseGeocodeLocation(latitude, longitude);
          const label = location.label || "Current location";
          const subtitle = location.subtitle || [location.area, location.city, location.state].filter(Boolean).join(", ");

          localStorage.setItem(USER_LOCATION_LABEL_KEY, label);
          localStorage.setItem(USER_LOCATION_SUBTITLE_KEY, subtitle);
          if (location.city) localStorage.setItem(USER_LOCATION_KEY, location.city);
          if (location.pincode) localStorage.setItem(USER_PINCODE_KEY, location.pincode);
          window.dispatchEvent(new Event("saha-location-updated"));

          setLocationLabel(label);
          setLocationSubtitle(subtitle);
        } catch (_error) {
          // Keep silent to avoid noisy UI in header.
        } finally {
          setIsLocationLoading(false);
        }
      },
      () => {
        setIsLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    setIsMenuOpen(false);
    syncLocationFromStorage();
  }, [pathname]);

  useEffect(() => {
    syncLocationFromStorage();
    if (!localStorage.getItem(USER_LOCATION_LABEL_KEY) && !localStorage.getItem(USER_LOCATION_KEY)) {
      fetchCurrentLocation();
    }

    const onStorage = (event) => {
      if (
        [
          USER_LOCATION_KEY,
          USER_PINCODE_KEY,
          USER_LOCATION_LABEL_KEY,
          USER_LOCATION_SUBTITLE_KEY,
        ].includes(event.key)
      ) {
        syncLocationFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand-mark">
          <img src={logoMark} alt="Saha Food logo" />
          <div>
            <span>Saha Food</span>
            <small>Cloud Kitchen</small>
          </div>
        </Link>

        <button
          type="button"
          className="header-location-chip"
          onClick={fetchCurrentLocation}
          title="Use my current location"
        >
          <span className="location-title">
            <span className="pin-icon">&#128205;</span>
            {isLocationLoading ? "Fetching location..." : (locationLabel || "Set location")}
            <span className="location-caret">&#9662;</span>
          </span>
          <span className="location-subtitle">{locationSubtitle || "Tap to detect your location"}</span>
        </button>

        <nav className="nav-links desktop-nav">
          <NavLink to="/">Home</NavLink>
          {user && <NavLink to="/profile">Profile</NavLink>}
          {user && <NavLink to="/orders">My Orders</NavLink>}
          {user && (
            <NavLink to="/cart" className="cart-link">
              Cart
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </NavLink>
          )}
          {isAdmin && <NavLink to="/admin">Admin Panel</NavLink>}
        </nav>

        <div className="nav-actions desktop-actions">
          {user ? (
            <>
              <div className="user-pill">
                <div>
                  <strong>{user.name}</strong>
                </div>
              </div>
              <button className="ghost-button" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="ghost-button">Login</Link>
              <Link to="/register" className="primary-button">Create Account</Link>
            </>
          )}
        </div>

        <button
          className={`hamburger-toggle ${isMenuOpen ? "open" : ""}`}
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <div
        className={`mobile-nav-overlay ${isMenuOpen ? "open" : ""}`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden={!isMenuOpen}
      />

      <aside className={`mobile-nav-drawer ${isMenuOpen ? "open" : ""}`} aria-hidden={!isMenuOpen}>
        <div className="mobile-drawer-head">
          <strong>Navigation</strong>
          <button type="button" className="text-button" onClick={() => setIsMenuOpen(false)}>Close</button>
        </div>

        <nav className="mobile-nav-links">
          <NavLink to="/">Home</NavLink>
          {user && <NavLink to="/profile">Profile</NavLink>}
          {user && <NavLink to="/orders">My Orders</NavLink>}
          {user && (
            <NavLink to="/cart" className="cart-link">
              Cart
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </NavLink>
          )}
          {isAdmin && <NavLink to="/admin">Admin Panel</NavLink>}
        </nav>

        <div className="mobile-nav-actions">
          {user ? (
            <>
              <div className="user-pill">
                <div>
                  <strong>{user.name}</strong>
                </div>
              </div>
              <button className="ghost-button wide-button" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="ghost-button wide-button">Login</Link>
              <Link to="/register" className="primary-button wide-button">Create Account</Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
