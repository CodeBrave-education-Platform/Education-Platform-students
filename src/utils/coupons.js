// Discount Coupon & Promo Code Validation Engine

export const VALID_COUPONS = [
  {
    code: 'JEE2026',
    discountType: 'percentage', // 'percentage' or 'flat'
    discountValue: 25, // 25% OFF
    description: '25% Special Discount on JEE Mains & Advanced Courses',
    minOrderValue: 999
  },
  {
    code: 'PWSTYLE',
    discountType: 'percentage',
    discountValue: 30, // 30% OFF
    description: 'PW Rankers Special 30% Discount',
    minOrderValue: 1499
  },
  {
    code: 'NEETRANK',
    discountType: 'percentage',
    discountValue: 20, // 20% OFF
    description: '20% Special Discount on NEET Medical Courses',
    minOrderValue: 999
  },
  {
    code: 'EARLYBIRD',
    discountType: 'flat',
    discountValue: 500, // ₹500 OFF
    description: 'Flat ₹500 Early Bird Savings',
    minOrderValue: 1999
  }
]

export function validateCoupon(code, orderPrice) {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Please enter a valid coupon code.' }
  }

  const cleanCode = code.trim().toUpperCase()
  const coupon = VALID_COUPONS.find(c => c.code === cleanCode)

  if (!coupon) {
    return { valid: false, error: 'Invalid promo code. Try "JEE2026" or "PWSTYLE".' }
  }

  if (orderPrice < coupon.minOrderValue) {
    return { valid: false, error: `Minimum order price of ₹${coupon.minOrderValue} required for promo code ${coupon.code}.` }
  }

  let discountAmount = 0
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round((orderPrice * coupon.discountValue) / 100)
  } else if (coupon.discountType === 'flat') {
    discountAmount = Math.min(coupon.discountValue, orderPrice)
  }

  const finalPrice = Math.max(0, orderPrice - discountAmount)

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    finalPrice,
    description: coupon.description
  }
}
