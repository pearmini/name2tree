import {createClient} from "@supabase/supabase-js";
import {getBrowserId} from "./browserId.js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return Boolean(url && anonKey);
}

let client = null;

export function getSupabase() {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      global: {
        headers: {
          "x-browser-id": getBrowserId(),
        },
      },
    });
  }
  return client;
}
