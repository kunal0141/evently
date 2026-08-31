"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!fullName || !email || !password) {
    redirect(`/signup?error=${encodeURIComponent("All fields are required.")}`);
  }
  if (password.length < 6) {
    redirect(`/signup?error=${encodeURIComponent("Password must be at least 6 characters.")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // If email confirmation is disabled in the Supabase project (recommended
  // for this app so reviewers can log in immediately), signUp already
  // returns an active session and we can send the user straight in.
  if (data.session) {
    redirect("/events");
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "Account created. Check your email to confirm, then log in."
    )}`
  );
}
