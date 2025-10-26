# ZinAI メール送信設定ガイド

新規登録時のメール送信機能を有効にするための設定ガイドです。

## 📧 機能概要

ZinAIでは、ユーザーが新規登録する際に、登録確認メールが自動送信されます。このメールには、アカウント登録を完了するためのマジックリンクが含まれています。

### メール送信が行われる場面

1. **企業ポータル新規登録** - 企業が新規アカウントを作成した時
2. **ジョブリスト新規登録** - 求職者が新規アカウントを作成した時

## 🔧 本番環境でのメール設定手順

### 1. Gmailアプリパスワードの取得

本番環境でメール送信機能を有効にするには、Gmailアプリパスワードが必要です。

#### 手順：

1. **Googleアカウントにアクセス**
   - https://myaccount.google.com/ にアクセス

2. **2段階認証を有効化**（まだの場合）
   - 「セキュリティ」→「2段階認証プロセス」→設定

3. **アプリパスワードを生成**
   - 「セキュリティ」→「Googleへのログイン」→「アプリパスワード」
   - アプリを選択：「メール」
   - デバイスを選択：「その他（カスタム名）」→「ZinAI」と入力
   - 「生成」をクリック
   - 16文字のパスワードが表示されます（スペースなし）

4. **パスワードをコピー**
   - このパスワードは後で確認できないため、安全な場所に保存してください

### 2. 環境変数の設定

#### ローカル開発環境の場合

`backend/.env` ファイルを編集：

```bash
# Email Configuration (Gmail)
EMAIL_USER=あなたのGmailアドレス@gmail.com
EMAIL_PASSWORD=生成した16文字のアプリパスワード
```

#### Render.com（本番環境）の場合

1. Render.comのダッシュボードにログイン
2. バックエンドサービスを選択
3. 「Environment」タブを開く
4. 以下の環境変数を追加：

| Key | Value |
|-----|-------|
| `EMAIL_USER` | あなたのGmailアドレス@gmail.com |
| `EMAIL_PASSWORD` | 生成した16文字のアプリパスワード |

5. 「Save Changes」をクリック
6. サービスが自動的に再デプロイされます

### 3. フロントエンドURLの設定

メールに含まれるログインリンクが正しいURLを指すように、`FRONTEND_URL`も設定してください。

#### 本番環境の場合

```bash
FRONTEND_URL=https://office-tree.jp/ZinAI
```

または、Render.comの環境変数で：

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | https://office-tree.jp/ZinAI |

## 🧪 開発環境でのテスト

開発環境では、`EMAIL_USER`が設定されていない場合、メールは送信されず、コンソールにログインリンクが表示されます。

### 開発モードの動作

1. ユーザーが新規登録フォームを送信
2. バックエンドのコンソールにマジックリンクが出力される
3. フロントエンドに確認ダイアログが表示される
4. 「OK」をクリックすると自動的にログイン

### テスト手順

1. バックエンドを起動：
```bash
cd backend
npm start
```

2. フロントエンドを起動：
```bash
cd frontend
npm start
```

3. ブラウザで以下にアクセス：
   - 企業ポータル: http://localhost:3000/
   - ジョブリスト: http://localhost:3000/talent/login

4. 「新規登録」タブを選択し、情報を入力して送信

5. バックエンドのコンソールを確認：
```
==============================================
マジックリンク（開発環境）:
名前: テスト企業
メール: test@company.com
タイプ: company
URL: http://localhost:3000/auth/verify?token=...
==============================================
```

## 📝 メールテンプレート

送信されるメールの内容は `backend/services/emailService.js` の `sendRegistrationEmail` 関数で定義されています。

### メールに含まれる情報

- ✅ 美しいグラデーションデザイン
- ✅ 登録完了用のマジックリンクボタン
- ✅ システムでできることの説明
- ✅ セキュリティに関する注意事項
- ✅ リンクの有効期限（15分）

### カスタマイズ

メールのデザインやコンテンツを変更したい場合は、`backend/services/emailService.js` の153行目以降を編集してください。

## 🔍 トラブルシューティング

### メールが送信されない場合

1. **環境変数の確認**
   ```bash
   # バックエンドディレクトリで確認
   cat .env | grep EMAIL
   ```

2. **Gmailアプリパスワードの確認**
   - アプリパスワードにスペースが含まれていないか確認
   - 正しい16文字のパスワードか確認

3. **2段階認証の確認**
   - Googleアカウントで2段階認証が有効になっているか確認

4. **ログの確認**
   ```bash
   # バックエンドのログを確認
   npm start
   ```

   エラーメッセージを確認：
   - `EAUTH` - 認証エラー（パスワードが間違っている）
   - `ECONNECTION` - 接続エラー（ネットワークの問題）

### メールが届かない場合

1. **迷惑メールフォルダを確認**
   - Gmailの迷惑メールフォルダをチェック

2. **送信元アドレスの確認**
   - `EMAIL_USER`に設定したGmailアドレスから送信されているか確認

3. **Gmailの送信制限**
   - Gmailには1日あたりの送信制限があります（通常500通/日）
   - 大量のテストメールを送信した場合、一時的にブロックされる可能性があります

## 🚀 本番環境への適用

1. `.env`ファイルの設定を完了
2. Render.comの環境変数を設定
3. サービスを再デプロイ
4. 実際に新規登録してメールが届くか確認

## 📚 参考リンク

- [Googleアプリパスワードの生成方法](https://support.google.com/accounts/answer/185833)
- [Nodemailer公式ドキュメント](https://nodemailer.com/about/)
- [Gmail SMTP設定](https://support.google.com/a/answer/176600)

## 💡 その他のメール送信オプション

Gmailの代わりに以下のサービスも使用できます：

### SendGrid

```javascript
// backend/services/emailService.js
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### AWS SES

```javascript
// backend/services/emailService.js
const transporter = nodemailer.createTransport({
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  auth: {
    user: process.env.AWS_SES_USER,
    pass: process.env.AWS_SES_PASSWORD
  }
});
```

---

ご不明な点がございましたら、お気軽にお問い合わせください。
