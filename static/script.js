document.addEventListener('DOMContentLoaded', () => {
    // HTMLの要素を取得
    const courseSelect = document.getElementById('course-select');
    const addButton = document.getElementById('add-button');
    const resetButton = document.getElementById('reset-button');
    const timetable = document.getElementById('timetable');
    const selectedList = document.getElementById('selected-list');
    const totalCreditsSpan = document.getElementById('total-credits');

    // 曜日のマッピング
    const dayMap = { '月': 0, '火': 1, '水': 2, '木': 3, '金': 4 };
    let selectedCourses = new Set(); // 選択済みの科目IDを管理

    // 初期化関数
    function initialize() {
        createTimetable();
        populateCourseSelect();
        updateDisplay();
    }

    // 時間割の表を生成
    function createTimetable() {
        const days = ['月', '火', '水', '木', '金'];
        const periods = [1, 2, 3, 4, 5];
        
        let html = '<thead><tr><th></th>';
        days.forEach(day => html += `<th>${day}</th>`);
        html += '</tr></thead><tbody>';

        periods.forEach(period => {
            html += `<tr><th>${period}限</th>`;
            days.forEach(day => {
                html += `<td id="cell-${dayMap[day]}-${period}"></td>`;
            });
            html += '</tr>';
        });
        html += '</tbody>';
        timetable.innerHTML = html;
    }

    // 科目選択のドロップダウンを生成
    function populateCourseSelect() {
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.name} (${course.day}${course.period}限)`;
            courseSelect.appendChild(option);
        });
    }

    // 表示を更新するメインの関数
    function updateDisplay() {
        // 時間割とリストをクリア
        document.querySelectorAll('#timetable td').forEach(td => {
            td.innerHTML = '';
            td.classList.remove('course-cell');
        });
        selectedList.innerHTML = '';

        let totalCredits = 0;
        const timetableSlots = {}; // 時間の重複チェック用

        selectedCourses.forEach(courseId => {
            const course = courses.find(c => c.id === courseId);
            if (!course) return;

            const slot = `${course.day}-${course.period}`;
            
            // 既に同じ時間帯に科目があれば、新しい方を優先（UI上は後から追加したものが表示される）
            timetableSlots[slot] = course;
            
            totalCredits += parseInt(course.credits, 10);
        });
      
        // 重複チェックと描画
        const conflicts = new Set();
        const tempSlots = {};
        selectedCourses.forEach(courseId => {
            const course = courses.find(c => c.id === courseId);
            const slot = `${course.day}-${course.period}`;
            if (tempSlots[slot]) {
                conflicts.add(slot);
            }
            tempSlots[slot] = true;
        });


        Object.values(timetableSlots).forEach(course => {
            const slot = `${course.day}-${course.period}`;
            const cell = document.getElementById(`cell-${dayMap[course.day]}-${course.period}`);
            if (cell) {
                cell.textContent = course.name;
                cell.classList.add('course-cell');
                if (conflicts.has(slot)) {
                    cell.style.backgroundColor = '#f8d7da'; // 重複している場合は赤くする
                } else {
                    cell.style.backgroundColor = ''; // 重複がなければデフォルト
                }
            }

            // 選択済みリストに追加
            const li = document.createElement('li');
            li.textContent = `${course.name} (${course.credits}単位)`;
            if (conflicts.has(slot)) {
                 li.style.color = 'red';
                 li.textContent += ' [重複!]';
            }
            selectedList.appendChild(li);
        });

        totalCreditsSpan.textContent = totalCredits;
    }

    // 「追加」ボタンの処理
    addButton.addEventListener('click', () => {
        const selectedId = courseSelect.value;
        if (!selectedId) {
            alert('科目を選択してください。');
            return;
        }

        if (selectedCourses.has(selectedId)) {
            alert('この科目は既に追加されています。');
            return;
        }
        
        selectedCourses.add(selectedId);
        updateDisplay();
    });

    // 「リセット」ボタンの処理
    resetButton.addEventListener('click', () => {
        if (confirm('すべての選択をリセットしますか？')) {
            selectedCourses.clear();
            updateDisplay();
            courseSelect.value = "";
        }
    });

    // アプリケーションの初期化
    initialize();
});