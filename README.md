# Vision MCP Server (TypeScript)

A local [Model Context Protocol](https://github.com/modelcontextprotocol/typescript-sdk) server that wraps Xiaomi's [MiMo-V2.5](https://huggingface.co/XiaomiMiMo/MiMo-V2.5) multimodal model as a vision tool for AI agents.

```text
Text Agent (e.g. DeepSeek / Claude)
  → MCP Client → inspect_image tool
  → Local image sandbox + Sharp crop/scale
  → MiMo-V2.5 (vision model, Anthropic Messages API)
  → VisualObservation JSON
  → Agent continues reasoning
```

### Prerequisites

- Node.js >= 20
- A [Xiaomi MiMo API key](https://mimo.mi.com/docs/en-US/quick-start/usage-guide/multimodal-understanding/image-understanding)

### Quick Start

```bash
git clone https://github.com/wenren93/vision-mcp-typescript.git
cd vision-mcp-typescript
npm install
cp .env.example .env
# Edit .env and set MIMO_API_KEY
npm run build
npm run demo -- /path/to/image.png "What is in this image?"
```

### Run as MCP Server

```bash
npm run start              # STDIO mode
npm run inspect            # MCP Inspector UI
```

### Integrate with Claude

```bash
claude mcp add vision \
  -e MIMO_API_KEY='your-key' \
  -e MIMO_BASE_URL='https://api.xiaomimimo.com/anthropic' \
  -e VISION_MODEL='mimo-v2.5' \
  -e VISION_ASSET_ROOT='/absolute/path/to/assets' \
  -- node /absolute/path/to/dist/server.js
```

> 📖 Full documentation in [中文](#中文文档) below.

---

# 中文文档 — 本地 MiMo 视觉 MCP（TypeScript）

这是一套不经过 OpenRouter 的完整链路：

```text
DeepSeek V4 Pro（纯文本主 Agent，Anthropic Messages 兼容 API）
  -> MCP Client
  -> 本地 inspect_image 工具
  -> 本地图片沙箱 + Sharp 裁剪/缩放
  -> MiMo-V2.5（Anthropic Messages 兼容 API）
  -> VisualObservation JSON
  -> DeepSeek 继续推理或操作浏览器
```

MiMo-V2.5 原生支持文本、图片、视频和音频输入，因此这里只把它当成任务条件化的“视觉传感器”。DeepSeek 仍负责规划、工具调用和最终回答。

项目包含：

- `src/server.ts`：STDIO Vision MCP Server。
- `src/mimo-vision.ts`：MiMo-V2.5 图片理解客户端。
- `src/demo-agent.ts`：DeepSeek 官方 API + MCP 工具循环的完整演示。
- `src/add-asset.ts`：安全导入本地图片。
- `src/asset-store.ts`：文件边界、重编码、裁剪和坐标映射。
- `src/schemas.ts`：MiMo 输出及 MCP 输出的 Zod Schema。

项目使用 MCP TypeScript SDK v2 的 `@modelcontextprotocol/server` 和 `@modelcontextprotocol/client`，需要 Node.js 20 或以上。[MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## 1. 推荐方式：本地 MCP + 小米 MiMo API

安装：

```bash
cd vision-mcp-typescript
npm install
cp .env.example .env
```

编辑 `.env`：

```dotenv
# MCP 视觉工具需要
MIMO_API_KEY=你的小米MiMo密钥
MIMO_BASE_URL=https://api.xiaomimimo.com/anthropic
VISION_MODEL=mimo-v2.5

# 仅端到端 Demo Agent 需要
DEEPSEEK_API_KEY=你的DeepSeek密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com/anthropic
TEXT_MODEL=deepseek-v4-pro

VISION_ASSET_ROOT=./assets
VISION_MAX_FILE_MB=10
VISION_MAX_PIXELS=40000000
VISION_TIMEOUT_MS=45000
```

MiMo 请求地址是 `https://api.xiaomimimo.com/anthropic/v1/messages`。图片采用 Anthropic content block：`type=image`，`source.type=base64`，并分别传递 `media_type` 和纯 Base64 数据，不需要公网图片 URL。[MiMo 图片理解](https://mimo.mi.com/docs/en-US/quick-start/usage-guide/multimodal-understanding/image-understanding)；[MiMo Anthropic Messages API](https://mimo.mi.com/docs/en-US/api/chat/anthropic-api)

## 2. 一条命令验证完整链路

```bash
npm run demo -- /绝对路径/page.png "图中登录按钮在哪里？"
```

执行过程：

1. 图片被重编码为 PNG，并生成随机 `assetId`。
2. Demo 启动本地 MCP Server 并读取工具列表。
3. DeepSeek V4 Pro 决定调用 `inspect_image`。
4. MCP Server 将受控图片发送给 `mimo-v2.5`。
5. MiMo 返回 OCR、视觉证据和归一化坐标。
6. Zod 校验输出，并把局部裁剪坐标映射回原图。
7. DeepSeek 基于视觉观察生成回答。

DeepSeek 端使用 `https://api.deepseek.com/anthropic/v1/messages`，模型 ID 为 `deepseek-v4-pro`，没有经过第三方路由。[DeepSeek Anthropic API](https://api-docs.deepseek.com/guides/anthropic_api/)；[DeepSeek Tool Calls](https://api-docs.deepseek.com/guides/tool_calls)

## 3. 单独运行 MCP Server

MCP Server 本身只需要 `MIMO_API_KEY`：

```bash
npm run build
npm run start
```

使用 MCP Inspector：

```bash
npm run inspect
```

先导入测试图片：

```bash
npm run add-asset -- /绝对路径/page.png
```

MCP Server 也提供 `import_image` 桥接工具。Claude 可以先调用
`import_image({ sourcePath })`，再把返回的 `assetId` 传给 `inspect_image`：

```bash
claude mcp add vision \
  -e MIMO_API_KEY='你的 MiMo API Key' \
  -e MIMO_BASE_URL='https://api.xiaomimimo.com/anthropic' \
  -e VISION_MODEL='mimo-v2.5' \
  -e VISION_ASSET_ROOT='/绝对路径/vision-mcp-typescript/assets' \
  -- node /绝对路径/vision-mcp-typescript/dist/server.js
```

调用顺序：

```text
import_image({ sourcePath: "/你的路径/page.png" })
→ { assetId: "img_....png" }
→ inspect_image({ assetId: "img_....png", goal: "找到登录按钮" })
```

导入时会重编码为 PNG 并复制到 `VISION_ASSET_ROOT` 沙箱。

调用参数：

```json
{
  "assetId": "img_生成的ID.png",
  "goal": "找到登录按钮并返回位置",
  "mode": "ui",
  "resolution": "auto"
}
```

## 4. 接入自己的 Agent

复制 `mcp.config.example.json`，把路径及密钥改成实际值：

```json
{
  "mcpServers": {
    "vision": {
      "command": "node",
      "args": ["/绝对路径/vision-mcp-typescript/dist/server.js"],
      "env": {
        "MIMO_API_KEY": "你的密钥",
        "MIMO_BASE_URL": "https://api.xiaomimimo.com/anthropic",
        "VISION_MODEL": "mimo-v2.5",
        "VISION_ASSET_ROOT": "/绝对路径/vision-mcp-typescript/assets"
      }
    }
  }
}
```

如果 Agent Harness 使用 Anthropic Messages，可参考 `src/demo-agent.ts`：

1. `client.listTools()` 读取 MCP 工具。
2. 将 MCP Schema 映射为 `tools[].name/description/input_schema`。
3. 收到 `content[].type=tool_use` 后执行 `client.callTool()`。
4. 将 `structuredContent` 放入用户消息的 `tool_result` content block 回填 DeepSeek。

## 5. 把 MiMo-V2.5 推理也部署到本地

应用和 MCP 部分仍然使用 TypeScript；模型推理层可使用支持 Anthropic Messages API 的 vLLM。启动兼容服务后，只需修改：

```dotenv
MIMO_BASE_URL=http://127.0.0.1:8000
MIMO_API_KEY=local
VISION_MODEL=mimo-v2.5
```

vLLM 已提供 `/v1/messages` Anthropic 兼容端点。核心启动方式如下，实际并行参数必须按 GPU 集群调整：

```bash
vllm serve XiaomiMiMo/MiMo-V2.5 \
  --served-model-name mimo-v2.5 \
  --host 127.0.0.1 \
  --port 8000 \
  --trust-remote-code \
  --reasoning-parser qwen3
```

MiMo-V2.5 是 310B 总参数、15B 激活参数的 FP8 MoE。15B 只是每个 token 的激活量，不代表只需加载 15B 权重；普通个人电脑无法实用地承载原始模型。官方参考部署采用多 GPU 并行。[MiMo-V2.5 模型卡与部署](https://huggingface.co/XiaomiMiMo/MiMo-V2.5)；[vLLM Anthropic Messages API](https://docs.vllm.ai/en/stable/serving/online_serving/)

这样图片不会离开本机；但示例中的 DeepSeek 主 Agent 仍调用 DeepSeek 官方 API。若要求整条链路完全离线，还需要另外自托管主文本模型。

## 6. 浏览器截图接入

浏览器执行器把当前 viewport 截图写进 `VISION_ASSET_ROOT`：

```ts
const assetId = `shot_${crypto.randomUUID()}.png`;
await page.screenshot({
  path: path.join(process.env.VISION_ASSET_ROOT!, assetId),
  fullPage: false,
});
```

`inspect_image` 返回 0..1 坐标。点击中心点：

```ts
const clickX = (box.x + box.width / 2) * viewport.width;
const clickY = (box.y + box.height / 2) * viewport.height;
await page.mouse.click(clickX, clickY);
```

仍建议 DOM/Accessibility Tree 优先、视觉兜底。点击前重新截图，避免滚动、动画或弹窗令坐标失效。

## 7. JSON 输出和安全边界

MiMo 的 Anthropic 兼容文档目前没有声明 `response_format` 或严格 JSON Schema 参数，因此本项目不发送 OpenAI 专属字段，而是执行：系统提示要求纯 JSON、提示词内嵌 Schema、JSON 解析、Zod 严格校验。不合规结果直接失败，不会把半结构化文本交给主 Agent。

- MCP 参数只接受 `assetId`，不接受任意 URL 或绝对路径。
- 图片只能从 `VISION_ASSET_ROOT` 读取，导入时重编码并去除元数据。
- 限制文件大小和最大像素数，降低图片炸弹风险。
- 图片中的文字被视为不可信数据，不能作为 Agent 指令。
- STDIO 的 stdout 是 MCP JSON-RPC 通道；日志只能写入 stderr。

## 8. 开发

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 类型检查
npm run typecheck

# 代码检查
npm run lint
npm run lint:fix

# 代码格式化
npm run format
npm run format:check

# 运行测试
npm test
```

测试不调用外部模型，会验证图片导入、裁剪映射以及真实 STDIO MCP 握手。上线前建议增加中文 OCR、网页 UI、模糊截图、图表和图片提示注入回归样本。

## 9. 贡献

欢迎贡献！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

## 10. 许可证

本项目采用 [MIT 许可证](LICENSE)。
