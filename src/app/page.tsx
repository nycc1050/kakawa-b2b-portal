import { redirect } from "next/navigation";

export default function Home() {
  // Middleware bounces an authenticated user from /login onward to the
  // right portal, so routing everyone through /login is enough here.
  redirect("/login");
}
