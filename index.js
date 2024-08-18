let question = [];
let locationIndex = 0;
let index = 0;
let completedCourse = {};
let isFileLoaded = false;

// 데이터 로드 및 초기화
fetch('quiz.json')
    .then(response => response.json())
    .then(data => {
        question = data;
        initMap();
        window.addEventListener('DOMContentLoaded', eventChange);
    });

// 모달 관련 함수
const toggleModal = show => document.querySelector('.modal').classList.toggle("show-modal", show);
document.querySelector('.coupon').addEventListener('click', () => {
    if (document.querySelector('.quiz-box').classList.contains("show-box")) {
        alert("이미 퀴즈가 시작되어 쿠폰을 발급 받을 수 없습니다!");
    } else {
        toggleModal(true);
    }
});
document.querySelector('.close-btn').addEventListener('click', () => toggleModal(false));

// 쿠폰 생성 및 다운로드
document.querySelector('.submit').addEventListener('click', () => {
    const ctx = document.getElementById('canvas').getContext('2d');
    const image = new Image();
    image.src = document.getElementById('coupon-image').src;
    image.onload = () => {
        document.getElementById('canvas').width = image.width;
        document.getElementById('canvas').height = image.height;
        ctx.drawImage(image, 0, 0);
        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.fillText(document.getElementById('name').value, canvas.width - 185, canvas.height - 305);
        ctx.fillText(new Date().toISOString().split('T')[0], canvas.width - 185, canvas.height - 355);
        
        const link = document.createElement('a');
        link.href = document.getElementById('canvas').toDataURL('image/png');
        link.download = 'stamp_card.png';
        link.click();
    };
});

// 퀴즈 시작 및 파일 업로드
const startQuiz = () => {
    const selectedCourse = document.getElementById('location').value;
    if (completedCourse[selectedCourse]) {
        alert("이미 완주한 코스입니다.");
    } else if (!isFileLoaded) {
        document.getElementById('file-input').click();
    } else {
        document.querySelector('.quiz-box').classList.add("show-box");
        loadQuestion();
    }
};

document.querySelector('.quiz-start').addEventListener('click', startQuiz);
document.getElementById('file-input').addEventListener('change', event => {
    const file = event.target.files[0];
    if (file && file.name === 'stamp_card.png') {
        document.getElementById('this-file').innerHTML = file.name;
        isFileLoaded = true;
        startQuiz();
    } else {
        alert("저희가 발급한 스탬프 카드를 등록 해주세요.");
    }
});

// 문제 로드 및 답변 처리
const loadQuestion = () => {
    const { idx, question: dataQuestion, correct, incorrect } = question[locationIndex].quiz[index];
    const allAnswers = [correct, ...incorrect].sort(() => Math.random() - 0.5);
    
    document.querySelector('.quiz-box').innerHTML = `
        <div>
            <h2>${idx}번 문제</h2>
            <p>${dataQuestion}</p>
            ${allAnswers.map(item => `<button class="answer">${item}</button>`).join("")}
        </div>
    `;

    document.querySelectorAll('.answer').forEach(btn => btn.addEventListener('click', () => handleAnswer(btn.textContent === correct)));
};

const handleAnswer = isCorrect => {
    document.querySelector('.result-box').textContent = isCorrect ? '정답입니다!' : '오답입니다! 다시 풀어보세요!';
    if (isCorrect) {
        index++;
        document.querySelectorAll('.waypoint').forEach(waypoint => {
            if (index == waypoint.innerHTML) waypoint.classList.add("complete-way");
        });
    }

    document.querySelector('.result-box').style.display = 'block';
    document.querySelector('.quiz-box').style.display = 'none';

    setTimeout(() => {
        if (index < question[locationIndex].quiz.length) {
            loadQuestion();
        } else {
            finishQuiz();
        }
        document.querySelector('.result-box').style.display = 'none';
        document.querySelector('.quiz-box').style.display = 'block';
    }, 1000);
};

const finishQuiz = () => {
    const selectedCourse = document.getElementById('location').value;
    completedCourse[selectedCourse] = true;
    document.querySelector('.quiz-box').classList.remove("show-box");
    index = 0;
    alert(Object.keys(completedCourse).length == 3 ? "모든 코스를 완주하였습니다!" : "축하합니다! 해당 코스 퀴즈풀이가 완료되었습니다!");
    if (Object.keys(completedCourse).length == 3) {
        document.getElementById('this-file').innerHTML = '';
        isFileLoaded = false;
    }
};

// 지도 관련 함수
const initMap = () => {
    updateMap(document.getElementById('location').value);
    eventChange();
};

document.getElementById('location').addEventListener('change', function() {
    updateMap(this.value);
    eventChange();
});

const updateMap = value => {
    document.getElementById('map-image').src = `map/${value}.png`;
    locationIndex = ['창덕궁', '경복궁', '신라'].indexOf(value);
};

// 경로 표시 및 경유지 연결
const pathCanvas = document.createElement('canvas');
document.querySelector('.map').appendChild(pathCanvas);

const setCanvasSize = () => {
    Object.assign(pathCanvas, {
        width: document.querySelector('.map').offsetWidth,
        height: document.querySelector('.map').offsetHeight,
        style: "position: absolute; left: -15px; top: -15px;"
    });
};

const drawPaths = waypoints => {
    const ctx = pathCanvas.getContext('2d');
    ctx.clearRect(0, 0, pathCanvas.width, pathCanvas.height);
    if (waypoints.length > 1) {
        ctx.beginPath();
        waypoints.forEach((wp, i) => {
            const [x, y] = [wp.offsetLeft + wp.offsetWidth / 2, wp.offsetTop + wp.offsetHeight / 2];
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 5;
        ctx.stroke();
    }
};

const eventChange = () => {
    const selectedCourse = document.getElementById('location').value;
    document.querySelectorAll('.waypoint').forEach(wp => wp.remove());
    const waypoints = question[locationIndex].quiz.map(ping => {
        const way = document.createElement('div');
        way.className = 'waypoint';
        Object.assign(way.style, {
            position: 'absolute',
            left: `${ping.location[0]}px`,
            top: `${ping.location[1]}px`
        });
        way.innerHTML = ping.idx;
        if (completedCourse[selectedCourse]) way.classList.add("complete-way");
        document.querySelector('.map').appendChild(way);
        return way;
    });

    setCanvasSize();
    drawPaths(waypoints);
};