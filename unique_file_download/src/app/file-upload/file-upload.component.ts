import { Component } from '@angular/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { SHA256 } from 'crypto-js';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css'],
})
export class FileUploadComponent {
  ExtractedZipFiles: Map<string, { name: string; data: Uint8Array }> = new Map();
  showDownloadButton = false;
  uploadedCount = 0; // Initialize uploaded count variable

  constructor() {}

  async extractZipFiles(files: FileList): Promise<void> {
    this.uploadedCount = files.length; // Update uploaded count
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.toLowerCase().endsWith('.zip')) {
        const zip = new JSZip();
        const zipData: Uint8Array = await this.readFileAsUint8Array(file);
        const zipFiles = await zip.loadAsync(zipData);
        await this.extractFilesFromZip(zipFiles);
      }
    }
  }

  async extractFilesFromZip(zip: JSZip): Promise<void> {
    await Promise.all(
      Object.entries(zip.files).map(async ([filePath, zipFile]) => {
        if (!zipFile.dir) {
          const fileData: Uint8Array = await zipFile.async('uint8array');
          const hash = SHA256(fileData.toString()).toString();
          if (!this.ExtractedZipFiles.has(hash)) {
            this.ExtractedZipFiles.set(hash, { name: zipFile.name, data: fileData });
          }
        }
      })
    );
  }

  async downloadResult(): Promise<void> {
    const zip = new JSZip();
    this.ExtractedZipFiles.forEach(({ name, data }) => {
      const fileName = name; // Use the original file name
      zip.file(fileName, data);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'result.zip');
  }

  onFilesSelected(event: any): void {
    const files = event.target.files;
    this.extractZipFiles(files);
    this.showDownloadButton = true; // Show download button when files are selected
  }

  async readFileAsUint8Array(file: File): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        resolve(uint8Array);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}
