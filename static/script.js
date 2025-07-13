document.addEventListener('DOMContentLoaded', () => {
    // HTML要素
    const timetable = document.getElementById('timetable');
    const selectedList = document.getElementById('selected-list');
    const totalCreditsSpan = document.getElementById('total-credits');
    const resetButton = document.getElementById('reset-button');
    const checkConflictsButton = document.getElementById('check-conflicts-button');
    const availableCoursesList = document.getElementById('available-courses-list');

    // データ構造: { "月-1": { q1: [c_id], q2: [c_id] }, ... }
    let timetableData = {};
    const dayMapReverse = ['月', '火', '水', '木', '金'];
    let currentSelectedSlot = null; // 現在選択中の .quarter-slot

    // 初期化
    function initialize() {
        createTimetable();
        addEventListeners();
        updateDisplay();
    }

    // 時間割の表を生成（クオーター分割対応）
    function createTimetable() {
        const days = ['月', '火', '水', '木', '金'];
        const periods = [1, 2, 3, 4, 5];
        let html = '<thead><tr><th></th>';
        days.forEach(day => html += `<th>${day}</th>`);
        html += '</tr></thead><tbody>';

        periods.forEach(period => {
            html += `<tr><th>${period}限</th>`;
            days.forEach((day, dayIndex) => {
                html += `<td><div class="quarter-container">
                    <div class="quarter-slot" data-day-index="${dayIndex}" data-period="${period}" data-quarter="q1"></div>
                    <div class="quarter-slot" data-day-index="${dayIndex}" data-period="${period}" data-quarter="q2"></div>
                </div></td>`;
            });
            html += '</tr>';
        });
        html += '</tbody>';
        timetable.innerHTML = html;
    }

    // イベントリスナー設定
    function addEventListeners() {
        timetable.addEventListener('click', e => {
            if (e.target.classList.contains('quarter-slot')) {
                handleSlotClick(e.target);
            }
        });
        resetButton.addEventListener('click', handleReset);
        checkConflictsButton.addEventListener('click', handleConflictCheck);
    }

    // スロット（各クオーター）がクリックされた時の処理
    function handleSlotClick(slot) {
        if (currentSelectedSlot) {
            currentSelectedSlot.classList.remove('selected-slot');
        }
        slot.classList.add('selected-slot');
        currentSelectedSlot = slot;
        displayAvailableCourses(slot.dataset);
    }

    // 選択可能な科目を右パネルに表示
    function displayAvailableCourses({ dayIndex, period, quarter }) {
        const day = dayMapReverse[dayIndex];
        const quarterTerms = (quarter === 'q1') ? ['前期', '後期', '通年', '1Q', '3Q'] : ['前期', '後期', '通年', '2Q', '4Q'];

        const available = courses.filter(c => 
            c.day === day && c.period === period && quarterTerms.includes(c.term)
        );
        
        availableCoursesList.innerHTML = '';
        if (available.length === 0) {
            availableCoursesList.innerHTML = '<p class="placeholder">このコマに開講されている<br>授業はありません。</p>';
            return;
        }

        const q_name = (quarter === 'q1') ? '1Q/3Q' : '2Q/4Q';
        const listTitle = document.createElement('h3');
        listTitle.textContent = `${day}曜 ${period}限 (${q_name}) の授業`;
        availableCoursesList.appendChild(listTitle);

        const slotKey = `${day}-${period}`;
        const selectedInSlot_q1 = (timetableData[slotKey] && timetableData[slotKey].q1) || [];
        const selectedInSlot_q2 = (timetableData[slotKey] && timetableData[slotKey].q2) || [];
        const allSelectedInSlot = [...selectedInSlot_q1, ...selectedInSlot_q2];

        available.forEach(course => {
            const item = document.createElement('div');
            item.className = 'course-item';
            const isSelected = allSelectedInSlot.includes(course.id);
            
            item.innerHTML = `<span>${course.name} (${course.term}, ${course.credits}単位)</span>
                <button data-course-id="${course.id}" ${isSelected ? 'disabled' : ''}>
                ${isSelected ? '選択済' : '追加'}</button>`;
            
            item.querySelector('button').addEventListener('click', () => addCourse(course.id));
            availableCoursesList.appendChild(item);
        });
    }

    // 科目を時間割に追加
    function addCourse(courseId) {
        const course = courses.find(c => c.id === courseId);
        if (!course) return;

        const slotKey = `${course.day}-${course.period}`;
        if (!timetableData[slotKey]) {
            timetableData[slotKey] = { q1: [], q2: [] };
        }

        const isSemesterCourse = ['前期', '後期', '通年'].includes(course.term);

        if (isSemesterCourse) {
            // 前期・後期科目は両方のクオーターに追加
            if (!timetableData[slotKey].q1.includes(courseId)) timetableData[slotKey].q1.push(courseId);
            if (!timetableData[slotKey].q2.includes(courseId)) timetableData[slotKey].q2.push(courseId);
        } else {
            // クオーター科目は該当する方だけに追加
            const targetQuarter = ['1Q', '3Q'].includes(course.term) ? 'q1' : 'q2';
            if (!timetableData[slotKey][targetQuarter].includes(courseId)) {
                timetableData[slotKey][targetQuarter].push(courseId);
            }
        }
        
        updateDisplay();
        if (currentSelectedSlot) displayAvailableCourses(currentSelectedSlot.dataset);
    }

    // 科目を削除
    function removeCourse(courseId) {
        const course = courses.find(c => c.id === courseId);
        if (!course) return;

        const slotKey = `${course.day}-${course.period}`;
        const isSemesterCourse = ['前期', '後期', '通年'].includes(course.term);

        if (timetableData[slotKey]) {
            if (isSemesterCourse) {
                // 前期・後期科目は両方から削除
                timetableData[slotKey].q1 = timetableData[slotKey].q1.filter(id => id !== courseId);
                timetableData[slotKey].q2 = timetableData[slotKey].q2.filter(id => id !== courseId);
            } else {
                // クオーター科目は該当箇所から削除
                const targetQuarter = ['1Q', '3Q'].includes(course.term) ? 'q1' : 'q2';
                timetableData[slotKey][targetQuarter] = timetableData[slotKey][targetQuarter].filter(id => id !== courseId);
            }

            // スロットが空になったらオブジェクトからキーごと削除
            if (timetableData[slotKey].q1.length === 0 && timetableData[slotKey].q2.length === 0) {
                delete timetableData[slotKey];
            }
        }
        
        updateDisplay();
        if (currentSelectedSlot) displayAvailableCourses(currentSelectedSlot.dataset);
    }

    // 画面表示を更新
    function updateDisplay() {
        document.querySelectorAll('.quarter-slot').forEach(slot => {
            slot.innerHTML = '';
            slot.classList.remove('course-cell');
        });

        if (currentSelectedSlot) currentSelectedSlot.classList.add('selected-slot');
        selectedList.innerHTML = '';

        let totalCredits = 0;
        const countedCourseIds = new Set(); // 単位の二重計上を防ぐ

        for (const slotKey in timetableData) {
            ['q1', 'q2'].forEach(quarter => {
                const courseIdArray = timetableData[slotKey][quarter];
                if (!courseIdArray || courseIdArray.length === 0) return;
                
                const [day, period] = slotKey.split('-');
                const dayIndex = dayMapReverse.indexOf(day);
                const slotEl = document.querySelector(`.quarter-slot[data-day-index='${dayIndex}'][data-period='${period}'][data-quarter='${quarter}']`);

                if (slotEl) {
                    const courseNamesHTML = courseIdArray.map(id => {
                        const course = courses.find(c => c.id === id);
                        // 単位の二重計上防止とリストアップ
                        if (!countedCourseIds.has(id)) {
                            countedCourseIds.add(id);
                            totalCredits += parseInt(course.credits, 10);

                            const li = document.createElement('li');
                            li.textContent = `${course.name} (${course.day}${course.period}限, ${course.term})`;
                            const removeBtn = document.createElement('button');
                            removeBtn.textContent = '削除';
                            removeBtn.onclick = () => removeCourse(id);
                            li.appendChild(removeBtn);
                            selectedList.appendChild(li);
                        }
                        return `<div>${course.name}</div>`;
                    }).join('');
                    slotEl.innerHTML = courseNamesHTML;
                    slotEl.classList.add('course-cell');
                }
            });
        }
        totalCreditsSpan.textContent = totalCredits;
    }

    // リセット処理
    function handleReset() {
        if (confirm('すべての選択をリセットしますか？')) {
            timetableData = {};
            availableCoursesList.innerHTML = '<p class="placeholder">時間割のコマを選択してください。</p>';
            if (currentSelectedSlot) {
                currentSelectedSlot.classList.remove('selected-slot');
                currentSelectedSlot = null;
            }
            document.querySelectorAll('.conflict-cell').forEach(c => c.classList.remove('conflict-cell'));
            updateDisplay();
        }
    }

    // 重複チェック処理
    function handleConflictCheck() {
        document.querySelectorAll('.conflict-cell').forEach(c => c.classList.remove('conflict-cell'));
        let conflictCount = 0;

        for (const slotKey in timetableData) {
            ['q1', 'q2'].forEach(quarter => {
                if (timetableData[slotKey][quarter].length > 1) {
                    const [day, period] = slotKey.split('-');
                    const dayIndex = dayMapReverse.indexOf(day);
                    const slotEl = document.querySelector(`.quarter-slot[data-day-index='${dayIndex}'][data-period='${period}'][data-quarter='${quarter}']`);
                    if (slotEl) slotEl.classList.add('conflict-cell');
                    conflictCount++;
                }
            });
        }
        
        if (conflictCount > 0) {
            alert(`⚠️ ${conflictCount}個のクオーターで授業が重複しています。`);
        } else {
            alert('✅ 重複している授業はありません。');
        }
    }

    initialize();
});