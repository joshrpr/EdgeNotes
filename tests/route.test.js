'use strict';
const test = require('node:test');
const assert = require('node:assert');
const R = require('../web/js/route.js');

test('measures how deep a route sits', () => {
  assert.strictEqual(R.depth('/'), 0);
  assert.strictEqual(R.depth('/nope'), 0);
  assert.strictEqual(R.depth('/new'), 1);
  assert.strictEqual(R.depth('/knife/k1'), 1);
  assert.strictEqual(R.depth('/knife/k1/edit'), 2);
  assert.strictEqual(R.depth('/knife/k1/log'), 2);
  assert.strictEqual(R.depth('/knife/k1/log/s1'), 2);
  assert.strictEqual(R.depth('/knife/k1/photo'), 2);
});

test('cuts in when going deeper and out when coming back', () => {
  assert.strictEqual(R.direction('/', '/knife/k1'), 'in');
  assert.strictEqual(R.direction('/knife/k1', '/knife/k1/log'), 'in');
  assert.strictEqual(R.direction('/knife/k1/log', '/knife/k1'), 'out');
  assert.strictEqual(R.direction('/knife/k1', '/'), 'out');
  assert.strictEqual(R.direction('/knife/k1', '/new'), 'in');
  assert.strictEqual(R.direction('/', '/'), 'in');
});
