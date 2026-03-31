"use client";

import { useState, useEffect } from "react";

export default function TestPagBank() {
  const [result, setResult] = useState<string>("Aguardando...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setResult("Página carregada. Clique em um botão para testar.");
  }, []);

  const runTest = async (testType: string) => {
    setLoading(true);
    setResult("Executando teste " + testType + "...");
    try {
      const res = await fetch("/api/pagbank/diagnostico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testType }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResult("Erro: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ color: "#22C55E" }}>Teste PagBank</h1>
      <div style={{ marginTop: "20px" }}>
        <button 
          onClick={() => runTest("PIX")} 
          disabled={loading}
          style={{ margin: "10px", padding: "15px 30px", fontSize: "16px", cursor: "pointer" }}
        >
          Testar PIX
        </button>
        <button 
          onClick={() => runTest("CREDIT_CARD")} 
          disabled={loading}
          style={{ margin: "10px", padding: "15px 30px", fontSize: "16px", cursor: "pointer" }}
        >
          Testar Cartão
        </button>
      </div>
      <pre style={{ background: "#1a1a1c", color: "#fff", padding: "20px", marginTop: "30px", borderRadius: "10px", overflow: "auto" }}>
        {result}
      </pre>
    </div>
  );
}