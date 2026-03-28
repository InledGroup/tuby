import { spawn } from 'node:child_process';
import { Download } from '../domain/Download.js';
import type { DownloadProgress } from '../domain/Download.js';
import path from 'node:path';
import fs from 'node:fs';

export class YtDlpAdapter {
  private static STORAGE_DIR = process.env.DOWNLOAD_DIR || path.join(process.cwd(), 'downloads');

  constructor() {
    if (!fs.existsSync(YtDlpAdapter.STORAGE_DIR)) {
      fs.mkdirSync(YtDlpAdapter.STORAGE_DIR, { recursive: true });
    }
  }

  async download(download: Download, onProgress: (progress: DownloadProgress) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const isAudio = download.format === 'audio';
      const outputTemplate = path.join(YtDlpAdapter.STORAGE_DIR, `${download.id}.%(ext)s`);

      const args = [
        download.url,
        '-o', outputTemplate,
        '--newline',
        '--progress-template', '%(progress)j',
        '--no-playlist',
      ];

      if (isAudio) {
        args.push('-x', '--audio-format', 'mp3');
      } else {
        // Force H.264 and AAC for maximum compatibility (QuickTime)
        args.push('-f', 'bestvideo[vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[vcodec^=avc1]/best', '--merge-output-format', 'mp4');
      }

      const ytDlp = spawn('yt-dlp', args);

      ytDlp.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const progressObj = JSON.parse(line);
            const progress: DownloadProgress = {
              percentage: progressObj._percent_str || '0%',
              eta: progressObj._eta_str || 'N/A',
              speed: progressObj._speed_str || 'N/A',
              status: progressObj.status || 'downloading'
            };
            onProgress(progress);
          } catch (e) {
            // Non-JSON output (info messages)
          }
        }
      });

      ytDlp.stderr.on('data', (data) => {
        console.error(`[yt-dlp error] ${data.toString().trim()}`);
      });

      ytDlp.on('close', (code) => {
        if (code === 0) {
          // Find the actual file because extension might vary (though we specified some)
          const files = fs.readdirSync(YtDlpAdapter.STORAGE_DIR);
          const finalFile = files.find(f => f.startsWith(download.id));
          if (finalFile) {
            resolve(path.join(YtDlpAdapter.STORAGE_DIR, finalFile));
          } else {
            reject(new Error('File not found after download'));
          }
        } else {
          reject(new Error(`yt-dlp failed with code ${code}`));
        }
      });
    });
  }

  getFilePath(filename: string): string {
    return path.join(YtDlpAdapter.STORAGE_DIR, filename);
  }

  async getMetadata(url: string): Promise<{ title: string; thumbnail: string; duration: number }> {
    return new Promise((resolve, reject) => {
      const ytDlp = spawn('yt-dlp', ['--dump-json', '--no-playlist', url]);
      let output = '';

      ytDlp.stdout.on('data', (data) => {
        output += data.toString();
      });

      ytDlp.stderr.on('data', (data) => {
        console.error(`[yt-dlp metadata error] ${data.toString().trim()}`);
      });

      ytDlp.on('close', (code) => {
        if (code === 0) {
          try {
            const data = JSON.parse(output);
            resolve({
              title: data.title,
              thumbnail: data.thumbnail,
              duration: data.duration
            });
          } catch (e) {
            reject(new Error('Failed to parse metadata'));
          }
        } else {
          reject(new Error(`yt-dlp metadata failed with code ${code}`));
        }
      });
    });
  }
}
