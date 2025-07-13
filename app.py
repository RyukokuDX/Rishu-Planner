import json
from flask import Flask, render_template

app = Flask(__name__)


def load_courses():
    """
    JSONファイルを読み込み、学期情報を含めたフラットなリストに変換する。
    """
    with open("data/intelligent_info_courses 2.json", "r", encoding="utf-8") as f:
        original_data = json.load(f)

    flattened_courses = []
    course_id_counter = 1

    for course_data in original_data:
        course_name = course_data.get("科目名")

        opening_info_list = course_data.get("開講情報一覧", [])
        if not opening_info_list:
            continue

        syllabus_list = opening_info_list[0].get("シラバス一覧", [])
        if not syllabus_list:
            continue

        for syllabus in syllabus_list:
            credits = syllabus.get("単位数")
            # ▼▼▼ 学期情報を取得 ▼▼▼
            term = syllabus.get("学期")

            lecture_times = syllabus.get("講義時間一覧", [])
            for time_slot in lecture_times:
                day = time_slot.get("曜日")
                period = time_slot.get("時限")

                if day == "集中" or period == 0:
                    continue

                flattened_courses.append(
                    {
                        "id": str(course_id_counter),
                        "name": course_name,
                        "day": str(day),
                        "period": str(period),
                        "credits": str(credits),
                        "term": str(term),  # ▼▼▼ データを追加 ▼▼▼
                    }
                )
                course_id_counter += 1

    return flattened_courses


@app.route("/")
def index():
    courses = load_courses()
    return render_template("index.html", courses=courses)


if __name__ == "__main__":
    app.run(debug=True)
