// App.tsx
import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import api from "@/services/api";

// shadcn/uiコンポーネントのインポート
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// ジョブのステータスタイプ
type JobStatus = "idle" | "pending" | "processing" | "completed" | "error";

// ステップの型定義
interface Step {
  id: string;
  name: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
}

// ジョブ情報の型定義
interface JobInfo {
  jobId: string;
  status: JobStatus;
  progress: number;
  currentStep: string;
  steps: Step[];
  error?: string;
  result?: {
    html: string;
    css: string;
    js: string;
    imageUrls: string[];
    imageBase64: string;
    imageBase64Map: Record<string, string>;
  };
}

// フォームのスキーマ定義
const formSchema = z.object({
  serviceName: z.string().min(2, {
    message: "サービス名は2文字以上入力してください。",
  }),
  serviceType: z.string().min(2, {
    message: "サービスタイプは2文字以上入力してください。",
  }),
  targetAudience: z.string().min(2, {
    message: "ターゲット層は2文字以上入力してください。",
  }),
  features: z.string().min(10, {
    message: "特徴は10文字以上入力してください。",
  }),
  testimonials: z.string().min(10, {
    message: "その他含めたい内容は10文字以上入力してください。",
  }),
  companyName: z.string().min(2, {
    message: "会社名は2文字以上入力してください。",
  }),
});

// APIに送信するデータの型
type FormData = z.infer<typeof formSchema>;

