const API_URL = "https://script.google.com/macros/s/AKfycbzRJxiBfL87wbDDapTklIW0l8Beio_DHPGfLlysYSTiU5kzlTV-3ubZekC6_1G1hWt3/exec";

let barChartInst = null;
let pieChartInst = null;
Chart.register(ChartDataLabels);
Chart.defaults.font.family = "'Prompt', sans-serif";
Chart.defaults.color = '#64748b';

let dashboardInterval = null;
let allScoreHistory = []; // ตัวแปรเก็บประวัติคะแนนไว้ทำ Filter
let sheetsDataList = []; // 🌟 [เพิ่มใหม่] ตัวแปรเก็บข้อมูล Sheet Name และ URL

// ฟังก์ชันโชว์ Loading หรูๆ
function showLoading(text) {
  Swal.fire({
    title: text,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => { Swal.showLoading(); }
  });
}

function switchTab(tabId, btnElement) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabId).style.display = 'block';
  btnElement.classList.add('active');

  const topControls = document.getElementById('top-controls');

  if (tabId === 'tab-dashboard') {
    topControls.style.display = 'flex';
    loadData();
    if(!dashboardInterval) dashboardInterval = setInterval(loadData, 30000);
  } else {
    topControls.style.display = 'none';
    if(dashboardInterval) { clearInterval(dashboardInterval); dashboardInterval = null; }
    if (tabId === 'tab-training') {
      loadQuizTopics();
      loadScoreHistory();
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetch(`${API_URL}?action=getSheets`)
    .then(response => response.json())
    .then(res => {
      if (res.result === 'success') {
        sheetsDataList = res.data; // 🌟 [อัปเดต] รับข้อมูลเป็น Array Object [{name, url}]
        const select = document.getElementById('sheetSelect');
        
        sheetsDataList.forEach(sheet => {
          let opt = document.createElement('option');
          opt.value = sheet.name;
          opt.innerHTML = sheet.name;
          select.appendChild(opt);
        });
        
        if (sheetsDataList.length > 0) {
           let defaultSheet = sheetsDataList.find(s => s.name === "2 มี.ค. - 10 เม.ย. 69");
           select.value = defaultSheet ? defaultSheet.name : sheetsDataList[0].name;
        }
        
        select.addEventListener('change', () => {
            updateSheetLink();
            loadData();
        });
        
        updateSheetLink(); // อัปเดตลิงก์ครั้งแรก
        loadData(); 
        dashboardInterval = setInterval(loadData, 30000);
      }
    });
});

// 🌟 [เพิ่มใหม่] ฟังก์ชันอัปเดต URL ของปุ่มลิงก์เปิด Google Sheet
function updateSheetLink() {
  const selectedName = document.getElementById('sheetSelect').value;
  const sheetObj = sheetsDataList.find(s => s.name === selectedName);
  const linkBtn = document.getElementById('viewSheetBtn');
  
  if (sheetObj && linkBtn) {
    linkBtn.href = sheetObj.url;
  }
}

// ป้องกันการยิงพลุซ้ำซากใน 1 Session
let hasCelebrated100 = false; 

function loadData() {
  const sheetName = document.getElementById('sheetSelect').value;
  if (!sheetName) return;
  
  fetch(`${API_URL}?action=getData&sheetName=${encodeURIComponent(sheetName)}`)
    .then(r => r.json())
    .then(res => {
      if (res.result === 'success') renderDashboard(res.data);
      else Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: 'ไม่สามารถโหลดข้อมูลได้' });
    });
}

