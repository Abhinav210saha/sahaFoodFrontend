import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import logoMark from "../assets/saha-food-mark.svg";

export function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

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
