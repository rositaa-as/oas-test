// Almacenamiento de donaciones
let donations = [];

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

// Funciones para Mis Donaciones
function addDonation(event) {
    event.preventDefault();
    
    const type = document.getElementById('donationType').value;
    const quantity = document.getElementById('donationQuantity').value;
    const date = document.getElementById('donationDate').value;
    const notes = document.getElementById('donationNotes').value;
    
    const donation = {
        id: Date.now(),
        type: type,
        quantity: quantity || 1,
        date: date,
        notes: notes,
        timestamp: new Date().toISOString()
    };
    
    donations.push(donation);
    saveDonations();
    renderDonations();
    updateStats();
    
    // Limpiar formulario
    document.getElementById('donationForm').reset();
    document.getElementById('quantityField').style.display = 'none';
    
    // Mostrar mensaje de éxito
    alert('✅ ¡Donación registrada exitosamente!');
}

function saveDonations() {
    const user = firebase.auth().currentUser;
    if (user) {
        localStorage.setItem(`donations_${user.uid}`, JSON.stringify(donations));
    }
}

function loadDonations() {
    const user = firebase.auth().currentUser;
    if (user) {
        const saved = localStorage.getItem(`donations_${user.uid}`);
        donations = saved ? JSON.parse(saved) : [];
        renderDonations();
        updateStats();
    }
}

function renderDonations() {
    const list = document.getElementById('donationsList');
    
    if (donations.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No hay donaciones registradas aún. ¡Comienza a registrar tus contribuciones!</p>';
        return;
    }
    
    const typeIcons = {
        tapitas: '🥤',
        sangre: '🩸',
        cabello: '💇‍♀️',
        silla: '♿',
        muletas: '🦯',
        medicamento: '💊'
    };
    
    const typeNames = {
        tapitas: 'Tapitas',
        sangre: 'Sangre',
        cabello: 'Cabello',
        silla: 'Silla de Ruedas',
        muletas: 'Muletas / Andaderas',
        medicamento: 'Medicamento'
    };
    
    list.innerHTML = donations.map(d => `
        <div style="background: white; padding: 15px; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid var(--pink-accent); display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                    <span style="font-size: 24px;">${typeIcons[d.type]}</span>
                    <strong style="color: var(--lila-dark);">${typeNames[d.type]}</strong>
                    ${d.type === 'tapitas' ? `<span style="background: var(--pink-accent); color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px;">${d.quantity} unidades</span>` : ''}
                </div>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">📅 ${new Date(d.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                ${d.notes ? `<p style="margin: 5px 0; font-size: 13px; color: #888; font-style: italic;">"${d.notes}"</p>` : ''}
            </div>
            <button onclick="deleteDonation(${d.id})" style="background: #ff5252; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 12px;">🗑️ Eliminar</button>
        </div>
    `).join('');
}

function deleteDonation(id) {
    if (confirm('¿Estás seguro de eliminar esta donación?')) {
        donations = donations.filter(d => d.id !== id);
        saveDonations();
        renderDonations();
        updateStats();
    }
}

function updateStats() {
    const totalTapitas = donations
        .filter(d => d.type === 'tapitas')
        .reduce((sum, d) => sum + parseInt(d.quantity || 0), 0);
    
    const totalSangre = donations.filter(d => d.type === 'sangre').length;
    
    const totalOtros = donations.filter(d =>
        d.type !== 'tapitas' && d.type !== 'sangre'
    ).length;
    
    document.getElementById('totalTapitas').textContent = totalTapitas.toLocaleString();
    document.getElementById('totalSangre').textContent = totalSangre;
    document.getElementById('totalOtros').textContent = totalOtros;
}

// Mostrar campo de cantidad solo para tapitas
document.addEventListener('DOMContentLoaded', function() {
    const typeSelect = document.getElementById('donationType');
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            const quantityField = document.getElementById('quantityField');
            const quantityInput = document.getElementById('donationQuantity');
            
            if (this.value === 'tapitas') {
                quantityField.style.display = 'block';
                quantityInput.required = true;
            } else {
                quantityField.style.display = 'none';
                quantityInput.required = false;
                quantityInput.value = '';
            }
        });
    }
    
    // Establecer fecha de hoy por defecto
    const dateInput = document.getElementById('donationDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
});
