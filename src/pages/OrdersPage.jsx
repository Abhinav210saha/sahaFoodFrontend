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

const timelineSteps = ["placed", "preparing", "out_for_delivery", "delivered"];

const statusLabel = (status) =>
  status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export function OrdersPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    const data = await api.getMyOrders(token);
    setOrders(data);
  };

  useEffect(() => {
    loadOrders().finally(() => setLoading(false));
  }, [token]);

  const handleDeleteOrder = async (orderId) => {
    const confirmed = window.confirm("Delete this order from your history?");
    if (!confirmed) return;

    try {
      await api.deleteMyOrder(orderId, token);
      await loadOrders();
      showToast("Order deleted from history.", "success");
    } catch (error) {
      showToast(error.message || "Failed to delete order.", "error");
    }
  };

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

  return (
    <main className="page-shell">
      <section className="admin-hero">
        <div>
          <p className="eyebrow">Order History</p>
          <h1>Track your previous orders</h1>
          <p>Every order placed from cards is stored here with selected delivery address details.</p>
        </div>
      </section>

      <section className="admin-list-grid">
        <div className="admin-list-card">
          <div className="card-heading"><h2>Your orders</h2></div>
          {loading && <p>Loading orders...</p>}
          {!loading && orders.length === 0 && <p className="helper-text">No orders yet.</p>}
          {!loading && orders.map((order) => (
            <article key={order._id} className="manage-row">
              <div>
                <strong>{order.itemName} x {order.quantity}</strong>
                <p>
                  Rs.{order.totalPrice} | {statusLabel(order.status)} | {new Date(order.createdAt).toLocaleString()}
                </p>
                <p>
                  <strong>Slot:</strong>{" "}
                  {order.deliverySlotType === "scheduled" && order.scheduledFor
                    ? `Scheduled (${new Date(order.scheduledFor).toLocaleString()})`
                    : "ASAP"}
                </p>
                <p><strong>Address:</strong> {formatAddress(order.address)}</p>
                <div className="order-timeline">
                  {timelineSteps.map((step) => {
                    const currentIndex = timelineSteps.indexOf(order.status);
                    const stepIndex = timelineSteps.indexOf(step);
                    const isDone = currentIndex >= stepIndex && order.status !== "cancelled";
                    return (
                      <span key={step} className={isDone ? "timeline-step done" : "timeline-step"}>
                        {statusLabel(step)}
                      </span>
                    );
                  })}
                  {order.status === "cancelled" && <span className="timeline-step cancelled">Cancelled</span>}
                </div>
              </div>
              <div className="row-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => handleReorder(order)}
                >
                  Reorder
                </button>
                <button
                  type="button"
                  className="text-button danger"
                  onClick={() => handleDeleteOrder(order._id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
