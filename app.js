/**
 * 大富翁班級抽籤系統 - 核心邏輯
 */

// 預設名單
const DEFAULT_CLASS_NAME = "102班";
const DEFAULT_STUDENTS_RAW = `1 王○晴
2 王○萱
3 任○珍
4 呂○潼
5 宋○昀
6 施○瑄
7 洪○綺
8 孫○涵
9 徐○柔
10 張○妮
11 許○慈
12 陳○瑄
13 陳○彤
14 黄○雅
15 傅○綺
16 曾○晴
17 曾○彤
18 温○芮
19 黃○晴
20 黃○琳
21 楊○潔
22 詹○瑊
23 潘○辰
24 鄧○予
25 鄭○沁
26 戴○鋡
27 鍾○霓
28 王○騰
29 林○緯
30 范○丞
31 莊○瀚
32 陳○元
33 黃○豪
34 詹○嘉
35 劉○佳`;

// 趣味班級機會庫
const CHANCE_EVENTS = [
  { title: "課堂小先鋒", desc: "主動朗讀下一段課文或單字，表現優異！", score: 3, icon: "📖" },
  { title: "互助友愛獎", desc: "請選一位今天幫助過你的同學，兩人各得愛心！", score: 2, icon: "🤝" },
  { title: "智慧快問快答", desc: "回答老師提出的一個課堂小問題，答對即可獲獎！", score: 2, icon: "💡" },
  { title: "天使免死金牌", desc: "獲得一張免罰/免抽查小卡，隨時可兌換！", score: 1, icon: "🛡️" },
  { title: "全班同樂會", desc: "幸運觸發班級光環，全班同學每人獲得 1 顆愛心！", score: 1, icon: "🎉", allClass: true },
  { title: "幽默大師", desc: "說一個簡短健康的小笑話或成語故事逗樂大家！", score: 2, icon: "😄" }
];

// 趣味班級命運庫
const FATE_EVENTS = [
  { title: "熱情學貓叫", desc: "模仿可愛小動物叫聲三聲，活躍課堂氣氛！", score: 2, icon: "🐱" },
  { title: "默契大考驗", desc: "指定一位同桌好友，猜拳贏的人獲得愛心！", score: 1, icon: "✌️" },
  { title: "讚美小達人", desc: "大聲說出鄰近同學的 2 個優點，傳遞正能量！", score: 2, icon: "💖" },
  { title: "黑板小幫手", desc: "課後協助老師擦乾淨黑板或整理講桌！", score: 2, icon: "🧹" },
  { title: "勇氣大挑戰", desc: "帶領全班大聲念出今天的座右銘或口號！", score: 2, icon: "📢" },
  { title: "小小歌唱家", desc: "清唱一句喜歡的歌曲或兒歌旋律！", score: 2, icon: "🎵" }
];

// 角落事件配置
const CORNER_CONFIGS = {
  0: { title: "起點 GO", desc: "迎新補給站", icon: "🚀", type: "go", eventDesc: "回到起點！恭喜獲得滿滿活力與能量加分！", score: 2 },
  10: { title: "機會", desc: "CHANCE", icon: "❓", type: "chance" },
  20: { title: "超級大獎", desc: "SUPER STAR", icon: "👑", type: "star", eventDesc: "幸運之神降臨！榮獲全場焦點大獎 +5 ❤️！", score: 5 },
  30: { title: "命運", desc: "FATE", icon: "⚡", type: "fate" }
};

// 街區顏色條帶配色（八個分區循環）
const STREET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

class MonopolyApp {
  constructor() {
    this.className = DEFAULT_CLASS_NAME;
    this.students = [];
    this.maskEnabled = true;
    this.boardCells = []; // 40 格完整數據
    this.currentPosition = 0; // 當前棋子所在格 (0~39)
    this.isRolling = false;
    this.diceCount = 1; // 1 顆或 2 顆骰子
    this.recentHistory = [];
    this.selectedStudent = null; // 當前彈窗展示的學生

    this.initElements();
    this.loadStorage();
    this.bindEvents();
    this.renderBoard();
    this.updateStats();
    this.initConfetti();
  }

