# ZinAI メール送信設定ガイド

新規登録時のメール送信機能を有効にするための設定ガイドです。

## 📧 機能概要

ZinAIでは、ユーザーが新規登録する際に、登録確認メールが自動送信されます。このメールには、アカウント登録を完了するためのマジックリンクが含まれています。

### メール送信が行われる場面

1. **企業ポータル新規登録** - 企業が新規アカウントを作成した時
2. **ジョブリスト新規登録** - 求職者が新規アカウントを作成した時

## 🔧 本番環境でのメール設定手順

### 1. Xserver SMTP設定

本システムは **Xserver** の SMTP を使用して、独自ドメイン `@office-tree.jp` からメールを送信します。

#### 必要な情報：

- **SMTPホスト**: `sv14354.xserver.jp`
- **SMTPポート**: `587` (STARTTLS)
- **ユーザー名**: `info@office-tree.jp` (または他の @office-tree.jp のメールアドレス)
- **パスワード**: メールアカウントのパスワード

### 2. 環境変数の設定

#### ローカル開発環境の場合

`backend/.env` ファイルを編集：

```bash
# Email Configuration (Xserver SMTP)
SMTP_HOST=sv14354.xserver.jp
SMTP_PORT=587
EMAIL_USER=info@office-tree.jp
EMAIL_PASSWORD=your-email-password
```

#### Render.com（本番環境）の場合

1. Render.comのダッシュボードにログイン
2. バックエンドサービスを選択
3. 「Environment」タブを開く
4. 以下の環境変数を追加：

| Key | Value |
|-----|-------|
| `SMTP_HOST` | sv14354.xserver.jp |
| `SMTP_PORT` | 587 |
| `EMAIL_USER` | info@office-tree.jp |
| `EMAIL_PASSWORD` | test0315 |

5. 「Save Changes」をクリック
6. サービスが自動的に再デプロイされます（数分かかります）

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
   - 受信者の迷惑メールフォルダをチェック

2. **送信元アドレスの確認**
   - 送信元: `ZinAI人材マッチング <info@office-tree.jp>`
   - `EMAIL_USER`に設定したメールアドレスから送信されているか確認

3. **Xserverの送信制限**
   - Xserverには1日あたりの送信制限があります
   - 大量のテストメールを送信した場合、一時的に制限される可能性があります

4. **メールログの確認**
   - Xserverのサーバーパネルで「メールログ」を確認
   - 送信エラーが記録されている場合があります

## 🚀 本番環境への適用

1. `.env`ファイルの設定を完了
2. Render.comの環境変数を設定
3. サービスを再デプロイ
4. 実際に新規登録してメールが届くか確認

## 📚 参考リンク

- [Xserver メール設定マニュアル](https://www.xserver.ne.jp/manual/man_mail_setting.php)
- [Nodemailer公式ドキュメント](https://nodemailer.com/about/)
- [Xserver サーバーパネル](https://www.xserver.ne.jp/login_server.php)

## 💡 送信元メールアドレスの推奨

### 現在の設定
```
info@office-tree.jp
```

### サービス名決定後の推奨アドレス
```
noreply@office-tree.jp    # 返信不要の自動送信メール用
support@office-tree.jp    # サポート対応用
contact@office-tree.jp    # お問い合わせ用
```

同じドメインなら環境変数の変更だけで簡単に切り替えできます！

---

ご不明な点がございましたら、お気軽にお問い合わせください。