function renderDashboard(data) {
  const totalAppointed = data.ekachai.appointed + data.pornthep.appointed;
  const totalNotAppointed = data.ekachai.notAppointed + data.pornthep.notAppointed;
  const totalCalled = totalAppointed + totalNotAppointed;
  const totalPending = (data.ekachai.pending + data.pornthep.pending) + (data.total - (totalCalled + data.ekachai.pending + data.pornthep.pending));
  
  let percent = data.total > 0 ? Math.round((totalCalled / data.total) * 100) : 0;
  const progFill = document.getElementById('prog_fill');
  const progText = document.getElementById('prog_text');
  const progMotiv = document.getElementById('prog_motivation');
  
  progText.innerText = `${percent}% (${totalCalled}/${data.total})`;
  progFill.style.width = `${percent > 100 ? 100 : percent}%`;

  if (percent >= 100) {
    progFill.style.background = 'linear-gradient(90deg, #10b981, #34d399)'; progText.style.color = '#10b981';
    progMotiv.innerHTML = '🎉 <b>สุดยอดเยี่ยม!</b> โทรติดตามลูกค้าสำเร็จครบ 100% แล้ว!'; progMotiv.style.color = '#10b981';
    if(!hasCelebrated100) { confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, zIndex: 3000 }); hasCelebrated100 = true; }
  } else if (percent >= 80) {
    progFill.style.background = 'linear-gradient(90deg, #f59e0b, #34d399)'; progText.style.color = '#d97706';
    progMotiv.innerHTML = '🔥 <b>โค้งสุดท้าย!</b> ลุยอีกนิดเดียวเป้าหมายอยู่แค่เอื้อม'; progMotiv.style.color = '#d97706';
    hasCelebrated100 = false; 
  } else if (percent >= 50) {
    progFill.style.background = 'linear-gradient(90deg, #f97316, #f59e0b)'; progText.style.color = '#f97316';
    progMotiv.innerHTML = '💪 <b>มาเกินครึ่งทางแล้ว!</b> รักษามาตรฐานที่ยอดเยี่ยมนี้ต่อไป'; progMotiv.style.color = '#f97316';
    hasCelebrated100 = false;
  } else if (percent > 0) {
    progFill.style.background = 'linear-gradient(90deg, #ef4444, #f97316)'; progText.style.color = '#b71c1c';
    progMotiv.innerHTML = '🚀 <b>เริ่มต้นได้ดี!</b> ค่อยๆ สะสมยอดไปทีละคันครับ'; progMotiv.style.color = '#b71c1c';
    hasCelebrated100 = false;
  } else {
    progFill.style.background = '#e2e8f0'; progText.style.color = '#94a3b8';
    progMotiv.innerHTML = '🌱 <b>เริ่มงานรอบใหม่!</b> เตรียมพร้อมลุยกันเลยครับ'; progMotiv.style.color = '#94a3b8';
    hasCelebrated100 = false;
  }

  // อัปเดตตัวเลขหลัก
  document.getElementById('tot_all').innerText = data.total;
  document.getElementById('tot_eka').innerText = data.ekachai.appointed;
  document.getElementById('tot_porn').innerText = data.pornthep.appointed;
  
  // 🌟 [อัปเดต] คำนวณสถิติย่อย (Ekachai)
  let ekaTarget = data.ekachai.appointed + data.ekachai.notAppointed + data.ekachai.pending;
  let ekaCalled = data.ekachai.appointed + data.ekachai.notAppointed;
  let ekaCalledPct = ekaTarget > 0 ? Math.round((ekaCalled / ekaTarget) * 100) : 0;
  let ekaAppointPct = ekaCalled > 0 ? Math.round((data.ekachai.appointed / ekaCalled) * 100) : 0;
  let ekaNotAppointPct = ekaCalled > 0 ? Math.round((data.ekachai.notAppointed / ekaCalled) * 100) : 0;
  
  document.getElementById('eka_called_stat').innerHTML = `<i class="fas fa-phone-alt"></i> โทรแล้ว: <b>${ekaCalled}/${ekaTarget}</b> (${ekaCalledPct}%)`;
  document.getElementById('eka_appointed_pct').innerHTML = `<i class="fas fa-check"></i> นัดสำเร็จ: <b style="color:#10b981;">${ekaAppointPct}%</b>`;
  document.getElementById('eka_not_appointed_pct').innerHTML = `<i class="fas fa-times"></i> ไม่นัด: <b style="color:#ef4444;">${ekaNotAppointPct}%</b>`;

  // 🌟 [อัปเดต] คำนวณสถิติย่อย (Pornthep)
  let pornTarget = data.pornthep.appointed + data.pornthep.notAppointed + data.pornthep.pending;
  let pornCalled = data.pornthep.appointed + data.pornthep.notAppointed;
  let pornCalledPct = pornTarget > 0 ? Math.round((pornCalled / pornTarget) * 100) : 0;
  let pornAppointPct = pornCalled > 0 ? Math.round((data.pornthep.appointed / pornCalled) * 100) : 0;
  let pornNotAppointPct = pornCalled > 0 ? Math.round((data.pornthep.notAppointed / pornCalled) * 100) : 0;
  
  document.getElementById('porn_called_stat').innerHTML = `<i class="fas fa-phone-alt"></i> โทรแล้ว: <b>${pornCalled}/${pornTarget}</b> (${pornCalledPct}%)`;
  document.getElementById('porn_appointed_pct').innerHTML = `<i class="fas fa-check"></i> นัดสำเร็จ: <b style="color:#10b981;">${pornAppointPct}%</b>`;
  document.getElementById('porn_not_appointed_pct').innerHTML = `<i class="fas fa-times"></i> ไม่นัด: <b style="color:#ef4444;">${pornNotAppointPct}%</b>`;

  document.getElementById('update_eka').innerText = data.ekachai.lastUpdate || '-';
  document.getElementById('update_porn').innerText = data.pornthep.lastUpdate || '-';
  document.getElementById('last_update').innerText = "อัปเดตข้อมูลล่าสุด: " + new Date().toLocaleTimeString('th-TH');

  // กราฟแท่ง
  const barCtx = document.getElementById('barChart').getContext('2d');
  let barGradientGreen = barCtx.createLinearGradient(0, 0, 0, 360); barGradientGreen.addColorStop(0, '#34d399'); barGradientGreen.addColorStop(1, '#059669'); 
  let barGradientRed = barCtx.createLinearGradient(0, 0, 0, 360); barGradientRed.addColorStop(0, '#f87171'); barGradientRed.addColorStop(1, '#dc2626'); 

  if (barChartInst) barChartInst.destroy();
  barChartInst = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['เอกชัย เกษรบัว', 'พรเทพ ม่วงรัก'], 
      datasets: [
        { label: 'นัดหมายสำเร็จ', data: [data.ekachai.appointed, data.pornthep.appointed], backgroundColor: barGradientGreen, borderRadius: 4 },
        { label: 'ไม่นัดหมาย', data: [data.ekachai.notAppointed, data.pornthep.notAppointed], backgroundColor: barGradientRed, borderRadius: 4 }
      ]
    },
    options: { 
      responsive: true, maintainAspectRatio: false, 
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: '#f1f5f9' }, suggestedMax: 8 }, x: { ticks: { font: { size: 11 } }, grid: { display: false } } },
      plugins: { legend: { labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } }, padding: 10 }, datalabels: { color: '#334155', anchor: 'end', align: 'top', font: { weight: 'bold', size: 12 }, formatter: v => v > 0 ? v : '' } }
    }
  });

  // กราฟวงกลม
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  let pieGradGreen = pieCtx.createLinearGradient(0, 0, 0, 360); pieGradGreen.addColorStop(0, '#34d399'); pieGradGreen.addColorStop(1, '#059669');
  let pieGradRed = pieCtx.createLinearGradient(0, 0, 0, 360); pieGradRed.addColorStop(0, '#fb7185'); pieGradRed.addColorStop(1, '#e11d48');
  let pieGradBlue = pieCtx.createLinearGradient(0, 0, 0, 360); pieGradBlue.addColorStop(0, '#7dd3fc'); pieGradBlue.addColorStop(1, '#0284c7'); 

  if (pieChartInst) pieChartInst.destroy();
  pieChartInst = new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: ['นัดหมายสำเร็จ', 'ไม่นัดหมาย', 'รอดำเนินการ'],
      datasets: [{ data: [totalAppointed, totalNotAppointed, totalPending], backgroundColor: [pieGradGreen, pieGradRed, pieGradBlue], borderWidth: 0, hoverOffset: 4 }]
    },
    options: { 
      responsive: true, maintainAspectRatio: false, cutout: '65%', 
      plugins: {
        legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, padding: 15, font: { size: 11 } } }, 
        datalabels: { color: '#ffffff', font: { weight: 'bold', size: 12 }, textAlign: 'center', textShadowBlur: 4, textShadowColor: 'rgba(0,0,0,0.3)', padding: 5, formatter: (value, ctx) => { if (value === 0) return ''; let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0); let percentage = (value * 100 / sum).toFixed(1) + "%"; return `${value} คัน\n(${percentage})`; } } 
      }
    }
  });
}

