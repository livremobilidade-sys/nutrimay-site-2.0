async function test() {
  const payload = {
    items: [
      { id: 1, name: 'Morango', quantity: 2, price: 5.50 }
    ],
    thermalBagOption: 'new',
    pickupPoint: 'Smart Fit - Centro'
  };

  try {
    const res = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('RESPONSE:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('ERROR:', err.message);
  }
}

test();
