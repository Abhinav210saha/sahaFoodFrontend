import { useEffect, useRef } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

export function PushNotificationsBridge() {
  const { token, user } = useAuth();
  const lastEndpointRef = useRef("");

  useEffect(() => {
    if (!token || !user || user.role === "admin") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;

    const setup = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const registration = await navigator.serviceWorker.register("/sw.js");
        const keyData = await api.getPushPublicKey(token);
        if (!keyData?.publicKey) return;

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
          });
        }

        const endpoint = subscription?.endpoint || "";
        if (endpoint && endpoint !== lastEndpointRef.current) {
          await api.subscribePush(subscription, token);
          lastEndpointRef.current = endpoint;
        }
      } catch {
        // Ignore push setup failures gracefully.
      }
    };

    setup();
  }, [token, user]);

  return null;
}