// プレビューのiframeを更新するための関数
const updateIframeContent = (
  iframe: HTMLIFrameElement,
  html: string,
  css: string,
  js: string,
  imageBase64: string,
  imageBase64Map: Record<string, string> = {}
) => {
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

  if (iframeDoc) {
    // CSSの中の${imageBase64}プレースホルダーを実際の画像データで置き換え
    let updatedCss = css.replace("${imageBase64}", imageBase64);
    
    let updatedHtml = html;
    Object.entries(imageBase64Map).forEach(([filename, base64Data]) => {
      const regex = new RegExp(`src="${filename}"`, 'g');
      updatedHtml = updatedHtml.replace(regex, `src="${base64Data}"`);
    });

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>${updatedCss}</style>
        </head>
        <body>
          ${updatedHtml}
          <script>${js}</script>
        </body>
      </html>
    `);
    iframeDoc.close();
  }
};

const App = () => {
  // 現在のジョブ情報の状態
  const [jobInfo, setJobInfo] = useState<JobInfo | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // フォームの状態管理
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceName: "EasySpeak",
      serviceType: "オンライン英会話スクール",
      targetAudience: "社会人向け",
      features: "24時間対応、パーソナルカリキュラム",
      testimonials: "講師情報、お客様の声",
      companyName: "株式会社アブソリュート",
    },
  });

  // フォーム送信ハンドラー
  const onSubmit = async (data: FormData) => {
    try {
      // APIを呼び出してジョブを開始
      const response = await fetch("http://localhost:8000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("ジョブの開始に失敗しました");
      }

      const result = await response.json();
      const jobId = result.jobId;

      // 初期ジョブ情報を設定
      setJobInfo({
        jobId: jobId,
        status: "processing",
        progress: 10,
        currentStep: "wireframe",
        steps: [
          {
            id: "wireframe",
            name: "ワイヤーフレーム作成",
            description: "HTML構造の生成",
            status: "processing",
            progress: 50,
          },
          {
            id: "css",
            name: "デザイン適用",
            description: "CSSスタイルの生成",
            status: "pending",
            progress: 0,
          },
          {
            id: "js",
            name: "インタラクション追加",
            description: "JavaScript機能の実装",
            status: "pending",
            progress: 0,
          },
          {
            id: "image",
            name: "画像生成",
            description: "AIによる画像の生成",
            status: "pending",
            progress: 0,
          },
          {
            id: "apply-image",
            name: "画像適用",
            description: "生成された画像の適用",
            status: "pending",
            progress: 0,
          },
        ],
      });

      // ジョブステータスのポーリングを開始
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`http://localhost:8000/api/jobs/${jobId}`);
          if (!statusResponse.ok) {
            throw new Error("ジョブステータスの取得に失敗しました");
          }

          const jobStatus = await statusResponse.json();
          setJobInfo(jobStatus);

          // ジョブが完了またはエラーの場合、ポーリングを停止
          if (jobStatus.status === "completed" || jobStatus.status === "error") {
            clearInterval(pollInterval);

            // 完了時にプレビューを更新
            if (jobStatus.status === "completed" && jobStatus.result && iframeRef.current) {
              updateIframeContent(
                iframeRef.current,
                jobStatus.result.html,
                jobStatus.result.css,
                jobStatus.result.js,
                jobStatus.result.imageBase64,
                jobStatus.result.imageBase64Map
              );
            }
          }
        } catch (error) {
          console.error("Error polling job status:", error);
          clearInterval(pollInterval);
          setJobInfo((prev) =>
            prev
              ? {
                  ...prev,
                  status: "error",
                  error: "ジョブステータスの取得に失敗しました",
                }
              : null
          );
        }
      }, 3000); // 3秒ごとにポーリング
    } catch (error) {
      console.error("Error starting job:", error);
      setJobInfo({
        jobId: `error-${Date.now()}`,
        status: "error",
        progress: 0,
        currentStep: "",
        steps: [],
        error: "ジョブの開始に失敗しました。",
      });
    }
  };

  // ダウンロード機能
  const handleDownload = async () => {
    if (!jobInfo || jobInfo.status !== "completed") return;

    setDownloadLoading(true);
    try {
      const blob = await api.downloadResults(jobInfo.jobId);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lp-${jobInfo.jobId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("ダウンロードに失敗しました。もう一度お試しください。");
    } finally {
      setDownloadLoading(false);
    }
  };

  // ジョブのリセット - 新しいLP生成を開始できるようにする
  const resetJob = () => {
    setJobInfo(null);
  };

  // プレビューを更新
  useEffect(() => {
    if (jobInfo?.status === "completed" && jobInfo.result && iframeRef.current) {
      updateIframeContent(
        iframeRef.current,
        jobInfo.result.html,
        jobInfo.result.css,
        jobInfo.result.js,
        jobInfo.result.imageBase64,
        jobInfo.result.imageBase64Map
      );
    }
  }, [jobInfo?.result, jobInfo?.status]);

  // 日本語のステップ名を取得

  return (
    <div className="bg-background">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 w-full border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-center px-4">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">LP</span>
            </span>
            <span className="text-xl font-bold">LPジェネレーター -あなたのビジネスを加速させる-</span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 py-6">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 左側: フォームと進捗状況 */}
            <div className="w-full h-[calc(100vh-8rem)]">
              <Card className="h-full">
                {!jobInfo || jobInfo.status === "error" ? (
                  <>
                    <CardHeader>
                      <CardTitle>LP情報入力</CardTitle>
                      <CardDescription>生成するLPに必要な情報を入力してください</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="serviceName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    サービス名 <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="EasySpeak" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="serviceType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    サービスタイプ <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="オンライン英会話スクール" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="targetAudience"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  ターゲット層 <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="社会人向け" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="features"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  サービスの特徴 <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="24時間対応、パーソナルカリキュラム"
                                    rows={3}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="testimonials"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  その他含めたい内容 <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="講師情報、お客様の声、会社概要など"
                                    rows={3}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  会社名 <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="株式会社アブソリュート" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button type="submit" className="w-full" size="lg">
                            {form.formState.isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                生成中...
                              </>
                            ) : (
                              "ランディングページを生成"
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                    <CardFooter className="flex flex-col text-center text-sm text-muted-foreground border-t">
                      <p>
                        入力された情報をもとにAIがHTMLコード、CSSデザイン、JSインタラクション、最適な画像を生成します。
                      </p>
                    </CardFooter>
                  </>
                ) : (
                  <>
                    <CardHeader className="pb-3">
                      <CardTitle>生成中...</CardTitle>
                      <CardDescription>
                        LPを生成しています。しばらくお待ちください。
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        {jobInfo.status === "completed" ? (
                          <div className="h-8 w-8 text-primary flex items-center justify-center">
                            ✓
                          </div>
                        ) : (
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        )}
                        <p className="text-muted-foreground text-center">
                          {jobInfo.status === "completed"
                            ? "生成が完了しました"
                            : "生成処理には数分かかる場合があります。"}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-3 border-t">
                      <p className="text-sm text-muted-foreground text-center">
                        {jobInfo.status === "completed"
                          ? "生成が完了しました！プレビューを確認できます。"
                          : "生成処理を実行中です..."}
                      </p>

                      {jobInfo.status === "completed" && (
                        <div className="flex gap-2 w-full">
                          <Button 
                            variant="default" 
                            onClick={handleDownload}
                            className="flex-1"
                            disabled={downloadLoading}
                          >
                            {downloadLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ダウンロード中...
                              </>
                            ) : (
                              "ファイルをダウンロード"
                            )}
                          </Button>
                          <Button variant="outline" onClick={resetJob}>
                            新規作成
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  </>
                )}
              </Card>
            </div>

            {/* 右側: サイトプレビュー */}
            <div className="w-full h-[calc(100vh-8rem)]">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle>LP プレビュー</CardTitle>
                  <CardDescription>生成されたランディングページのプレビュー</CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden">
                  <div className="relative bg-accent/20 h-[calc(100vh-16rem)] min-h-[600px] rounded-b-lg">
                    {!jobInfo || jobInfo.status === "idle" ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <p className="text-muted-foreground mb-2">
                          LPを生成するとここにプレビューが表示されます
                        </p>
                        <div className="mt-4 w-full max-w-md space-y-4">
                          <div className="h-8 bg-muted rounded w-full animate-pulse"></div>
                          <div className="h-32 bg-muted rounded w-full animate-pulse"></div>
                          <div className="h-24 bg-muted rounded w-full animate-pulse"></div>
                          <div className="h-24 bg-muted rounded w-full animate-pulse"></div>
                        </div>
                      </div>
                    ) : jobInfo.status === "processing" || jobInfo.status === "pending" ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <p className="text-muted-foreground mb-2">LPを生成中...</p>
                        <div className="w-full max-w-md mt-4 space-y-4">
                          <div className="h-8 bg-muted rounded w-full animate-pulse"></div>
                          <div className="h-32 bg-muted rounded w-full animate-pulse"></div>
                          <div className="h-24 bg-muted rounded w-full animate-pulse"></div>
                          <div className="h-24 bg-muted rounded w-full animate-pulse"></div>
                        </div>
                      </div>
                    ) : jobInfo.status === "error" ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <p className="text-destructive mb-2">エラーが発生しました</p>
                        <p className="text-muted-foreground">{jobInfo.error}</p>
                      </div>
                    ) : (
                      <iframe
                        ref={iframeRef}
                        title="LP Preview"
                        className="absolute inset-0 w-full h-full border-0 rounded-b-lg"
                        sandbox="allow-same-origin allow-scripts"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="w-full border-t py-4 bg-background mt-auto">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">LP</span>
            </span>
            <span className="text-sm font-semibold">LPジェネレーター</span>
          </div>

          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
