/* AI Clinic — full JS for single-page demo
   Navigation, symptom analyzer, appointments, chart, BMI, reminders, chat, theme
*/

// small helpers
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const KEY_APPTS = 'ai_clinic_appointments_v1';
const KEY_REMS = 'ai_clinic_reminders_v1';
const KEY_THEME = 'ai_clinic_theme_v1';

// ---------- NAVIGATION ----------
const navBtns = $$('.nav-btn');
const pages = $$('.page');
function openPage(id){
  pages.forEach(p => p.classList.toggle('active', p.id === id));
  navBtns.forEach(b => b.classList.toggle('active', b.dataset.target === id));
  window.scrollTo({top:0, behavior:'smooth'});
}
navBtns.forEach(b => {
  b.addEventListener('click', () => openPage(b.dataset.target));
});
// CTA openers
$$('[data-open]').forEach(b => {
  b.addEventListener('click', (e) => {
    e.preventDefault();
    const t = b.dataset.open || b.dataset.target;
    openPage(t);
  });
});

// ---------- THEME TOGGLE ----------
const themeToggle = $('#themeToggle');
if(localStorage.getItem(KEY_THEME) === 'dark'){
  document.body.classList.add('dark');
  if(themeToggle) themeToggle.checked = true;
}
if(themeToggle){
  themeToggle.addEventListener('change', () => {
    if(themeToggle.checked){
      document.body.classList.add('dark');
      localStorage.setItem(KEY_THEME, 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem(KEY_THEME, 'light');
    }
  });
}

// ---------- SYMPTOM ANALYZER (rule-based demo) ----------
const symptomBtn = $('#symptomBtn');
const symptomInput = $('#symptomInput');
const symptomResult = $('#symptomResult');
const symptomLoader = $('#symptomLoader');

function analyzeSymptoms(text){
  const t = (text||'').toLowerCase();
  let confidence = 80 + Math.floor(Math.random()*16);
  let tag = 'healthy';
  let msg = 'Nothing urgent detected. Maintain hydration and rest.';
  if(/fever|cough|cold|sore throat/.test(t)){
    tag = 'respiratory';
    msg = 'Symptoms suggest a mild respiratory infection (cold/flu). Rest, hydrate, monitor fever.';
    confidence = 65 + Math.floor(Math.random()*26);
  } else if(/chest|breath|shortness/.test(t)){
    tag = 'urgent';
    msg = 'Potentially serious. Seek immediate medical attention or call emergency services.';
    confidence = 88 + Math.floor(Math.random()*8);
  } else if(/headache|dizzy|migraine/.test(t)){
    tag = 'headache';
    msg = 'Common causes: tension, dehydration. Rest and drink water. See a doctor if severe.';
  } else if(/stomach|nausea|diarrhea|vomit/.test(t)){
    tag = 'gastro';
    msg = 'Gastrointestinal symptoms. Keep hydrated; consult if severe or prolonged.';
  }
  return { tag, msg, confidence };
}

if(symptomBtn){
  symptomBtn.addEventListener('click', () => {
    const txt = symptomInput.value.trim();
    if(!txt){ symptomResult.textContent = 'Please enter symptoms first.'; return; }
    symptomResult.textContent = '';
    symptomLoader.classList.remove('hidden');
    setTimeout(() => {
      const res = analyzeSymptoms(txt);
      symptomLoader.classList.add('hidden');
      symptomResult.innerHTML = `<strong>${res.msg}</strong>
        <div class="muted small">Confidence: ${res.confidence}% • Category: ${res.tag}</div>`;
      if(res.tag === 'urgent') symptomResult.style.borderLeft = '4px solid #ff6b6b';
      else symptomResult.style.borderLeft = '4px solid rgba(10,142,160,0.6)';
    }, 900 + Math.random()*900);
  });
  symptomInput.addEventListener('keydown', e => {
    if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){
      symptomBtn.click();
    }
  });
}

// ---------- APPOINTMENTS (localStorage) ----------
const apptForm = $('#appointmentForm');
const apptList = $('#appointmentList');
const clearApptBtn = $('#clearAppointments');

function loadAppointments(){
  const arr = JSON.parse(localStorage.getItem(KEY_APPTS) || '[]');
  if(!apptList) return;
  if(arr.length === 0){
    apptList.innerHTML = '<p class="muted">No appointments saved.</p>';
    return;
  }
  apptList.innerHTML = arr.map((a,i) => `
    <div class="appointment-item">
      <div><strong>${escapeHtml(a.name)}</strong> · <span class="muted">${escapeHtml(a.doctor)}</span></div>
      <div class="muted small">${escapeHtml(a.date)} ${a.notes ? (' · ' + escapeHtml(a.notes)) : ''}</div>
    </div>`).join('');
}
function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

if(apptForm){
  apptForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#patientName').value.trim();
    const doctor = $('#doctorSelect').value;
    const date = $('#appointmentDate').value;
    const notes = $('#appointmentNotes').value.trim();
    if(!name || !doctor || !date) return alert('Please fill name, doctor, and date.');
    const arr = JSON.parse(localStorage.getItem(KEY_APPTS) || '[]');
    arr.push({ name, doctor, date, notes });
    localStorage.setItem(KEY_APPTS, JSON.stringify(arr));
    apptForm.reset();
    loadAppointments();
    openPage('appointment');
  });
  if(clearApptBtn){
    clearApptBtn.addEventListener('click', () => {
      if(!confirm('Clear all stored appointments?')) return;
      localStorage.removeItem(KEY_APPTS);
      loadAppointments();
    });
  }
}
loadAppointments();

