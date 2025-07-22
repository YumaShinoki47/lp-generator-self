# LP Generator - AI-Powered Landing Page Generator

🚀 **AI技術を活用した自動ランディングページ生成システム**

このプロジェクトは、ユーザーの入力に基づいてAIが自動的に高品質なランディングページを生成するWebアプリケーションです。HTML、CSS、JavaScript、そして専用の画像まで、完全なランディングページを数分で作成できます。

## ✨ 特徴

### 🤖 AI駆動の多段階生成プロセス
- **ワイヤーフレーム生成**: Claude 3.7 Sonnetによる構造化されたHTML生成
- **デザイン適用**: Gemini 2.0 Flashによる美しいCSS設計
- **インタラクション追加**: 動的なJavaScript機能の実装
- **画像生成**: Google Imagen3による高品質な画像作成
- **画像適用**: 生成された画像の最適な配置と統合

### 🎨 包括的なコンテンツ生成
- レスポンシブデザインによる完全なランディングページ
- カスタム画像（講師写真、背景画像、アイコンなど）
- 日本語に最適化されたUI/UX
- 複数セクション（ヒーロー、特徴、料金、お客様の声など）

### 💼 実用的な機能
- リアルタイムプレビュー表示
- ワンクリックファイルダウンロード（ZIP形式）
- 24時間対応の生成プロセス
- エラーハンドリングと再試行機能

## 🛠️ 技術スタック

### フロントエンド
- **React 19** - モダンなReactフレームワーク
- **TypeScript** - 型安全性
- **Vite** - 高速開発環境
- **shadcn/ui** - 美しいUIコンポーネント
- **TailwindCSS v4** - ユーティリティファーストのCSS
- **React Hook Form + Zod** - フォーム管理とバリデーション
- **pnpm** - 効率的なパッケージマネージャー

### バックエンド
- **Python FastAPI** - 高性能非同期Webフレームワーク
- **Google Gemini AI** - テキスト生成AI
- **Claude 3.7 Sonnet** - 代替テキスト生成AI
- **Google Imagen3** - 画像生成AI
- **Ray** - 分散処理とタスク並列化
- **Uvicorn** - ASGIサーバー

### AI サービス
- **Google Gemini 2.0 Flash** - CSS・JavaScript生成
- **Claude 3.7 Sonnet** - HTML構造生成
- **Google Imagen3** - カスタム画像生成

## 📋 前提条件

- **Node.js** 18.0 以上
- **Python** 3.9 以上
- **pnpm** (推奨) または npm
- **Git** (リポジトリクローン用)
- 以下のAPIキー（取得方法は後述）:
  - Google Gemini API Key
  - Anthropic Claude API Key
  - Google Imagen API Key

⚠️ **重要**: APIキーの安全な管理については [SECURITY.md](SECURITY.md) を必ずお読みください。

## 🚀 セットアップ

### 1. リポジトリのクローン
```bash
git clone https://github.com/your-username/lp-generator-self.git
cd lp-generator-self
```

### 2. バックエンドの設定

```bash
cd backend

# Python仮想環境の作成（推奨）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係のインストール
pip install -r requirements.txt

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して実際のAPIキーに置き換える
```

**⚠️ セキュリティ重要**: APIキーの安全な管理について[SECURITY.md](SECURITY.md)を必ずお読みください。

`.env`ファイルに設定する内容（実際のAPIキーに置き換えてください）:
```env
# AI API Keys (実際の値に置き換えてください)
GEMINI_API_KEY=your_actual_gemini_api_key_here
ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here
GOOGLE_IMAGEN_API_KEY=your_actual_google_imagen_api_key_here
```

### 3. フロントエンドの設定

```bash
cd ../frontend

# 依存関係のインストール
pnpm install  # または npm install

# 環境変数の設定
cp .env.example .env
# 通常は変更不要ですが、必要に応じて .env を編集してください
```

## 🏃‍♂️ 実行方法

### 開発環境

**1. バックエンドサーバー起動**
```bash
cd backend
python main.py
# サーバーが http://localhost:8000 で起動
```

