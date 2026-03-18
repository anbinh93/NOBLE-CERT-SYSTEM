import { redirect } from "next/navigation";

/**
 * Root route: Redirect to login.
 * Auth guard + role-based routing handled by login page.
 */
export default function RootPage() {
  redirect("/login");
}
