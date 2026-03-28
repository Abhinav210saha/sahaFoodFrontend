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

const formatCurrency = (value) => `Rs.${Number(value || 0).toFixed(2)}`;

export function OrdersPage() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const visibleOrders = orders.filter((order) =>
    order.itemName.toLowerCase().includes(search.trim().toLowerCase())
  );

  const getBillSummary = (order) => {
    const itemTotal = Number(order.totalPrice || 0);
    const gst = itemTotal * 0.12;
    const deliveryFee = 32;
    const platformFee = 12.5;
    const convenienceFee = 19;
    const discount = deliveryFee;
    const payable = itemTotal + gst + platformFee + convenienceFee;
    return { itemTotal, gst, deliveryFee, platformFee, convenienceFee, discount, payable };
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

      <section className="admin-list-grid orders-layout">
        <div className="admin-list-card order-list-card">
          <div className="card-heading"><h2>Your orders</h2></div>
          <input
            className="search-input"
            placeholder="Search by dish"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {loading && <p>Loading orders...</p>}
          {!loading && visibleOrders.length === 0 && <p className="helper-text">No orders yet.</p>}
          {!loading && visibleOrders.map((order) => (
            <article key={order._id} className="manage-row order-card-row">
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
                  onClick={() => setSelectedOrder(order)}
                >
                  View details
                </button>
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

        <div className="admin-list-card order-details-card">
          <div className="card-heading">
            <h2>Order details</h2>
          </div>
          {!selectedOrder ? (
            <p className="helper-text">Select an order to view full details.</p>
          ) : (
            <>
              <article className="order-status-pill">
                Order is {statusLabel(selectedOrder.status).toLowerCase()}
              </article>
              <article className="order-details-block">
                <strong>{selectedOrder.itemName} x {selectedOrder.quantity}</strong>
                <p>Order ID: #{selectedOrder._id?.slice(-10)}</p>
                <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </article>
              <article className="order-details-block">
                <strong>Bill Summary</strong>
                {(() => {
                  const bill = getBillSummary(selectedOrder);
                  return (
                    <div className="bill-grid">
                      <span>Item total</span><span>{formatCurrency(bill.itemTotal)}</span>
                      <span>GST & packaging</span><span>{formatCurrency(bill.gst)}</span>
                      <span>Delivery partner fee</span><span><s>{formatCurrency(bill.deliveryFee)}</s> FREE</span>
                      <span>Platform fee</span><span>{formatCurrency(bill.platformFee)}</span>
                      <span>Convenience fee</span><span>{formatCurrency(bill.convenienceFee)}</span>
                      <strong>Paid</strong><strong>{formatCurrency(bill.payable)}</strong>
                    </div>
                  );
                })()}
              </article>
              <article className="order-details-block">
                <strong>{user?.name || "Customer"}</strong>
                <p>{user?.phone || "No phone"}</p>
                <p><strong>Address:</strong> {formatAddress(selectedOrder.address)}</p>
              </article>
              <button type="button" className="ghost-button wide-button">
                Invoice
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
