// ใส่ API URL ของคุณ
const API_URL = "https://script.google.com/macros/s/AKfycbzRJxiBfL87wbDDapTklIW0l8Beio_DHPGfLlysYSTiU5kzlTV-3ubZekC6_1G1hWt3/exec";

let barChartInst = null;
let pieChartInst = null;

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
  
  document.getElementById('tot_all').innerText = data.total;
  document.getElementById('tot_eka').innerText = data.ekachai.appointed;
  document.getElementById('tot_porn').innerText = data.pornthep.appointed;
  
  const now = new Date();
  document.getElementById('last_update').innerText = "อัปเดตข้อมูลล่าสุด: " + now.toLocaleTimeString('th-TH');

  // --- 1. Bar Chart (โทนน้ำเงินฟ้า กับ เขียวมินิมอล) ---
  const barCtx = document.getElementById('barChart').getContext('2d');
  if (barChartInst) barChartInst.destroy();
  barChartInst = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['เอกชัย', 'พรเทพ'],
      datasets: [
        { 
          label: 'นัดหมายสำเร็จ', 
          data: [data.ekachai.appointed, data.pornthep.appointed], 
          backgroundColor: '#10b981', // เขียว Emerald สบายตา
          borderRadius: 4 // มุมโค้งมินิมอล
        },
        { 
          label: 'ไม่นัดหมาย', 
          data: [data.ekachai.notAppointed, data.pornthep.notAppointed], 
          backgroundColor: '#0ea5e9', // น้ำเงินฟ้า Sky blue
          borderRadius: 4
        }
      ]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false, // สำคัญ: เพื่อบีบกราฟให้เล็กตามกรอบ CSS
      scales: { 
        y: { 
          beginAtZero: true, 
          ticks: { stepSize: 1 },
          grid: { color: '#f1f5f9' }
        },
        x: { grid: { display: false } }
      },
      plugins: {
        legend: { labels: { usePointStyle: true, boxWidth: 8 } }
      }
    }
  });

  // --- 2. Donut Chart (โทนสดใส พรีเมียม) ---
  const totalAppointed = data.ekachai.appointed + data.pornthep.appointed;
  const totalNotAppointed = data.ekachai.notAppointed + data.pornthep.notAppointed;
  const totalPending = (data.ekachai.pending + data.pornthep.pending) + (data.total - (totalAppointed + totalNotAppointed + data.ekachai.pending + data.pornthep.pending));

  const pieCtx = document.getElementById('pieChart').getContext('2d');
  if (pieChartInst) pieChartInst.destroy();
  pieChartInst = new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: ['นัดหมายสำเร็จ', 'ไม่นัดหมาย', 'รอดำเนินการ'],
      datasets: [{
        data: [totalAppointed, totalNotAppointed, totalPending],
        backgroundColor: [
          '#00E396', // สดใส: เขียวมรกต (Vibrant Premium Green)
          '#FF4560', // สดใส: แดงอมชมพู (Vibrant Rose Red)
          '#E2E8F0'  // เรียบหรู: เทาสว่าง (ให้สีอื่นเด่นขึ้นมา)
        ],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: { 
      responsive: true,
      maintainAspectRatio: false, // บีบขนาดให้พอดี
      cutout: '70%', // ทำให้โดนัทเส้นบางลง ดูหรูขึ้น
      plugins: {
        legend: { 
          position: 'right',
          labels: { usePointStyle: true, boxWidth: 8, padding: 15 } 
        }
      }
    }
  });
}