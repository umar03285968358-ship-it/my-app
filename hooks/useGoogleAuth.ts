import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useRef, useState } from "react";

WebBrowser.maybeCompleteAuthSession();

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
  verified_email?: boolean;
}

export interface GoogleAuthConfig {
  iosClientId?: string;
  androidClientId?: string;
  webClientId?: string;
  scopes?: string[];

  onSuccess?: (
    userInfo: GoogleUserInfo,
    accessToken: string,
  ) => void | Promise<void>;

  onError?: (message: string) => void;
}

interface UseGoogleAuthReturn {
  promptGoogleLogin: () => Promise<void>;
  loading: boolean;
  error: string | null;
  userInfo: GoogleUserInfo | null;
  isReady: boolean;
  reset: () => void;
}

export function useGoogleAuth(
  config: GoogleAuthConfig = {},
): UseGoogleAuthReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<GoogleUserInfo | null>(null);

  /*
   * Keep the latest callbacks without recreating the
   * authentication request on every render.
   */
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  /*
   * Google Client IDs
   *
   * Web Client ID (used in Expo Go — validated by redirect URI):
   *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
   *
   * Android Client ID (only valid in a real dev/standalone build with
   * the correct package name + SHA-1 fingerprint registered — NOT usable
   * in Expo Go, since Expo Go has its own identity):
   *   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
   */
  const webClientId =
    config.webClientId ?? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const iosClientId =
    config.iosClientId ??
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ??
    webClientId;

  const androidClientId =
    config.androidClientId ??
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ??
    webClientId;

  /*
   * Google OAuth request
   *
   * androidClientId MUST be passed here — expo-auth-session throws if it's
   * undefined on Android, it does not silently fall back on its own.
   *
   * The trick is what VALUE androidClientId resolves to (see above):
   * as long as EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID is unset in .env,
   * the `androidClientId` variable above falls back to `webClientId`,
   * so this ends up using a Web-type client (validated by redirect URI)
   * even on Android — which is the only flow Expo Go can satisfy.
   *
   * Only set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID once you're running a
   * real dev client / standalone build where the Android client's
   * package name + SHA-1 fingerprint actually match what's registered
   * in Google Cloud Console.
   */
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId,
    androidClientId,
    iosClientId,

    scopes: config.scopes ?? ["profile", "email"],
  });

  /*
   * Debug request initialization
   */
  useEffect(() => {
    if (!request) {
      console.log("[GOOGLE AUTH] Request is not ready yet.");
      return;
    }

    console.log("====================================");
    console.log("[GOOGLE AUTH] Request initialized");
    console.log("[GOOGLE AUTH] Web Client ID:", webClientId);
    console.log(
      "[GOOGLE AUTH] Android Client ID (not passed to hook):",
      androidClientId,
    );
    console.log("[GOOGLE AUTH] iOS Client ID:", iosClientId);
    console.log("[GOOGLE AUTH] Redirect URI:", request.redirectUri);
    console.log(
      "[GOOGLE AUTH] Request clientId (actually used):",
      request.clientId,
    );
    console.log("[GOOGLE AUTH] Request URL:", request.url);
    console.log("====================================");
  }, [request, webClientId, androidClientId, iosClientId]);

  /*
   * Debug Google response
   */
  useEffect(() => {
    if (!response) {
      return;
    }

    console.log("====================================");
    console.log("[GOOGLE AUTH] RESPONSE");
    console.log("[GOOGLE AUTH] Type:", response.type);

    console.log(
      "[GOOGLE AUTH] Full response:",
      JSON.stringify(response, null, 2),
    );

    console.log("====================================");
  }, [response]);

  /*
   * Get Google profile
   */
  const fetchUserInfo = useCallback(
    async (accessToken: string): Promise<GoogleUserInfo> => {
      if (!accessToken) {
        throw new Error("Google access token is missing.");
      }

      const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseText = await res.text();

      let data: any = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = responseText;
      }

      console.log("====================================");
      console.log("[GOOGLE AUTH] User info status:", res.status);
      console.log("[GOOGLE AUTH] User info response:", data);
      console.log("====================================");

      if (!res.ok) {
        throw new Error(
          data?.error_description ||
            data?.error ||
            data?.message ||
            "Unable to retrieve Google user information.",
        );
      }

      if (!data?.email) {
        throw new Error("Google did not return an email address.");
      }

      return {
        id: String(data.id ?? ""),
        email: String(data.email ?? ""),
        name: String(data.name ?? ""),
        picture: String(data.picture ?? ""),
        given_name: String(data.given_name ?? ""),
        family_name: String(data.family_name ?? ""),
        verified_email: data.verified_email,
      };
    },
    [],
  );

  /*
   * Handle Google response
   */
  useEffect(() => {
    if (!response) {
      return;
    }

    const handleResponse = async () => {
      if (response.type === "success") {
        setLoading(true);
        setError(null);

        try {
          const accessToken = response.authentication?.accessToken;

          if (!accessToken) {
            throw new Error("Google did not return an access token.");
          }

          console.log("[GOOGLE AUTH] Access token received.");

          const info = await fetchUserInfo(accessToken);

          console.log("[GOOGLE AUTH] Google user information:", info);

          setUserInfo(info);

          /*
           * Send Google user back to Login/Signup.
           */
          await configRef.current.onSuccess?.(info, accessToken);
        } catch (err: any) {
          const message = err?.message ?? "Google sign-in failed.";

          console.log("[GOOGLE AUTH] Error:", message);

          setError(message);

          configRef.current.onError?.(message);
        } finally {
          setLoading(false);
        }

        return;
      }

      if (response.type === "error") {
        const message = response.error?.message ?? "Google sign-in failed.";

        console.log("[GOOGLE AUTH] Google returned an error:", message);

        setError(message);

        configRef.current.onError?.(message);

        setLoading(false);

        return;
      }

      if (response.type === "cancel" || response.type === "dismiss") {
        console.log("[GOOGLE AUTH] User cancelled Google sign-in.");

        setLoading(false);
      }
    };

    handleResponse();
  }, [response, fetchUserInfo]);

  /*
   * Start Google authentication
   */
  const promptGoogleLogin = useCallback(async () => {
    if (!request) {
      const message = "Google sign-in is still initializing. Please try again.";

      console.log("[GOOGLE AUTH]", message);

      setError(message);

      configRef.current.onError?.(message);

      return;
    }

    setError(null);
    setLoading(true);

    try {
      console.log("[GOOGLE AUTH] Opening Google authentication...");

      const result = await promptAsync();

      console.log("[GOOGLE AUTH] Prompt result:", result.type);

      /*
       * The response effect handles success.
       *
       * For cancel/error, stop loading immediately.
       */
      if (result.type !== "success") {
        setLoading(false);
      }
    } catch (err: any) {
      const message = err?.message ?? "Could not start Google sign-in.";

      console.log("[GOOGLE AUTH] Prompt error:", message);

      setError(message);

      configRef.current.onError?.(message);

      setLoading(false);
    }
  }, [promptAsync, request]);

  /*
   * Reset Google state
   */
  const reset = useCallback(() => {
    setError(null);
    setUserInfo(null);
    setLoading(false);
  }, []);

  return {
    promptGoogleLogin,
    loading,
    error,
    userInfo,
    isReady: !!request,
    reset,
  };
}
