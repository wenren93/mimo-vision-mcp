# 贡献指南

感谢你对本项目的关注！以下是参与贡献的方式。

## 开发环境

```bash
git clone https://github.com/wenren93/vision-mcp-typescript.git
cd vision-mcp-typescript
npm install
cp .env.example .env
# 编辑 .env 填入你的 API Key
```

## 常用命令

```bash
npm run build    # 编译 TypeScript
npm run dev      # 开发模式运行 MCP Server
npm test         # 运行测试
npm run demo     # 运行端到端演示
```

## 提交规范

- 使用清晰的 commit message，说明改动的目的
- 一个 PR 只做一件事
- 确保 `npm test` 通过后再提交

## Pull Request 流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交改动并推送
4. 创建 Pull Request，描述改动内容和原因

## 报告问题

- 使用 GitHub Issues 报告 bug
- 说明复现步骤、期望行为和实际行为
- 包含环境信息（Node.js 版本、操作系统等）

## 安全问题

如果发现安全漏洞，请**不要**公开 Issue。请参阅 [SECURITY.md](SECURITY.md) 了解报告方式。

## 行为准则

参与本项目即表示你同意遵守 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。
