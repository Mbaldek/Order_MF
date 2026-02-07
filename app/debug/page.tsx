"use client";

import { supabase } from "@/lib/supabaseClient";


export default function DebugPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function testInsert() {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        company: "DBG",
        stand: "DBG",
        first_name: "DBG",
        last_name: "DBG",
        phone: "000",
        email: "dbg@dbg.com",
      })
      .select("id")
      .single();

    alert(error ? JSON.stringify(error) : `OK: ${data?.id}`);
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Debug Supabase</h1>
      <p>URL: {url || "(missing)"}</p>
      <p>ANON KEY prefix: {key ? key.slice(0, 16) + "..." : "(missing)"}</p>
      <button onClick={testInsert} style={{ padding: 12, border: "1px solid #ccc" }}>
        Test INSERT orders
      </button>
    </div>
  );
}
