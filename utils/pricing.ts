import { MobProduct } from "@/services/api";

export function getDiscountedPrice(product: MobProduct): number {
  const price = product.salePrice ?? 0;
  if (product.discRupees && product.discRupees > 0) {
    return Math.max(price - product.discRupees, 0);
  }
  if (product.discPercentage && product.discPercentage > 0) {
    return Math.max(price - (price * product.discPercentage) / 100, 0);
  }
  return price;
}

/** imagesPath is already the full, ready-to-render image URL — same field
 * used directly in app/product/[id].tsx. Don't concatenate anything. */
export function getProductImageUrl(product: MobProduct): string | undefined {
  return product.imagesPath ?? undefined;
}