**2. フロントエンドサーバー起動**
```bash
cd frontend
pnpm dev  # または npm run dev
# アプリケーションが http://localhost:5173 で起動
```

### 本番環境

**フロントエンドビルド**
```bash
cd frontend
pnpm build  # または npm run build
pnpm preview  # ビルド結果のプレビュー
```

## 📖 使用方法

### 基本的な流れ

1. **Webアプリケーションにアクセス** - `http://localhost:5173`を開く

2. **サービス情報を入力**:
   - サービス名（例：EasySpeak）
   - サービス種別（例：オンライン英会話スクール）
   - ターゲット顧客（例：社会人向け）
   - 主な特徴（例：24時間対応、パーソナルカリキュラム）
   - お客様の声・講師情報
   - 会社名

3. **生成開始** - 「ランディングページを生成」ボタンをクリック

4. **進捗確認** - リアルタイムで以下の段階を確認:
   - ワイヤーフレーム作成
   - デザイン適用
   - インタラクション追加
   - 画像生成
   - 画像適用

5. **プレビュー確認** - 右側のプレビューペインで結果を確認

6. **ダウンロード** - 「ファイルをダウンロード」ボタンで完成したファイル一式を取得

### 生成されるファイル

ダウンロードされるZIPファイルには以下が含まれます:

```
lp-{job-id}.zip/
├── index.html          # メインのHTMLファイル
├── style.css           # カスタマイズされたCSS
├── script.js           # インタラクティブ機能のJS
└── placeholder_*.png   # AI生成された画像ファイル
```

## 📁 プロジェクト構造

```
lp-generator-self/
├── README.md                   # プロジェクト説明
├── SECURITY.md                 # セキュリティガイドライン
├── .gitignore                  # Git除外設定
├── backend/                    # Python FastAPI バックエンド
│   ├── .env.example           # 環境変数テンプレート
│   ├── .env                   # 実際の環境変数（Git除外）
│   ├── main.py                # FastAPI アプリケーション
│   ├── lp_generator.py        # AI エージェント実装
│   ├── requirements.txt       # Python依存関係
│   └── jobs/                  # 生成結果保存（Git除外）
└── frontend/                   # React フロントエンド
    ├── .env.example           # 環境変数テンプレート
    ├── .env                   # 実際の環境変数（Git除外）
    ├── package.json           # Node.js依存関係
    ├── vite.config.ts         # Vite設定
    ├── tsconfig.json          # TypeScript設定
    ├── tailwind.config.js     # TailwindCSS設定
    └── src/
        ├── App.tsx            # メインアプリケーション
        ├── services/api.ts    # API通信
        ├── types/types.ts     # TypeScript型定義
        └── components/ui/     # shadcn/uiコンポーネント
```

## 🏗️ アーキテクチャ

### システム構成図

```
[Frontend (React)] ←→ [FastAPI Backend] ←→ [AI Services]
                                          ├── Google Gemini
                                          ├── Claude 3.7 Sonnet
                                          └── Google Imagen3
```

### データフロー

1. **ユーザー入力** → フロントエンドフォーム
2. **API送信** → FastAPIバックエンド
3. **ジョブ作成** → バックグラウンド処理開始
4. **AI処理** → 5段階の順次実行:
   - HTML構造生成 (Claude)
   - CSS生成 (Gemini)
   - JavaScript生成 (Gemini)
   - 画像生成 (Imagen3) - Ray並列処理
   - 画像統合 (Gemini)
5. **結果統合** → ZIP形式で保存
6. **クライアント配信** → ダウンロード提供

### ジョブ管理システム

- **非同期処理**: FastAPIのBackgroundTasksによる非ブロッキング実行
- **進捗追跡**: リアルタイムのステータス更新
- **エラー処理**: 各段階での堅牢なエラーハンドリング
- **再試行機能**: 失敗したジョブの再実行

## 🔧 開発コマンド

### フロントエンド
```bash
pnpm dev          # 開発サーバー起動
pnpm build        # プロダクションビルド
pnpm lint         # ESLintによるコード検査
pnpm preview      # ビルド結果のプレビュー
```

### バックエンド
```bash
python main.py    # FastAPIサーバー起動 (開発モード)
```