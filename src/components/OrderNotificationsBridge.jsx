import { useEffect, useRef } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const formatStatus = (status) =>
  String(status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

export function OrderNotificationsBridge() {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const previousOrdersRef = useRef(new Map());
  const initializedRef = useRef(false);

  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      gain.gain.setValueAtTime(0.06, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
    } catch {
      // No-op if autoplay policy blocks sound.
    }
  };

  useEffect(() => {
    if (!token || !user) return;

    previousOrdersRef.current = new Map();
    initializedRef.current = false;

    const poll = async () => {
      try {
        const orders =
          user.role === "admin"
            ? await api.getAllOrders(token)
            : await api.getMyOrders(token);

        const nextMap = new Map(orders.map((order) => [String(order._id), order.status]));

        if (!initializedRef.current) {
          previousOrdersRef.current = nextMap;
          initializedRef.current = true;
          return;
        }

        if (user.role === "admin") {
          const newOrders = orders.filter((order) => !previousOrdersRef.current.has(String(order._id)));
          if (newOrders.length > 0) {
            playNotificationSound();
            showToast(
              `${newOrders.length} new order${newOrders.length > 1 ? "s" : ""} placed.`,
              "info",
              3500,
              "New Order"
            );
          }
        } else {
          orders.forEach((order) => {
            const orderId = String(order._id);
            const previousStatus = previousOrdersRef.current.get(orderId);
            if (previousStatus && previousStatus !== order.status) {
              playNotificationSound();
              showToast(
                `${order.itemName}: ${formatStatus(order.status)}`,
                "success",
                4000,
                "Order Status Updated"
              );
            }
          });
        }

        previousOrdersRef.current = nextMap;
      } catch {
        // Silent poll failure to avoid noisy UX.
      }
    };

    poll();
    const timer = setInterval(poll, 20000);
    return () => clearInterval(timer);
  }, [token, user, showToast]);

  return null;
}
