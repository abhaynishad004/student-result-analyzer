
const STORAGE_KEY = "studentResultRecords";

let students = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let editingId = null;

const form = document.getElementById("resultForm");
const table = document.getElementById("studentTable");
const searchInput = document.getElementById("searchInput");

const subjects = [
    "math",
    "physics",
    "chemistry",
    "programming",
    "english"
];

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function calculateResult(marks) {
    const total = marks.reduce((sum, mark) => sum + mark, 0);
    const percentage = total / 5;

    const passed = marks.every(mark => mark >= 33);

    let grade = "F";

    if (passed) {
        if (percentage >= 90) grade = "A+";
        else if (percentage >= 80) grade = "A";
        else if (percentage >= 70) grade = "B+";
        else if (percentage >= 60) grade = "B";
        else if (percentage >= 50) grade = "C";
        else grade = "D";
    }

    return {
        total,
        percentage: percentage.toFixed(2),
        grade,
        result: passed ? "Pass" : "Fail"
    };
}

function saveStudents() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("studentName").value.trim();
    const roll = document.getElementById("rollNumber").value.trim();
    const semester = document.getElementById("semester").value.trim();

    const marks = subjects.map(id =>
        Number(document.getElementById(id).value)
    );

    if (!name || !roll || !semester) {
        alert("Please fill all student details.");
        return;
    }

    if (marks.some(mark =>
        !Number.isFinite(mark) || mark < 0 || mark > 100
    )) {
        alert("Marks must be between 0 and 100.");
        return;
    }

    const duplicate = students.some(student =>
        student.roll.toLowerCase() === roll.toLowerCase() &&
        student.id !== editingId
    );

    if (duplicate) {
        alert("This roll number already exists.");
        return;
    }

    const result = calculateResult(marks);

    const studentData = {
        id: editingId || Date.now().toString(),
        name,
        roll,
        semester,
        marks,
        ...result
    };

    if (editingId) {
        students = students.map(student =>
            student.id === editingId ? studentData : student
        );

        alert("Student record updated successfully.");
    } else {
        students.push(studentData);
        alert("Student record added successfully.");
    }

    saveStudents();
    resetForm();
    renderStudents();
});

function renderStudents(list = students) {
    if (list.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    No student records found.
                </td>
            </tr>`;
    } else {
        table.innerHTML = list.map(student => `
            <tr>
                <td>${escapeHTML(student.roll)}</td>
                <td>${escapeHTML(student.name)}</td>
                <td>${student.total}/500</td>
                <td>${student.percentage}%</td>
                <td>${escapeHTML(student.grade)}</td>
                <td>
                    <span class="status ${student.result === "Pass" ? "pass" : "fail"}">
                        ${student.result}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit-btn"
                        onclick="editStudent('${student.id}')">
                        Edit
                    </button>
                    <button class="action-btn delete-btn"
                        onclick="deleteStudent('${student.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `).join("");
    }

    updateDashboard();
}

function updateDashboard() {
    const total = students.length;

    const passed = students.filter(
        student => student.result === "Pass"
    ).length;

    const failed = total - passed;

    const average = total
        ? students.reduce(
            (sum, student) => sum + Number(student.percentage), 0
        ) / total
        : 0;

    document.getElementById("totalStudents").textContent = total;
    document.getElementById("passedStudents").textContent = passed;
    document.getElementById("failedStudents").textContent = failed;

    document.getElementById("classAverage").textContent =
        average.toFixed(2) + "%";

    updateAnalysis();
}

function updateAnalysis() {
    const analysis = document.getElementById("analysis");

    if (students.length === 0) {
        analysis.textContent =
            "Add student records to view performance analysis.";
        return;
    }

    const topper = [...students].sort(
        (a, b) => b.percentage - a.percentage
    )[0];

    const average = students.reduce(
        (sum, student) => sum + Number(student.percentage), 0
    ) / students.length;

    const passRate = (
        students.filter(student => student.result === "Pass").length /
        students.length * 100
    ).toFixed(2);

    analysis.innerHTML = `
        <div class="analysis-item">
            <strong>Class Average:</strong> ${average.toFixed(2)}%
        </div>
        <div class="analysis-item">
            <strong>Top Performer:</strong> ${escapeHTML(topper.name)}
            (Roll No. ${escapeHTML(topper.roll)})
        </div>
        <div class="analysis-item">
            <strong>Highest Percentage:</strong> ${topper.percentage}%
        </div>
        <div class="analysis-item">
            <strong>Pass Percentage:</strong> ${passRate}%
        </div>
        <div class="analysis-item">
            <strong>Total Students Analyzed:</strong> ${students.length}
        </div>
    `;
}

function editStudent(id) {
    const student = students.find(item => item.id === id);

    if (!student) return;

    editingId = id;

    document.getElementById("studentName").value = student.name;
    document.getElementById("rollNumber").value = student.roll;
    document.getElementById("semester").value = student.semester;

    subjects.forEach((subject, index) => {
        document.getElementById(subject).value = student.marks[index];
    });

    document.getElementById("formHeading").textContent =
        "Update Student Result";

    document.getElementById("submitBtn").textContent =
        "Update Student";

    document.getElementById("cancelBtn").hidden = false;

    form.scrollIntoView({ behavior: "smooth" });
}

function deleteStudent(id) {
    const student = students.find(item => item.id === id);

    if (!student) return;

    const confirmDelete = confirm(
        "Are you sure you want to delete this student record?"
    );

    if (!confirmDelete) return;

    students = students.filter(item => item.id !== id);

    if (editingId === id) {
        resetForm();
    }

    saveStudents();
    renderStudents();

    alert("Student record deleted successfully.");
}

function resetForm() {
    form.reset();
    editingId = null;

    document.getElementById("formHeading").textContent =
        "Add Student Result";

    document.getElementById("submitBtn").textContent =
        "Add Student";

    document.getElementById("cancelBtn").hidden = true;
}

searchInput.addEventListener("input", function() {
    const query = this.value.toLowerCase().trim();

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.roll.toLowerCase().includes(query)
    );

    renderStudents(filteredStudents);
});

// Load saved records when the website opens
renderStudents();
