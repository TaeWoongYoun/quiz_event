let question = []; // JSON 파일 데이터를 저장할 변수
let locationIndex = 0; // locationIndex를 기본 값으로 초기화

// JSON 파일을 비동기로 불러오기
fetch('quiz.json')
    .then(response => response.json())
    .then(data => {
    question = data;
    initMap(); // 맵 초기화 함수 호출
    window.addEventListener('DOMContentLoaded', eventChange); // 맵이 로드되면 eventChange 호출
});

// 쿠폰 발급 모달창
const openCoupon = document.querySelector('.coupon');
const closeCoupon = document.querySelector('.close-btn');
const modal = document.querySelector('.modal');

openCoupon.addEventListener('click', function() {
  if (quizBox.classList.contains("show-box")) {
    alert("이미 퀴즈가 시작되어 쿠폰을 발급 받을 수 없습니다!");
  } else {
    modal.classList.add("show-modal");
  }
});

closeCoupon.addEventListener('click', function() {
  modal.classList.remove("show-modal");
});

// 캔버스 이미지 생성 및 이미지 다운로드
const submitBtn = document.querySelector('.submit');
const nameInput = document.getElementById('name');
const canvas = document.getElementById('canvas');
const couponImage = document.getElementById('coupon-image');

var date = new Date();
var year = date.getFullYear();
var month = ('0' + (date.getMonth() + 1)).slice(-2);
var day = date.getDate();
var today = year + '-' + month + '-' + day;

const image = new Image();
let inputName = '';

submitBtn.addEventListener('click', function() {
  const imgCanvas = canvas.getContext('2d');
  inputName = nameInput.value;
  image.src = couponImage.src;

  image.onload = function() {
    canvas.width = image.width;
    canvas.height = image.height;

    imgCanvas.drawImage(image, 0, 0);
    imgCanvas.fillStyle = 'black';
    imgCanvas.textAlign = 'left';
    imgCanvas.fillText(inputName, canvas.width - 185, canvas.height - 305);
    imgCanvas.fillText(today, canvas.width - 185, canvas.height - 355);

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'stamp_card.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
});

// 파일 가져오기(업로드) 및 퀴즈 시작
const fileInput = document.getElementById('file-input');
const quizStart = document.querySelector('.quiz-start');
const quizBox = document.querySelector('.quiz-box');
const thisFile = document.getElementById('this-file');
let loaded = false;

quizStart.addEventListener('click', function() {
  if (quizBox.classList.contains("show-box")) {
    alert("이미 퀴즈가 시작되었습니다!");
  } else {
    startQuiz();
  }
});

fileInput.addEventListener('change', function(event) {
  const file = event.target.files[0];

  if (file && file.name === 'stamp_card.png') {
    alert("퀴즈가 시작되었습니다!");
    loaded = true;
    thisFile.innerHTML = file.name;
    fileInput.value = '';

    startQuiz();
  } else {
    alert("저희가 발급한 스탬프 카드를 등록 해주세요.");
  }
});

const startQuiz = function() {
  const selectedCourse = locationSelect.value;

  if (completedCourse[selectedCourse]) {
    alert("이미 완주한 코스입니다.");
    return;
  } else if (!loaded) {
    fileInput.click();
    return;
  }

  quizBox.classList.add("show-box");
  loadQuestion();
};

const resultBox = document.querySelector('.result-box');
let currentIndex = 0;
let completedCourse = [];

// 문제를 랜덤(무작위)으로 출력
const shuffle = function(answer) {
  for (let i = answer.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answer[i], answer[j]] = [answer[j], answer[i]];
  }
  return answer;
};

