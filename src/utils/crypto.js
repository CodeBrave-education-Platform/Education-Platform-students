/**
 * True constant-time string comparison helper for V8 isolates
 * to block timing analysis attacks on cryptographic checks.
 */
export function timingSafeEqualEdge(strA, strB) {
  if (typeof strA !== 'string' || typeof strB !== 'string') return false;
  if (strA.length !== strB.length) return false;
  
  let result = 0;
  for (let i = 0; i < strA.length; i++) {
    result |= strA.charCodeAt(i) ^ strB.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Edge-Safe HMAC-SHA256 Signature Verification
 */
export async function verifyWebhookSignature(rawBody, signature, secret) {
  const encoder = new TextEncoder();
  
  // 1. Import the raw secret key using native Web Crypto APIs
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // 2. Compute the cryptographic signature over the raw text payload
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(rawBody)
  );
  
  // 3. Convert the ArrayBuffer result into a standard hex string
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // 4. Execute a secure bitwise check to block timing analysis attacks
  return timingSafeEqualEdge(expectedSignature, signature);
}
