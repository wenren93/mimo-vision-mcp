import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

import { childProcessEnv } from './config.js';

test('stdio server exposes image bridge and rejects an unsafe asset id', async () => {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const client = new Client({ name: 'vision-smoke-test', version: '0.1.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(projectRoot, 'dist', 'server.js')],
    cwd: projectRoot,
    env: {
      ...childProcessEnv(),
      MIMO_API_KEY: 'test-only-key',
      VISION_ASSET_ROOT: path.join(projectRoot, 'assets'),
    },
    stderr: 'pipe',
  });

  try {
    await client.connect(transport);
    const listed = await client.listTools();
    const inspectTool = listed.tools.find((tool) => tool.name === 'inspect_image');
    const importTool = listed.tools.find((tool) => tool.name === 'import_image');
    assert.ok(inspectTool);
    assert.ok(importTool);
    assert.equal(inspectTool.inputSchema.type, 'object');
    assert.equal(inspectTool.outputSchema?.type, 'object');

    const failed = await client.callTool({
      name: 'inspect_image',
      arguments: {
        assetId: '../secret.png',
        goal: 'read the image',
      },
    });
    assert.equal(failed.isError, true);
  } finally {
    await client.close();
  }
});
