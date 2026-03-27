import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import logoMark from "../assets/saha-food-mark.svg";

export function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();

  return (
    <header className="site-header">
      <Link to="/" className="brand-mark">
        <img src={logoMark} alt="Saha Food logo" />
        <div>
          <span>Saha Food</span>
          <small>Cloud Kitchen</small>
        </div>
      </Link>

      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        {user && <NavLink to="/profile">Profile</NavLink>}
        {user && <NavLink to="/orders">My Orders</NavLink>}
        {user && (
          <NavLink to="/cart" className="cart-link">
            Cart
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </NavLink>
        )}
        {user?.role === "admin" && <NavLink to="/admin">Admin Panel</NavLink>}
      </nav>

      <div className="nav-actions">
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
    </header>
  );
}
