export interface IS3Service {
  uploadFile(fileBuffer: Buffer, originalName: string, id?: number): Promise<{ filename: string; url: string }>;
  deleteFile(filename: string): Promise<void>;
  listAllFiles(): Promise<string[]>;
  fileExists(filename: string): Promise<boolean>;
  getFileUrl(filename: string): string;
}