// ==========================================
// 4. Training Center Logic
// ==========================================
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

function loadQuizTopics() {
  fetch(`${API_URL}?action=get_quiz_list`)
    .then(r => r.json())
    .then(res => {
      if(res.result === 'success') {
        let html = '<option value="">-- เลือกหัวข้อที่ต้องการสอบ --</option>';
        res.data.forEach(t => html += `<option value="${t}">${t}</option>`);
        document.getElementById('quiz_topic_list').innerHTML = html;
      }
    });
}

function loadScoreHistory() {
  fetch(`${API_URL}?action=get_score_history`)
    .then(r => r.json())
    .then(res => {
      if(res.result === 'success') {
        const reversedData = res.data.reverse();
        const uniqueHistory = [];
        const seen = new Set();
        
        reversedData.forEach(h => {
            let key = h.name + "_" + h.topic; 
            if(!seen.has(key)) { seen.add(key); uniqueHistory.push(h); }
        });

        allScoreHistory = uniqueHistory;

        const topicFilter = document.getElementById('filter_quiz_topic');
        const uniqueTopics = [...new Set(allScoreHistory.map(item => item.topic))];
        let topicOptions = '<option value="all">📖 ทุกหัวข้อ</option>';
        uniqueTopics.forEach(t => {
            topicOptions += `<option value="${t}">${t}</option>`;
        });
        if(topicFilter) topicFilter.innerHTML = topicOptions;

        filterScoreHistory();
      }
    });
}

