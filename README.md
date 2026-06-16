# Excel 物资二维码批量生成工具

一个纯前端 Web 工具，用于从 Excel 表格中批量读取物资 ID，并生成可下载、可打印的二维码标签。

## 功能特性

- 上传 `.xlsx`、`.xls`、`.csv` 文件。
- 读取 Excel 表头并预览前 20 行数据。
- 指定任意一列作为物资 ID 列。
- 可选择一个附加显示字段，例如物资名称、规格或位置。
- 按 Excel 行顺序生成二维码，重复物资 ID 不去重。
- 空物资 ID 自动跳过，并显示跳过数量。
- 二维码标签上方显示二维码，下方显示物资 ID 和可选附加字段。
- 支持导出 ZIP，内部每条有效记录一张高清 PNG。
- 支持导出 A4 PDF。
- PDF 支持常用行列预设：`2x4`、`3x3`、`3x4`、`4x5`。
- PDF 支持自定义行数和列数。
- PDF 支持可选裁切线，默认关闭。
- PDF 会根据二维码尺寸和文字长度提示排版风险。
- 所有处理都在浏览器本地完成，不上传服务器。

## 技术栈

- React
- TypeScript
- Vite
- Vitest
- SheetJS `xlsx`
- `qrcode`
- `jszip`
- `jspdf`
- `lucide-react`

## 本地运行

```bash
npm install
npm run dev
```

默认开发地址：

```text
http://127.0.0.1:5173
```

如果需要指定端口：

```bash
npm run dev -- --port 4173
```

## 构建

```bash
npm run build
```

构建产物会生成到：

```text
dist/
```

## 测试

```bash
npm test
```

当前测试覆盖：

- 空物资 ID 跳过。
- 重复物资 ID 保留。
- 有效记录、空 ID、重复 ID 统计。
- PNG 文件名序号和非法字符处理。
- PDF A4 行列排版和拥挤风险判断。

## 使用流程

1. 打开网页。
2. 上传带表头的 Excel 文件。
3. 在「物资 ID 列」中选择用于生成二维码的列。
4. 可选一个「附加显示字段」。
5. 点击「应用字段」生成二维码预览。
6. 如需图片素材，点击「下载 ZIP」。
7. 如需打印，设置 A4 PDF 的行列数量。
8. 查看排版风险提示。
9. 点击「下载 PDF」。

## Excel 要求

- 第一行必须是表头。
- 物资 ID 列不能为空，否则对应行会被跳过。
- 附加字段可为空，字段为空时二维码标签只显示物资 ID。
- 重复物资 ID 会按 Excel 原始行顺序保留并生成多张标签。

## 导出规则

### ZIP

ZIP 内每条有效记录生成一张 PNG。

文件名格式：

```text
序号_物资ID.png
```

示例：

```text
001_WZ-2026-001.png
002_WZ-2026-001.png
003_WZ-2026-002.png
```

不适合作为文件名的字符会被替换为 `_`。

### PDF

- 纸张：A4 纵向。
- 每个单元格内包含一张二维码标签。
- 标签文字通过 Canvas 渲染为图片后写入 PDF，因此支持中文物资描述。
- 轻微拥挤时允许导出并提示风险。
- 严重拥挤时禁用 PDF 导出按钮。

## 已知说明

- 这是纯前端工具，适合本地处理可信 Excel 文件。
- `xlsx` 和 `jspdf` 依赖在 `npm audit` 中存在上游安全提示。如果需要公开部署给多人上传陌生文件，建议后续替换依赖或改为服务端隔离处理。
- 由于包含 Excel、二维码、ZIP、PDF 相关库，生产构建会出现 bundle 体积提示，不影响功能。

## 项目结构

```text
src/
  App.tsx              主界面和交互状态
  styles.css           页面样式
  lib/
    excel.ts           Excel 解析
    records.ts         物资记录标准化和统计
    filenames.ts       PNG 文件名生成
    layout.ts          PDF 行列排版和风险判断
    qr.ts              二维码与标签图片生成
    exporters.ts       ZIP 和 PDF 导出
    *.test.ts          核心逻辑测试
docs/
  superpowers/specs/   产品需求文档
  product-design/      UI 设计提示词
outputs/               验证截图和测试导出文件
```

## License

未指定。
