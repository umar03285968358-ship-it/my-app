import type { GoogleUserInfo } from "@/types/google";

const GOOGLE_USER_INFO_URL = "https://www.googleapis.com/userinfo/v2/me";

/**
 * Fetch the authenticated Google user's profile.
 *
 * IMPORTANT:
 * This function only talks to Google.
 * It does NOT talk to our backend yet.
 *
 * Later we will send the Google identity/token
 * to our own backend from a separate API function.
 */
export async function getGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  if (!accessToken) {
    throw new Error("Google access token is missing.");
  }

  const response = await fetch(GOOGLE_USER_INFO_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const responseText = await response.text();

  let data: any = null;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = responseText;
  }

  console.log("====================================");
  console.log("[GOOGLE] User info status:", response.status);
  console.log("[GOOGLE] User info response:", data);
  console.log("====================================");

  if (!response.ok) {
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
    id: data.id,
    email: data.email,
    name: data.name ?? "",
    picture: data.picture ?? "",
    given_name: data.given_name ?? "",
    family_name: data.family_name ?? "",
    verified_email: data.verified_email,
  };
}
