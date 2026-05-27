/**
 * ASENTRA Payment Gateway SDK Integrations (Razorpay & Stripe)
 * 
 * This utility provides standard helper functions to load dynamic payment gateway SDKs
 * in Next.js browser environments, enabling direct UPI and Credit Card checkout flows.
 */

/**
 * 1. RAZORPAY INTEGRATION ACTIONS
 */

/**
 * Dynamically loads the Razorpay checkout script into the page DOM.
 * @returns {Promise<boolean>} Promise resolving when script is successfully loaded
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    
    // If Razorpay is already available, resolve immediately
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Initiates a secure payment gateway checkout session using Razorpay SDK.
 * 
 * @param {Object} config Configurations for Razorpay transaction
 * @param {string} config.key Public Razorpay Test or Live Key ID (e.g. 'rzp_test_xxxx')
 * @param {number} config.amount Transaction amount in Paise/Cents (e.g. 499900 for ₹4999.00)
 * @param {string} config.currency Standard ISO Currency code (default: 'INR')
 * @param {string} config.courseName Name of course being bought
 * @param {string} config.description Short payment description
 * @param {string} config.userEmail Prefilled user email
 * @param {string} config.userPhone Prefilled user contact number
 * @param {Function} config.onSuccess Success payment callback handler
 * @param {Function} config.onDismiss Modal closed callback handler
 */
export async function initiateRazorpayCheckout({
  key = 'rzp_test_YOUR_KEY_HERE', // REPLACE WITH LIVE KEY ID
  amount,
  currency = 'INR',
  courseName,
  description = 'Premium Prep Enrollment Ledger',
  userEmail = '',
  userPhone = '',
  onSuccess,
  onDismiss
}) {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error('Failed to load Razorpay Payment Gateway SDK script. Check internet connectivity.');
  }

  const options = {
    key: key,
    amount: amount, // Amount in lowest currency subunit (paise)
    currency: currency,
    name: 'ASENTRA ACADEMY',
    description: `${courseName} - ${description}`,
    image: 'https://db.uggatacexipoidzhcjhx.supabase.co/storage/v1/render/image/public/assets/logo.png', // Optional brand asset icon
    handler: function (response) {
      // payment_id is returned on success
      if (onSuccess) {
        onSuccess({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature
        });
      }
    },
    prefill: {
      name: '',
      email: userEmail,
      contact: userPhone
    },
    notes: {
      platform: 'ASENTRA',
      course_id: courseName
    },
    theme: {
      color: '#2563EB' // Brand Indigo/Blue hex matching color scheme
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) {
          onDismiss();
        }
      }
    }
  };

  const paymentObject = new window.Razorpay(options);
  paymentObject.open();
}

/**
 * 2. STRIPE INTEGRATION ACTIONS
 */

/**
 * Helper template to redirect to Stripe Hosted Checkout Sessions.
 * Typically Stripe checkout sessions are created server-side via Node SDK
 * to keep private Stripe API keys secure, and then returned to Client for redirection.
 * 
 * @param {string} sessionId Checkout Session ID returned from backend (e.g. 'cs_test_xxx')
 * @param {string} publishableKey Stripe Publishable Key (e.g. 'pk_test_xxx')
 */
export async function redirectToStripeCheckout({
  sessionId,
  publishableKey = 'pk_test_YOUR_STRIPE_KEY_HERE'
}) {
  if (typeof window === 'undefined') return;
  
  // Dynamically load Stripe.js script
  const stripeLoaded = await new Promise((resolve) => {
    if (window.Stripe) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  if (!stripeLoaded) {
    throw new Error('Failed to load Stripe Checkout SDK script.');
  }

  const stripe = window.Stripe(publishableKey);
  const { error } = await stripe.redirectToCheckout({
    sessionId: sessionId
  });

  if (error) {
    console.error('Stripe Redirection Exception:', error);
    throw error;
  }
}
