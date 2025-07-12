document.addEventListener('DOMContentLoaded', () => {
    // HTMLの要素を取得
    const timetable = document.getElementById('timetable');
    const selectedList = document.getElementById('selected-list');
    const totalCreditsSpan = document.getElementById('total-credits');
    const resetButton = document.getElementById('reset-button');
    const availableCoursesList = document.getElementById('available-courses-list');

    // データと状態管理
    const dayMapReverse = ['月', '火', '水', '木', '金'];
    let selectedCourses = new Set(); // 選択済みの科目IDを管理
    let currentSelectedCell = null; // 現在選択中のセル

    /**
     * アプリケーションを初期化する
     */
    function initialize() {
        createTimetable();
        addTimetableListeners();
        updateDisplay();
        resetButton.addEventListener('click', handleReset);
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
                // セルに曜日と時限の情報をデータ属性として埋め込む
                html += `<td data-day-index="${dayIndex}" data-period="${period}"></td>`;
            });
            html += '</tr>';
        });
        html += '</tbody>';
        timetable.innerHTML = html;
    }

    /**
     * 時間割の各セルにクリックイベントを設定する
     */
    function addTimetableListeners() {
        timetable.addEventListener('click', (e) => {
            // TD（セル）要素以外がクリックされた場合は無視
            if (e.target.tagName !== 'TD') return;
            
            const cell = e.target;
            const dayIndex = cell.dataset.dayIndex;
            const period = cell.dataset.period;
            handleCellClick(cell, dayIndex, period);
        });
    }

    /**
     * セルがクリックされた時の処理
     */
    function handleCellClick(cell, dayIndex, period) {
        // 以前に選択されていたセルのハイライトを解除
        if (currentSelectedCell) {
            currentSelectedCell.classList.remove('selected-cell');
        }
        
        // 新しくクリックされたセルをハイライト
        cell.classList.add('selected-cell');
        currentSelectedCell = cell;

        const day = dayMapReverse[dayIndex];
        displayAvailableCourses(day, period);
    }

    /**
     * 右パネルに選択可能な科目を表示する
     */
    function displayAvailableCourses(day, period) {
        // 対象のコマに開講されている科目をフィルタリング
        const available = courses.filter(c => c.day === day && c.period === period);
        
        availableCoursesList.innerHTML = ''; // 表示をクリア

        if (available.length === 0) {
            availableCoursesList.innerHTML = '<p class="placeholder">このコマに開講されている<br>授業はありません。</p>';
            return;
        }

        const listTitle = document.createElement('h3');
        listTitle.textContent = `${day}曜 ${period}限 の授業`;
        availableCoursesList.appendChild(listTitle);

        available.forEach(course => {
            const item = document.createElement('div');
            item.className = 'course-item';
            
            const isSelected = selectedCourses.has(course.id);
            
            item.innerHTML = `
                <span>${course.name} (${course.credits}単位)</span>
                <button data-course-id="${course.id}" ${isSelected ? 'disabled' : ''}>
                    ${isSelected ? '選択済' : '追加'}
                </button>
            `;
            
            // 各科目の追加ボタンにイベントを設定
            item.querySelector('button').addEventListener('click', () => {
                addCourse(course.id, day, period);
            });
            
            availableCoursesList.appendChild(item);
        });
    }

    /**
     * 科目を履修リストに追加する
     */
    function addCourse(courseId, day, period) {
        // 同じ時間帯に既に別の科目が登録されているかチェック
        const existingCourseId = [...selectedCourses].find(id => {
            const c = courses.find(cr => cr.id === id);
            return c.day === day && c.period === period;
        });
        
        // 既存の科目があれば削除（上書き）
        if (existingCourseId) {
            selectedCourses.delete(existingCourseId);
        }

        selectedCourses.add(courseId);
        updateDisplay();
        
        // 右パネルの科目リストも更新して「追加」ボタンを「選択済」に変える
        displayAvailableCourses(day, period);
    }
    
    /**
     * 科目を履修リストから削除する
     */
    function removeCourse(courseId) {
        const course = courses.find(c => c.id === courseId);
        selectedCourses.delete(courseId);
        updateDisplay();
        
        // 右パネルが表示されている場合はそちらも更新
        if (currentSelectedCell) {
            const day = dayMapReverse[currentSelectedCell.dataset.dayIndex];
            const period = currentSelectedCell.dataset.period;
            if (course.day === day && course.period === period) {
                 displayAvailableCourses(day, period);
            }
        }
    }

    /**
     * 画面全体の表示を更新する
     */
    function updateDisplay() {
        // 1. 時間割のセルをクリア
        document.querySelectorAll('#timetable td').forEach(td => {
            td.innerHTML = '';
            td.classList.remove('course-cell');
        });
        // 選択中のセルのハイライトは維持
        if (currentSelectedCell) {
            currentSelectedCell.classList.add('selected-cell');
        }

        // 2. 左パネルの選択済みリストをクリア
        selectedList.innerHTML = '';
        
        let totalCredits = 0;

        selectedCourses.forEach(courseId => {
            const course = courses.find(c => c.id === courseId);
            if (!course) return;

            // 3. 時間割に科目名をセット
            const cell = document.querySelector(`td[data-day-index='${dayMapReverse.indexOf(course.day)}'][data-period='${course.period}']`);
            if (cell) {
                cell.textContent = course.name;
                cell.classList.add('course-cell');
            }

            // 4. 左パネルの選択済みリストに項目を追加
            const li = document.createElement('li');
            li.textContent = `${course.name} (${course.day}${course.period}限)`;
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '削除';
            removeBtn.onclick = () => removeCourse(course.id);
            li.appendChild(removeBtn);
            selectedList.appendChild(li);

            // 5. 合計単位数を加算
            totalCredits += parseInt(course.credits, 10);
        });

        // 6. 合計単位数を更新
        totalCreditsSpan.textContent = totalCredits;
    }

    /**
     * リセットボタンの処理
     */
    function handleReset() {
        if (confirm('すべての選択をリセットしますか？')) {
            selectedCourses.clear();
            availableCoursesList.innerHTML = '<p class="placeholder">時間割のコマを選択してください。</p>';
            if(currentSelectedCell) {
                currentSelectedCell.classList.remove('selected-cell');
                currentSelectedCell = null;
            }
            updateDisplay();
        }
    }

    // --- アプリケーションの実行 ---
    initialize();
});