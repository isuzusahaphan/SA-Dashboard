const API_URL = "https://script.google.com/macros/s/AKfycbzRJxiBfL87wbDDapTklIW0l8Beio_DHPGfLlysYSTiU5kzlTV-3ubZekC6_1G1hWt3/exec";

let barChartInst = null;
let pieChartInst = null;

// ลงทะเบียน Plugin แสดงตัวเลขบนกราฟ
Chart.register(ChartDataLabels);

// ตั้งค่า Global Font ให้กับ Chart.js เป็นฟอนต์ Prompt
Chart.defaults.font.family = "'Prompt', sans-serif";
Chart.defaults.color = '#64748b';

document.addEventListener("DOMContentLoaded", () => {
  fetch(`${API_URL}?action=getSheets`)
    .then(response => response.json())
    .then(res => {
      if (res.result === 'success') {
        const names = res.data;
        const select = document.getElementById('sheetSelect');
        names.forEach(name => {
          let opt = document.createElement('option');
          opt.value = name;
          opt.innerHTML = name;
          select.appendChild(opt);
        });
        
        if (names.includes("2 มี.ค. - 10 เม.ย. 69")) {
          select.value = "2 มี.ค. - 10 เม.ย. 69";
        }
        
        select.addEventListener('change', loadData);
        loadData(); 
      }
    })
    .catch(error => console.error("Error loading sheets:", error));
    
  setInterval(loadData, 30000);
});

function loadData() {
  const sheetName = document.getElementById('sheetSelect').value;
  if (!sheetName) return;
  
  document.getElementById('loading').style.display = 'inline';
  
  fetch(`${API_URL}?action=getData&sheetName=${encodeURIComponent(sheetName)}`)
    .then(response => response.json())
    .then(res => {
      if (res.result === 'success') {
        renderDashboard(res.data);
      } else {
        alert("เกิดข้อผิดพลาด: " + res.message);
        document.getElementById('loading').style.display = 'none';
      }
    })
    .catch(error => {
      console.error("Error loading data:", error);
      document.getElementById('loading').style.display = 'none';
    });
}

