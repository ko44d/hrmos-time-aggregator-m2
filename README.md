# hrmos-time-aggregator-m2

## 起動方法

このプロジェクトをローカルで起動するには、以下の手順を実行してください。

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

4. サーバーを起動する:
   ```sh
   npm start
   ```

5. ブラウザで `http://localhost:3000` にアクセスして動作を確認する。

## その他
- 開発環境でホットリロードを有効にする場合は `npm run dev` を使用してください。
- 本番環境用のビルドは `npm run build` を実行してください。
