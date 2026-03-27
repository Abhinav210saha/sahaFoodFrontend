import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

const adminWhatsapp = (import.meta.env.VITE_ADMIN_WHATSAPP || "916202173133").replace(/\D/g, "");

const formatAddress = (address) =>
  [address.line1, address.line2, `${address.city}, ${address.state} - ${address.pincode}`, address.landmark]
    .filter(Boolean)
    .join(", ");

export function CartPage() {
  const { token } = useAuth();
  const { items, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart();
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
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
    setPlacing(true);
    try {
      const result = await api.placeBulkOrder(
        {
          addressId: selectedAddressId,
          items: items.map((item) => ({
            itemName: item.name,
            itemPrice: item.price,
            quantity: item.quantity,
            deliveryTime: item.deliveryTime,
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
          <p className="helper-text">{selectedAddress ? formatAddress(selectedAddress) : "No address selected"}</p>
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
