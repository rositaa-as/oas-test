function showSection(id, btn) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    if(btn) btn.classList.add('active');
    document.querySelector('.main-content').scrollTop = 0;
}

function calcImpact() {
    const val = document.getElementById('tapaInput').value;
    const res = document.getElementById('impactResult');
    if(val > 0) {
        const quimios = Math.floor(val / 5000);
        if (quimios > 0) {
            res.innerHTML = `🌟 ¡Equivale a <strong>${quimios}</strong> quimioterapia(s)!`;
            res.style.color = "var(--pink-accent)";
        } else {
            res.innerHTML = `¡Faltan ${5000 - val} para lograr una quimio!`;
            res.style.color = "var(--success)";
        }
    } else { res.innerHTML = "Ingresa una cantidad"; }
}

function updateNeeds() {
    const val = document.getElementById('itemSelect').value;
    const res = document.getElementById('needResult');
    const data = {
        silla: "📍 Cáritas GDL requiere sillas de ruedas urgentes.",
        muletas: "📍 Cruz Roja acepta muletas en buen estado.",
        medicamento: "📍 Nariz Roja recibe oncológicos vigentes."
    };
    if(val) {
        res.style.background = "#E8F5E9";
        res.innerHTML = `<strong>Sugerencia:</strong> ${data[val]}`;
    } else { res.innerHTML = ""; }
}
