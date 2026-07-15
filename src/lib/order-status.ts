export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending Review",
  confirmed: "Confirmed",
  shipped: "Shipped",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
  pending: "bg-low-bg text-low",
  confirmed: "bg-teal-tint text-teal",
  shipped: "bg-stock-bg text-stock",
  cancelled: "bg-line text-ink-faint",
};

export function isOrderStatus(value: string | undefined): value is OrderStatus {
  return !!value && (ORDER_STATUSES as readonly string[]).includes(value);
}