// ---------- DASHBOARD (Chart.js) ----------
const ctx = document.getElementById('healthChart');
if(ctx){
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [
        { label: 'Heart Rate (bpm)', data: [74,76,75,77,76,78,76], borderColor: '#0a8ea0', backgroundColor:'rgba(10,142,160,0.12)', tension:0.3, fill:true },
        { label: 'Steps (×100)', data: [52,60,55,64,58,70,66], borderColor: '#60d5d9', backgroundColor:'rgba(96,213,217,0.08)', tension:0.3, fill:true }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio:false,
      plugins: { legend:{position:'bottom'} },
      scales: { y:{ beginAtZero:false } }
    }
  });
}

// ---------- BMI ----------
const bmiBtn = $('#bmiBtn');
const bmiResult = $('#bmiResult');
if(bmiBtn){
  bmiBtn.addEventListener('click', () => {
    const h = parseFloat($('#height').value);
    const w = parseFloat($('#weight').value);
    if(!(h > 0) || !(w > 0)) { bmiResult.textContent = 'Enter valid height and weight.'; return; }
    const bmi = w / ((h/100)*(h/100));
    const val = bmi.toFixed(1);
    let status = 'Normal';
    if(bmi < 18.5) status = 'Underweight';
    else if(bmi < 25) status = 'Normal';
    else if(bmi < 30) status = 'Overweight';
    else status = 'Obese';
    bmiResult.innerHTML = `<strong>${val}</strong> — ${status}`;
  });
}

// ---------- REMINDERS ----------
const remForm = $('#reminderForm');
const remList = $('#reminderList');
function loadReminders(){
  const arr = JSON.parse(localStorage.getItem(KEY_REMS) || '[]');
  if(!remList) return;
  if(arr.length === 0){ remList.innerHTML = '<li class="muted">No reminders set.</li>'; return; }
  remList.innerHTML = arr.map((r,i)=>`
    <li>${escapeHtml(r.name)} <span class="muted small">${escapeHtml(r.time)}</span>
      <button class="btn ghost" data-idx="${i}">Delete</button>
    </li>`).join('');
}
if(remForm){
  remForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#medName').value.trim();
    const time = $('#medTime').value;
    if(!name || !time) return;
    const arr = JSON.parse(localStorage.getItem(KEY_REMS) || '[]');
    arr.push({ name, time });
    localStorage.setItem(KEY_REMS, JSON.stringify(arr));
    remForm.reset();
    loadReminders();
  });
  remList && remList.addEventListener('click', e => {
    if(e.target.tagName === 'BUTTON'){
      const idx = e.target.dataset.idx;
      const arr = JSON.parse(localStorage.getItem(KEY_REMS) || '[]');
      arr.splice(idx,1);
      localStorage.setItem(KEY_REMS, JSON.stringify(arr));
      loadReminders();
    }
  });
}
loadReminders();

// ---------- CHATBOT (mock front-end) ----------
const chatWindow = $('#chatWindow');
const chatText = $('#chatText');
const chatSend = $('#chatSend');

function addChatMessage(text, who='bot'){
  const el = document.createElement('div');
  el.className = 'chat-message ' + (who==='user' ? 'chat-user' : 'chat-bot');
  el.innerHTML = text;
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function botReply(input){
  const t = (input||'').toLowerCase();
  if(t.includes('hello')||t.includes('hi')) return "Hello! I'm a demo assistant — how can I help (demo only)?";
  if(t.includes('fever')||t.includes('cough')) return "I detect respiratory-like keywords. For demo: rest & hydrate; consult a doctor if symptoms worsen.";
  if(t.includes('appointment')) return "You can book an appointment from the Appointments tab. It's stored locally for the demo.";
  if(t.includes('bmi')) return "Use the BMI tab to compute BMI. Enter height in cm and weight in kg.";
  if(t.includes('emergency')||t.includes('chest')) return "If this is an emergency, call your local emergency services immediately.";
  return "Sorry — demo assistant couldn't find a precise match. Try keywords like 'fever', 'appointment', 'bmi'.";
}

if(chatSend){
  chatSend.addEventListener('click', () => {
    const txt = chatText.value.trim();
    if(!txt) return;
    addChatMessage(txt, 'user');
    chatText.value = '';
    // show typing indicator
    addChatMessage('Typing...', 'bot');
    setTimeout(()=> {
      // remove last bot (typing) then add reply
      const nodes = Array.from(chatWindow.querySelectorAll('.chat-message'));
      const last = nodes[nodes.length-1];
      if(last && last.textContent === 'Typing...') last.remove();
      addChatMessage(botReply(txt), 'bot');
    }, 700 + Math.random()*800);
  });

  chatText.addEventListener('keydown', e => {
    if(e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); chatSend.click();
    }
  });
}

// ---------- init: open default page ----------
document.addEventListener('DOMContentLoaded', () => {
  const active = navBtns.find(b => b.classList.contains('active'));
  if(active) openPage(active.dataset.target);
  else openPage('home');
});