  initElements() {
    this.boardEl = document.getElementById('game-board');
    this.btnRoll = document.getElementById('btn-roll');
    this.dice1 = document.getElementById('dice-1');
    this.dice2 = document.getElementById('dice-2');
    this.classNameEl = document.getElementById('class-name-badge');
    this.historyTagsEl = document.getElementById('history-tags');
    this.totalDrawnEl = document.getElementById('stat-total-drawn');
    this.totalScoreEl = document.getElementById('stat-total-score');
    this.soundToggleBtn = document.getElementById('btn-sound-toggle');

    // 模態框元素
    this.resultModal = document.getElementById('result-modal');
    this.eventModal = document.getElementById('event-modal');
    this.settingsModal = document.getElementById('settings-modal');

    // 學生結果彈窗欄位
    this.winnerAvatar = document.getElementById('winner-avatar');
    this.winnerSeat = document.getElementById('winner-seat');
    this.winnerName = document.getElementById('winner-name');
    this.winnerScore = document.getElementById('winner-score');

    // 設定彈窗欄位
    this.inputClassName = document.getElementById('input-class-name');
    this.inputStudentList = document.getElementById('input-student-list');
    this.switchMask = document.getElementById('switch-mask');
  }

  // 從 LocalStorage 載入資料
  loadStorage() {
    const savedClass = localStorage.getItem('monopoly_class_name');
    const savedStudents = localStorage.getItem('monopoly_students');
    const savedMask = localStorage.getItem('monopoly_mask');
    const savedHistory = localStorage.getItem('monopoly_history');

    if (savedClass) this.className = savedClass;
    if (savedMask !== null) this.maskEnabled = savedMask === 'true';
    if (savedHistory) {
      try {
        this.recentHistory = JSON.parse(savedHistory);
      } catch (e) {
        this.recentHistory = [];
      }
    }

    if (savedStudents) {
      try {
        this.students = JSON.parse(savedStudents);
      } catch (e) {
        this.parseStudentsRaw(DEFAULT_STUDENTS_RAW);
      }
    } else {
      this.parseStudentsRaw(DEFAULT_STUDENTS_RAW);
    }

    this.classNameEl.textContent = this.className;
    this.renderHistoryTags();
  }

  // 儲存資料到 LocalStorage
  saveStorage() {
    localStorage.setItem('monopoly_class_name', this.className);
    localStorage.setItem('monopoly_students', JSON.stringify(this.students));
    localStorage.setItem('monopoly_mask', this.maskEnabled.toString());
    localStorage.setItem('monopoly_history', JSON.stringify(this.recentHistory.slice(-10)));
  }

  // 解析學生名單字串
  parseStudentsRaw(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    this.students = lines.map((line, idx) => {
      // 支援 "1 王小明" 或 "王小明" 格式
      const parts = line.split(/[\s,、\t]+/);
      let seat = idx + 1;
      let name = line;

      if (parts.length >= 2 && !isNaN(parseInt(parts[0]))) {
        seat = parseInt(parts[0]);
        name = parts.slice(1).join(' ');
      } else if (parts.length === 1) {
        name = parts[0];
      }

      return {
        seat: seat,
        originalName: name,
        score: 0
      };
    });
  }

  // 遮罩姓名處理
  getDisplayName(name) {
    if (!this.maskEnabled) {
      return name;
    }
    // 如果名字本身已經有「○」則保留，否則將中間字轉為「○」
    if (name.includes('○') || name.includes('o') || name.includes('O')) {
      return name;
    }
    if (name.length === 2) {
      return name[0] + '○';
    } else if (name.length >= 3) {
      return name[0] + '○' + name.slice(2);
    }
    return name;
  }

