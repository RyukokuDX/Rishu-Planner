import json
from flask import Flask, render_template

# Flaskアプリの初期化
app = Flask(__name__)


def load_courses():
    """
    複雑な構造のJSONファイルを読み込み、アプリケーションで使いやすい
    フラットなリスト形式に変換する。
    """
    with open("data/intelligent_info_courses 2.json", "r", encoding="utf-8") as f:
        original_data = json.load(f)

    flattened_courses = []
    course_id_counter = 1

    # 各科目をループ処理
    for course_data in original_data:
        course_name = course_data.get("科目名")

        # 2025年度の開講情報を取得
        opening_info_list = course_data.get("開講情報一覧", [])
        if not opening_info_list:
            continue

        # シラバス情報を取得
        syllabus_list = opening_info_list[0].get("シラバス一覧", [])
        if not syllabus_list:
            continue

        # 1つの科目に複数のシラバス情報（担当教員違いなど）がある場合も考慮
        for syllabus in syllabus_list:
            credits = syllabus.get("単位数")

            # 講義時間を取得
            lecture_times = syllabus.get("講義時間一覧", [])

            # 1つの科目が複数の時間帯にまたがる場合（例：火曜2限と3限）も考慮
            for time_slot in lecture_times:
                day = time_slot.get("曜日")
                period = time_slot.get("時限")

                # 「集中講義」など、時間割に配置できないものはスキップ
                if day == "集中" or period == 0:
                    continue

                # アプリケーションで使うシンプルな形式のデータを作成
                flattened_courses.append(
                    {
                        "id": str(course_id_counter),
                        "name": course_name,
                        "day": str(day),
                        "period": str(period),
                        "credits": str(credits),
                    }
                )
                course_id_counter += 1

    return flattened_courses


# トップページへのアクセスがあった場合の処理
@app.route("/")
def index():
    # 変換済みの科目データを読み込む
    courses = load_courses()
    # index.htmlをレンダリングし、科目データを渡す
    return render_template("index.html", courses=courses)


# このファイルが直接実行された場合にサーバーを起動
if __name__ == "__main__":
    app.run(debug=True)
