"use client";

import { useState } from "react";

export default function TestPagBank() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async (testType: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/pagbank/diagnostico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testType }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Teste PagBank</h1>
      <button onClick={() => runTest("PIX")} disabled={loading} style={{ margin: "5px", padding: "10px" }}>
        Testar PIX
      </button>
      <button onClick={() => runTest("CREDIT_CARD")} disabled={loading} style={{ margin: "5px", padding: "10px" }}>
        Testar Cartão
      </button>
      <pre style={{ background: "#f0f0f0", padding: "10px", marginTop: "20px" }}>
        {result ? JSON.stringify(result, null, 2) : "Aguardando teste..."}
      </pre>
    </div>
  );
}