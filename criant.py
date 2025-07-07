from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
# CORSを有効にする。これにより、異なるオリジン（例: http://127.0.0.1:5500）
# からのJavaScriptリクエストを受け付けられるようになります。
CORS(app)

# 本来はデータベースから取得しますが、ここではダミーデータを使います。
# 要件定義の「5. 想定技術スタック」にあるデータ収集で作成されるデータです。
LECTURE_DATA = [
    {
        "id": 101,
        "name": "プログラミング入門",
        "teacher": "佐藤教授",
        "credits": 2,
        "day": "monday",
        "period": 1,
    },
    {
        "id": 102,
        "name": "線形代数I",
        "teacher": "鈴木准教授",
        "credits": 2,
        "day": "monday",
        "period": 1,
    },
    {
        "id": 201,
        "name": "Webデザイン基礎",
        "teacher": "高橋講師",
        "credits": 2,
        "day": "tuesday",
        "period": 2,
    },
    # ... 他の講義データ
]


@app.route("/api/lectures")
def get_lectures_by_time():
    # クエリパラメータから曜日と時限を取得
    day = request.args.get("day")
    period_str = request.args.get("period")

    # パラメータが不足している場合はエラーを返す
    if not day or not period_str:
        return jsonify({"error": "day and period parameters are required"}), 400

    try:
        period = int(period_str)
    except (ValueError, TypeError):
        return jsonify({"error": "period must be an integer"}), 400

    # 該当する講義をデータからフィルタリング
    results = [
        lecture
        for lecture in LECTURE_DATA
        if lecture["day"] == day and lecture["period"] == period
    ]

    return jsonify(results)


if __name__ == "__main__":
    app.run(debug=True)
