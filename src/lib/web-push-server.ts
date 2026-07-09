import webpush from "web-push";

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  locale: "en" | "fa";
};

function getVapidKeys() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@giahyar.app";

  if (!publicKey || !privateKey) return null;

  return { publicKey, privateKey, subject };
}

export function isWebPushConfigured(): boolean {
  return getVapidKeys() !== null;
}

export function getVapidPublicKey(): string | null {
  return getVapidKeys()?.publicKey ?? null;
}

export async function sendWebPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<void> {
  const keys = getVapidKeys();
  if (!keys) {
    throw new Error("Web push is not configured");
  }

  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);

  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    JSON.stringify(payload)
  );
}
