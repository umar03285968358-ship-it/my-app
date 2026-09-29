export function resolvePostLoginRoute(
  user: any,
): "/(rider)/dashboard" | "/(admin)/dashboard" | "/(tabs)" {
  const userType = String(user?.userType ?? "")
    .trim()
    .toLowerCase();

  if (userType === "rider") {
    return "/(rider)/dashboard";
  }

  if (userType === "admin") {
    return "/(admin)/dashboard";
  }

  return "/(tabs)";
}