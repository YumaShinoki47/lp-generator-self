// LP生成に必要なデータの型定義
export interface LPGenerationData {
  serviceName: string;
  serviceType: string;
  targetAudience: string;
  features: string;
  testimonials: string;
  companyName: string;
}

// ステップの型定義
export interface Step {
  id: string;
  name: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
}

// ジョブ状態の型定義
export interface JobStatus {
  jobId: string;
  status: "idle" | "pending" | "processing" | "completed" | "error";
  progress: number;
  currentStep: string;
  steps: Step[];
  error?: string;
  result?: {
    html: string;
    css: string;
    js: string;
    imageUrls: string[];
  };
}
