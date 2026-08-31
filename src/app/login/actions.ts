"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error: string | null;
}

/** Only ever redirect somewhere inside our own app - never follow an
 * absolute/external URL a caller might slip into redirectTo. */
function safeRedirectTarget(redirectTo: FormDataEntryValue | null): string | null {
  const value = typeof redirectTo === "string" ? redirectTo : "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return null;
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  revalidatePath("/", "layout");

  if (profile?.role === "admin") {
    redirect("/admin/dashboard");
  }
  // Catalog is the customer home page. Honor a deep-link redirect (e.g. a
  // bookmarked /quote link that bounced through /login) if one was given.
  redirect(safeRedirectTarget(formData.get("redirectTo")) ?? "/catalog");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
