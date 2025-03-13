# hrmos-time-aggregator-m2

## 起動方法

このプロジェクトの起動方法は、開発環境と本番環境の2種類に分かれます。

### 開発環境での起動方法

開発中はホットリロードが有効な開発用サーバーを利用して、コード変更時に自動的にブラウザが更新されます。以下の手順で開発サーバーを起動してください。

1. リポジトリをクローンする:
   ```sh
   git clone https://github.com/your-repo/hrmos-time-aggregator-m2.git
   cd hrmos-time-aggregator-m2
   ```

2. 必要な依存関係をインストールする:
   ```sh
   npm install
   ```

3. 環境変数を設定する:
   `.env.example` をコピーして `.env` を作成し、適宜設定を記入してください。

4. 開発用サーバーを起動する:
   ```sh
   npm run dev
   ```
   実行すると、ホットリロードが有効な状態で開発サーバーが起動します。

5. ブラウザで `http://localhost:3000` にアクセスして動作を確認する。

### 本番環境での起動方法

本番環境では、まずプロダクションビルドを作成し、その後プロダクションサーバーを起動します。以下の手順に従ってください。

1. リポジトリをクローンする:
   ```sh
   git clone https://github.com/your-repo/hrmos-time-aggregator-m2.git
   cd hrmos-time-aggregator-m2
   ```

2. 必要な依存関係をインストールする:
   ```sh
   npm install
   ```

3. 環境変数を設定する:
   `.env.example` をコピーして `.env` を作成し、適宜設定を記入してください。

4. プロダクションビルドを作成する:
   ```sh
   npm run build
   ```

5. プロダクションサーバーを起動する:
   ```sh
   npm start
   ```

6. ブラウザで `http://localhost:3000` にアクセスして動作を確認する。

## その他

- 環境に応じた設定や依存関係がある場合は、適宜 `.env` の設定を見直してください。
