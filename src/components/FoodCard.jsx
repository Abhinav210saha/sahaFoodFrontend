import { Link } from "react-router-dom";
import { useState } from "react";
export function FoodCard({ item, user, onOrder, onAddToCart, orderingItemId }) {
  const [quantity, setQuantity] = useState(1);
  const [quickPaymentMethod, setQuickPaymentMethod] = useState("cod");

  return (
    <article className="food-card">
      <img src={item.image} alt={item.name} />
      <div className="food-card-body">
        <div className="food-meta-row">
          <span className="pill-tag">{item.category}</span>
          <span className="rating-chip">{item.rating}* rating</span>
        </div>
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <div className="food-footer-row">
          <strong>Rs.{item.price}</strong>
          <span>{item.deliveryTime}</span>
        </div>
        {item.trackInventory && (
          <p className={item.stockQty <= (item.lowStockThreshold ?? 5) ? "error-text" : "helper-text"}>
            {item.stockQty <= (item.lowStockThreshold ?? 5)
              ? `Low stock: only ${item.stockQty} left`
              : `In stock: ${item.stockQty}`}
          </p>
        )}
        <div className="qty-row">
          <span>Qty</span>
          <button type="button" className="qty-btn" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
          <strong>{quantity}</strong>
          <button type="button" className="qty-btn" onClick={() => setQuantity((q) => Math.min(20, q + 1))}>+</button>
          <span className="qty-total">Total Rs.{item.price * quantity}</span>
        </div>
        <div className="food-actions">
          {user ? (
            <>
              <select
                value={quickPaymentMethod}
                onChange={(event) => setQuickPaymentMethod(event.target.value)}
                className="address-select"
                aria-label="Quick order payment method"
              >
                <option value="cod">Cash on Delivery</option>
                <option value="online">Pay Online</option>
              </select>
              <button
                type="button"
                className="ghost-button order-button"
                onClick={() => onAddToCart(item, quantity)}
              >
                Add To Cart
              </button>
              <button
                type="button"
                className="primary-button order-button"
                onClick={() => onOrder(item, quantity, quickPaymentMethod)}
                disabled={orderingItemId === item._id}
              >
                {orderingItemId === item._id ? "Placing Order..." : "Quick Order"}
              </button>
            </>
          ) : (
            <Link className="ghost-button order-button" to="/login">
              Login To Order
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
