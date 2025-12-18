const { jsPDF } = window.jspdf;

// --- ESTADO Y PERSISTENCIA ---
let registros = JSON.parse(localStorage.getItem("registros")) || [];
let empleados = JSON.parse(localStorage.getItem("empleados")) || ["Empleado de ejemplo"];

// Selectores Generales
const views = document.querySelectorAll('.view');
const dockItems = document.querySelectorAll('.dock-item');
const selectEmpleado = document.getElementById("empleado");
const selectFiltro = document.getElementById("filtro-empleado");
const employeeListAdmin = document.getElementById("employee-list-admin");

// --- GESTIÓN DE VISTAS (DOCK) ---
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

// --- GESTIÓN DE EMPLEADOS ---
document.getElementById("add-employee-form").addEventListener("submit", e => {
  e.preventDefault();
  const nombre = document.getElementById("new-employee-name").value.trim();
  if (nombre && !empleados.includes(nombre)) {
    empleados.push(nombre);
    saveAndRefreshEmployees();
    e.target.reset();
  }
});

window.eliminarEmpleado = (index) => {
  if(confirm(`¿Eliminar a ${empleados[index]}? Los registros existentes se mantendrán.`)) {
    empleados.splice(index, 1);
    saveAndRefreshEmployees();
  }
};

function saveAndRefreshEmployees() {
  localStorage.setItem("empleados", JSON.stringify(empleados));
  const options = empleados.map(emp => `<option value="${emp}">${emp}</option>`).join("");
  selectEmpleado.innerHTML = `<option value="" disabled selected>Selecciona tu nombre...</option>` + options;
  selectFiltro.innerHTML = `<option value="todos">Todos los empleados</option>` + options;
  
  employeeListAdmin.innerHTML = empleados.map((emp, i) => `
    <li>
      <span>${emp}</span>
      <button onclick="eliminarEmpleado(${i})" class="btn-delete">✕</button>
    </li>
  `).join("");
}

// --- LÓGICA DE JORNADAS ---
document.getElementById("registro-form").addEventListener("submit", e => {
  e.preventDefault();
  const reg = {
    empleado: selectEmpleado.value,
    fecha: document.getElementById("fecha").value,
    entrada: document.getElementById("entrada").value,
    salida: document.getElementById("salida").value
  };
  registros.push(reg);
  localStorage.setItem("registros", JSON.stringify(registros));
  e.target.reset();
  render();
  alert("Jornada guardada.");
});

window.eliminarRegistro = (index) => {
  if(confirm("¿Eliminar registro?")) {
    registros.splice(index, 1);
    localStorage.setItem("registros", JSON.stringify(registros));
    render();
  }
};

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
selectFiltro.addEventListener("change", render);

function render() {
  const historialEl = document.getElementById("historial");
  historialEl.innerHTML = "";
  const filtro = selectFiltro.value;
  let totalMin = 0;
  let diasSet = new Set();

  [...registros].reverse().forEach((r, revIdx) => {
    const originalIdx = registros.length - 1 - revIdx;
    if (filtro === "todos" || r.empleado === filtro) {
      const min = calcularMinutos(r.entrada, r.salida);
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="info-registro">
          <strong>${r.empleado}</strong>
          <small>${r.fecha} (${r.entrada}-${r.salida})</small>
        </div>
        <div class="acciones-registro">
          <span>${minutosAHoras(min)}</span>
          <button onclick="eliminarRegistro(${originalIdx})" class="btn-delete">✕</button>
        </div>`;
      historialEl.appendChild(li);
      totalMin += min;
      diasSet.add(r.fecha);
    }
  });

  document.getElementById("stat-total").textContent = minutosAHoras(totalMin);
  document.getElementById("stat-dias").textContent = diasSet.size;
}

// --- EXPORTAR PDF ---
document.getElementById("exportPdfBtn").addEventListener("click", () => {
  if (registros.length === 0) return alert("Sin datos");
  const doc = new jsPDF();
  const f = selectFiltro.value;
  doc.setFontSize(18); doc.text("Reporte de Jornada", 20, 20);
  doc.setFontSize(12); doc.text(`Filtro: ${f}`, 20, 30);
  let y = 45;
  registros.filter(r => f === 'todos' || r.empleado === f).forEach(r => {
    const m = calcularMinutos(r.entrada, r.salida);
    doc.text(`${r.fecha} | ${r.empleado.slice(0,12)} | ${r.entrada}-${r.salida} | ${minutosAHoras(m)}`, 20, y);
    y += 10;
  });
  doc.save(`Reporte_${f}.pdf`);
});

// Dark Mode
const darkToggle = document.getElementById("darkToggle");
if(localStorage.getItem("darkMode") === "true"){ document.body.classList.add("dark"); darkToggle.checked = true; }
darkToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
});

saveAndRefreshEmployees();
render();
