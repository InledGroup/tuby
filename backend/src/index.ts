import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Download } from './domain/Download.js';
import type { DownloadStatus, DownloadProgress } from './domain/Download.js';
import { YtDlpAdapter } from './infrastructure/YtDlpAdapter.js';
import path from 'node:path';
import fs from 'node:fs';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const ytDlp = new YtDlpAdapter();
const downloads = new Map<string, Download>();
const clients = new Map<string, express.Response>();

// Serve frontend static files
const frontendPath = path.join(process.cwd(), 'frontend', 'dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  // SPA fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Get video metadata
app.get('/api/metadata', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'URL is required' });

  try {
    const metadata = await ytDlp.getMetadata(url);
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

// Start download
app.post('/api/download', async (req, res) => {
  const { url, format } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  if (format !== 'video' && format !== 'audio') return res.status(400).json({ error: 'Invalid format' });

  const id = uuidv4();
  const download = new Download(id, url, format);
  downloads.set(id, download);

  // Start background process
  (async () => {
    try {
      const fullPath = await ytDlp.download(download, (progress) => {
        download.updateProgress(progress);
        sendUpdate(id, { status: download.status, progress: download.progress });
      });
      const filename = path.basename(fullPath);
      download.complete(filename);
      sendUpdate(id, { status: 'COMPLETED', filename });
    } catch (error) {
      console.error(error);
      download.fail();
      sendUpdate(id, { status: 'FAILED' });
    }
  })();

  res.json({ id });
});

// SSE progress
app.get('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const download = downloads.get(id);

  if (!download) return res.status(404).json({ error: 'Download not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.set(id, res);

  req.on('close', () => {
    clients.delete(id);
  });

  // Send initial state
  res.write(`data: ${JSON.stringify({ status: download.status, progress: download.progress })}\n\n`);
});

// Download file
app.get('/api/files/:id', (req, res) => {
  const { id } = req.params;
  const download = downloads.get(id);

  if (!download || !download.filename || download.status !== 'COMPLETED') {
    return res.status(404).json({ error: 'File not ready' });
  }

  const filePath = ytDlp.getFilePath(download.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on disk' });
  }

  res.download(filePath, download.filename);
});

// Preview stream
app.get('/api/preview/:id', (req, res) => {
  const { id } = req.params;
  const download = downloads.get(id);

  if (!download || !download.filename || download.status !== 'COMPLETED') {
    return res.status(404).json({ error: 'Preview not ready' });
  }

  const filePath = ytDlp.getFilePath(download.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on disk' });
  }

  res.sendFile(filePath);
});

function sendUpdate(id: string, data: any) {
  const client = clients.get(id);
  if (client) {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
    if (data.status === 'COMPLETED' || data.status === 'FAILED') {
      client.end();
      clients.delete(id);
    }
  }
}

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