function filterScoreHistory() {
    const nameFilter = document.getElementById('filter_quiz_name').value;
    const topicFilter = document.getElementById('filter_quiz_topic').value;

    let filteredList = allScoreHistory.filter(h => {
        let matchName = (nameFilter === 'all' || h.name.includes(nameFilter));
        let matchTopic = (topicFilter === 'all' || h.topic === topicFilter);
        return matchName && matchTopic;
    });

    renderScoreHistory(filteredList);
}

function renderScoreHistory(dataList) {
    let html = '';
    dataList.slice(0, 20).forEach(h => {
        let scoreClass = (h.score/h.full >= 0.8) ? '#10b981' : (h.score/h.full >= 0.5 ? '#f59e0b' : '#ef4444');
        html += `
        <div class="history-item" style="border-left: 4px solid ${scoreClass}; background:#fff; padding: 15px; border-radius: 8px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <div><b style="color:#1e293b; font-size: 14px;">${h.name}</b><br><span style="color:#64748b; font-size: 12.5px;">${h.topic}</span><br><small style="color:#94a3b8;">${new Date(h.date).toLocaleDateString('th-TH')}</small></div>
            <div style="text-align:right; font-size:12.5px; color:#475569;">คะแนน: <b style="color:${scoreClass}; font-size: 18px;">${h.score}/${h.full}</b><br><span style="font-size: 11px;">รอบที่สอบ: ${h.attempt}</span></div>
        </div>`;
    });
    
    document.getElementById('score-history-container').innerHTML = html || '<p style="text-align:center; color:#94a3b8; padding: 20px;">ไม่พบประวัติที่ตรงกับเงื่อนไข</p>';
}

