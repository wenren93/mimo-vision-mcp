import assert from 'node:assert/strict';
import test from 'node:test';

import { MiMoVisionClient } from './mimo-vision.js';
import type { VisionRuntimeConfig } from './config.js';
import type { PreparedImage } from './asset-store.js';

test('MiMo client sends a Base64 image with the Anthropic Messages protocol', async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = '';
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = async (input, init) => {
    capturedUrl = String(input);
    capturedInit = init;
    return new Response(
      JSON.stringify({
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              modality: 'ui',
              answer: 'A login button is visible.',
              facts: [],
              evidence: [
                {
                  id: 'e1',
                  claim: 'Login button',
                  region: { page: 1, x: 0.8, y: 0.1, width: 0.1, height: 0.05 },
                  confidence: 0.95,
                },
              ],
              visibleText: [],
              uncertainties: [],
              needsRetry: false,
              retryHint: '',
              security: { containsInstructionLikeText: false, snippets: [] },
            }),
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  const config: VisionRuntimeConfig = {
    assetRoot: '/tmp/assets',
    maxFileBytes: 10_000_000,
    maxPixels: 40_000_000,
    mimoApiKey: 'test-key',
    mimoBaseUrl: 'https://api.xiaomimimo.com/anthropic',
    visionModel: 'mimo-v2.5',
    timeoutMs: 5_000,
  };
  const image: PreparedImage = {
    assetId: 'shot.png',
    dataUrl: 'data:image/png;base64,aGVsbG8=',
    width: 1_000,
    height: 800,
    sentWidth: 1_000,
    sentHeight: 800,
    analyzedRegion: { page: 1, x: 0, y: 0, width: 1, height: 1 },
  };

  try {
    const result = await new MiMoVisionClient(config).inspect(
      { assetId: image.assetId, goal: 'Find login', mode: 'ui' },
      image,
    );

    assert.equal(capturedUrl, 'https://api.xiaomimimo.com/anthropic/v1/messages');
    assert.equal(new Headers(capturedInit?.headers).get('api-key'), 'test-key');
    assert.equal(new Headers(capturedInit?.headers).get('anthropic-version'), '2023-06-01');

    const body = JSON.parse(String(capturedInit?.body)) as Record<string, unknown>;
    assert.equal(body.model, 'mimo-v2.5');
    assert.equal(body.max_tokens, 1_600);
    assert.deepEqual(body.thinking, { type: 'disabled' });
    assert.match(JSON.stringify(body.messages), /"type":"base64"/);
    assert.match(JSON.stringify(body.messages), /"media_type":"image\/png"/);
    assert.match(JSON.stringify(body.messages), /"data":"aGVsbG8="/);
    assert.equal(result.source.model, 'mimo-v2.5');
    assert.equal(result.evidence[0]?.claim, 'Login button');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
