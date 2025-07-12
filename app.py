import csv
from flask import Flask, render_template

# Flaskアプリの初期化
app = Flask(__name__)


# CSVファイルから科目データを読み込む関数
def load_courses():
    courses = []
    # UTF-8でファイルを開く
    with open("data/courses.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            courses.append(row)
    return courses


# トップページへのアクセスがあった場合の処理
@app.route("/")
def index():
    # 科目データを読み込む
    courses = load_courses()
    # index.htmlをレンダリングし、科目データを渡す
    return render_template("index.html", courses=courses)


# このファイルが直接実行された場合にサーバーを起動
if __name__ == "__main__":
    app.run(debug=True)
