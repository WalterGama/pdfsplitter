
export interface SplitResult {
  cityName: string;
  pdfBlob: Blob;
  pdfUrl: string;
  pageCount: number;
}

export interface ProcessingStatus {
  step: 'idle' | 'extracting' | 'analyzing' | 'splitting' | 'completed' | 'error';
  progress: number;
  message: string;
}
