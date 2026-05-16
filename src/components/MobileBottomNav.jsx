import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export function MobileBottomNav() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const onCategoriesClick = (event) => {
    event.preventDefault();
    if (location.pathname === "/") {
      const menuSection = document.getElementById("menu");
      if (menuSection) {
        menuSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    navigate("/", { state: { openCategories: true } });
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
      <NavLink to="/" end className="mobile-bottom-item">
        <span className="mobile-bottom-icon">{"\u{1F3E0}"}</span>
        <span>Home</span>
      </NavLink>
      <a href="/#menu" className="mobile-bottom-item" onClick={onCategoriesClick}>
        <span className="mobile-bottom-icon">{"\u{1F37D}\uFE0F"}</span>
        <span>Categories</span>
      </a>
      <NavLink to="/orders" className="mobile-bottom-item">
        <span className="mobile-bottom-icon">{"\u{1F9FE}"}</span>
        <span>My Orders</span>
      </NavLink>
      <NavLink to="/cart" className="mobile-bottom-item mobile-bottom-cart">
        <span className="mobile-bottom-icon">{"\u{1F6CD}\uFE0F"}</span>
        <span>Cart</span>
        {totalItems > 0 && <em>{totalItems}</em>}
      </NavLink>
    </nav>
  );
}
