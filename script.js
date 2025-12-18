const { jsPDF } = window.jspdf;

// Selectores
const views = document.querySelectorAll('.view');
const dockItems = document.querySelectorAll('.dock-item');
const form = document.getElementById("registro-form");
const filtroEmpleado = document.getElementById("filtro-empleado");
const exportPdfBtn = document.getElementById("exportPdfBtn"); // ID Corregido

let registros = JSON.parse(localStorage.getItem("registros")) || [];

// --- NAVEGACIÓN ---
dockItems.forEach(item => {
  item.addEventListener('click', () => {
    dockItems.forEach(btn => btn.classList.remove('active'));
    item.classList.add('active');
    const targetView = item.getAttribute('data-view');
    views.forEach(view => {
      view.id === targetView ? view.classList.remove('hidden') : view.classList.add('hidden');
    });
    render();
  });
});

// --- LÓGICA DE DATOS ---
form.addEventListener("submit", e => {
  e.preventDefault();
  const reg = {
    empleado: document.getElementById("empleado").value,
    fecha: document.getElementById("fecha").value,
    entrada: document.getElementById("entrada").value,
    salida: document.getElementById("salida").value
  };
  registros.push(reg);
  localStorage.setItem("registros", JSON.stringify(registros));
  form.reset();
  render();
  alert(`Registro guardado para ${reg.empleado}`);
});

function eliminarRegistro(index) {
  if(confirm("¿Eliminar este registro?")) {
    registros.splice(index, 1);
    localStorage.setItem("registros", JSON.stringify(registros));
    render();
  }
}

function calcularMinutos(entrada, salida) {
  const [h1, m1] = entrada.split(":").map(Number);
  const [h2, m2] = salida.split(":").map(Number);
  let min = (h2 * 60 + m2) - (h1 * 60 + m1);
  return min < 0 ? min + 1440 : min;
}

function minutosAHoras(min) {
  return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`;
}

// --- RENDERIZADO ---
filtroEmpleado.addEventListener("change", render);

function render() {
  const historialEl = document.getElementById("historial");
  historialEl.innerHTML = "";
  const filtro = filtroEmpleado.value;
  let totalMin = 0;
  let diasSet = new Set();

  [...registros].reverse().forEach((r, revIdx) => {
    const originalIdx = registros.length - 1 - revIdx;
    const min = calcularMinutos(r.entrada, r.salida);
    
    // Solo mostrar en historial si coincide con filtro o estamos en Home (filtro 'todos')
    if (filtro === "todos" || r.empleado === filtro) {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="info-registro">
          <strong>${r.empleado}</strong>
          <small>${r.fecha} (${r.entrada}-${r.salida})</small>
        </div>
        <div class="acciones-registro">
          <span>${minutosAHoras(min)}</span>
          <button onclick="eliminarRegistro(${originalIdx})" class="btn-delete">✕</button>
        </div>
      `;
      historialEl.appendChild(li);
      totalMin += min;
      diasSet.add(r.fecha);
    }
  });

  document.getElementById("stat-total").textContent = minutosAHoras(totalMin);
  document.getElementById("stat-dias").textContent = diasSet.size;
}

// --- PDF CORREGIDO ---
exportPdfBtn.addEventListener("click", () => {
  if (registros.length === 0) {
    alert("No hay datos para exportar");
    return;
  }
  const doc = new jsPDF();
  const filtro = filtroEmpleado.value;
  
  doc.setFontSize(18);
  doc.text("Reporte de Jornada Laboral", 20, 20);
  doc.setFontSize(12);
  doc.text(`Empleado: ${filtro === 'todos' ? 'Todo el equipo' : filtro}`, 20, 30);
  doc.text(`Fecha de exportación: ${new Date().toLocaleDateString()}`, 20, 38);
  
  let y = 50;
  doc.line(20, y-5, 190, y-5);
  
  registros.filter(r => filtro === 'todos' || r.empleado === filtro).forEach(r => {
    const m = calcularMinutos(r.entrada, r.salida);
    doc.text(`${r.fecha} | ${r.empleado.padEnd(15)} | ${r.entrada}-${r.salida} | ${minutosAHoras(m)}`, 20, y);
    y += 10;
    if(y > 280) { doc.addPage(); y = 20; }
  });

  doc.save(`Reporte_Jornada_${filtro.replace(' ', '_')}.pdf`);
});

// Dark Mode
const darkToggle = document.getElementById("darkToggle");
if(localStorage.getItem("darkMode") === "true"){
  document.body.classList.add("dark");
  darkToggle.checked = true;
}
darkToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
});

render();
