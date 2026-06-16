import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Grid3X3,
  Loader2,
  QrCode,
  RefreshCw,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { parseWorkbook, type ParsedWorkbook } from './lib/excel';
import { calculatePdfLayout, getRiskMessage, PDF_PRESETS } from './lib/layout';
import { buildMaterialRecords, summarizeRecords } from './lib/records';
import { createQrDataUrl } from './lib/qr';
import { downloadBlob, exportPdf, exportZip } from './lib/exporters';
import type { LayoutRisk, MaterialRecord } from './lib/types';

type QrPreview = {
  key: string;
  dataUrl: string;
};

const SAMPLE_WORKBOOK: ParsedWorkbook = {
  fileName: '示例物资清单.xlsx',
  fileSize: 128 * 1024,
  headers: ['物资编码', '物资名称', '规格型号', '存放位置', '数量'],
  rows: [
    { 物资编码: 'WZ-2026-001', 物资名称: '工业传感器', 规格型号: 'S-220', 存放位置: 'A区-03架', 数量: 12 },
    { 物资编码: 'WZ-2026-002', 物资名称: '控制模块', 规格型号: 'CM-18', 存放位置: 'B区-01架', 数量: 4 },
    { 物资编码: 'WZ-2026-003', 物资名称: '温控阀门', 规格型号: 'TV-90', 存放位置: 'C区-02架', 数量: 7 },
    { 物资编码: '', 物资名称: '空白测试行', 规格型号: 'NA', 存放位置: '待确认', 数量: 1 },
    { 物资编码: 'WZ-2026-001', 物资名称: '工业传感器备用件', 规格型号: 'S-220', 存放位置: 'A区-05架', 数量: 2 },
  ],
  previewRows: [],
};
SAMPLE_WORKBOOK.previewRows = SAMPLE_WORKBOOK.rows;

