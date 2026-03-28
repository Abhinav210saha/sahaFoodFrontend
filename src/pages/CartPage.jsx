import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { loadRazorpaySdk } from "../utils/razorpay";

const adminWhatsapp = (import.meta.env.VITE_ADMIN_WHATSAPP || "916202173133").replace(/\D/g, "");

const formatAddress = (address) =>
  [address.line1, address.line2, `${address.city}, ${address.state} - ${address.pincode}`, address.landmark]
    .filter(Boolean)
    .join(", ");

export function CartPage() {
  const { token, user } = useAuth();
  const { items, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart();
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [deliverySlotType, setDeliverySlotType] = useState("asap");
  const [scheduledFor, setScheduledFor] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    api
      .getAddresses(token)
      .then((data) => {
        setAddresses(data);
        const preferred = data.find((address) => address.isDefault) || data[0];
        setSelectedAddressId(preferred?._id || "");
      })
      .catch(() => setAddresses([]));
  }, [token]);

  const selectedAddress = useMemo(
    () => addresses.find((address) => String(address._id) === String(selectedAddressId)),
    [addresses, selectedAddressId]
  );

  const placeCartOrder = async () => {
    if (!items.length) {
      showToast("Cart is empty.", "warning");
      return;
    }
    if (!selectedAddressId) {
      showToast("Please select an address before checkout.", "warning");
      return;
    }
    if (deliverySlotType === "scheduled" && !scheduledFor) {
      showToast("Please choose a scheduled delivery time.", "warning");
      return;
    }
    setPlacing(true);
    try {
      let paymentPayload = { paymentMethod: "cod", paymentStatus: "pending", paymentId: "" };
      if (paymentMethod === "online") {
        const sdkLoaded = await loadRazorpaySdk();
        if (!sdkLoaded) {
          showToast("Unable to load payment gateway.", "error");
          return;
        }

        const paymentOrder = await api.createPaymentOrder(totalAmount, token);

        const paymentResult = await new Promise((resolve, reject) => {
          const razorpay = new window.Razorpay({
            key: paymentOrder.keyId,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            order_id: paymentOrder.orderId,
            name: "Saha Food",
            description: "Food order payment",
            prefill: {
              name: user?.name || "",
              email: user?.email || "",
              contact: user?.phone || "",
            },
            handler: async (response) => {
              try {
                await api.verifyPayment(response, token);
                resolve(response);
              } catch (error) {
                reject(error);
              }
            },
            modal: {
              ondismiss: () => reject(new Error("Payment cancelled")),
            },
          });

          razorpay.open();
        });

        paymentPayload = {
          paymentMethod: "online",
          paymentStatus: "paid",
          paymentId: paymentResult.razorpay_payment_id,
        };
      }

      const result = await api.placeBulkOrder(
        {
          addressId: selectedAddressId,
          ...paymentPayload,
          items: items.map((item) => ({
            menuItemId: item.menuItemId || item._id,
            itemName: item.name,
            itemPrice: item.price,
            quantity: item.quantity,
            deliveryTime: item.deliveryTime,
            deliverySlotType,
            scheduledFor: deliverySlotType === "scheduled" ? scheduledFor : undefined,
          })),
        },
        token
      );

      const whatsappUrl = `https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(result.whatsappMessage)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      clearCart();
      showToast("Cart order placed and sent on WhatsApp.", "success");
    } catch (error) {
      showToast(error.message || "Failed to place cart order.", "error");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="admin-hero">
        <div>
          <p className="eyebrow">Cart</p>
          <h1>Checkout multiple foods at once</h1>
          <p>Select delivery address and place all selected dishes in one order.</p>
        </div>
      </section>

      <section className="admin-grid">
        <div className="admin-card">
          <div className="card-heading">
            <h2>Cart items</h2>
          </div>
          {!items.length && <p className="helper-text">Your cart is empty.</p>}
          {items.map((item) => (
            <article key={item._id} className="manage-row">
              <div>
                <strong>{item.name}</strong>
                <p>Rs.{item.price} each</p>
              </div>
              <div className="cart-actions">
                <button type="button" className="qty-btn" onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</button>
                <strong>{item.quantity}</strong>
                <button type="button" className="qty-btn" onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                <span className="qty-total">Rs.{item.price * item.quantity}</span>
                <button type="button" className="text-button danger" onClick={() => removeFromCart(item._id)}>Remove</button>
              </div>
            </article>
          ))}
        </div>

        <div className="admin-card stack-form">
          <h2>Checkout</h2>
          {addresses.length > 0 ? (
            <label>
              Select address
              <select value={selectedAddressId} onChange={(event) => setSelectedAddressId(event.target.value)}>
                <option value="">Select address</option>
                {addresses.map((address) => (
                  <option key={address._id} value={address._id}>
                    {address.label} - {address.city}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="menu-upload-preview">
              <p className="helper-text">
                No saved address found. Add an address before placing checkout order.
              </p>
              <Link className="ghost-button" to="/profile">Manage addresses</Link>
            </div>
          )}
          <label>
            Delivery slot
            <select value={deliverySlotType} onChange={(event) => setDeliverySlotType(event.target.value)}>
              <option value="asap">ASAP</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </label>
          <label>
            Payment method
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value="cod">Cash on Delivery</option>
              <option value="online">Pay Online (Razorpay)</option>
            </select>
          </label>
          {deliverySlotType === "scheduled" && (
            <label>
              Scheduled time
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
              />
            </label>
          )}
          <p className="helper-text">{selectedAddress ? formatAddress(selectedAddress) : "No address selected"}</p>
          <Link className="text-button" to="/profile">Manage addresses</Link>
          <p><strong>Total: Rs.{totalAmount}</strong></p>
          <button type="button" className="primary-button wide-button" disabled={placing} onClick={placeCartOrder}>
            {placing ? "Placing Order..." : "Place Cart Order"}
          </button>
          <button type="button" className="ghost-button wide-button" onClick={clearCart}>Clear Cart</button>
        </div>
      </section>
    </main>
  );
}
