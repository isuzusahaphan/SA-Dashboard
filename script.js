const API_URL = "https://script.google.com/macros/s/AKfycbzRJxiBfL87wbDDapTklIW0l8Beio_DHPGfLlysYSTiU5kzlTV-3ubZekC6_1G1hWt3/exec";

let barChartInst = null;
let pieChartInst = null;

// ลงทะเบียน Plugin แสดงตัวเลขบนกราฟ
Chart.register(ChartDataLabels);

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
  
  // โชว์วันที่โทรล่าสุดใต้กราฟแท่ง
  document.getElementById('update_eka').innerText = data.ekachai.lastUpdate || '-';
  document.getElementById('update_porn').innerText = data.pornthep.lastUpdate || '-';
  
  const now = new Date();
  document.getElementById('last_update').innerText = "อัปเดตข้อมูลล่าสุด: " + now.toLocaleTimeString('th-TH');

  // --- 1. Bar Chart ---
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
          backgroundColor: '#10b981', 
          borderRadius: 4 
        },
        { 
          label: 'ไม่นัดหมาย', 
          data: [data.ekachai.notAppointed, data.pornthep.notAppointed], 
          backgroundColor: '#0ea5e9',
          borderRadius: 4
        }
      ]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false, 
      scales: { 
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' }, suggestedMax: 5 },
        x: { grid: { display: false } }
      },
      plugins: {
        legend: { labels: { usePointStyle: true, boxWidth: 8 } },
        // ตั้งค่าตัวเลขบนกราฟแท่ง
        datalabels: {
          color: '#475569',
          anchor: 'end',
          align: 'top',
          font: { weight: 'bold', size: 12 },
          formatter: (value) => value > 0 ? value : '' // ซ่อนเลข 0 ไม่ให้รก
        }
      }
    }
  });

  // --- 2. Donut Chart ---
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
        backgroundColor: ['#00E396', '#FF4560', '#E2E8F0'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: { 
      responsive: true,
      maintainAspectRatio: false, 
      cutout: '65%',
      plugins: {
        legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, padding: 15 } },
        // ตั้งค่าตัวเลขและเปอร์เซ็นต์บน Donut Chart
        datalabels: {
          color: '#ffffff',
          font: { weight: 'bold', size: 11 },
          textAlign: 'center',
          textShadowBlur: 4,
          textShadowColor: 'rgba(0,0,0,0.3)',
          formatter: (value, ctx) => {
            if (value === 0) return ''; // ถ้าเป็น 0 ไม่ต้องโชว์
            let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            let percentage = (value * 100 / sum).toFixed(1) + "%";
            
            // กรณีเป็นสีเทา (รอดำเนินการ) ให้เปลี่ยนสีอักษรเป็นสีเข้มเพื่อให้มองเห็นชัด
            if (ctx.dataIndex === 2) ctx.chart.data.datasets[0].datalabels = { color: '#475569' };
            
            return `${value} คัน\n(${percentage})`;
          }
        }
      }
    }
  });
}
