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

const payload = {
  reference_id: `ORDER-${Date.now()}`,
  items: [
    {
      reference_id: '123',
      name: 'Morango',
      quantity: 1,
      unit_amount: 550
    }
  ],
  redirect_url: 'http://127.0.0.1:3000/pedido/sucesso' // Test with 127.0.0.1
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