  // 產生 40 格棋盤數據（4 角落 + 36 格周邊）
  generateBoardCells() {
    this.boardCells = [];
    let studentIndex = 0;

    for (let pos = 0; pos < 40; pos++) {
      if (CORNER_CONFIGS[pos]) {
        // 角落特殊格
        this.boardCells.push({
          position: pos,
          type: 'corner',
          cornerType: CORNER_CONFIGS[pos].type,
          title: CORNER_CONFIGS[pos].title,
          desc: CORNER_CONFIGS[pos].desc,
          icon: CORNER_CONFIGS[pos].icon,
          config: CORNER_CONFIGS[pos]
        });
      } else {
        // 普通學生格或替補特殊格
        if (studentIndex < this.students.length) {
          const student = this.students[studentIndex];
          const streetIndex = Math.floor((pos % 40) / 5);
          this.boardCells.push({
            position: pos,
            type: 'student',
            student: student,
            bannerColor: STREET_COLORS[streetIndex % STREET_COLORS.length]
          });
          studentIndex++;
        } else {
          // 學生人數不足 36 位時，自動補上「機會」或「命運」
          const isChance = (pos % 2 === 0);
          this.boardCells.push({
            position: pos,
            type: isChance ? 'chance_cell' : 'fate_cell',
            title: isChance ? '✨ 機會' : '⚡ 命運',
            desc: '驚喜班級事件',
            icon: isChance ? '❓' : '⚡',
            bannerColor: isChance ? '#f59e0b' : '#8b5cf6'
          });
        }
      }
    }
  }

  // 計算每個 position (0~39) 對應的 11x11 Grid 座標 (row 1~11, col 1~11)
  getCellGridCoords(pos) {
    // 0 -> (1, 1) 左上角
    if (pos >= 0 && pos <= 10) {
      // 上邊：row 1, col 1 ~ 11
      return { row: 1, col: pos + 1 };
    } else if (pos >= 11 && pos <= 19) {
      // 右邊：col 11, row 2 ~ 10
      return { row: pos - 10 + 1, col: 11 };
    } else if (pos >= 20 && pos <= 30) {
      // 下邊：row 11, col 11 ~ 1 (逆行)
      return { row: 11, col: 11 - (pos - 20) };
    } else {
      // 左邊：col 1, row 10 ~ 2 (逆行)
      return { row: 11 - (pos - 30), col: 1 };
    }
  }

  // 渲染棋盤
  renderBoard() {
    this.generateBoardCells();
    
    // 清除既有格子（保留中央控制台）
    const existingCells = this.boardEl.querySelectorAll('.cell');
    existingCells.forEach(el => el.remove());

    this.boardCells.forEach(cellData => {
      const coords = this.getCellGridCoords(cellData.position);
      const cellEl = document.createElement('div');
      cellEl.id = `cell-${cellData.position}`;
      cellEl.className = `cell ${cellData.type === 'corner' ? 'corner' : ''} ${cellData.type.includes('chance') || cellData.type.includes('fate') ? 'special-cell' : ''}`;
      cellEl.style.gridRow = coords.row;
      cellEl.style.gridColumn = coords.col;

      if (cellData.type === 'corner') {
        cellEl.innerHTML = `
          <div class="cell-content">
            <div class="corner-icon">${cellData.icon}</div>
            <div class="corner-title">${cellData.title}</div>
            <div class="corner-desc">${cellData.desc}</div>
          </div>
        `;
      } else if (cellData.type === 'student') {
        const s = cellData.student;
        const displayName = this.getDisplayName(s.originalName);
        const scoreClass = s.score > 0 ? 'plus' : (s.score < 0 ? 'minus' : 'zero');
        cellEl.innerHTML = `
          <div class="cell-banner" style="background: ${cellData.bannerColor};">
            No.${s.seat}
          </div>
          <div class="cell-content">
            <div class="cell-name">${displayName}</div>
            <div class="cell-score-box ${scoreClass}">
              <span>❤️</span> <span>${s.score}</span>
            </div>
          </div>
        `;
      } else {
        // 機會/命運補格
        cellEl.innerHTML = `
          <div class="cell-banner" style="background: ${cellData.bannerColor};">
            ${cellData.title}
          </div>
          <div class="cell-content">
            <div class="corner-icon" style="font-size: 1.5rem;">${cellData.icon}</div>
            <div class="cell-name" style="font-size: 0.95rem;">${cellData.desc}</div>
          </div>
        `;
      }

      // 點擊棋盤格子也可直接查看學生或事件
      cellEl.addEventListener('click', () => {
        if (!this.isRolling) {
          this.handleCellClick(cellData);
        }
      });

      this.boardEl.appendChild(cellEl);
    });

    this.updatePawnPosition(this.currentPosition);
  }

