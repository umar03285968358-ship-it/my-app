import type { GoogleUserInfo } from "@/types/google";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

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

/*
 * ============================================================
 * ENVIRONMENT VARIABLES
 * ============================================================
 */

const ENV_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const ENV_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

const ENV_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

/*
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

const ANDROID_PACKAGE =
  "com.umarabdullah123.logixsolutionz";

const ANDROID_SHA1 =
  "5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25";

const DEFAULT_SCOPES = [
  "email",
  "profile",
];

/*
 * ============================================================
 * DEBUG HELPERS
 * ============================================================
 */

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function logGoogleError(error: any): void {
  console.error("");
  console.error(
    "####################################################",
  );
  console.error(
    "############ GOOGLE NATIVE ERROR ###################",
  );
  console.error(
    "####################################################",
  );

  console.error(
    "[GOOGLE ERROR] Raw:",
    error,
  );

  console.error(
    "[GOOGLE ERROR] JSON:",
    safeStringify(error),
  );

  console.error(
    "[GOOGLE ERROR] name:",
    error?.name ?? "N/A",
  );

  console.error(
    "[GOOGLE ERROR] message:",
    error?.message ?? "N/A",
  );

  console.error(
    "[GOOGLE ERROR] code:",
    error?.code ?? "N/A",
  );

  console.error(
    "[GOOGLE ERROR] status:",
    error?.status ?? "N/A",
  );

  console.error(
    "[GOOGLE ERROR] stack:",
    error?.stack ?? "N/A",
  );

  console.error(
    "[GOOGLE ERROR] SIGN_IN_CANCELLED:",
    statusCodes.SIGN_IN_CANCELLED,
  );

  console.error(
    "[GOOGLE ERROR] IN_PROGRESS:",
    statusCodes.IN_PROGRESS,
  );

  console.error(
    "[GOOGLE ERROR] PLAY_SERVICES_NOT_AVAILABLE:",
    statusCodes.PLAY_SERVICES_NOT_AVAILABLE,
  );

  console.error(
    "####################################################",
  );
  console.error("");
}

/*
 * ============================================================
 * HOOK
 * ============================================================
 */

