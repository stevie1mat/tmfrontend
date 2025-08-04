import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Validate Stripe configuration
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY is not configured');
  // Don't throw error during build time, just log it
  if (process.env.NODE_ENV === 'production') {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
}

// Only initialize Stripe if the secret key is available
let stripe: Stripe | null = null;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-06-30.basil',
  });
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  console.error('❌ STRIPE_WEBHOOK_SECRET is not configured');
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔔 Webhook received!');
    console.log('📋 Request headers:', Object.fromEntries(req.headers.entries()));
    
    const body = await req.text();
    console.log('📄 Request body length:', body.length);
    
    const signature = req.headers.get('stripe-signature');
    console.log('🔐 Stripe signature present:', !!signature);

    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      if (!webhookSecret) {
        throw new Error('Webhook secret not configured');
      }
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified');
      console.log('🎯 Event type:', event.type);
      console.log('🆔 Event ID:', event.id);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('💳 Processing checkout.session.completed event');
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('🎉 Processing completed checkout session:', session.id);
    console.log('📋 Session metadata:', session.metadata);
    console.log('👤 Customer details:', session.customer_details);
    
    // Extract credits from metadata
    const credits = parseInt(session.metadata?.credits || '0');
    const customerEmail = session.customer_details?.email;
    
    console.log(`💰 Credits to add: ${credits}`);
    console.log(`📧 Customer email: ${customerEmail}`);
    
    if (!credits || !customerEmail) {
      console.error('❌ Missing credits or customer email in session:', {
        sessionId: session.id,
        credits,
        customerEmail,
        metadata: session.metadata,
        customerDetails: session.customer_details
      });
      return;
    }

    console.log(`🔄 Adding ${credits} credits for customer: ${customerEmail}`);

    // Find user by email and update their credits
    await updateUserCredits(customerEmail, credits);
    
    console.log(`✅ Successfully added ${credits} credits for ${customerEmail}`);
  } catch (error) {
    console.error('❌ Error handling checkout session completed:', error);
    throw error;
  }
}

async function updateUserCredits(email: string, creditsToAdd: number) {
  try {
    // First, get the user by email from the auth service
    const authApiUrl = process.env.NEXT_PUBLIC_USER_API_URL || 'https://trademinutes-user-service.onrender.com';
    console.log('🔍 Auth API URL for webhook:', authApiUrl);
    console.log('🔍 Looking up user by email:', email);
    
    // Get user by email
    const userResponse = await fetch(`${authApiUrl}/api/auth/user-by-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    console.log('📡 User lookup response status:', userResponse.status);
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('❌ User lookup failed:', errorText);
      throw new Error(`Failed to find user with email: ${email} - Status: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    console.log('👤 User data found:', userData);
    
    const userId = userData.ID || userData.id;
    const currentCredits = userData.credits || 0;
    const newCredits = currentCredits + creditsToAdd;

    console.log(`💰 Updating credits for user ${userId}: ${currentCredits} -> ${newCredits}`);

    // Update user credits
    const updateResponse = await fetch(`${authApiUrl}/api/auth/update-credits`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        credits: newCredits,
        transactionType: 'purchase',
        amount: creditsToAdd,
        description: `Purchased ${creditsToAdd} credits via Stripe`,
      }),
    });

    console.log('📡 Credit update response status:', updateResponse.status);
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ Credit update failed:', errorText);
      throw new Error(`Failed to update user credits - Status: ${updateResponse.status}`);
    }

    const updateResult = await updateResponse.json();
    console.log('✅ Credit update result:', updateResult);
    console.log(`✅ Successfully updated credits for user ${userId}: ${currentCredits} -> ${newCredits}`);
  } catch (error) {
    console.error('❌ Error updating user credits:', error);
    throw error;
  }
} 