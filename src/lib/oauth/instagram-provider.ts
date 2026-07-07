import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";

export interface InstagramProfile {
  id: string;
  username: string;
  account_type?: string;
}

export default function InstagramProvider(
  options: OAuthUserConfig<Record<string, unknown>>
): OAuthConfig<Record<string, unknown>> {
  return {
    id: "instagram",
    name: "Instagram",
    type: "oauth",
    authorization: {
      url: "https://api.instagram.com/oauth/authorize",
      params: {
        scope: "user_profile,user_media",
      },
    },
    token: {
      url: "https://api.instagram.com/oauth/access_token",
      async request({ provider, params }: { provider: { clientId?: string; clientSecret?: string; callbackUrl?: string }; params: { code?: string } }) {
        const body = new URLSearchParams({
          client_id: provider.clientId!,
          client_secret: provider.clientSecret!,
          grant_type: "authorization_code",
          redirect_uri: provider.callbackUrl!,
          code: params.code!,
        });

        const response = await fetch("https://api.instagram.com/oauth/access_token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });

        const data = (await response.json()) as {
          access_token?: string;
          user_id?: number;
          error_message?: string;
        };

        if (!response.ok || !data.access_token) {
          throw new Error(data.error_message || "Instagram token exchange failed");
        }

        return {
          tokens: {
            access_token: data.access_token,
            token_type: "bearer",
            providerAccountId: String(data.user_id),
          },
        };
      },
    },
    userinfo: {
      url: "https://graph.instagram.com/me",
      async request({ tokens }: { tokens: { access_token?: string } }) {
        const url = new URL("https://graph.instagram.com/me");
        url.searchParams.set("fields", "id,username,account_type");
        url.searchParams.set("access_token", tokens.access_token!);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch Instagram profile");
        }
        return response.json() as Promise<Record<string, unknown>>;
      },
    },
    profile(profile: Record<string, unknown>) {
      const id = String(profile.id ?? "");
      const username = String(profile.username ?? "instagram_user");
      return {
        id,
        name: username,
        email: `instagram_${id}@users.plantcare.app`,
        image: null,
      };
    },
    options,
  };
}
