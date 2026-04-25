# 自动广告海报生成网页工具（MVP）

## 技术栈
- Next.js (App Router)
- Tailwind CSS
- Canvas 模板渲染（无复杂 AI 图片 API）

## 功能覆盖
1. 输入国家、广告主题、目标年龄、广告风格、输出数量（MVP 固定 5）。
2. 根据国家映射本地语言（中文/日文/英文，其他默认英文）自动生成文案。
3. 海报固定尺寸 1254x1254。
4. 风格偏移动端优先、稳重、专业、信任感（金融咨询视觉）。
5. 限制内容：
   - 不使用真人照片（纯图形模板）
   - 文案过滤收益保证/下载PDF/CFA 等敏感词
6. 底部默认免责声明：
   - Educational content only. Not financial advice. Results are not guaranteed.
7. 每次生成 5 个版本。
8. 支持每个版本导出 PNG。

## 本地运行
```bash
npm install
npm run dev
```
打开 `http://localhost:3000`。
