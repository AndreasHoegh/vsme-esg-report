import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://khkkfucjmojywucvkidn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8fExr3iwGiA16DOSUjaE9g_MmPYc52Q";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function getDeviceId() {
  let id = localStorage.getItem("vsme_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("vsme_device_id", id);
  }
  return id;
}
