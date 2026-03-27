import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const emptyAddress = {
  label: "Home",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  isDefault: false,
};

export function ProfilePage() {
  const { token, user, setUser } = useAuth();
  const { showToast } = useToast();
  const [profileForm, setProfileForm] = useState({ name: user?.name || "" });
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(emptyAddress);

  const loadAddresses = async () => {
    const data = await api.getAddresses(token);
    setAddresses(data);
  };

  useEffect(() => {
    if (token) {
      loadAddresses().catch(() => setAddresses([]));
    }
  }, [token]);

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      const updatedUser = await api.updateProfile({ name: profileForm.name }, token);
      setUser(updatedUser);
      showToast("Profile updated.", "success");
    } catch (err) {
      showToast(err.message || "Failed to update profile.", "error");
    }
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    const payload = {
      label: (addressForm.label || "Home").trim(),
      line1: (addressForm.line1 || "").trim(),
      line2: (addressForm.line2 || "").trim(),
      city: (addressForm.city || "").trim(),
      state: (addressForm.state || "").trim(),
      pincode: (addressForm.pincode || "").trim(),
      landmark: (addressForm.landmark || "").trim(),
      isDefault: Boolean(addressForm.isDefault),
    };

    if (!payload.label || !payload.line1 || !payload.city || !payload.state || !payload.pincode) {
      showToast("Please fill Label, Flat no and block, City, State and Pincode.", "warning");
      return;
    }

    try {
      const updatedAddresses = await api.addAddress(payload, token);
      setAddresses(updatedAddresses);
      setAddressForm(emptyAddress);
      showToast("Address added.", "success");
    } catch (err) {
      showToast(err.message || "Failed to add address.", "error");
    }
  };

  const setDefaultAddress = async (address) => {
    try {
      const updatedAddresses = await api.updateAddress(address._id, { isDefault: true }, token);
      setAddresses(updatedAddresses);
      showToast("Default address changed.", "success");
    } catch (err) {
      showToast(err.message || "Failed to change default address.", "error");
    }
  };

  const removeAddress = async (addressId) => {
    try {
      const updatedAddresses = await api.deleteAddress(addressId, token);
      setAddresses(updatedAddresses);
      showToast("Address removed.", "success");
    } catch (err) {
      showToast(err.message || "Failed to remove address.", "error");
    }
  };

  return (
    <main className="page-shell">
      <section className="admin-hero">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>Manage your profile and delivery addresses</h1>
          <p>Update your profile name and maintain multiple addresses for faster ordering.</p>
        </div>
      </section>

      <section className="admin-grid">
        <form className="admin-card stack-form" onSubmit={saveProfile}>
          <h2>Profile details</h2>
          <label>
            Name
            <input
              value={profileForm.name}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </label>
          <button className="primary-button wide-button">Update profile</button>
        </form>

        <form className="admin-card stack-form" onSubmit={saveAddress}>
          <h2>Add delivery address</h2>
          <label>
            Label
            <select
              value={addressForm.label}
              onChange={(e) => setAddressForm((p) => ({ ...p, label: e.target.value }))}
            >
              <option value="Home">Home</option>
              <option value="Office">Office</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label>
            Flat no and block
            <input
              required
              value={addressForm.line1}
              onChange={(e) => setAddressForm((p) => ({ ...p, line1: e.target.value }))}
            />
          </label>
          <label>
            Society name with full address
            <input
              value={addressForm.line2}
              onChange={(e) => setAddressForm((p) => ({ ...p, line2: e.target.value }))}
            />
          </label>
          <label>City<input required value={addressForm.city} onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))} /></label>
          <label>State<input required value={addressForm.state} onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))} /></label>
          <label>Pincode<input required value={addressForm.pincode} onChange={(e) => setAddressForm((p) => ({ ...p, pincode: e.target.value }))} /></label>
          <label>Landmark<input value={addressForm.landmark} onChange={(e) => setAddressForm((p) => ({ ...p, landmark: e.target.value }))} /></label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={addressForm.isDefault}
              onChange={(e) => setAddressForm((p) => ({ ...p, isDefault: e.target.checked }))}
            />
            Set as default address
          </label>
          <button className="primary-button wide-button">Add address</button>
        </form>
      </section>

      <section className="admin-list-grid">
        <div className="admin-list-card">
          <div className="card-heading"><h2>Your addresses</h2></div>
          {addresses.length === 0 && <p className="helper-text">No saved addresses yet.</p>}
          {addresses.map((address) => (
            <article key={address._id} className="manage-row">
              <div>
                <strong>{address.label}{address.isDefault ? " (Default)" : ""}</strong>
                <p>{[address.line1, address.line2, `${address.city}, ${address.state} - ${address.pincode}`, address.landmark].filter(Boolean).join(", ")}</p>
              </div>
              <div className="row-actions">
                {!address.isDefault && (
                  <button type="button" className="text-button" onClick={() => setDefaultAddress(address)}>
                    Set Default
                  </button>
                )}
                <button type="button" className="text-button danger" onClick={() => removeAddress(address._id)}>
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
