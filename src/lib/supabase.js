import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
let rememberSession = true;

const sessionStorageAdapter = {
  getItem(key) {
    return globalThis.localStorage.getItem(key) ?? globalThis.sessionStorage.getItem(key);
  },
  setItem(key, value) {
    const target = rememberSession ? globalThis.localStorage : globalThis.sessionStorage;
    const other = rememberSession ? globalThis.sessionStorage : globalThis.localStorage;
    target.setItem(key, value);
    other.removeItem(key);
  },
  removeItem(key) {
    globalThis.localStorage.removeItem(key);
    globalThis.sessionStorage.removeItem(key);
  },
};

export function setRememberSession(remember) {
  rememberSession = Boolean(remember);
}

export const supabase = supabaseUrl && supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: sessionStorageAdapter,
    },
  })
  : null;
