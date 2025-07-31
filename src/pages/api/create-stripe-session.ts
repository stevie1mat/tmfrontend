import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY is not configured');
}

const stripe = new Stripe(stripeSecretKey as string, {
  apiVersion: '2025-06-30.basil',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { credits, price, email } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!credits || !price) {
    return res.status(400).json({ error: 'Missing credits or price' });
  }
  
  if (!email) {
    return res.status(400).json({ error: 'Missing customer email' });
  }

  try {
    console.log('🔍 Creating Stripe session with:', { credits, price, email });
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} TradeMinutes Credits`,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/credits?success=1`,
      cancel_url: `${req.headers.origin}/credits?canceled=1`,
      customer_email: email, // Collect customer email
      metadata: {
        credits: credits.toString(),
      },
    });
    
    console.log('✅ Stripe session created successfully:', session.id);
    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('❌ Stripe session error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      type: error.type,
      code: error.code
    });
    return res.status(500).json({ error: `Stripe session creation failed: ${error.message}` });
  }
} 