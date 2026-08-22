import type { GoogleUserInfo } from "@/types/google";

const GOOGLE_USER_INFO_URL =
  "https://www.googleapis.com/userinfo/v2/me";

/**
 * Fetch the authenticated Google user's profile.
 *
 * This function communicates only with Google.
 * It does NOT register the user in our backend.
 *
 * Backend registration is handled separately through signupUser().
 */
export async function getGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  if (!accessToken) {
    throw new Error(
      "Google access token is missing.",
    );
  }

  console.log(
    "[GOOGLE USER INFO] Fetching Google profile...",
  );

  const response = await fetch(
    GOOGLE_USER_INFO_URL,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const responseText =
    await response.text();

  let data: any = null;

  try {
    data = responseText
      ? JSON.parse(responseText)
      : null;
  } catch {
    data = responseText;
  }

  console.log(
    "[GOOGLE USER INFO] HTTP status:",
    response.status,
  );

  if (!response.ok) {
    console.error(
      "[GOOGLE USER INFO] Request failed:",
      data,
    );

    throw new Error(
      data?.error_description ||
        data?.error ||
        data?.message ||
        "Unable to retrieve Google user information.",
    );
  }

  if (!data?.id) {
    throw new Error(
      "Google did not return a user ID.",
    );
  }

  if (!data?.email) {
    throw new Error(
      "Google did not return an email address.",
    );
  }

  const userInfo: GoogleUserInfo = {
    id: String(data.id),
    email: String(data.email),
    name: String(data.name ?? ""),
    picture: String(data.picture ?? ""),
    given_name: data.given_name
      ? String(data.given_name)
      : undefined,
    family_name: data.family_name
      ? String(data.family_name)
      : undefined,
    verified_email:
      typeof data.verified_email ===
      "boolean"
        ? data.verified_email
        : undefined,
  };

  console.log(
    "[GOOGLE USER INFO] User received:",
    {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      hasPicture: !!userInfo.picture,
      verifiedEmail:
        userInfo.verified_email,
    },
  );

  return userInfo;
}