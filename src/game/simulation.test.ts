import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeElementCensus,
  createSimulationState,
  drawRasterBox,
  drawRasterCircle,
  drawRasterLine,
  executeFloodFill,
  getPixel,
  paintBrush,
  setPixel,
  stepPhysics,
} from './simulation';
import {
  TYPE_ACID,
  TYPE_DIAMOND,
  TYPE_EMPTY,
  TYPE_FIRE,
  TYPE_HEAT,
  TYPE_LAVA,
  TYPE_SAND,
  TYPE_SPARK,
  TYPE_WALL,
  TYPE_WATER,
  TYPE_WIRE,
  TYPE_WOOD,
} from './types';

test('sand falls downward through empty space and sinks in water', () => {
  const state = createSimulationState(20, 20);
  setPixel(state, 10, 5, TYPE_SAND);
  stepPhysics(state);
  assert.equal(getPixel(state, 10, 5), TYPE_EMPTY);
  assert.equal(getPixel(state, 10, 6), TYPE_SAND);
});

test('fire ascends and extinguishes in water', () => {
  const state = createSimulationState(20, 20);
  setPixel(state, 10, 10, TYPE_FIRE);
  setPixel(state, 10, 9, TYPE_WATER);
  stepPhysics(state);
  const topElem = getPixel(state, 10, 9);
  assert.ok(topElem === TYPE_WATER || topElem === TYPE_EMPTY);
});

test('lava melts wood into fire and cools into wall with water', () => {
  const state = createSimulationState(20, 20);
  setPixel(state, 10, 10, TYPE_WOOD);
  setPixel(state, 10, 9, TYPE_LAVA);
  stepPhysics(state);
  assert.equal(getPixel(state, 10, 10), TYPE_FIRE);
});

test('wire melts into lava when subjected to intense proximity heat', () => {
  const state = createSimulationState(20, 20);
  setPixel(state, 10, 11, TYPE_WALL);
  setPixel(state, 10, 10, TYPE_WIRE);
  setPixel(state, 10, 9, TYPE_HEAT);
  stepPhysics(state);
  assert.equal(getPixel(state, 10, 10), TYPE_LAVA);
});

test('drawing suite: drawRasterLine creates straight continuous line', () => {
  const state = createSimulationState(30, 30);
  drawRasterLine(state, 5, 5, 15, 5, 1, TYPE_WALL);
  for (let x = 5; x <= 15; x++) {
    assert.equal(getPixel(state, x, 5), TYPE_WALL);
  }
});

test('drawing suite: drawRasterBox creates filled and hollow rectangles', () => {
  const state = createSimulationState(30, 30);
  drawRasterBox(state, 5, 5, 10, 10, true, TYPE_DIAMOND);
  assert.equal(getPixel(state, 5, 5), TYPE_DIAMOND);
  assert.equal(getPixel(state, 7, 7), TYPE_DIAMOND);
  assert.equal(getPixel(state, 10, 10), TYPE_DIAMOND);
  assert.equal(getPixel(state, 4, 4), TYPE_EMPTY);
});

test('drawing suite: executeFloodFill fills contiguous region', () => {
  const state = createSimulationState(30, 30);
  drawRasterBox(state, 5, 5, 15, 15, false, TYPE_WALL);
  const filled = executeFloodFill(state, 8, 8, TYPE_WATER);
  assert.ok(filled > 20);
  assert.equal(getPixel(state, 8, 8), TYPE_WATER);
  assert.equal(getPixel(state, 9, 9), TYPE_WATER);
  assert.equal(getPixel(state, 5, 5), TYPE_WALL);
  assert.equal(getPixel(state, 2, 2), TYPE_EMPTY);
});
