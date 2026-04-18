// Almacenamiento de donaciones (cache local)
let donations = [];

// Configuración de tipos de donación
const donationConfig = {
    tapitas: { 
        requiresQuantity: true, 
        unit: 'tapitas',
        label: 'Cantidad de tapitas',
        placeholder: 'Ej: 1000',
        hint: 'Ingresa el número de tapitas donadas'
    },
    sangre: { 
        requiresQuantity: true, 
        unit: 'veces',
        label: 'Número de veces',
        placeholder: 'Ej: 1',
        hint: 'Cada vez que donas sangre cuenta como 1'
    },
    cabello: { 
        requiresQuantity: true, 
        unit: 'cm',
        label: 'Longitud en centímetros',
        placeholder: 'Ej: 30',
        hint: 'Mínimo 30 cm para poder donar'
    },
    silla: { 
        requiresQuantity: true, 
        unit: 'unidades',
        label: 'Cantidad de sillas',
        placeholder: 'Ej: 1',
        hint: 'Número de sillas de ruedas donadas'
    },
    muletas: { 
        requiresQuantity: true, 
        unit: 'unidades',
        label: 'Cantidad de muletas/andaderas',
        placeholder: 'Ej: 2',
        hint: 'Número de muletas o andaderas donadas'
    },
    medicamento: { 
        requiresQuantity: true, 
        unit: 'cajas',
        label: 'Cantidad de cajas',
        placeholder: 'Ej: 5',
        hint: 'Número de cajas de medicamento donadas'
    }
};

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

// ============================================
// FUNCIONES DE FIRESTORE
// ============================================

/**
 * Guarda una donación en Firestore
 */
async function saveDonationToFirestore(donation) {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error('No hay usuario autenticado');
        return null;
    }
    
    try {
        // Crear ID único: timestamp + userId
        const donationId = `${Date.now()}_${user.uid}`;
        
        // Guardar en colección /donations
        await db.collection('donations').doc(donationId).set({
            user_id: user.uid,
            type: donation.type,
            quantity: parseInt(donation.quantity) || 1,
            date: donation.date,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Actualizar estadísticas del usuario en /users/{user_id}
        await updateUserStats(user.uid, donation.type, parseInt(donation.quantity) || 1);
        
        console.log('✅ Donación guardada en Firestore:', donationId);
        return donationId;
    } catch (error) {
        console.error('❌ Error al guardar donación:', error);
        throw error;
    }
}

/**
 * Actualiza las estadísticas del usuario
 */
async function updateUserStats(userId, donationType, quantity) {
    const userRef = db.collection('users').doc(userId);
    
    try {
        const userDoc = await userRef.get();
        const user = firebase.auth().currentUser;
        
        if (!userDoc.exists) {
            // Crear documento de usuario si no existe
            await userRef.set({
                name: user.displayName || 'Usuario',
                email: user.email,
                total_tapitas: 0,
                total_donations: 0,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Actualizar contadores
        const updates = {
            total_donations: firebase.firestore.FieldValue.increment(1),
            last_donation: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Si es tapitas, actualizar contador específico
        if (donationType === 'tapitas') {
            updates.total_tapitas = firebase.firestore.FieldValue.increment(quantity);
        }
        
        await userRef.update(updates);
        console.log('✅ Estadísticas de usuario actualizadas');
    } catch (error) {
        console.error('❌ Error al actualizar estadísticas:', error);
        throw error;
    }
}

/**
 * Carga las donaciones del usuario desde Firestore
 */
async function loadDonationsFromFirestore() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    try {
        const snapshot = await db.collection('donations')
            .where('user_id', '==', user.uid)
            .orderBy('timestamp', 'desc')
            .get();
        
        donations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convertir timestamp de Firestore a fecha
            date: doc.data().date || new Date().toISOString().split('T')[0]
        }));
        
        renderDonations();
        await updateStatsFromFirestore();
        
        console.log(`✅ ${donations.length} donaciones cargadas desde Firestore`);
    } catch (error) {
        console.error('❌ Error al cargar donaciones:', error);
    }
}

/**
 * Actualiza las estadísticas desde Firestore
 */
async function updateStatsFromFirestore() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            document.getElementById('totalTapitas').textContent = 
                (userData.total_tapitas || 0).toLocaleString();
        }
        
        // Calcular otras estadísticas desde las donaciones
        const totalSangre = donations.filter(d => d.type === 'sangre')
            .reduce((sum, d) => sum + (d.quantity || 1), 0);
        
        const totalOtros = donations.filter(d => 
            d.type !== 'tapitas' && d.type !== 'sangre'
        ).reduce((sum, d) => sum + (d.quantity || 1), 0);
        
        document.getElementById('totalSangre').textContent = totalSangre;
        document.getElementById('totalOtros').textContent = totalOtros;
    } catch (error) {
        console.error('❌ Error al actualizar estadísticas:', error);
    }
}

/**
 * Elimina una donación de Firestore
 */
