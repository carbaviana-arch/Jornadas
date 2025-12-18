const { jsPDF } = window.jspdf;

const form = document.getElementById("registro-form");
const historialEl = document.getElementById("historial");
const totalHorasEl = document.getElementById("total-horas");
const resumenDiaEl = document.getElementById("resumen-dia");
const resumenSemanaEl = document.getElementById("resumen-semana");
const resumenMesEl = document.getElementById("resumen-mes");
const darkToggle = document.getElementById("darkToggle");
const exportPdfBtn = document.getElementById("exportPdf");

let registros = JSON.parse(localStorage.getItem("registros")) || [];

// Guardar registro
form.addEventListener("submit", e => {
  e.preventDefault();
  const fecha = document.getElementById("fecha").value;
  const entrada = document.getElementById("entrada").value;
  const salida = document.getElementById("salida").value;
  if (!fecha || !entrada || !salida) return;

  registros.push({ fecha, entrada, salida });
  localStorage.setItem("registros", JSON.stringify(registros));
  form.reset();
  render();
});

// Eliminar registro
function eliminarRegistro(index) {
  registros.splice(index, 1);
  localStorage.setItem("registros", JSON.stringify(registros));
  render();
}

// Calcular minutos trabajados
function calcularMinutos(entrada, salida) {
  const [h1, m1] = entrada.split(":").map(Number);
  const [h2, m2] = salida.split(":").map(Number);
  let inicio = h1*60 + m1;
  let fin = h2*60 + m2;
  if (fin < inicio) fin += 24*60;
  return fin - inicio;
}

// Convertir minutos a hh:mm
function minutosAHoras(minutos) {
  const h = Math.floor(minutos/60);
  const m = minutos%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// Renderizar
function render() {
  historialEl.innerHTML = "";
  let totalMin = 0, hoyMin = 0, semanaMin = 0, mesMin = 0;
  const hoy = new Date().toISOString().slice(0,10);
  const fechaActual = new Date();
  const mesActual = fechaActual.getMonth();
  const semanaActual = getWeekNumber(fechaActual);

  registros.forEach((r,i)=>{
    const min = calcularMinutos(r.entrada, r.salida);
    totalMin += min;

    if(r.fecha===hoy) hoyMin += min;
    const f = new Date(r.fecha);
    if(getWeekNumber(f)===semanaActual) semanaMin += min;
    if(f.getMonth()===mesActual && f.getFullYear()===fechaActual.getFullYear()) mesMin += min;

    const li = document.createElement("li");
    li.innerHTML = `
      <span>${r.fecha} (${r.entrada} - ${r.salida})</span>
      <span>${minutosAHoras(min)} <button onclick="eliminarRegistro(${i})">✕</button></span>
    `;
    historialEl.appendChild(li);
  });

  totalHorasEl.textContent = minutosAHoras(totalMin);
  resumenDiaEl.textContent = minutosAHoras(hoyMin);
  resumenSemanaEl.textContent = minutosAHoras(semanaMin);
  resumenMesEl.textContent = minutosAHoras(mesMin);
}

// Semana ISO
function getWeekNumber(date) {
  date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date - yearStart)/86400000) +1)/7);
}

// Dark Mode Switch
if(localStorage.getItem("darkMode")==="true"){
  document.body.classList.add("dark");
  darkToggle.checked = true;
}
darkToggle.addEventListener("change",()=>{
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
});

// Exportar PDF
exportPdfBtn.addEventListener("click",()=>{
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Informe de Horas", 20, 20);
  doc.setFontSize(12);
  doc.text(`Total: ${totalHorasEl.textContent}`, 20, 30);
  doc.text(`Hoy: ${resumenDiaEl.textContent}`, 20, 38);
  doc.text(`Semana: ${resumenSemanaEl.textContent}`, 20, 46);
  doc.text(`Mes: ${resumenMesEl.textContent}`, 20, 54);

  let y = 64;
  registros.forEach(r=>{
    const min = calcularMinutos(r.entrada,r.salida);
    doc.text(`${r.fecha} (${r.entrada}-${r.salida}) - ${minutosAHoras(min)}`, 20, y);
    y += 8;
    if(y > 280){ doc.addPage(); y = 20; }
  });

  doc.save("registro-horas.pdf");
});

render();