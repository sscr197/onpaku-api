# オンパク API

オンパクアプリケーションのバックエンドAPIサーバーです。

## 環境構築

### 必要要件

- Docker
- Docker Compose
- Node.js (v18以上)

### セットアップ

1. リポジトリをクローン

```bash
git clone git@github.com:sscr197/onpaku-api.git
cd onpaku-api
```

2. 環境変数の設定

```bash
cp .env.example .env
```

必要な環境変数を`.env`ファイルに設定してください。

## 起動方法

### 開発環境

1. DockerコンテナおよびAPIサーバーの起動

```bash
docker compose up -d
```

- Firebase EmulatorのUIは http://localhost:4000 でアクセスできます。

- APIサーバーは http://localhost:3000 で起動します。

## テスト

### 単体テスト

```bash
npm run test
```

### E2Eテスト

```bash
npm run test:e2e
```

### Firebaseとのintegrationテスト

※ Dockerコンテナが起動している必要があります

```bash
npm run test:integration
```

## API ドキュメント

Swagger UIで提供されるAPIドキュメントは以下のURLでアクセスできます：

http://localhost:3000/docs

## エンドポイント一覧

### ベースURL

```
http://localhost:3000/api/v1/onpaku
```

### 主要エンドポイント

#### ユーザー関連

- `POST /users` - ユーザー新規登録
- `PATCH /users` - ユーザー情報更新

#### プログラム関連

- `POST /programs` - プログラム登録・更新

#### 予約関連

- `POST /reservations` - 予約登録

#### 認証関連

- `GET /vcs/pending` - Pending状態のVC一覧取得
- `PATCH /vcs/{email}/activate` - VCアクティベート
- `PATCH /vcs/{email}/revoke` - VC無効化

## 認証

全てのAPIリクエストには`Authorization`ヘッダーにAPIキーを含める必要があります：

```
Authorization: Bearer ${process.env.API_KEY}
```