// 문제 로드
const loadQuestion = function() {
  const getData = question[locationIndex].quiz[currentIndex];
  const dataQuestion = getData.question;
  const correct = getData.correct;
  const incorrect = getData.incorrect;

  const allAnswers = shuffle([correct, ...incorrect]);
  const answer = allAnswers.map(function(item) {
    return `<button class="answer">${item}</button>`;
  }).join("");

  quizBox.innerHTML = `
    <div>
      <h2>${getData.idx}번 문제</h2>
      <p>${dataQuestion}</p>
      ${answer}
    </div>
  `;

  const answerBtns = document.querySelectorAll('.answer');

  answerBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const selectedCourse = locationSelect.value;

      if (btn.textContent === correct) {
        resultBox.textContent = '정답입니다!';
        currentIndex++;

        document.querySelectorAll('.waypoint').forEach(function(waypoint) {
          const orderCourse = waypoint.innerHTML;

          if (currentIndex == orderCourse) {
            waypoint.classList.add("complete-way");
          }
        });

      } else {
        resultBox.textContent = '오답입니다! 다시 풀어보세요!';
      }

      if (currentIndex === question[locationIndex].quiz.length) {
        completedCourse[selectedCourse] = true;
        completedCourse.push(selectedCourse);
      }

      resultBox.style.display = 'block';
      quizBox.style.display = 'none';

      setTimeout(function() {
        if (currentIndex < question[locationIndex].quiz.length) {
          loadQuestion();
        } else {
          quizBox.classList.remove("show-box");
          currentIndex = 0;

          if (completedCourse.length == 3) {
            alert("모든 코스를 완주하였습니다!");
            thisFile.innerHTML = '';
          } else {
            alert("축하합니다! 해당 코스 퀴즈풀이가 완료되었습니다!");
          }
        }

        resultBox.style.display = 'none';
        quizBox.style.display = 'block';
      }, 1000);
    });
  });
};

// 지도 변경효과
const locationSelect = document.getElementById('location');
const mapImage = document.getElementById('map-image');

// 초기 맵 설정
const initMap = function() {
  const selectedCourse = locationSelect.value;
  switch(selectedCourse) {
    case '창덕궁':
      mapImage.src = 'map/창덕궁.png';
      locationIndex = 0;
      break;
  }
  eventChange(); // 맵 초기화 후 eventChange 호출하여 waypoints 설정
};

locationSelect.addEventListener('change', function() {
  const value = this.value;

  const changeWaypoint = document.querySelectorAll('.waypoint');
  changeWaypoint.forEach(function(waypoint) {
    waypoint.remove();
  });

  switch(value) {
    case '창덕궁':
      mapImage.src = 'map/창덕궁.png';
      locationIndex = 0;
      break;

    case '경복궁':
      mapImage.src = 'map/경복궁.png';
      locationIndex = 1;
      break;

    case '신라':
      mapImage.src = 'map/신라.png';
      locationIndex = 2;
      break;

    default:
      mapImage.src = '';
      locationIndex = 0;
      break;
  }

  eventChange();
});

// 지도 위에 경로 표시
// 지도 위에 경로 표시 및 경유지 연결
const map = document.querySelector('.map');
const pathCanvas = document.createElement('canvas');
map.appendChild(pathCanvas);

// 캔버스 크기 및 위치 설정
const setCanvasSize = () => {
  Object.assign(pathCanvas, {
    width: map.offsetWidth,
    height: map.offsetHeight,
    style: "position: absolute; left: -15px; top: -15px;"
  });
};

// 경유지 연결 선 그리기
const drawPaths = waypoints => {
  const ctx = pathCanvas.getContext('2d');
  ctx.clearRect(0, 0, pathCanvas.width, pathCanvas.height);

  if (waypoints.length > 1) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    ctx.beginPath();
    waypoints.forEach((wp, i) => {
      const [x, y] = [
        wp.offsetLeft + wp.offsetWidth / 2,
        wp.offsetTop + wp.offsetHeight / 2
      ];
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
};

// 경유지 및 경로 초기화 및 업데이트
const eventChange = () => {
  const selectedCourse = locationSelect.value;
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
    map.appendChild(way);
    return way;
  });

  setCanvasSize();
  drawPaths(waypoints);
};