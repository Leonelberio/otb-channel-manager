import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Redirect to properties page
  redirect("/dashboard/properties");
}