  // 更新棋子標記位置
  updatePawnPosition(pos) {
    // 移除舊標記
    const oldPawn = this.boardEl.querySelector('.pawn-marker');
    if (oldPawn) oldPawn.remove();

    const targetCell = document.getElementById(`cell-${pos}`);
    if (targetCell) {
      const pawn = document.createElement('div');
      pawn.className = 'pawn-marker';
      pawn.innerHTML = '🪙';
      targetCell.appendChild(pawn);
    }
  }

  // 擲骰子並開始抽籤動畫
  rollDice() {
    if (this.isRolling) return;
    this.isRolling = true;
    this.btnRoll.disabled = true;

    // Web Audio 初始化
    window.soundEffects.init();
    window.soundEffects.playDiceRoll();

    // 啟動骰子滾動動畫
    this.dice1.classList.add('rolling');
    if (this.diceCount === 2) this.dice2.classList.add('rolling');

    // 決定隨機點數 (1~6 或 2~12)
    const rollVal1 = Math.floor(Math.random() * 6) + 1;
    const rollVal2 = Math.floor(Math.random() * 6) + 1;
    const totalRoll = (this.diceCount === 1) ? rollVal1 : (rollVal1 + rollVal2);

    // 增加額外旋轉圈數（例如跑滿 1 圈 40 步 + 骰子點數），讓抽籤走格更加驚險刺激
    const extraRounds = 1; 
    const totalSteps = (40 * extraRounds) + totalRoll;

    // 骰子轉動停留展示
    setTimeout(() => {
      this.dice1.classList.remove('rolling');
      if (this.diceCount === 2) this.dice2.classList.remove('rolling');
      this.setDiceFace(this.dice1, rollVal1);
      if (this.diceCount === 2) this.setDiceFace(this.dice2, rollVal2);

      // 開始走格動畫
      this.animatePawnMovement(totalSteps);
    }, 700);
  }

  // 設定 3D 骰子最終停留角度
  setDiceFace(cubeEl, value) {
    const rotations = {
      1: 'rotateY(0deg) rotateX(0deg)',
      2: 'rotateY(-90deg) rotateX(0deg)',
      3: 'rotateY(-180deg) rotateX(0deg)',
      4: 'rotateY(90deg) rotateX(0deg)',
      5: 'rotateX(-90deg) rotateY(0deg)',
      6: 'rotateX(90deg) rotateY(0deg)'
    };
    cubeEl.style.transform = rotations[value] || 'rotateX(0deg) rotateY(0deg)';
  }

  // 順滑減速走格演算法
  animatePawnMovement(totalStepsRemaining, currentStepCount = 0) {
    if (totalStepsRemaining <= 0) {
      // 走格完成！
      this.isRolling = false;
      this.btnRoll.disabled = false;
      this.onLandOnCell(this.currentPosition);
      return;
    }

    // 清除前一格的高亮
    const prevCell = document.getElementById(`cell-${this.currentPosition}`);
    if (prevCell) prevCell.classList.remove('active-step');

    // 走下一步
    this.currentPosition = (this.currentPosition + 1) % 40;
    this.updatePawnPosition(this.currentPosition);

    const currentCell = document.getElementById(`cell-${this.currentPosition}`);
    if (currentCell) currentCell.classList.add('active-step');

    // 播放走格音效
    window.soundEffects.playStep(currentStepCount);

    // 計算下一跳延遲時間（前半段快速，最後 10 步開始指數級減速 Ease-out）
    let delay = 60;
    if (totalStepsRemaining <= 12) {
      const slowProgress = (12 - totalStepsRemaining) / 12; // 0 ~ 1
      delay = 60 + Math.pow(slowProgress, 2) * 380;
    }

    setTimeout(() => {
      this.animatePawnMovement(totalStepsRemaining - 1, currentStepCount + 1);
    }, delay);
  }

