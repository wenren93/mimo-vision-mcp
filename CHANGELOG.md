# 更新日志

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.4.0] - 2026-08-17

### 新增
- 英文 Quick Start 文档
- GitHub Issue 模板（Bug Report / Feature Request）
- GitHub Pull Request 模板

### 改进
- `.env.example` 补充变量用途和默认值注释
- 替换仓库 URL 占位符

## [0.3.0] - 2025-07-16

### 新增
- `import_image` 工具：支持从本地路径安全导入图片
- 坐标映射：支持裁剪区域到原图坐标的双向转换
- Zod 严格校验所有 MiMo API 输出
- 单元测试和集成测试

### 改进
- 图片导入时自动重编码为 PNG，去除元数据
- 文件大小和像素数限制
- 路径遍历防护

## [0.2.0] - 2025-07-10

### 新增
- MCP Inspector 支持
- 浏览器截图集成示例
- 自托管 vLLM 部署指南

## [0.1.0] - 2025-07-01

### 新增
- 初始版本
- STDIO MCP Server
- MiMo-V2.5 图片理解客户端
- DeepSeek V4 Pro 端到端演示
