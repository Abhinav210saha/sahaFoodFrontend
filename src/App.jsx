import { useEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { useToast } from "./context/ToastContext";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AdminPage } from "./pages/AdminPage";
import { ProfilePage } from "./pages/ProfilePage";
import { OrdersPage } from "./pages/OrdersPage";
import { CartPage } from "./pages/CartPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { OrderNotificationsBridge } from "./components/OrderNotificationsBridge";
import { PushNotificationsBridge } from "./components/PushNotificationsBridge";
import { MobileBottomNav } from "./components/MobileBottomNav";

function App() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const lastBackPressAtRef = useRef(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removed = false;
    let backButtonListener = null;
    const installBackListener = async () => {
      backButtonListener = await CapacitorApp.addListener("backButton", ({ canGoBack }) => {
        if (window.location.pathname !== "/") {
          navigate("/", { replace: true });
          return;
        }
        if (canGoBack) {
          window.history.back();
          return;
        }
        const now = Date.now();
        if (now - lastBackPressAtRef.current < 2000) {
          CapacitorApp.exitApp();
          return;
        }
        lastBackPressAtRef.current = now;
        showToast("Press back again to exit app.", "info");
      });

      if (removed && backButtonListener) backButtonListener.remove();
    };

    installBackListener();
    return () => {
      removed = true;
      if (backButtonListener) backButtonListener.remove();
    };
  }, [navigate, showToast]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (location.pathname === "/") return;
    window.history.pushState({ inAppRoute: location.pathname }, "");
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <OrderNotificationsBridge />
      <PushNotificationsBridge />
      <Header />
      <div className="route-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
          <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
      <MobileBottomNav />
      <Footer />
    </div>
  );
}

export default App;
