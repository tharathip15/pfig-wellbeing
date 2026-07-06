const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm'));
  assert.ok(match, `Missing CSS rule for ${selector}`);
  return match[1];
}

function assertUses(selector, declaration) {
  assert.match(
    ruleBody(selector),
    new RegExp(declaration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `${selector} should include ${declaration}`
  );
}

function mediaBlocks(query) {
  const blocks = [];
  let searchFrom = 0;
  const mediaPrefix = `@media ${query}`;

  while (searchFrom < css.length) {
    const start = css.indexOf(mediaPrefix, searchFrom);
    if (start === -1) break;

    const open = css.indexOf('{', start);
    assert.notEqual(open, -1, `Missing opening brace for ${mediaPrefix}`);

    let depth = 0;
    let end = -1;
    for (let i = open; i < css.length; i += 1) {
      if (css[i] === '{') depth += 1;
      if (css[i] === '}') depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }

    assert.notEqual(end, -1, `Missing closing brace for ${mediaPrefix}`);
    blocks.push(css.slice(open + 1, end));
    searchFrom = end + 1;
  }

  assert.ok(blocks.length > 0, `Missing media query ${mediaPrefix}`);
  return blocks;
}

function mediaRuleBody(query, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm');
  const block = mediaBlocks(query).find(item => pattern.test(item));
  assert.ok(block, `Missing ${selector} rule inside @media ${query}`);
  return block.match(pattern)[1];
}

function assertMediaUses(query, selector, declaration) {
  assert.match(
    mediaRuleBody(query, selector),
    new RegExp(declaration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `${selector} should include ${declaration} inside @media ${query}`
  );
}

function assertNoDarkSurface(selector) {
  assert.doesNotMatch(
    ruleBody(selector),
    /rgba\((?:15,\s*23,\s*42|9,\s*13,\s*22|2,\s*6,\s*23|255,\s*255,\s*255),/i,
    `${selector} should not hard-code dark-theme surface colors in the base light-theme rule`
  );
}

test('light theme employee form controls use readable theme tokens', () => {
  assertUses('.form-control', 'background: var(--bg-input)');
  assertNoDarkSurface('.form-control');

  assertUses('.form-control:disabled', 'background: var(--bg-item)');
  assertUses('.form-control:disabled', 'color: var(--text-muted)');
  assertNoDarkSurface('.form-control:disabled');
});

test('light theme employee modal sections use readable theme tokens', () => {
  assertUses('.form-section-title', 'border-bottom: 1px solid var(--border-color)');
  assertNoDarkSurface('.form-section-title');

  assertUses('.month-record-grid', 'background: var(--bg-item)');
  assertUses('.month-record-grid', 'border: 1px solid var(--border-color)');
  assertNoDarkSurface('.month-record-grid');
});

test('employee modal collapses all grid-spanning labels on narrow screens', () => {
  assertMediaUses('(max-width: 600px)', '.form-section-title', 'grid-column: span 1');
});

test('light theme photo comparison cards avoid dark-only surfaces', () => {
  assertUses('.photo-preview-thumbnail', 'background: var(--bg-photo-frame)');
  assertNoDarkSurface('.photo-preview-thumbnail');

  assertUses('.btn-gallery-empty', 'background: var(--bg-btn-secondary)');
  assertUses('.btn-gallery-empty', 'border-color: var(--border-color)');
  assertNoDarkSurface('.btn-gallery-empty');

  assertUses('.comparison-card', 'background: var(--bg-item)');
  assertNoDarkSurface('.comparison-card');

  assertUses('.comparison-card-header', 'background: var(--bg-item-hover)');
  assertNoDarkSurface('.comparison-card-header');

  assertUses('.comparison-card-image', 'background: var(--bg-photo-frame)');
  assertNoDarkSurface('.comparison-card-image');

  assertUses('.comparison-card-image img', 'background: var(--bg-photo-frame)');
  assertNoDarkSurface('.comparison-card-image img');

  assertUses('.comparison-card-meta', 'border-top: 1px solid var(--border-color)');
  assertUses('.comparison-card-meta', 'background: var(--bg-item)');
  assertNoDarkSurface('.comparison-card-meta');
});

test('light theme toast uses readable theme tokens', () => {
  assertUses(':root', '--bg-toast: #ffffff');
  assertUses(':root', '--text-toast: #0f172a');
  assertUses('body.dark-theme', '--bg-toast: #1e293b');
  assertUses('body.dark-theme', '--text-toast: #f8fafc');

  assertUses('.toast', 'background: var(--bg-toast)');
  assertUses('.toast', 'border: 1px solid var(--border-color)');
  assertUses('.toast', 'color: var(--text-toast)');
});

test('weight range current marker keeps its label inside chart edges', () => {
  assertUses('.weight-range-pin.is-edge-left::after', 'left: 50%');
  assertUses('.weight-range-pin.is-edge-left::after', 'transform: none');
  assertUses('.weight-range-pin.is-edge-right::after', 'right: 50%');
  assertUses('.weight-range-pin.is-edge-right::after', 'transform: none');

  assert.match(appJs, /currentPinEdgeClass/, 'profile renderer should classify edge-positioned current weight pins');
  assert.match(appJs, /currentPct\s*<=\s*15/, 'left edge threshold should be explicit');
  assert.match(appJs, /currentPct\s*>=\s*85/, 'right edge threshold should be explicit');
  assert.match(appJs, /weight-range-pin\s+\$\{currentPinEdgeClass\}/, 'current pin markup should include edge class');
});

test('light theme weight range labels use theme surfaces', () => {
  assertUses('.weight-range-target-marker::after', 'background: var(--bg-modal)');
  assertUses('.weight-range-target-marker::after', 'border: 1px solid var(--border-color)');
  assertNoDarkSurface('.weight-range-target-marker::after');

  assertUses('.weight-range-pin::after', 'background: var(--bg-modal)');
  assertUses('.weight-range-pin::after', 'border: 1px solid var(--border-color)');
  assertNoDarkSurface('.weight-range-pin::after');
});