async function deleteDonationFromFirestore(donationId) {
    try {
        const donationDoc = await db.collection('donations').doc(donationId).get();
        
        if (!donationDoc.exists) {
            throw new Error('Donación no encontrada');
        }
        
        const donationData = donationDoc.data();
        const user = firebase.auth().currentUser;
        
        // Verificar que el usuario sea el dueño
        if (donationData.user_id !== user.uid) {
            throw new Error('No tienes permiso para eliminar esta donación');
        }
        
        // Eliminar de Firestore
        await db.collection('donations').doc(donationId).delete();
        
        // Actualizar estadísticas del usuario (restar)
        const userRef = db.collection('users').doc(user.uid);
        const updates = {
            total_donations: firebase.firestore.FieldValue.increment(-1)
        };
        
        if (donationData.type === 'tapitas') {
            updates.total_tapitas = firebase.firestore.FieldValue.increment(-donationData.quantity);
        }
        
        await userRef.update(updates);
        
        console.log('✅ Donación eliminada de Firestore');
        return true;
    } catch (error) {
        console.error('❌ Error al eliminar donación:', error);
        throw error;
    }
}

// ============================================
// FUNCIONES DE UI
// ============================================

/**
 * Agrega una nueva donación
 */
async function addDonation(event) {
    event.preventDefault();
    
    const type = document.getElementById('donationType').value;
    const quantity = document.getElementById('donationQuantity').value;
    const date = document.getElementById('donationDate').value;
    const notes = document.getElementById('donationNotes').value;
    
    // Validar cantidad según tipo
    const config = donationConfig[type];
    if (config.requiresQuantity && (!quantity || quantity <= 0)) {
        alert('Por favor ingresa una cantidad válida');
        return;
    }
    
    // Validación especial para cabello (mínimo 30cm)
    if (type === 'cabello' && quantity < 30) {
        alert('⚠️ La longitud mínima para donar cabello es de 30 cm');
        return;
    }
    
    const donation = {
        type: type,
        quantity: quantity || 1,
        date: date,
        notes: notes
    };
    
    try {
        // Mostrar indicador de carga
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '⏳ Guardando...';
        submitBtn.disabled = true;
        
        // Guardar en Firestore
        await saveDonationToFirestore(donation);
        
        // Recargar donaciones
        await loadDonationsFromFirestore();
        
        // Limpiar formulario
        document.getElementById('donationForm').reset();
        document.getElementById('quantityField').style.display = 'none';
        
        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Mostrar mensaje de éxito
        alert('✅ ¡Donación registrada exitosamente en la base de datos!');
    } catch (error) {
        alert('❌ Error al guardar la donación. Por favor intenta de nuevo.');
        console.error(error);
        
        // Restaurar botón en caso de error
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '✅ Registrar Donación';
        submitBtn.disabled = false;
    }
}

/**
 * Renderiza la lista de donaciones
 */
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
    
    list.innerHTML = donations.map(d => {
        const config = donationConfig[d.type];
        const quantityText = config ? `${d.quantity} ${config.unit}` : d.quantity;
        
        return `
        <div style="background: white; padding: 15px; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid var(--pink-accent); display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                    <span style="font-size: 24px;">${typeIcons[d.type]}</span>
                    <strong style="color: var(--lila-dark);">${typeNames[d.type]}</strong>
                    <span style="background: var(--pink-accent); color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px;">${quantityText}</span>
                </div>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">📅 ${new Date(d.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <button onclick="deleteDonation('${d.id}')" style="background: #ff5252; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 12px;">🗑️ Eliminar</button>
        </div>
    `}).join('');
}

/**
 * Elimina una donación
 */
async function deleteDonation(id) {
    if (!confirm('¿Estás seguro de eliminar esta donación?')) {
        return;
    }
    
    try {
        await deleteDonationFromFirestore(id);
        await loadDonationsFromFirestore();
        alert('✅ Donación eliminada correctamente');
    } catch (error) {
        alert('❌ Error al eliminar la donación. Por favor intenta de nuevo.');
        console.error(error);
    }
}

/**
 * Carga las donaciones (llamada desde firebase-config.js)
 */
function loadDonations() {
    loadDonationsFromFirestore();
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const typeSelect = document.getElementById('donationType');
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            const quantityField = document.getElementById('quantityField');
            const quantityInput = document.getElementById('donationQuantity');
            const quantityLabel = document.getElementById('quantityLabel');
            const quantityHint = document.getElementById('quantityHint');
            
            const config = donationConfig[this.value];
            
            if (config && config.requiresQuantity) {
                quantityField.style.display = 'block';
                quantityInput.required = true;
                quantityLabel.textContent = config.label;
                quantityInput.placeholder = config.placeholder;
                quantityHint.textContent = config.hint;
                
                // Configurar validación mínima para cabello
                if (this.value === 'cabello') {
                    quantityInput.min = 30;
                } else {
                    quantityInput.min = 1;
                }
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

// Made with Bob
