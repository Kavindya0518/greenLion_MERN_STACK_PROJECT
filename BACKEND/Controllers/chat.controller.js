const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => null);

function buildLocalAnswer(message, context) {
  const m = String(message || '').toLowerCase();
  const name = context?.productName || '';
  const price = context?.price ? `LKR ${Number(context.price).toFixed(2)}` : '';
  if (m.includes('price') && name && price) return `${name} is priced at ${price}.`;
  if (m.includes('return') || m.includes('refund')) return 'Our return policy allows returns within 14 days in original condition with receipt.';
  if (m.includes('warranty')) return 'Most products include a 1-year limited warranty against manufacturing defects.';
  if (m.includes('shipping') || m.includes('delivery')) return 'Standard delivery is 2-5 business days. Express options may be available at checkout.';
  if (name) return `Here are details for ${name}. Ask about price, warranty, or availability.`;
  return 'How can I help you today? You can ask about products, pricing, shipping, or returns.';
}

async function askChat(req, res) {
  try {
    const { message, context } = req.body || {};
    const key = process.env.OPENAI_API_KEY;
    if (!key || !fetch) {
      const answer = buildLocalAnswer(message, context);
      return res.json({ ok: true, answer });
    }
    const prompt = `You are a concise assistant for an e-commerce site. Use the provided context if relevant. Keep answers under 80 words.\nContext: ${JSON.stringify(context || {})}\nUser: ${message}\nAssistant:`;
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful, concise assistant for an online store.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 180,
      })
    });
    if (!r.ok) {
      const answer = buildLocalAnswer(message, context);
      return res.json({ ok: true, answer });
    }
    const data = await r.json();
    const answer = data?.choices?.[0]?.message?.content?.trim() || buildLocalAnswer(message, context);
    return res.json({ ok: true, answer });
  } catch (e) {
    return res.status(200).json({ ok: true, answer: 'Sorry, I could not process that right now. Please try again.' });
  }
}

module.exports = { askChat };
