import { CartItem } from "@/context/CartContext";
import { OrderDetailItem } from "@/services/api";

export function buildOrderDetail(items: CartItem[]): OrderDetailItem[] {
  return items.map((i) => ({
    ProductID: i.product.productID,
    ProductTitle: i.product.productTitle,
    Quantity: i.quantity,
    CostPrice: i.product.avgCostPrice,
    AvgCostPrice: i.product.avgCostPrice,
    SalePrice: i.product.salePrice,
    DiscInR: i.product.discRupees ?? 0,
    DiscInP: i.product.discPercentage ?? 0,
    Gst: i.product.gst ?? 0,
    ET: i.product.et ?? 0,
  }));
}
