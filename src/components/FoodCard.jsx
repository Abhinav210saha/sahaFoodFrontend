import { Link } from "react-router-dom";
import { useState } from "react";
export function FoodCard({ item, user, onOrder, onAddToCart, orderingItemId }) {
  const [quantity, setQuantity] = useState(1);

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
                onClick={() => onOrder(item, quantity)}
                disabled={orderingItemId === item._id}
              >
                {orderingItemId === item._id ? "Placing Order..." : "Order On WhatsApp"}
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
