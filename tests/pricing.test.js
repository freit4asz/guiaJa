const test = require('node:test');
const assert = require('node:assert/strict');
const {packagePrice} = require('../models/pricing');

test('applies a 5% package discount and rounds currency to cents', () => {
  assert.deepEqual(packagePrice('1990.00'), {
    original: 1990,
    discount: 99.5,
    discounted: 1890.5
  });
  assert.deepEqual(packagePrice('1999.99'), {
    original: 1999.99,
    discount: 100,
    discounted: 1899.99
  });
});
