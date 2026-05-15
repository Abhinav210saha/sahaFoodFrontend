import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export function MobileBottomNav() {
  const { user } = useAuth();
  const { totalItems } = useCart();

  if (!user) return null;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
      <NavLink to="/" end className="mobile-bottom-item">
        <span className="mobile-bottom-icon">🏠</span>
        <span>Home</span>
      </NavLink>
      <a href="#menu" className="mobile-bottom-item">
        <span className="mobile-bottom-icon">🍽️</span>
        <span>Categories</span>
      </a>
      <NavLink to="/orders" className="mobile-bottom-item">
        <span className="mobile-bottom-icon">🧾</span>
        <span>My Orders</span>
      </NavLink>
      <NavLink to="/cart" className="mobile-bottom-item mobile-bottom-cart">
        <span className="mobile-bottom-icon">🛍️</span>
        <span>Cart</span>
        {totalItems > 0 && <em>{totalItems}</em>}
      </NavLink>
    </nav>
  );
}