function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [materialColumn, setMaterialColumn] = useState('');
  const [extraColumn, setExtraColumn] = useState('');
  const [rows, setRows] = useState(4);
  const [columns, setColumns] = useState(3);
  const [showCutLines, setShowCutLines] = useState(false);
  const [status, setStatus] = useState('等待上传');
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState<'zip' | 'pdf' | ''>('');
  const [qrPreviews, setQrPreviews] = useState<QrPreview[]>([]);
  const [previewMode, setPreviewMode] = useState<'grid' | 'page'>('grid');

  const records = useMemo(() => {
    if (!workbook || !materialColumn) {
      return [];
    }
    return buildMaterialRecords(workbook.rows, materialColumn, extraColumn || undefined);
  }, [extraColumn, materialColumn, workbook]);

  const summary = useMemo(() => {
    if (!workbook || !materialColumn) {
      return { validCount: 0, skippedBlankIdCount: 0, duplicateIdCount: 0 };
    }
    return summarizeRecords(workbook.rows, records, materialColumn);
  }, [materialColumn, records, workbook]);

  const layout = useMemo(() => {
    const longestMaterialIdLength = Math.max(0, ...records.map((record) => record.materialId.length));
    const longestExtraTextLength = Math.max(0, ...records.map((record) => record.extraText.length));
    return calculatePdfLayout({
      rows,
      columns,
      recordCount: records.length,
      longestMaterialIdLength,
      longestExtraTextLength,
    });
  }, [columns, records, rows]);

  async function handleFile(file: File) {
    setError('');
    setStatus('解析中');
    try {
      const parsed = await parseWorkbook(file);
      setWorkbook(parsed);
      setMaterialColumn('');
      setExtraColumn('');
      setQrPreviews([]);
      setStatus('已解析');
    } catch (nextError) {
      setWorkbook(null);
      setStatus('解析失败');
      setError(nextError instanceof Error ? nextError.message : '文件解析失败');
    }
  }

  async function refreshPreview(nextRecords: MaterialRecord[] = records) {
    const previews = await Promise.all(
      nextRecords.slice(0, 12).map(async (record, index) => ({
        key: `${record.sourceRowNumber}-${index}`,
        dataUrl: await createQrDataUrl(record.qrContent, 180),
      })),
    );
    setQrPreviews(previews);
  }

  async function applyFields() {
    if (!materialColumn) {
      return;
    }
    await refreshPreview();
  }

  function loadSampleData() {
    setWorkbook(SAMPLE_WORKBOOK);
    setMaterialColumn('物资编码');
    setExtraColumn('物资名称');
    setStatus('已解析');
    setError('');
    setTimeout(() => {
      const sampleRecords = buildMaterialRecords(SAMPLE_WORKBOOK.rows, '物资编码', '物资名称');
      void refreshPreview(sampleRecords);
    }, 0);
  }

  function resetAll() {
    setWorkbook(null);
    setMaterialColumn('');
    setExtraColumn('');
    setRows(4);
    setColumns(3);
    setShowCutLines(false);
    setStatus('等待上传');
    setError('');
    setQrPreviews([]);
  }

  async function handleZipExport() {
    if (!records.length) {
      return;
    }
    setExporting('zip');
    try {
      const blob = await exportZip(records);
      downloadBlob(blob, '物资二维码PNG.zip');
    } finally {
      setExporting('');
    }
  }

  async function handlePdfExport() {
    if (!records.length || layout.risk === 'blocked') {
      return;
    }
    setExporting('pdf');
    try {
      const blob = await exportPdf(records, layout, showCutLines);
      downloadBlob(blob, '物资二维码A4排版.pdf');
    } finally {
      setExporting('');
    }
  }

  const currentStep = !workbook ? 0 : !materialColumn || !records.length ? 1 : exporting ? 3 : 2;
  const canExport = records.length > 0;
  const visibleRows = workbook?.previewRows ?? [];
  const fileStatus = workbook ? workbook.fileName : '未上传文件';

  return (
    <main className="app-shell">
      <header className="command-bar">
        <div className="brand-block">
          <span className="brand-icon">
            <QrCode size={20} />
          </span>
          <div>
            <h1>Excel 物资二维码批量生成工具</h1>
            <p>本地处理 · 不上传服务器 · 支持 ZIP / A4 PDF</p>
          </div>
        </div>
        <div className="command-actions">
          <span className="status-pill">本地处理</span>
          <span className="file-chip">{fileStatus}</span>
          <button className="ghost-button" onClick={resetAll}>
            <RotateCcw size={16} />
            清空重置
          </button>
        </div>
      </header>

      <section className="stepper" aria-label="处理步骤">
        {['上传 Excel', '选择字段', '预览二维码', '导出文件'].map((step, index) => (
          <div className={`step ${index <= currentStep ? 'active' : ''}`} key={step}>
            <span>{index < currentStep ? <CheckCircle2 size={16} /> : index + 1}</span>
            {step}
          </div>
        ))}
      </section>

      <section className="workspace">
        <aside className="panel data-panel">
          <PanelHeader title="Excel 数据源" subtitle="上传带表头的 Excel 文件，预览前 20 行" status={status} />

          <div
            className="upload-zone"
            onClick={() => fileInputRef.current?.click()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files[0];
              if (file) void handleFile(file);
            }}
            onDragOver={(event) => event.preventDefault()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <Upload size={24} />
            <strong>{workbook ? workbook.fileName : '拖拽 Excel 到这里'}</strong>
            <span>
              {workbook
                ? `${formatFileSize(workbook.fileSize)} · 共 ${workbook.rows.length} 行 · ${workbook.headers.length} 列`
                : '支持 .xlsx / .xls / .csv，Excel 必须包含表头'}
            </span>
            <button className="primary-button" type="button">
              {workbook ? '更换文件' : '选择文件'}
            </button>
          </div>

          <button className="text-button" onClick={loadSampleData}>
            <FileSpreadsheet size={15} />
            使用示例数据体验
          </button>

          {error && <div className="error-banner">{error}</div>}

          <div className="field-card">
            <h3>字段映射</h3>
            <label>
              <span>物资 ID 列 *</span>
              <select value={materialColumn} onChange={(event) => setMaterialColumn(event.target.value)}>
                <option value="">请选择物资 ID 列</option>
                {workbook?.headers.map((header) => (
                  <option value={header} key={header}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>附加显示字段</span>
              <select value={extraColumn} onChange={(event) => setExtraColumn(event.target.value)}>
                <option value="">不显示附加字段</option>
                {workbook?.headers.map((header) => (
                  <option value={header} key={header}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
            <p>物资 ID 写入二维码内容，附加字段只显示在标签第二行。</p>
            <button className="primary-button full-width" disabled={!materialColumn} onClick={() => void applyFields()}>
              应用字段
            </button>
          </div>

          <div className="metrics-row">
            <Metric label="有效记录" value={summary.validCount} />
            <Metric label="跳过空 ID" value={summary.skippedBlankIdCount} />
            <Metric label="重复 ID" value={summary.duplicateIdCount} />
          </div>

          <DataPreview
            headers={workbook?.headers ?? []}
            rows={visibleRows}
            materialColumn={materialColumn}
            extraColumn={extraColumn}
          />
        </aside>

        <section className="panel preview-panel">
          <div className="panel-heading split">
            <div>
              <h2>二维码标签预览</h2>
              <p>按 Excel 行顺序生成，重复 ID 保留</p>
            </div>
            <span className="status-pill light">预览 {Math.min(records.length, 12)} / {records.length}</span>
          </div>

          <div className="preview-toolbar">
            <div className="segmented">
              <button className={previewMode === 'grid' ? 'selected' : ''} onClick={() => setPreviewMode('grid')}>
                <Grid3X3 size={15} />
                网格
              </button>
              <button className={previewMode === 'page' ? 'selected' : ''} onClick={() => setPreviewMode('page')}>
                A4 单页
              </button>
            </div>
            <button className="icon-button" onClick={() => void refreshPreview()} disabled={!records.length}>
              <RefreshCw size={16} />
            </button>
          </div>

          {records.length ? (
            previewMode === 'grid' ? (
              <div className="qr-grid">
                {records.slice(0, 12).map((record, index) => (
                  <QrLabel
                    key={`${record.sourceRowNumber}-${record.materialId}-${index}`}
                    record={record}
                    dataUrl={qrPreviews[index]?.dataUrl}
                  />
                ))}
              </div>
            ) : (
              <A4Preview
                records={records}
                previews={qrPreviews}
                rows={layout.rows}
                columns={layout.columns}
                showCutLines={showCutLines}
              />
            )
          ) : (
            <div className="empty-preview">
              <QrCode size={44} />
              <strong>上传 Excel 后将在这里预览二维码标签</strong>
              <span>支持批量生成 PNG 和 A4 PDF</span>
            </div>
          )}
        </section>

        <aside className="panel export-panel">
          <PanelHeader title="导出设置" subtitle="生成 ZIP 图片包或 A4 PDF" />

          <div className="export-card">
            <div className="export-title">
              <Archive size={18} />
              <div>
                <h3>PNG 图片包</h3>
                <p>每条有效记录生成一张高清 PNG</p>
              </div>
            </div>
            <span className="filename-rule">文件名：序号_物资ID.png</span>
            <button className="primary-button full-width" disabled={!canExport || exporting === 'pdf'} onClick={() => void handleZipExport()}>
              {exporting === 'zip' ? <Loader2 className="spin" size={16} /> : <Download size={16} />}
              {exporting === 'zip' ? '生成中...' : `下载 ZIP（${records.length} 张）`}
            </button>
          </div>

          <div className="export-card">
            <div className="export-title">
              <FileSpreadsheet size={18} />
              <div>
                <h3>A4 PDF 排版</h3>
                <p>A4 纵向 · 自动分页 · 每页 {layout.itemsPerPage} 个</p>
              </div>
            </div>

            <div className="preset-grid">
              {PDF_PRESETS.map((preset) => (
                <button
                  className={preset.rows === rows && preset.columns === columns ? 'selected' : ''}
                  key={preset.label}
                  onClick={() => {
                    setRows(preset.rows);
                    setColumns(preset.columns);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="number-grid">
              <label>
                <span>列数</span>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={columns}
                  onChange={(event) => setColumns(Number(event.target.value))}
                />
              </label>
              <label>
                <span>行数</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={rows}
                  onChange={(event) => setRows(Number(event.target.value))}
                />
              </label>
            </div>

            <label className="toggle-row">
              <span>
                <strong>显示裁切线</strong>
                <em>普通 A4 裁剪时开启，贴纸纸可关闭</em>
              </span>
              <input type="checkbox" checked={showCutLines} onChange={(event) => setShowCutLines(event.target.checked)} />
            </label>

            <div className="layout-stats">
              <Metric label="单页数量" value={layout.itemsPerPage} />
              <Metric label="总页数" value={layout.totalPages} />
              <Metric label="二维码边长" value={`${layout.qrSizeMm.toFixed(1)}mm`} />
            </div>

            <RiskNotice risk={layout.risk} />

            <button
              className="primary-button full-width"
              disabled={!canExport || layout.risk === 'blocked' || exporting === 'zip'}
              onClick={() => void handlePdfExport()}
            >
              {exporting === 'pdf' ? <Loader2 className="spin" size={16} /> : <Download size={16} />}
              {exporting === 'pdf' ? '生成 PDF 中...' : '下载 PDF'}
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}

function PanelHeader({ title, subtitle, status }: { title: string; subtitle: string; status?: string }) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {status && <span className={`parse-status ${status === '解析失败' ? 'error' : status === '已解析' ? 'success' : ''}`}>{status}</span>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function DataPreview({
  headers,
  rows,
  materialColumn,
  extraColumn,
}: {
  headers: string[];
  rows: Record<string, unknown>[];
  materialColumn: string;
  extraColumn: string;
}) {
  return (
    <div className="table-card">
      <div className="table-title">
        <h3>数据预览</h3>
        <span>仅展示前 20 行</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {headers.map((header) => (
                <th className={header === materialColumn ? 'id-column' : header === extraColumn ? 'extra-column' : ''} key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {headers.map((header) => (
                  <td className={header === materialColumn ? 'id-column' : header === extraColumn ? 'extra-column' : ''} key={header}>
                    {String(row[header] ?? '') || <span className="blank-cell">空</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QrLabel({ record, dataUrl }: { record: MaterialRecord; dataUrl?: string }) {
  return (
    <article className="qr-card">
      <div className="qr-box">{dataUrl ? <img src={dataUrl} alt={`${record.materialId} 二维码`} /> : <QrCode size={66} />}</div>
      <strong title={record.materialId}>{record.materialId}</strong>
      {record.extraText && <span title={record.extraText}>{record.extraText}</span>}
    </article>
  );
}

function A4Preview({
  records,
  previews,
  rows,
  columns,
  showCutLines,
}: {
  records: MaterialRecord[];
  previews: QrPreview[];
  rows: number;
  columns: number;
  showCutLines: boolean;
}) {
  const cells = Array.from({ length: rows * columns }, (_, index) => records[index]).filter(Boolean);
  return (
    <div className="a4-stage">
      <div className="a4-page" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
        {cells.map((record, index) => (
          <div className={`a4-cell ${showCutLines ? 'with-cut' : ''}`} key={`${record.materialId}-${index}`}>
            <QrLabel record={record} dataUrl={previews[index]?.dataUrl} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskNotice({ risk }: { risk: LayoutRisk }) {
  const icon = risk === 'safe' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />;
  return (
    <div className={`risk-notice ${risk}`}>
      {icon}
      <div>
        <strong>{risk === 'safe' ? '正常' : risk === 'warning' ? '轻微拥挤' : '严重拥挤'}</strong>
        <span>{getRiskMessage(risk)}</span>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default App;