function prepareQuiz() {
  const topic = document.getElementById('quiz_topic_list').value;
  if(!topic) return Swal.fire({ icon: 'warning', title: 'เดี๋ยวก่อน!', text: 'กรุณาเลือกหัวข้อแบบทดสอบก่อนครับ', confirmButtonColor: '#0ea5e9' });
  
  showLoading('กำลังเตรียมข้อสอบ...');
  
  fetch(`${API_URL}?action=get_quiz_questions&topic=${encodeURIComponent(topic)}`)
    .then(r => r.json())
    .then(res => {
      Swal.close(); 
      if(res.result === 'success' && res.data.length > 0) {
        currentQuestions = res.data;
        currentQuestionIndex = 0;
        score = 0;
        
        document.getElementById('quiz-selection').style.display = 'none';
        document.getElementById('quiz-container').style.display = 'block';
        document.getElementById('current_quiz_title').innerText = topic;
        showQuestion();
      } else {
        Swal.fire({ icon: 'error', title: 'ไม่พบข้อมูล', text: 'ไม่พบคำถามในหัวข้อนี้ กรุณาติดต่อผู้ดูแลระบบ', confirmButtonColor: '#ef4444' });
      }
    }).catch(e => {
        Swal.close();
        Swal.fire({ icon: 'error', title: 'เครือข่ายขัดข้อง', text: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้', confirmButtonColor: '#ef4444' });
    });
}

function showQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  document.getElementById('quiz_step').innerText = `ข้อที่ ${currentQuestionIndex + 1} / ${currentQuestions.length}`;
  document.getElementById('explanation_box').style.display = 'none';
  document.getElementById('next-q-btn').style.display = 'none';
  
  document.getElementById('q_text').innerText = `${currentQuestionIndex + 1}. ${q.q}`;
  
  let optionsHtml = '';
  const choices = [
    { id: 'A', text: q.a, explain: q.expA },
    { id: 'B', text: q.b, explain: q.expB },
    { id: 'C', text: q.c, explain: q.expC },
    { id: 'D', text: q.d, explain: q.expD }
  ];

  choices.forEach(choice => {
    optionsHtml += `
      <div class="quiz-opt-container" id="container-${choice.id}">
        <div class="quiz-opt-header" onclick="checkAnswer('${choice.id}')">
          <span>${choice.id}</span> ${choice.text}
        </div>
        <div class="opt-explain" id="explain-${choice.id}">${choice.explain || "ไม่มีคำอธิบายเพิ่มเติม"}</div>
      </div>`;
  });
  document.getElementById('options_container').innerHTML = optionsHtml;
}

function checkAnswer(userAns) {
  const q = currentQuestions[currentQuestionIndex];
  document.querySelectorAll('.quiz-opt-container').forEach(c => c.classList.add('locked'));
  
  if (userAns === q.correct) {
    document.getElementById(`container-${userAns}`).classList.add('correct');
    score++;
  } else {
    document.getElementById(`container-${userAns}`).classList.add('incorrect');
    if(document.getElementById(`container-${q.correct}`)) document.getElementById(`container-${q.correct}`).classList.add('correct');
  }

  ['A','B','C','D'].forEach(id => document.getElementById(`explain-${id}`).style.display = 'block');

  if(q.expSummary) {
    document.getElementById('explanation_text').innerText = q.expSummary;
    document.getElementById('explanation_box').style.display = 'block';
  }
  
  document.getElementById('next-q-btn').style.display = 'block';
  document.getElementById('next-q-btn').innerHTML = (currentQuestionIndex === currentQuestions.length - 1) ? 'ส่งคำตอบประเมินผล <i class="fas fa-paper-plane"></i>' : 'ข้อถัดไป <i class="fas fa-arrow-right"></i>';
}

function nextQuestion() {
  if(currentQuestionIndex < currentQuestions.length - 1) {
    currentQuestionIndex++;
    showQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  showLoading('กำลังประมวลผลคะแนน...');
  
  const payload = `action=save_quiz_score&name=${encodeURIComponent(document.getElementById('quiz_user_name').value)}&topic=${encodeURIComponent(document.getElementById('current_quiz_title').innerText)}&score=${score}&full=${currentQuestions.length}`;
  
  fetch(`${API_URL}?${payload}`)
    .then(r => r.json())
    .then(res => {
      Swal.close();
      document.getElementById('quiz-container').style.display = 'none';
      document.getElementById('quiz-result').style.display = 'block';
      
      const pct = (score / currentQuestions.length) * 100;
      let iconHtml = '';
      
      if (pct >= 80) {
         iconHtml = '<i class="fas fa-trophy" style="color:#f59e0b;"></i>';
         confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 }, zIndex: 3000 });
      } else if (pct >= 50) {
         iconHtml = '<i class="fas fa-thumbs-up" style="color:#0ea5e9;"></i>';
      } else {
         iconHtml = '<i class="fas fa-book" style="color:#64748b;"></i>';
      }
      
      document.getElementById('result-icon').innerHTML = iconHtml;
      document.getElementById('result-score-text').innerText = `คุณทำได้ ${score} / ${currentQuestions.length} คะแนน`;
      document.getElementById('result-attempt-text').innerText = `(สอบครั้งที่ ${res.attempt})`;
    }).catch(e => {
        Swal.close();
        Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: 'ไม่สามารถบันทึกคะแนนได้', confirmButtonColor: '#ef4444' });
    });
}

function resetQuiz() {
  document.getElementById('quiz-result').style.display = 'none';
  document.getElementById('quiz-selection').style.display = 'block';
  document.getElementById('quiz_topic_list').value = "";
  loadScoreHistory(); 
}
