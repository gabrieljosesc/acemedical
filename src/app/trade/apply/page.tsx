import { redirect } from "next/navigation";

// The signup form IS the trade application — it collects business and
// medical-license details and orders are reviewed before processing.
export default function TradeApplyPage() {
  redirect("/auth/signup");
}
