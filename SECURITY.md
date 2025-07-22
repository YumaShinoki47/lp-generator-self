# セキュリティガイドライン

## 🔐 APIキーの安全な管理

### ❌ 絶対にやってはいけないこと
- `.env`ファイルをGitにコミットする
- APIキーをソースコードに直接記述する
- APIキーをREADMEやドキュメントに記載する
- APIキーをコミットメッセージに含める

### ✅ 正しいAPIキー管理方法

#### 1. 環境変数の設定
```bash
# backend/.env.exampleを backend/.envにコピー
cp backend/.env.example backend/.env

# frontend/.env.exampleを frontend/.envにコピー  
cp frontend/.env.example frontend/.env

# 実際のAPIキーに置き換える
```

#### 2. APIキーの取得方法

**Google Gemini API Key**
1. [Google AI Studio](https://aistudio.google.com/app/apikey)にアクセス
2. 「Create API Key」をクリック
3. 生成されたキーを`GEMINI_API_KEY`に設定

**Anthropic Claude API Key**
1. [Anthropic Console](https://console.anthropic.com/)にアクセス
2. APIキーを作成
3. 生成されたキーを`ANTHROPIC_API_KEY`に設定

**Google Imagen API Key**
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. Vertex AI APIを有効化
3. サービスアカウントキーを作成
4. 生成されたキーを`GOOGLE_IMAGEN_API_KEY`に設定

#### 3. 本番環境でのデプロイ

**環境変数を使用**
```bash
# Vercel、Netlify、Herokuなどのプラットフォームでは
# 環境変数設定画面で設定

export GEMINI_API_KEY="actual_key_here"
export ANTHROPIC_API_KEY="actual_key_here" 
export GOOGLE_IMAGEN_API_KEY="actual_key_here"
```

## 🛡️ セキュリティチェックリスト

### デプロイ前の確認事項
- [ ] `.env`ファイルが`.gitignore`に含まれている
- [ ] 実際のAPIキーがコードに含まれていない
- [ ] `.env.example`にはダミー値のみが含まれている
- [ ] `git status`でtracked filesを確認
- [ ] コミット履歴にAPIキーが含まれていない

### 定期的なセキュリティ監査
- [ ] 不要なAPIキーの削除
- [ ] APIキー使用量の監視
- [ ] アクセス権限の最小化
- [ ] キーローテーションの実施

## 🚨 セキュリティインシデント対応

### APIキーが漏洩した場合
1. **即座にAPIキーを無効化**
2. **新しいAPIキーを生成**
3. **アプリケーションの設定を更新**
4. **Gitコミット履歴をクリーン**
5. **影響範囲の調査**

### 緊急対応コマンド
```bash
# Gitからセンシティブファイルを完全削除
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch backend/.env' \
--prune-empty --tag-name-filter cat -- --all

# 強制プッシュ（注意: 協力者に事前連絡）
git push origin --force --all
```

## 📞 セキュリティに関する報告

セキュリティ上の脆弱性を発見した場合:
- **Public Issue**: 使用しない
- **Direct Contact**: security@example.com
- **Responsible Disclosure**: 24-48時間以内に対応

## 📚 参考資料

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)