export function useGoogleAuth(
  config: GoogleAuthConfig = {},
): UseGoogleAuthReturn {
  const [loading, setLoading] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [userInfo, setUserInfo] =
    useState<GoogleUserInfo | null>(null);

  const [isReady, setIsReady] =
    useState(false);

  /*
   * Keep latest callbacks/config without
   * forcing authentication configuration again.
   */

  const configRef =
    useRef<GoogleAuthConfig>(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const configuredRef =
    useRef(false);

  /*
   * ============================================================
   * CLIENT IDS
   * ============================================================
   */

  const webClientId =
    config.webClientId ??
    ENV_WEB_CLIENT_ID;

  const androidClientId =
    config.androidClientId ??
    ENV_ANDROID_CLIENT_ID;

  const iosClientId =
    config.iosClientId ??
    ENV_IOS_CLIENT_ID;

  const scopes =
    config.scopes ??
    DEFAULT_SCOPES;

  /*
   * ============================================================
   * INITIAL DEBUG
   * ============================================================
   */

  useEffect(() => {
    console.log("");
    console.log(
      "####################################################",
    );
    console.log(
      "############ GOOGLE NATIVE CONFIG ##################",
    );
    console.log(
      "####################################################",
    );

    console.log(
      "[GOOGLE DEBUG] Authentication:",
      "Native Google Sign-In",
    );

    console.log(
      "[GOOGLE DEBUG] Package:",
      ANDROID_PACKAGE,
    );

    console.log(
      "[GOOGLE DEBUG] SHA-1:",
      ANDROID_SHA1,
    );

    console.log(
      "[GOOGLE DEBUG] Android Client ID:",
      androidClientId || "❌ MISSING",
    );

    console.log(
      "[GOOGLE DEBUG] Web Client ID:",
      webClientId || "❌ MISSING",
    );

    console.log(
      "[GOOGLE DEBUG] iOS Client ID:",
      iosClientId || "NOT PROVIDED",
    );

    console.log(
      "[GOOGLE DEBUG] Scopes:",
      scopes,
    );

    console.log(
      "[GOOGLE DEBUG] GoogleSignin:",
      GoogleSignin
        ? "✅ AVAILABLE"
        : "❌ MISSING",
    );

    console.log(
      "[GOOGLE DEBUG] Token persistence:",
      "❌ DISABLED",
    );

    console.log(
      "[GOOGLE DEBUG] Expo Auth Session:",
      "NOT USED",
    );

    console.log(
      "####################################################",
    );
    console.log("");
  }, [
    androidClientId,
    webClientId,
    iosClientId,
    scopes,
  ]);

  /*
   * ============================================================
   * CONFIGURE GOOGLE SIGN-IN
   * ============================================================
   */

  useEffect(() => {
    if (configuredRef.current) {
      return;
    }

    console.log("");
    console.log(
      "####################################################",
    );
    console.log(
      "######## CONFIGURING GOOGLE SIGN-IN ################",
    );
    console.log(
      "####################################################",
    );

    if (!webClientId) {
      const message =
        "Google Web Client ID is missing.";

      console.error(
        "[GOOGLE DEBUG] ❌",
        message,
      );

      setError(message);
      setIsReady(false);

      configRef.current.onError?.(
        message,
      );

      return;
    }

    if (
      !webClientId.endsWith(
        ".apps.googleusercontent.com",
      )
    ) {
      const message =
        "Google Web Client ID has an unexpected format.";

      console.error(
        "[GOOGLE DEBUG] ❌",
        message,
      );

      setError(message);
      setIsReady(false);

      configRef.current.onError?.(
        message,
      );

      return;
    }

    console.log(
      "[GOOGLE DEBUG] Web Client ID: ✅ VALID",
    );

    console.log(
      "[GOOGLE DEBUG] Android Client ID:",
      androidClientId || "NOT PROVIDED",
    );

    console.log(
      "[GOOGLE DEBUG] Calling GoogleSignin.configure()...",
    );

    try {
      GoogleSignin.configure({
        webClientId,

        iosClientId:
          iosClientId || undefined,

        scopes,

        /*
         * We don't need refresh/offline tokens
         * for the current signup/login flow.
         */
        offlineAccess: false,
      });

      configuredRef.current = true;

      setIsReady(true);
      setError(null);

      console.log(
        "[GOOGLE DEBUG] GoogleSignin.configure(): ✅ SUCCESS",
      );

      console.log(
        "[GOOGLE DEBUG] Package:",
        ANDROID_PACKAGE,
      );

      console.log(
        "[GOOGLE DEBUG] SHA-1:",
        ANDROID_SHA1,
      );

      console.log(
        "[GOOGLE DEBUG] Token persistence: ❌ DISABLED",
      );
    } catch (err: any) {
      const message =
        err?.message ??
        "Failed to configure Google Sign-In.";

      console.error(
        "[GOOGLE DEBUG] configure() failed.",
      );

      logGoogleError(err);

      setError(message);
      setIsReady(false);

      configRef.current.onError?.(
        message,
      );
    }

    console.log(
      "####################################################",
    );
    console.log("");
  }, [
    webClientId,
    iosClientId,
    scopes,
    androidClientId,
  ]);

  /*
   * ============================================================
   * MAP GOOGLE USER
   * ============================================================
   */

  const mapGoogleUser =
    useCallback(
      (nativeUser: any): GoogleUserInfo => {
        console.log(
          "[GOOGLE DEBUG] Mapping Google user...",
        );

        console.log(
          "[GOOGLE DEBUG] Native user:",
          safeStringify(nativeUser),
        );

        const user =
          nativeUser?.user ??
          nativeUser;

        const mappedUser: GoogleUserInfo = {
          id: String(
            user?.id ?? "",
          ),

          email: String(
            user?.email ?? "",
          ),

          name: String(
            user?.name ?? "",
          ),

          picture: String(
            user?.photo ?? "",
          ),

          given_name:
            user?.givenName
              ? String(user.givenName)
              : undefined,

          family_name:
            user?.familyName
              ? String(user.familyName)
              : undefined,

          /*
           * Native Google Sign-In does not necessarily
           * expose verified_email.
           */
          verified_email:
            undefined,
        };

        console.log(
          "[GOOGLE DEBUG] Mapped user:",
          safeStringify(mappedUser),
        );

        return mappedUser;
      },
      [],
    );

  /*
   * ============================================================
   * GOOGLE LOGIN / SIGNUP TRIGGER
   * ============================================================
   *
   * NOTE ON SCOPE:
   *
   * This hook ONLY handles native Google authentication and
   * returns { userInfo, accessToken } to the caller's onSuccess.
   *
   * It does NOT know or care whether the caller is going to use
   * that result for signup (InsertMobUser -> MobUserLogin) or
   * for plain login (MobUserLogin). That backend orchestration
   * lives in login.tsx / signup.tsx, on purpose, so this hook
   * stays reusable for both screens.
   */

  const promptGoogleLogin =
    useCallback(
      async () => {
        if (loading) {
          console.warn(
            "[GOOGLE DEBUG] Sign-In already running.",
          );

          return;
        }

        if (
          !configuredRef.current ||
          !isReady
        ) {
          const message =
            "Google Sign-In is not ready yet.";

          console.error(
            "[GOOGLE DEBUG] ❌",
            message,
          );

          setError(message);

          configRef.current.onError?.(
            message,
          );

          return;
        }

        console.log("");
        console.log(
          "####################################################",
        );
        console.log(
          "############ START GOOGLE LOGIN ####################",
        );
        console.log(
          "####################################################",
        );

        setLoading(true);
        setError(null);

        try {
          /*
           * ======================================================
           * STEP 1 - PLAY SERVICES
           * ======================================================
           */

          console.log(
            "[GOOGLE DEBUG] STEP 1: Checking Play Services...",
          );

          await GoogleSignin.hasPlayServices({
            showPlayServicesUpdateDialog: true,
          });

          console.log(
            "[GOOGLE DEBUG] Play Services: ✅ AVAILABLE",
          );

          /*
           * ======================================================
           * STEP 2 - FORCE A FRESH ACCOUNT CHOOSER
           * ======================================================
           *
           * If a previous native session (from an earlier login
           * or signup attempt, possibly with a different Google
           * account) is still cached, signIn() can silently return
           * that cached account instead of showing the picker, or
           * can conflict with a fresh signup attempt.
           *
           * We defensively sign out of any cached native session
           * first. This does NOT affect our own backend session
           * (AsyncStorage) at all - it only clears the native
           * Google Sign-In module's cached account, so the user
           * always gets a real account picker.
           */

          console.log(
            "[GOOGLE DEBUG] STEP 2: Clearing any cached native Google session...",
          );

          try {
            const hasPriorSession =
              await GoogleSignin.hasPreviousSignIn();

            console.log(
              "[GOOGLE DEBUG] Previous native session present:",
              hasPriorSession,
            );

            if (hasPriorSession) {
              await GoogleSignin.signOut();

              console.log(
                "[GOOGLE DEBUG] Cached native session cleared.",
              );
            }
          } catch (clearErr) {
            /*
             * Non-fatal: if this fails we still attempt signIn()
             * below, we just log it for visibility.
             */
            console.warn(
              "[GOOGLE DEBUG] Could not clear cached session (continuing anyway):",
              clearErr,
            );
          }

          /*
           * ======================================================
           * STEP 3 - SIGN IN
           * ======================================================
           */

          console.log(
            "[GOOGLE DEBUG] STEP 3: Opening native Google Sign-In...",
          );

          const response =
            await GoogleSignin.signIn();

          console.log(
            "[GOOGLE DEBUG] signIn() completed.",
          );

          console.log(
            "[GOOGLE DEBUG] Sign-In response:",
            safeStringify(response),
          );

          /*
           * ======================================================
           * STEP 4 - RESPONSE
           * ======================================================
           */

          if (
            !isSuccessResponse(response)
          ) {
            console.warn(
              "[GOOGLE DEBUG] Sign-In did not return success.",
            );

            return;
          }

          console.log(
            "[GOOGLE DEBUG] Google Sign-In: ✅ SUCCESS",
          );

          /*
           * ======================================================
           * STEP 5 - USER
           * ======================================================
           */

          const info =
            mapGoogleUser(
              response.data,
            );

          console.log(
            "[GOOGLE DEBUG] User ID:",
            info.id,
          );

          console.log(
            "[GOOGLE DEBUG] Email:",
            info.email,
          );

          console.log(
            "[GOOGLE DEBUG] Name:",
            info.name,
          );

          console.log(
            "[GOOGLE DEBUG] Picture:",
            info.picture,
          );

          if (!info.email) {
            throw new Error(
              "Google authentication succeeded, but no email was returned.",
            );
          }

          /*
           * ======================================================
           * STEP 6 - TEMPORARY TOKEN
           * ======================================================
           *
           * We retrieve it only because the current
           * onSuccess contract accepts it.
           *
           * WE DO NOT STORE IT.
           */

          console.log(
            "[GOOGLE DEBUG] STEP 6: Getting temporary Google token...",
          );

          const tokens =
            await GoogleSignin.getTokens();

          const accessToken =
            tokens?.accessToken;

          console.log(
            "[GOOGLE DEBUG] Access token:",
            accessToken
              ? "✅ AVAILABLE"
              : "❌ MISSING",
          );

          console.log(
            "[GOOGLE DEBUG] ID token:",
            tokens?.idToken
              ? "✅ AVAILABLE"
              : "❌ MISSING",
          );

          /*
           * NEVER log the actual token.
           */

          console.log(
            "[GOOGLE DEBUG] Access token length:",
            accessToken?.length ?? 0,
          );

          console.log(
            "[GOOGLE DEBUG] ID token length:",
            tokens?.idToken?.length ?? 0,
          );

          if (!accessToken) {
            throw new Error(
              "Google authentication succeeded, but no access token was returned.",
            );
          }

          /*
           * ======================================================
           * STEP 7 - SAVE ONLY USER INFO IN MEMORY
           * ======================================================
           */

          setUserInfo(info);

          console.log(
            "[GOOGLE DEBUG] User state updated.",
          );

          /*
           * ======================================================
           * STEP 8 - CALLBACK
           * ======================================================
           *
           * Whatever the caller's onSuccess does next (signup ->
           * login -> save session -> redirect, or just login ->
           * save session -> redirect) happens here. If the
           * caller's onSuccess throws, we let it propagate so the
           * caller's own try/catch (in login.tsx / signup.tsx)
           * handles its own Alert - we don't swallow it here.
           */

          console.log(
            "[GOOGLE DEBUG] STEP 8: Calling onSuccess...",
          );

          await configRef.current.onSuccess?.(
            info,
            accessToken,
          );

          console.log(
            "[GOOGLE DEBUG] onSuccess completed.",
          );

          /*
           * ======================================================
           * SUCCESS
           * ======================================================
           */

          console.log("");
          console.log(
            "####################################################",
          );
          console.log(
            "############ GOOGLE LOGIN SUCCESS ##################",
          );
          console.log(
            "####################################################",
          );

          console.log(
            "[GOOGLE DEBUG] 🎉 Google authentication complete.",
          );

          console.log(
            "[GOOGLE DEBUG] User:",
            info.email,
          );

          console.log(
            "[GOOGLE DEBUG] Token persistence:",
            "❌ NOT STORED",
          );

          console.log(
            "####################################################",
          );
          console.log("");
        } catch (err: any) {
          logGoogleError(err);

          let message =
            err?.message ??
            "Google Sign-In failed.";

          if (isErrorWithCode(err)) {
            switch (err.code) {
              case statusCodes.SIGN_IN_CANCELLED:
                console.warn(
                  "[GOOGLE DEBUG] User cancelled Google Sign-In.",
                );

                return;

              case statusCodes.IN_PROGRESS:
                message =
                  "Google Sign-In is already in progress.";
                break;

              case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                message =
                  "Google Play Services are unavailable or need updating.";
                break;

              default:
                break;
            }
          }

          const normalizedCode =
            String(
              err?.code ?? "",
            ).toUpperCase();

          const normalizedMessage =
            String(
              err?.message ?? "",
            ).toUpperCase();

          if (
            normalizedCode === "10" ||
            normalizedCode ===
              "DEVELOPER_ERROR" ||
            normalizedMessage.includes(
              "DEVELOPER_ERROR",
            )
          ) {
            console.error(
              "[GOOGLE DEBUG] ❌ DEVELOPER_ERROR detected.",
            );

            console.error(
              "[GOOGLE DEBUG] This means Google's servers rejected the",
            );
            console.error(
              "[GOOGLE DEBUG] OAuth client for this build. Check that the",
            );
            console.error(
              "[GOOGLE DEBUG] SHA-1 below matches the certificate that",
            );
            console.error(
              "[GOOGLE DEBUG] actually signed THIS build, and that it is",
            );
            console.error(
              "[GOOGLE DEBUG] registered in Google Cloud Console for this",
            );
            console.error(
              "[GOOGLE DEBUG] exact package name.",
            );

            console.error(
              "[GOOGLE DEBUG] Package:",
              ANDROID_PACKAGE,
            );

            console.error(
              "[GOOGLE DEBUG] SHA-1:",
              ANDROID_SHA1,
            );

            console.error(
              "[GOOGLE DEBUG] Android Client ID:",
              androidClientId,
            );

            console.error(
              "[GOOGLE DEBUG] Web Client ID:",
              webClientId,
            );

            message =
              "Google Sign-In configuration error (DEVELOPER_ERROR). " +
              "The app's certificate is not registered with Google. " +
              "Please contact support.";
          }

          setError(message);

          configRef.current.onError?.(
            message,
          );
        } finally {
          setLoading(false);

          console.log(
            "[GOOGLE DEBUG] Login process finished.",
          );
        }
      },
      [
        isReady,
        loading,
        mapGoogleUser,
        androidClientId,
        webClientId,
      ],
    );

  /*
   * ============================================================
   * RESET
   * ============================================================
   */

  const reset =
    useCallback(() => {
      setLoading(false);
      setError(null);
      setUserInfo(null);

      console.log(
        "[GOOGLE DEBUG] Auth state reset.",
      );
    }, []);

  return {
    promptGoogleLogin,
    loading,
    error,
    userInfo,
    isReady,
    reset,
  };
}