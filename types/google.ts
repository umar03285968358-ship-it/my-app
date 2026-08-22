/**
 * Shared Google user information.
 *
 * IMPORTANT:
 * Keep this interface in ONE place.
 *
 * Both:
 *   - services/googleAuth.ts
 *   - hooks/useGoogleAuth.ts
 *
 * use this same type.
 */

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
  verified_email?: boolean;
}