  // 停靠在目標格子上的觸發事件
  onLandOnCell(pos) {
    const cellData = this.boardCells[pos];
    const cellEl = document.getElementById(`cell-${pos}`);
    if (cellEl) {
      cellEl.classList.add('winner-selected');
      setTimeout(() => cellEl.classList.remove('winner-selected'), 4000);
    }

    if (cellData.type === 'student') {
      // 抽中學生！
      window.soundEffects.playWin();
      this.triggerConfetti();
      this.openStudentResultModal(cellData.student);
      this.addHistoryRecord(`No.${cellData.student.seat} ${this.getDisplayName(cellData.student.originalName)}`);
    } else if (cellData.type === 'corner') {
      // 角落事件
      this.handleCornerLanding(cellData);
    } else {
      // 機會或命運替補格
      this.handleSpecialLanding(cellData.type.includes('chance') ? 'chance' : 'fate');
    }

    this.updateStats();
  }

  // 處理角落停靠事件
  handleCornerLanding(cellData) {
    window.soundEffects.playSpecialEvent();
    this.triggerConfetti();

    if (cellData.cornerType === 'go') {
      this.showEventModal({
        type: 'corner-event',
        icon: '🚀',
        title: '起點 GO 班級補給',
        desc: '精神滿滿！所有同學活力充沛，請大家一同拍手歡呼！',
        reward: '活力滿分 🌟'
      });
      this.addHistoryRecord('🚀 起點 GO');
    } else if (cellData.cornerType === 'star') {
      this.showEventModal({
        type: 'corner-event',
        icon: '👑',
        title: '大富翁幸運大獎',
        desc: '全場最幸運的時刻！觸發班級榮譽之星大狂歡！',
        reward: '全場歡呼 +5 ❤️',
        action: () => {
          // 若有上一位抽中學生，額外給他加分或全班加分
        }
      });
      this.addHistoryRecord('👑 超級大獎');
    } else if (cellData.cornerType === 'chance') {
      this.handleSpecialLanding('chance');
    } else if (cellData.cornerType === 'fate') {
      this.handleSpecialLanding('fate');
    }
  }

  // 處理機會/命運抽卡
  handleSpecialLanding(type) {
    window.soundEffects.playSpecialEvent();
    const eventPool = type === 'chance' ? CHANCE_EVENTS : FATE_EVENTS;
    const randomEvent = eventPool[Math.floor(Math.random() * eventPool.length)];

    this.showEventModal({
      type: type,
      icon: randomEvent.icon,
      title: type === 'chance' ? `🎲 機會：${randomEvent.title}` : `⚡ 命運：${randomEvent.title}`,
      desc: randomEvent.desc,
      reward: `獎勵：+${randomEvent.score} ❤️ 愛心`,
      score: randomEvent.score,
      allClass: randomEvent.allClass
    });

    this.addHistoryRecord(`${type === 'chance' ? '❓' : '⚡'} ${randomEvent.title}`);
  }

  // 打開學生獲獎彈窗
  openStudentResultModal(student) {
    this.selectedStudent = student;
    this.winnerAvatar.textContent = ['🎓', '🌟', '🚀', '🌈', '🎉', '🍀', '✨'][student.seat % 7];
    this.winnerSeat.textContent = `座號 No. ${student.seat}`;
    this.winnerName.textContent = this.getDisplayName(student.originalName);
    this.winnerScore.textContent = `${student.score}`;
    this.resultModal.classList.add('active');
  }

  // 點擊格子直接查看內容
  handleCellClick(cellData) {
    if (cellData.type === 'student') {
      this.openStudentResultModal(cellData.student);
    } else if (cellData.type === 'corner') {
      if (cellData.cornerType === 'go') {
        this.showEventModal({
          type: 'corner-event',
          icon: '🚀',
          title: '起點 GO 班級補給站',
          desc: '精神滿滿！所有同學活力充沛，準備迎接精彩的課堂挑戰！',
          reward: '活力充沛 滿分！'
        });
      } else if (cellData.cornerType === 'star') {
        this.showEventModal({
          type: 'corner-event',
          icon: '👑',
          title: '大富翁超級大獎',
          desc: '幸運之神降臨！全場焦點榮譽之星，為班級注入最高熱情！',
          reward: '幸運之星 +5 ❤️'
        });
      } else if (cellData.cornerType === 'chance') {
        this.handleSpecialLanding('chance');
      } else if (cellData.cornerType === 'fate') {
        this.handleSpecialLanding('fate');
      }
    } else if (cellData.type && cellData.type.includes('chance')) {
      this.handleSpecialLanding('chance');
    } else if (cellData.type && cellData.type.includes('fate')) {
      this.handleSpecialLanding('fate');
    }
  }

