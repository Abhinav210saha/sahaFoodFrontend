import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useCart } from "../context/CartContext";

const formatAddress = (address) =>
  [address.line1, address.line2, `${address.city}, ${address.state} - ${address.pincode}`, address.landmark]
    .filter(Boolean)
    .join(", ");

const statusLabel = (status) =>
  status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const statusFlow = ["placed", "preparing", "out_for_delivery", "delivered"];

export function OrdersPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadOrders = async () => {
    const data = await api.getMyOrders(token);
    setOrders(data);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchInitial = async () => {
      try {
        const data = await api.getMyOrders(token);
        if (isMounted) setOrders(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const poll = async () => {
      try {
        const data = await api.getMyOrders(token);
        if (isMounted) setOrders(data);
      } catch {
        // Silent polling failure to avoid noisy UX.
      }
    };

    fetchInitial();
    const timer = setInterval(poll, 15000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [token]);

  const handleReorder = (order) => {
    const cartId = `reorder-${order.itemName}-${order.itemPrice}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
    addToCart(
      {
        _id: cartId,
        menuItemId: order.menuItem || order._id,
        name: order.itemName,
        price: order.itemPrice,
        deliveryTime: order.deliveryTime,
      },
      order.quantity
    );
    showToast(`${order.itemName} added to cart for reorder.`, "success");
    navigate("/cart");
  };

  const visibleOrders = orders.filter((order) =>
    order.itemName.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleRateOrder = () => {
    showToast("Rating feature coming soon.", "info");
  };

  return (
    <main className="page-shell orders-page">
      <section className="admin-hero">
        <div>
          <p className="eyebrow">Order History</p>
          <h1>Track your previous orders</h1>
          <p>Every order placed from cards is stored here with selected delivery address details.</p>
        </div>
      </section>

      <section className="admin-list-grid">
        <div className="admin-list-card order-list-card">
          <div className="card-heading"><h2>Your orders</h2></div>
          <input
            className="search-input"
            placeholder="Search by restaurant or dish"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {loading && <p>Loading orders...</p>}
          {!loading && visibleOrders.length === 0 && <p className="helper-text">No orders yet.</p>}
          {!loading && visibleOrders.map((order) => (
            <article key={order._id} className="order-card-v2">
              <div>
                <div className="order-card-v2-top">
                  <div>
                    <strong>Order {statusLabel(order.status).toLowerCase()}</strong>
                    <p className="helper-text">
                      Placed at {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <strong>Rs.{order.totalPrice}</strong>
                </div>
                <div className="order-items-strip">
                  <div className="order-thumb">{order.itemName?.[0] || "F"}</div>
                  <div>
                    <strong>{order.itemName}</strong>
                    <p className="helper-text">x {order.quantity} | {order.deliverySlotType === "scheduled" ? "Scheduled" : "ASAP"}</p>
                  </div>
                </div>
                <div className="order-status-track">
                  {statusFlow.map((step) => {
                    const currentIndex = statusFlow.indexOf(order.status);
                    const stepIndex = statusFlow.indexOf(step);
                    const isDone = currentIndex >= stepIndex && order.status !== "cancelled";
                    return (
                      <span key={step} className={isDone ? "status-step done" : "status-step"}>
                        {statusLabel(step)}
                      </span>
                    );
                  })}
                  {order.status === "cancelled" && <span className="status-step cancelled">Cancelled</span>}
                </div>
                <p className="helper-text"><strong>Address:</strong> {formatAddress(order.address)}</p>
              </div>
              <div className="order-card-v2-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={handleRateOrder}
                >
                  Rate Order
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => handleReorder(order)}
                >
                  Order Again
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
