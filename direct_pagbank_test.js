const fs = require('fs');

// Simple dotenv parser
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = envContent
  .split('\n')
  .filter(line => line.includes('='))
  .reduce((acc, line) => {
    const parts = line.split('=');
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    acc[key] = value;
    return acc;
  }, {});

const PAGBANK_TOKEN = env.PAGBANK_TOKEN;
const PAGBANK_URL = env.PAGBANK_ENV === 'production' 
  ? 'https://api.pagseguro.com/checkouts' 
  : 'https://sandbox.api.pagseguro.com/checkouts';

const baseUrl = env.NEXT_PUBLIC_BASE_URL || 'https://checkout-teste.nutrimay.com';

const payload = {
  reference_id: `ORDER-${Date.now()}`,
  customer_modifiable: true,
  items: [
    {
      reference_id: 'shaker-morango',
      name: 'Shaker Morango',
      quantity: 2,
      unit_amount: 2500
    },
    {
      reference_id: 'bolsa-termica',
      name: 'Bolsa Térmica',
      quantity: 1,
      unit_amount: 1000
    }
  ],
  payment_methods: [
    { type: "CREDIT_CARD", brands: ["MASTERCARD", "VISA", "ELO", "HIPERCARD", "AMEX"] },
    { type: "PIX" },
    { type: "BOLETO" },
  ],
  redirect_url: `${baseUrl}/pedido/sucesso`,
  return_url: `${baseUrl}/pedido/sucesso`,
  notification_urls: [`${baseUrl}/api/pagbank/webhook`],
  soft_descriptor: "MAYNUTRI",
  customer: {
    name: 'João da Silva',
    email: 'joao@exemplo.com',
    tax_id: '12345678909',
    phone: {
      country: '55',
      area: '11',
      number: '999999999'
    }
  }
};

async function test() {
  try {
    const res = await fetch(PAGBANK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const status = res.status;
    const text = await res.text();
    console.log('STATUS:', status);
    console.log('RESPONSE:', text);
  } catch (err) {
    console.log('ERROR:', err.message);
  }
}

test();
