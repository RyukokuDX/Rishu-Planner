document.addEventListener('DOMContentLoaded', function() {
    // --- データ管理 ---
    // 履修登録された講義リスト（将来的にはユーザーが追加・削除できるようにする）
    const registeredLectures = [
        { id: 1, name: 'プログラミング基礎', day: 'mon', period: 1, quarter: 'first', credits: 2, category: '専門科目' },
        { id: 2, name: '線形代数I', day: 'tue', period: 2, quarter: 'first', credits: 2, category: '専門科目' },
        { id: 3, name: '学術的文章の作成', day: 'wed', period: 3, quarter: 'second', credits: 1, category: '教養科目' },
        { id: 4, name: '微分積分I', day: 'thu', period: 2, quarter: 'first', credits: 2, category: '専門科目' },
        { id: 5, name: '英語コミュニケーション', day: 'fri', period: 4, quarter: 'second', credits: 1, category: '教養科目' },
        { id: 6, name: 'スポーツ科学', day: 'wed', period: 5, quarter: 'first', credits: 1, category: '自由科目' },
        { id: 7, name: '情報社会と倫理', day: 'mon', period: 3, quarter: 'second', credits: 2, category: '教養科目' },
    ];

    // 単位計算の対象となるカテゴリ
    const creditCategories = ['専門科目', '教養科目', '自由科目'];


    // --- DOM要素 ---
    const timetableBody = document.querySelector('#timetable tbody');
    const creditBreakdownEl = document.getElementById('credit-breakdown');
    const totalCreditsEl = document.getElementById('total-credits');


    // --- 初期化処理 ---
    const periods = 5; // 5限までを想定
    const days = ['mon', 'tue', 'wed', 'thu', 'fri'];

    // 時間割の枠を生成
    createTimetableFrame();
    // 講義データを時間割に描画
    renderLectures();
    // 単位サマリーを計算・表示
    updateCreditSummary();


    // --- 関数定義 ---
    function createTimetableFrame() {
        for (let i = 1; i <= periods; i++) {
            const row = document.createElement('tr');

            // 時限のヘッダーセル
            const periodHeaderCell = document.createElement('th');
            periodHeaderCell.textContent = `${i}`;
            row.appendChild(periodHeaderCell);

            // 各曜日のセル
            for (const day of days) {
                const cell = document.createElement('td');
                cell.dataset.day = day;
                cell.dataset.period = i;

                // クォーター制対応のため、セル内に2つのdivを生成
                const firstHalf = document.createElement('div');
                firstHalf.classList.add('quarter-cell');
                firstHalf.dataset.quarter = 'first'; // 前期 (1Q or 3Q)

                const secondHalf = document.createElement('div');
                secondHalf.classList.add('quarter-cell');
                secondHalf.dataset.quarter = 'second'; // 後期 (2Q or 4Q)

                cell.appendChild(firstHalf);
                cell.appendChild(secondHalf);
                row.appendChild(cell);
            }

            timetableBody.appendChild(row);
        }
    }

    /**
     * 登録された講義を時間割に描画する
     */
    function renderLectures() {
        // 既存の講義表示をクリア
        document.querySelectorAll('.lecture-item').forEach(el => el.remove());

        registeredLectures.forEach(lecture => {
            // 対応するクォーターセルを見つける
            const targetCell = document.querySelector(`td[data-day="${lecture.day}"][data-period="${lecture.period}"] .quarter-cell[data-quarter="${lecture.quarter}"]`);

            if (targetCell) {
                const lectureDiv = document.createElement('div');
                lectureDiv.classList.add('lecture-item');
                lectureDiv.textContent = lecture.name;
                lectureDiv.title = `${lecture.name} (${lecture.credits}単位, ${lecture.category})`; // マウスオーバーで詳細表示
                lectureDiv.dataset.lectureId = lecture.id;
                targetCell.appendChild(lectureDiv);
            }
        });
    }

    /**
     * 単位数をカテゴリ別に集計し、表示を更新する
     */
    function updateCreditSummary() {
        // カテゴリごとの単位数を初期化
        const creditsByCategory = {};
        creditCategories.forEach(cat => creditsByCategory[cat] = 0);

        let totalCredits = 0;

        // 登録された講義をループして単位を計算
        for (const lecture of registeredLectures) {
            if (creditsByCategory.hasOwnProperty(lecture.category)) {
                creditsByCategory[lecture.category] += lecture.credits;
            }
            totalCredits += lecture.credits;
        }

        // 表示を更新
        creditBreakdownEl.innerHTML = ''; // 中身を一旦クリア
        for (const category of creditCategories) {
            const p = document.createElement('p');
            p.textContent = `${category}: ${creditsByCategory[category]}単位`;
            creditBreakdownEl.appendChild(p);
        }

        totalCreditsEl.textContent = totalCredits;
    }
});

// 時間割の全てのセル（コマ）にクリックイベントを設定
document.querySelectorAll('.timetable-cell').forEach(cell => {
    cell.addEventListener('click', async () => {
        // HTMLのdata属性から曜日と時限を取得 (例: <td class="timetable-cell" data-day="monday" data-period="1">)
        const day = cell.dataset.day;
        const period = cell.dataset.period;

        if (!day || !period) {
            console.error('Cell does not have day/period data.');
            return;
        }

        try {
            // バックエンドAPIにリクエストを送信
            const response = await fetch(`/api/lectures?day=${day}&period=${period}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const lectures = await response.json();

            // 取得した講義リストを描画する関数を呼び出す
            displayLectures(lectures);

        } catch (error) {
            console.error('Could not fetch lectures:', error);
            // ユーザーにエラーを通知する処理
            const lectureList = document.getElementById('lecture-list-area');
            lectureList.innerHTML = '<li>講義情報の取得に失敗しました。</li>';
        }
    });
});

/**
 * 講義リストを画面に表示する
 * @param {Array} lectures - 表示する講義の配列
 */
function displayLectures(lectures) {
    // 要件定義の画面構成案にある「選択可能な講義リスト」のエリア
    const lectureList = document.getElementById('lecture-list-area');
    lectureList.innerHTML = ''; // 表示を一旦クリア

    if (lectures.length === 0) {
        lectureList.innerHTML = '<li>この時間帯に開講されている講義はありません。</li>';
        return;
    }

    // 各講義をリスト項目として追加
    lectures.forEach(lecture => {
        const listItem = document.createElement('li');
        // 要件定義にあるようにチェックボックスで選択できるようにする
        listItem.innerHTML = `
            <input type="checkbox" id="lecture-${lecture.id}" value="${lecture.id}">
            <label for="lecture-${lecture.id}">
                ${lecture.name} (${lecture.teacher}) - ${lecture.credits}単位
            </label>
        `;
        lectureList.appendChild(listItem);
    });
}
