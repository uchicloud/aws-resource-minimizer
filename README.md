# aws-resource-minimizer

## 開発の手順
1. 以下のソフトウェアをインストールする
    - bun
    - 7-zip
1. 環境変数を設定し、AWSアカウント情報を紐づける  
1. `bun i`で必要モジュールを取得
1. `bun run build`でLambdaを構築
1. `bun run update`でLambdaを更新