  // 愛心加減分處理
  adjustSelectedStudentScore(delta) {
    if (!this.selectedStudent) return;
    this.selectedStudent.score += delta;

    if (delta > 0) {
      window.soundEffects.playPlusScore();
    } else {
      window.soundEffects.playMinusScore();
    }

    this.winnerScore.textContent = `${this.selectedStudent.score}`;
    this.renderBoard();
    this.updateStats();
    this.saveStorage();
  }

  // 顯示特殊事件彈窗
  showEventModal({ type, icon, title, desc, reward, score, allClass }) {
    const modalHeader = document.getElementById('event-modal-header');
    const modalIcon = document.getElementById('event-icon');
    const modalTitle = document.getElementById('event-title');
    const modalDesc = document.getElementById('event-desc');
    const modalReward = document.getElementById('event-reward');

    modalHeader.className = `event-card-header ${type}`;
    modalIcon.textContent = icon;
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    modalReward.textContent = reward;

    if (allClass && score) {
      // 全班加分
      this.students.forEach(s => s.score += score);
      this.renderBoard();
      this.saveStorage();
    }

    this.eventModal.classList.add('active');
  }

  // 歷史記錄標籤
  addHistoryRecord(text) {
    this.recentHistory.push(text);
    if (this.recentHistory.length > 8) {
      this.recentHistory.shift();
    }
    this.renderHistoryTags();
    this.saveStorage();
  }

  renderHistoryTags() {
    this.historyTagsEl.innerHTML = '';
    if (this.recentHistory.length === 0) {
      this.historyTagsEl.innerHTML = '<span class="history-tag">尚無抽籤紀錄</span>';
      return;
    }
    this.recentHistory.slice().reverse().forEach(item => {
      const span = document.createElement('span');
      span.className = 'history-tag';
      span.textContent = item;
      this.historyTagsEl.appendChild(span);
    });
  }

  // 更新統計數據
  updateStats() {
    const totalScore = this.students.reduce((acc, cur) => acc + (cur.score || 0), 0);
    this.totalDrawnEl.textContent = `${this.recentHistory.length} 次`;
    this.totalScoreEl.textContent = `${totalScore} ❤️`;
  }

