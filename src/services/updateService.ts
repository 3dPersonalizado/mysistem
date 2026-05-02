import { App } from '@capacitor/app';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { Capacitor } from '@capacitor/core';

const GITHUB_REPO = 'LukasFe3D/LukasFe3D-Hub';

export interface UpdateInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
}

export const UpdateService = {
  async getCurrentVersion(): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      const info = await App.getInfo();
      return info.version;
    }
    // Return a default version for web/dev
    return '1.0.0';
  },

  async checkForUpdates(): Promise<UpdateInfo | null> {
    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
      if (!response.ok) return null;

      const data = await response.json();
      const latestVersion = data.tag_name.replace('v', '');
      const currentVersion = await this.getCurrentVersion();

      if (this.compareVersions(latestVersion, currentVersion) > 0) {
        // Find APK asset
        const apkAsset = data.assets.find((asset: any) => asset.name.endsWith('.apk'));
        if (apkAsset) {
          return {
            version: latestVersion,
            downloadUrl: apkAsset.browser_download_url,
            releaseNotes: data.body
          };
        }
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
    return null;
  },

  compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  },

  async downloadAndInstall(url: string, onProgress: (progress: number) => void): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      window.open(url, '_blank');
      return;
    }

    try {
      const fileName = 'update.apk';
      
      // Download file using fetch (progressive)
      const response = await fetch(url);
      const reader = response.body?.getReader();
      const contentLength = +(response.headers.get('Content-Length') || 0);

      if (!reader) throw new Error('Failed to start download');

      let receivedLength = 0;
      const chunks = [];
      while(true) {
        const {done, value} = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedLength += value.length;
        onProgress(Math.round((receivedLength / contentLength) * 100));
      }

      const blob = new Blob(chunks);
      const base64Data = await this.blobToBase64(blob);

      // Save to filesystem
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Data
      });

      // Open for installation
      await FileOpener.openFile({
        path: savedFile.uri,
        mimeType: 'application/vnd.android.package-archive'
      });
    } catch (error) {
      console.error('Download/Install error:', error);
      throw error;
    }
  },

  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
};
