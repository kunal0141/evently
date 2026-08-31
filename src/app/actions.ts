"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Test-money wallet: adds ₹10,000 of play credits, no real payment involved.
export async function topUpWallet() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.rpc("top_up_wallet", { p_amount_cents: 1000000 });
  revalidatePath("/", "layout");
}