  // 下載學生與分數清單文字檔
  downloadScoreList() {
    const now = new Date();
    const timeString = now.toLocaleString('zh-TW', { hour12: false });
    
    // 依座號排序名單
    const seatSorted = [...this.students].sort((a, b) => a.seat - b.seat);
    // 依分數排行榜排序
    const scoreSorted = [...this.students].sort((a, b) => b.score - a.score);

    let content = `=================================================\n`;
    content += `  🎉 ${this.className} - 大富翁抽籤系統 學生積分清單\n`;
    content += `  📅 匯出時間：${timeString}\n`;
    content += `=================================================\n\n`;

    content += `【 學生座號與得分列表 】\n`;
    content += `-------------------------------------------------\n`;
    content += `座號\t姓名\t\t\t得分(愛心)\n`;
    content += `-------------------------------------------------\n`;

    seatSorted.forEach(s => {
      const name = this.maskEnabled ? this.getDisplayName(s.originalName) : s.originalName;
      content += `${s.seat.toString().padEnd(4)}\t${name.padEnd(10, '　')}\t${s.score} ❤️\n`;
    });

    content += `\n=================================================\n`;
    content += `【 班級愛心風雲排行榜 TOP 5 】\n`;
    content += `-------------------------------------------------\n`;
    scoreSorted.slice(0, 5).forEach((s, idx) => {
      const medal = ['🥇 第1名', '🥈 第2名', '🥉 第3名', '🎖️ 第4名', '🎖️ 第5名'][idx];
      const name = this.maskEnabled ? this.getDisplayName(s.originalName) : s.originalName;
      content += `${medal}：座號 ${s.seat} 號 ${name} —— ${s.score} 分\n`;
    });

    content += `\n=================================================\n`;
    content += `總學生人數：${this.students.length} 人\n`;
    content += `班級總積分：${this.students.reduce((a, b) => a + b.score, 0)} ❤️\n`;
    content += `=================================================\n`;

    // 建立 Blob 並觸發下載 (UTF-8 with BOM 確保 Windows 記事本完美顯示)
    const blob = new Blob(["\uFEFF" + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.className}_大富翁抽籤積分名單_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 綁定所有按鈕與互動事件
  bindEvents() {
    // 擲骰按鈕
    this.btnRoll.addEventListener('click', () => this.rollDice());

    // 骰子模式切換 (1顆 / 2顆)
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (this.isRolling) return;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.diceCount = parseInt(btn.dataset.dice);
        this.dice2.style.display = (this.diceCount === 2) ? 'block' : 'none';
      });
    });

    // 靜音開關
    this.soundToggleBtn.addEventListener('click', () => {
      const isMuted = window.soundEffects.toggleMute();
      this.soundToggleBtn.innerHTML = isMuted ? '<span>🔇</span> 靜音' : '<span>🔊</span> 音效開';
    });

    // 下載清單按鈕
    document.getElementById('btn-download-list').addEventListener('click', () => {
      this.downloadScoreList();
    });

    // 打開設定
    document.getElementById('btn-open-settings').addEventListener('click', () => {
      this.inputClassName.value = this.className;
      this.inputStudentList.value = this.students.map(s => `${s.seat} ${s.originalName}`).join('\n');
      this.switchMask.checked = this.maskEnabled;
      this.settingsModal.classList.add('active');
    });

    // 儲存設定
    document.getElementById('btn-save-settings').addEventListener('click', () => {
      this.className = this.inputClassName.value.trim() || DEFAULT_CLASS_NAME;
      this.classNameEl.textContent = this.className;
      this.maskEnabled = this.switchMask.checked;
      this.parseStudentsRaw(this.inputStudentList.value);
      this.saveStorage();
      this.renderBoard();
      this.updateStats();
      this.settingsModal.classList.remove('active');
    });

    // 重設所有分數
    document.getElementById('btn-reset-scores').addEventListener('click', () => {
      if (confirm('確定要將所有同學的分數重設為 0 分嗎？')) {
        this.students.forEach(s => s.score = 0);
        this.recentHistory = [];
        this.saveStorage();
        this.renderBoard();
        this.renderHistoryTags();
        this.updateStats();
        alert('所有分數已重設！');
      }
    });

    // 關閉各模態框
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        this.resultModal.classList.remove('active');
        this.eventModal.classList.remove('active');
        this.settingsModal.classList.remove('active');
      });
    });

    // 加減分按鈕
    document.getElementById('btn-plus-1').addEventListener('click', () => this.adjustSelectedStudentScore(1));
    document.getElementById('btn-plus-5').addEventListener('click', () => this.adjustSelectedStudentScore(5));
    document.getElementById('btn-minus-1').addEventListener('click', () => this.adjustSelectedStudentScore(-1));

    // 點擊遮罩空白處關閉
    [this.resultModal, this.eventModal, this.settingsModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    // 鍵盤空白鍵擲骰子快捷鍵
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.isRolling) {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
          activeModal.classList.remove('active');
        } else {
          this.rollDice();
        }
      }
    });
  }

  // 歡樂 Canvas 五彩碎紙噴發特效
  initConfetti() {
    this.canvas = document.getElementById('confetti-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  triggerConfetti() {
    const colors = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#fbbf24'];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.7) * 20,
        size: Math.random() * 10 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.45,
        opacity: 1
      });
    }
    if (!this.confettiRunning) {
      this.confettiRunning = true;
      this.renderConfetti();
    }
  }

  renderConfetti() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.opacity -= 0.012;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();

      if (p.opacity <= 0 || p.y > window.innerHeight) {
        this.particles.splice(i, 1);
      }
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.renderConfetti());
    } else {
      this.confettiRunning = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// 頁面加載完成後啟動應用
window.addEventListener('DOMContentLoaded', () => {
  window.app = new MonopolyApp();
});
