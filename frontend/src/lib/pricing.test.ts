import assert from 'node:assert/strict';
import test from 'node:test';
import { calcLineTotal } from './pricing';

const product = {
  id: 1,
  name: 'Cà phê sữa',
  price: 35000,
  imageUrl: '/images/cf-sua.jpg',
};

test('uses base price for default size M with no toppings', () => {
  assert.equal(calcLineTotal(product, 'M', [], 1), 35000);
});

test('applies size L and topping price correctly', () => {
  assert.equal(calcLineTotal(product, 'L', ['tran-chau'], 1), 55000);
});

test('multiplies line total by quantity', () => {
  assert.equal(calcLineTotal(product, 'L', ['tran-chau'], 2), 110000);
});

test('applies size S discount and multiple toppings', () => {
  assert.equal(calcLineTotal(product, 'S', ['kem', 'pudding'], 1), 57000);
});
