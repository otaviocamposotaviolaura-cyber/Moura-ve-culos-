const SUPABASE_URL = "https://tqwqqjaybdlbhfljdrui.supabase.co";

const SUPABASE_KEY = "sb_publishable_3g6oKAR6vsNArrB2jn3TeQ_ai9r4FSk";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

console.log("CONFIG CARREGADO");
console.log("URL:", SUPABASE_URL);
console.log("Chave carregada:", !!SUPABASE_KEY);
console.log("Cliente Supabase:", supabase);