function renderDashboard(data) {
  document.getElementById('loading').style.display = 'none';
  
  // รวมตัวแปรพื้นฐาน
  const totalAppointed = data.ekachai.appointed + data.pornthep.appointed;
  const totalNotAppointed = data.ekachai.notAppointed + data.pornthep.notAppointed;
  const totalCalled = totalAppointed + totalNotAppointed;
  const totalPending = (data.ekachai.pending + data.pornthep.pending) + (data.total - (totalCalled + data.ekachai.pending + data.pornthep.pending));
  
  // ----------------------------------------------------
  // 🔥 อัปเดต Progress Bar และข้อความแบบ Dynamic Gradient 🔥
  // ----------------------------------------------------
  let percent = data.total > 0 ? Math.round((totalCalled / data.total) * 100) : 0;
  
  const progFill = document.getElementById('prog_fill');
  const progText = document.getElementById('prog_text');
  const progMotiv = document.getElementById('prog_motivation');
  
  progText.innerText = `${percent}% (${totalCalled}/${data.total} คัน)`;
  progFill.style.width = `${percent > 100 ? 100 : percent}%`;

  // เปลี่ยนบาร์และข้อความเป็น Dynamic Gradient (แดง -> ส้ม -> เขียว)
  if (percent >= 100) {
    progFill.style.background = 'linear-gradient(90deg, #10b981, #34d399)'; // 🔥Gradient เขียว ( Emerald to Bright Emerald)
    progText.style.color = '#10b981';
    progMotiv.innerHTML = '🎉 <b>สุดยอดเยี่ยม!</b> โทรติดตามลูกค้าสำเร็จครบ 100% แล้ว ขอเสียงปรบมือให้ทุกคนครับ!';
    progMotiv.style.color = '#10b981';
  } else if (percent >= 80) {
    progFill.style.background = 'linear-gradient(90deg, #f59e0b, #34d399)'; // 🔥Gradient ทองส้มไปเขียว ( Amber to Bright Emerald)
    progFill.style.transition = 'width 1.2s ease-out, background 0.8s ease';
    progText.style.color = '#d97706';
    progMotiv.innerHTML = '🔥 <b>โค้งสุดท้ายแล้ว!</b> ผลงานทะลุ 80% ลุยอีกนิดเดียวเป้าหมายอยู่แค่เอื้อมครับ';
    progMotiv.style.color = '#d97706';
  } else if (percent >= 50) {
    progFill.style.background = 'linear-gradient(90deg, #f97316, #f59e0b)'; // 🔥Gradient ส้มไปทอง ( Orange to Amber)
    progText.style.color = '#f97316';
    progMotiv.innerHTML = '💪 <b>เดินทางมาเกินครึ่งทางแล้ว!</b> รักษาความมุ่งมั่นและมาตรฐานที่ยอดเยี่ยมนี้ต่อไปครับ';
    progMotiv.style.color = '#f97316';
  } else if (percent > 0) {
    progFill.style.background = 'linear-gradient(90deg, #ef4444, #f97316)'; // 🔥Gradient แดงไปส้ม ( Red to Orange)
    progText.style.color = '#b71c1c';
    progMotiv.innerHTML = '🚀 <b>เริ่มต้นได้ดี!</b> ค่อยๆ สะสมยอดไปทีละคัน เป็นกำลังใจให้ทีมงานทุกคนครับ';
    progMotiv.style.color = '#b71c1c';
  } else {
    // กรณี 0% หรือข้อมูลยังไม่โหลด
    progFill.style.background = '#e2e8f0';
    progFill.style.transition = 'width 1.2s ease-out, background 0s ease';
    progText.style.color = '#94a3b8';
    progMotiv.innerHTML = '🌱 <b>เริ่มงานรอบใหม่!</b> เตรียมพร้อมลุยกันเลยครับ สู้ๆ!';
    progMotiv.style.color = '#94a3b8';
  }

  // อัปเดต Summary Cards
  document.getElementById('tot_all').innerText = data.total;
  document.getElementById('tot_eka').innerText = data.ekachai.appointed;
  document.getElementById('tot_porn').innerText = data.pornthep.appointed;
  
  document.getElementById('update_eka').innerText = data.ekachai.lastUpdate || '-';
  document.getElementById('update_porn').innerText = data.pornthep.lastUpdate || '-';
  
  const now = new Date();
  document.getElementById('last_update').innerText = "อัปเดตข้อมูลล่าสุด: " + now.toLocaleTimeString('th-TH');

  // --- 1. Bar Chart (ยืดสูงขึ้น และ DataLabels 14px) ---
  const barCtx = document.getElementById('barChart').getContext('2d');
  if (barChartInst) barChartInst.destroy();
  barChartInst = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['เอกชัย เกษรบัว', 'พรเทพ ม่วงรัก'], 
      datasets: [
        { 
          label: 'นัดหมายสำเร็จ', 
          data: [data.ekachai.appointed, data.pornthep.appointed], 
          backgroundColor: '#10b981', 
          borderRadius: 4 
        },
        { 
          label: 'ไม่นัดหมาย', 
          data: [data.ekachai.notAppointed, data.pornthep.notAppointed], 
          backgroundColor: '#ef4444', 
          borderRadius: 4
        }
      ]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false, 
      scales: { 
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 12 } }, grid: { color: '#f1f5f9' }, suggestedMax: 8 }, 
        x: { ticks: { font: { size: 12 } }, grid: { display: false } }
      },
      plugins: {
        legend: { labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 } }, padding: 15 },
        datalabels: {
          color: '#334155',
          anchor: 'end',
          align: 'top',
          font: { weight: 'bold', size: 14 }, // 🔥 ขยายขนาดจาก 12 เป็น 14 🔥
          formatter: (value) => value > 0 ? value : ''
        }
      }
    }
  });

  // --- 2. Donut Chart (ปรับให้เส้นหนาและดูเต็มขึ้นในพื้นที่ใหม่) ---
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  if (pieChartInst) pieChartInst.destroy();
  pieChartInst = new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: ['นัดหมายสำเร็จ', 'ไม่นัดหมาย', 'รอดำเนินการ'],
      datasets: [{
        data: [totalAppointed, totalNotAppointed, totalPending],
        backgroundColor: ['#00E396', '#FF4560', '#E2E8F0'], 
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: { 
      responsive: true,
      maintainAspectRatio: false, 
      cutout: '60%', 
      plugins: {
        legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, padding: 20, font: { size: 13 } } }, 
        datalabels: {
          color: '#ffffff',
          font: { weight: 'bold', size: 14 }, 
          textAlign: 'center',
          textShadowBlur: 4,
          textShadowColor: 'rgba(0,0,0,0.3)',
          padding: 8, 
          formatter: (value, ctx) => {
            if (value === 0) return ''; 
            let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            let percentage = (value * 100 / sum).toFixed(1) + "%";
            
            if (ctx.dataIndex === 2) ctx.chart.data.datasets[0].datalabels = { color: '#475569', textShadowColor: 'transparent' };
            
            return `${value} คัน\n(${percentage})`;
          }
        }
      }
    }
  });
}
