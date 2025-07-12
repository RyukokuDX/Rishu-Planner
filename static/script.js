document.addEventListener('DOMContentLoaded', () => {
    // HTMLの要素を取得
    const timetable = document.getElementById('timetable');
    const selectedList = document.getElementById('selected-list');
    const totalCreditsSpan = document.getElementById('total-credits');
    const resetButton = document.getElementById('reset-button');
    const checkConflictsButton = document.getElementById('check-conflicts-button');
    const availableCoursesList = document.getElementById('available-courses-list');

    // データと状態管理
    const dayMapReverse = ['月', '火', '水', '木', '金'];
    // 登録された科目を管理するデータ構造を変更
    // e.g. { "月-1": ["courseId1", "courseId2"], "火-2": ["courseId3"] }
    let timetableData = {};
    let currentSelectedCell = null; // 現在選択中のセル

    /**
     * アプリケーションを初期化する
     */
    function initialize() {
        createTimetable();
        addEventListeners();
        updateDisplay();
    }

    /**
     * イベントリスナーをまとめて設定する
     */
    function addEventListeners() {
        // 時間割のクリックイベント
        timetable.addEventListener('click', (e) => {
            if (e.target.tagName !== 'TD') return;
            handleCellClick(e.target);
        });
        // リセットボタンのイベント
        resetButton.addEventListener('click', handleReset);
        // 重複チェックボタンのイベント
        checkConflictsButton.addEventListener('click', handleConflictCheck);
    }

    /**
     * 時間割の表を動的に生成する
     */
    function createTimetable() {
        const days = ['月', '火', '水', '木', '金'];
        const periods = [1, 2, 3, 4, 5];
        
        let html = '<thead><tr><th></th>';
        days.forEach(day => html += `<th>${day}</th>`);
        html += '</tr></thead><tbody>';

        periods.forEach(period => {
            html += `<tr><th>${period}限</th>`;
            days.forEach((day, dayIndex) => {
                html += `<td data-day-index="${dayIndex}" data-period="${period}"></td>`;
            });
            html += '</tr>';
        });
        html += '</tbody>';
        timetable.innerHTML = html;
    }

    /**
     * セルがクリックされた時の処理
     */
    function handleCellClick(cell) {
        if (currentSelectedCell) {
            currentSelectedCell.classList.remove('selected-cell');
        }
        cell.classList.add('selected-cell');
        currentSelectedCell = cell;

        const day = dayMapReverse[cell.dataset.dayIndex];
        const period = cell.dataset.period;
        displayAvailableCourses(day, period);
    }

    /**
     * 右パネルに選択可能な科目を表示する
     */
    function displayAvailableCourses(day, period) {
        const available = courses.filter(c => c.day === day && c.period === period);
        availableCoursesList.innerHTML = '';

        if (available.length === 0) {
            availableCoursesList.innerHTML = '<p class="placeholder">このコマに開講されている<br>授業はありません。</p>';
            return;
        }

        const listTitle = document.createElement('h3');
        listTitle.textContent = `${day}曜 ${period}限 の授業`;
        availableCoursesList.appendChild(listTitle);

        const slotKey = `${day}-${period}`;
        const selectedInSlot = timetableData[slotKey] || [];

        available.forEach(course => {
            const item = document.createElement('div');
            item.className = 'course-item';
            const isSelected = selectedInSlot.includes(course.id);
            
            item.innerHTML = `
                <span>${course.name} (${course.credits}単位)</span>
                <button data-course-id="${course.id}" ${isSelected ? 'disabled' : ''}>
                    ${isSelected ? '選択済' : '追加'}
                </button>
            `;
            
            item.querySelector('button').addEventListener('click', () => {
                addCourse(course.id, day, period);
            });
            availableCoursesList.appendChild(item);
        });
    }

    /**
     * 科目を履修リストに追加する（複数登録を許可）
     */
    function addCourse(courseId, day, period) {
        const slotKey = `${day}-${period}`;
        if (!timetableData[slotKey]) {
            timetableData[slotKey] = [];
        }
        
        if (!timetableData[slotKey].includes(courseId)) {
            timetableData[slotKey].push(courseId);
        } else {
            alert('この授業は既にこのコマに追加されています。');
            return;
        }

        updateDisplay();
        displayAvailableCourses(day, period);
    }

    /**
     * 科目を履修リストから削除する
     */
    function removeCourse(courseId, slotKey) {
        if (timetableData[slotKey]) {
            timetableData[slotKey] = timetableData[slotKey].filter(id => id !== courseId);
            if (timetableData[slotKey].length === 0) {
                delete timetableData[slotKey];
            }
        }
        updateDisplay();
        
        // 右パネルも更新
        if (currentSelectedCell) {
            const day = dayMapReverse[currentSelectedCell.dataset.dayIndex];
            const period = currentSelectedCell.dataset.period;
            if (`${day}-${period}` === slotKey) {
                 displayAvailableCourses(day, period);
            }
        }
    }

    /**
     * 画面全体の表示を更新する
     */
    function updateDisplay() {
        // 時間割の表示をクリア（重複ハイライトは消さない）
        document.querySelectorAll('#timetable td').forEach(td => {
            td.innerHTML = '';
            td.classList.remove('course-cell');
        });
        if (currentSelectedCell) {
            currentSelectedCell.classList.add('selected-cell');
        }

        selectedList.innerHTML = '';
        let totalCredits = 0;

        for (const slotKey in timetableData) {
            const courseIdArray = timetableData[slotKey];
            if (courseIdArray.length === 0) continue;

            const [day, period] = slotKey.split('-');
            const cell = document.querySelector(`td[data-day-index='${dayMapReverse.indexOf(day)}'][data-period='${period}']`);

            if (cell) {
                const courseNamesHTML = courseIdArray.map(id => {
                    const course = courses.find(c => c.id === id);
                    return course ? `<div>${course.name}</div>` : '';
                }).join('');
                cell.innerHTML = courseNamesHTML;
                cell.classList.add('course-cell');
            }

            courseIdArray.forEach(id => {
                const course = courses.find(c => c.id === id);
                if (!course) return;

                const li = document.createElement('li');
                li.textContent = `${course.name} (${course.day}${course.period}限)`;
                const removeBtn = document.createElement('button');
                removeBtn.textContent = '削除';
                removeBtn.onclick = () => removeCourse(course.id, slotKey);
                li.appendChild(removeBtn);
                selectedList.appendChild(li);

                totalCredits += parseInt(course.credits, 10);
            });
        }
        totalCreditsSpan.textContent = totalCredits;
    }

    /**
     * リセットボタンの処理
     */
    function handleReset() {
        if (confirm('すべての選択をリセットしますか？')) {
            timetableData = {};
            availableCoursesList.innerHTML = '<p class="placeholder">時間割のコマを選択してください。</p>';
            if(currentSelectedCell) {
                currentSelectedCell.classList.remove('selected-cell');
                currentSelectedCell = null;
            }
            // 重複ハイライトも全て消す
            document.querySelectorAll('.conflict-cell').forEach(c => c.classList.remove('conflict-cell'));
            updateDisplay();
        }
    }

    /**
     * 重複チェックボタンの処理
     */
    function handleConflictCheck() {
        // まず全てのハイライトをクリア
        document.querySelectorAll('.conflict-cell').forEach(c => c.classList.remove('conflict-cell'));

        let conflictCount = 0;
        for (const slotKey in timetableData) {
            if (timetableData[slotKey].length > 1) {
                const [day, period] = slotKey.split('-');
                const cell = document.querySelector(`td[data-day-index='${dayMapReverse.indexOf(day)}'][data-period='${period}']`);
                if (cell) {
                    cell.classList.add('conflict-cell');
                }
                conflictCount++;
            }
        }
        
        if (conflictCount > 0) {
            alert(`⚠️ ${conflictCount}個のコマで授業が重複しています。`);
        } else {
            alert('✅ 重複している授業はありません。');
        }
    }

    // --- アプリケーションの実行 ---
    initialize();
});