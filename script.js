document.addEventListener('DOMContentLoaded', () => {
    const addSubjectBtn = document.getElementById('add-subject-btn');
    const subjectNameInput = document.getElementById('subject-name-input');
    const subjectsList = document.getElementById('subjects-list');
    const overallAttendanceDisplay = document.getElementById('overall-attendance-display');
    const overallIndicator = document.getElementById('overall-indicator');
    const resetBtn = document.getElementById('reset-btn');

    let subjects = JSON.parse(localStorage.getItem('attendanceSubjects')) || [];

    const saveData = () => {
        localStorage.setItem('attendanceSubjects', JSON.stringify(subjects));
    };

    const calculateOverallAttendance = () => {
        if (subjects.length === 0) {
            overallAttendanceDisplay.textContent = 'N/A';
            overallIndicator.className = 'indicator';
            return;
        }

        const totalAttended = subjects.reduce((acc, subject) => acc + subject.attended, 0);
        const totalClasses = subjects.reduce((acc, subject) => acc + subject.total, 0);

        if (totalClasses === 0) {
            overallAttendanceDisplay.textContent = '0%';
            overallIndicator.className = 'indicator';
            return;
        }

        const overallPercentage = (totalAttended / totalClasses) * 100;
        overallAttendanceDisplay.textContent = `${overallPercentage.toFixed(1)}%`;

        overallIndicator.className = 'indicator';
        if (overallPercentage >= 75) {
            overallIndicator.classList.add('green');
        } else if (overallPercentage >= 50) {
            overallIndicator.classList.add('yellow');
        } else {
            overallIndicator.classList.add('red');
        }
    };

    const renderSubjects = () => {
        subjectsList.innerHTML = '';
        subjects.forEach((subject, index) => {
            const subjectEl = document.createElement('div');
            subjectEl.className = 'subject';

            const percentage = subject.total > 0 ? (subject.attended / subject.total) * 100 : 0;

            subjectEl.innerHTML = `
                <div class="subject-info">
                    <span class="subject-name">${subject.name}</span>
                    <div class="attendance-controls">
                        <button class="present-btn" data-index="${index}">Present</button>
                        <button class="absent-btn" data-index="${index}">Absent</button>
                        <button class="delete-btn" data-index="${index}">Delete</button>
                    </div>
                </div>
                <div class="attendance-percentage">${percentage.toFixed(1)}% (${subject.attended}/${subject.total})</div>
            `;
            subjectsList.appendChild(subjectEl);
        });
        calculateOverallAttendance();
    };

    addSubjectBtn.addEventListener('click', () => {
        const subjectName = subjectNameInput.value.trim();
        if (subjectName && !subjects.some(subject => subject.name.toLowerCase() === subjectName.toLowerCase())) {
            subjects.push({ name: subjectName, attended: 0, total: 0 });
            subjectNameInput.value = '';
            saveData();
            renderSubjects();
        } else if (subjectName) {
            alert('This subject already exists.');
        }
    });

    subjectsList.addEventListener('click', (e) => {
        const index = e.target.dataset.index;
        if (e.target.classList.contains('present-btn')) {
            subjects[index].attended++;
            subjects[index].total++;
        } else if (e.target.classList.contains('absent-btn')) {
            subjects[index].total++;
        } else if (e.target.classList.contains('delete-btn')) {
            if (confirm(`Are you sure you want to delete ${subjects[index].name}?`)) {
                subjects.splice(index, 1);
            }
        }
        saveData();
        renderSubjects();
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all data?')) {
            subjects = [];
            saveData();
            renderSubjects();
        }
    });

    renderSubjects();
});