export type DownloadStatus = 'PENDING' | 'DOWNLOADING' | 'COMPLETED' | 'FAILED';

export interface DownloadProgress {
  percentage: string;
  eta: string;
  speed: string;
  status: string;
}

export class Download {
  constructor(
    public readonly id: string,
    public readonly url: string,
    public readonly format: 'video' | 'audio',
    public status: DownloadStatus = 'PENDING',
    public progress: DownloadProgress = { percentage: '0%', eta: 'N/A', speed: 'N/A', status: 'starting' },
    public filename: string | null = null
  ) {}

  updateProgress(progress: DownloadProgress) {
    this.progress = progress;
    if (this.status !== 'COMPLETED') {
      this.status = 'DOWNLOADING';
    }
  }

  complete(filename: string) {
    this.status = 'COMPLETED';
    this.filename = filename;
    this.progress.percentage = '100%';
  }

  fail() {
    this.status = 'FAILED';
  }
}
