const { jsPDF } = window.jspdf;

// Elementos UI
const views = document.querySelectorAll('.view');
const dockItems = document.querySelectorAll('.dock-item');
const filtroEmpleado = document.getElementById("filtro-empleado");

let registros = JSON.parse(localStorage.getItem("registros")) || [];

// --- NAVEGACIÓN DOCK ---
dockItems.forEach(item => {
  item.addEventListener('click', () => {
    const targetView = item.getAttribute('data-view');
    
    // Cambiar estado de botones
    dockItems.forEach(btn => btn.classList.remove('active'));
    item.classList.add('active');

    // Cambiar visibilidad de secciones
    views.forEach(view => {
      view.id === targetView ? view.classList.remove('hidden') : view.classList.add('hidden');
    });
    render();
  });
});

// --- LÓGICA DE REGISTRO ---
document.getElementById("registro-form").addEventListener("submit", e => {
  e.preventDefault();
  const reg = {
    empleado: document.getElementById("empleado").value,
    fecha: document.getElementById("fecha").value,
    entrada: document.getElementById("entrada").value,
    salida: document.getElementById("salida").value
  };

  registros.push(reg);
  localStorage.setItem("registros", JSON.stringify(registros));
  e.target.reset();
  render();
  alert("¡Jornada guardada correctamente!");
});

function calcularMinutos(entrada, salida) {
  const [h1, m1] = entrada.split(":").map(Number);
  const [h2, m2] = salida.split(":").map(Number);
  let min = (h2 * 60 + m2) - (h1 * 60 + m1);
  return min < 0 ? min + 1440 : min;
}

function minutosAHoras(min) {
  return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`;
}

// --- RENDERIZADO Y FILTROS ---
filtroEmpleado.addEventListener("change", render);

function render() {
  const historialEl = document.getElementById("historial");
  historialEl.innerHTML = "";
  
  const filtro = filtroEmpleado.value;
  let totalMin = 0;
  let diasSet = new Set();

  registros.forEach((r, i) => {
    const min = calcularMinutos(r.entrada, r.salida);
    
    // Render historial (solo últimos 5 si estamos en home)
    const li = document.createElement("li");
    li.innerHTML = `<div><strong>${r.empleado}</strong><br><small>${r.fecha}</small></div>
                    <span>${minutosAHoras(min)}</span>`;
    historialEl.prepend(li);

    // Cálculos para Estadísticas
    if (filtro === "todos" || r.empleado === filtro) {
      totalMin += min;
      diasSet.add(r.fecha);
    }
  });

  document.getElementById("stat-total").textContent = minutosAHoras(totalMin);
  document.getElementById("stat-dias").textContent = diasSet.size;
}

// Inicializar
render();
