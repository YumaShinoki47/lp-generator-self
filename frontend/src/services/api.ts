import { LPGenerationData, JobStatus } from "@/types";

// APIの基本URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// レスポンスのエラーチェック
const checkResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `API error: ${response.status}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // エラーJSONのパースに失敗した場合は、元のエラーメッセージを使用
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

// API呼び出しをまとめたオブジェクト
const api = {
  // LP生成ジョブを開始する
  startGeneration: async (data: LPGenerationData): Promise<{ jobId: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return checkResponse(response);
    } catch (error) {
      console.error("Error starting generation:", error);
      throw error;
    }
  },

  // ジョブの状態を取得する
  getJobStatus: async (jobId: string): Promise<JobStatus> => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
      return checkResponse(response);
    } catch (error) {
      console.error(`Error getting job status for ${jobId}:`, error);
      throw error;
    }
  },

  // 生成結果をダウンロードする
  downloadResults: async (jobId: string): Promise<Blob> => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/download`);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error(`Error downloading results for ${jobId}:`, error);
      throw error;
    }
  },

  // ジョブを再実行する
  retryJob: async (jobId: string): Promise<{ jobId: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/retry`, {
        method: "POST",
      });

      return checkResponse(response);
    } catch (error) {
      console.error(`Error retrying job ${jobId}:`, error);
      throw error;
    }
  },
};

export default api;
