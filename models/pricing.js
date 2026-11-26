const PACKAGE_DISCOUNT_PERCENT = 5;

function packagePrice(price) {
  const originalCents = Math.round(Number(price) * 100);
  const discountCents = Math.round(originalCents * PACKAGE_DISCOUNT_PERCENT / 100);
  return {
    original: originalCents / 100,
    discount: discountCents / 100,
    discounted: (originalCents - discountCents) / 100
  };
}

module.exports = {PACKAGE_DISCOUNT_PERCENT, packagePrice};
