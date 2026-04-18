// Almacenamiento de donaciones (local)
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
    
    // Si se muestra la sección de Mis Donaciones, inicializar el formulario
    if (id === 'mis-donaciones') {
        // Usar setTimeout para asegurar que el DOM esté listo
        setTimeout(() => {
            initializeDonationForm();
        }, 100);
    }
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

/**
 * Actualiza la visualización del slider de cabello
 */
function updateHairLength(value) {
    const length = parseInt(value);
    const display = document.getElementById('hairLengthValue');
    const message = document.getElementById('hairMessage');
    const progress = document.getElementById('hairProgress');
    
    // Actualizar valor
    display.textContent = length;
    
    // Actualizar barra de progreso (60cm = 100%)
    const progressPercent = (length / 60) * 100;
    progress.style.width = progressPercent + '%';
    
    // Mensajes motivacionales según la longitud
    const messages = {
        0: {
            text: "🤔 Desliza para comenzar a medir",
            class: ""
        },
        10: {
            text: "📏 Aún muy corto... ¡Sigue creciendo!",
            class: "not-enough"
        },
        20: {
            text: "💪 ¡Vas por buen camino! Necesitas al menos 30 cm",
            class: "almost"
        },
        30: {
            text: "✅ ¡Perfecto! Ya puedes donar y ayudar a alguien",
            class: "good"
        },
        40: {
            text: "🌟 ¡Excelente longitud! Tu donación será muy valiosa",
            class: "good"
        },
        50: {
            text: "💝 ¡Increíble! Podrás hacer una peluca completa",
            class: "excellent"
        },
        60: {
            text: "🎉 ¡Máximo alcanzado! Tu generosidad cambiará vidas",
            class: "excellent"
        }
    };
    
    const messageData = messages[length];
    if (messageData) {
        message.textContent = messageData.text;
        message.className = 'hair-message ' + messageData.class;
    }
}

// ============================================
// FUNCIONES DE FIRESTORE
// ============================================

/**
 * Actualiza las métricas globales de la comunidad
 */
async function updateCommunityStats(donationType, quantity, isDelete = false) {
    const statsRef = db.collection('donaciones_totales').doc('stats');
    
    try {
        // Validar que la cantidad sea positiva
        if (quantity <= 0) {
            console.warn('⚠️ Cantidad inválida para actualizar estadísticas:', quantity);
            return;
        }
        
        const increment = isDelete ? -quantity : quantity;
        const fieldMap = {
            'tapitas': 'total_tapitas',
            'sangre': 'total_sangre',
            'cabello': 'total_cabello',
            'silla': 'total_sillas',
            'muletas': 'total_muletas',
            'medicamento': 'total_medicamento'
        };
        
        const field = fieldMap[donationType];
        if (!field) {
            console.warn('⚠️ Tipo de donación no reconocido:', donationType);
            return;
        }
        
        // Verificar si el documento existe
        const statsDoc = await statsRef.get();
        
        if (!statsDoc.exists) {
            // Crear documento inicial con todos los campos en 0
            console.log('📝 Creando documento de estadísticas globales...');
            await statsRef.set({
                total_tapitas: 0,
                total_sangre: 0,
                total_cabello: 0,
                total_sillas: 0,
                total_muletas: 0,
                total_medicamento: 0,
                last_updated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Si es eliminación, verificar que no resulte en valores negativos
        if (isDelete) {
            const currentStats = await statsRef.get();
            if (currentStats.exists) {
                const currentValue = currentStats.data()[field] || 0;
                if (currentValue - quantity < 0) {
                    console.warn(`⚠️ No se puede restar ${quantity} de ${field}, valor actual: ${currentValue}`);
                    // Ajustar a 0 en lugar de negativo
                    await statsRef.update({
                        [field]: 0,
                        last_updated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    return;
                }
            }
        }
        
        // Actualizar el campo específico
        await statsRef.update({
            [field]: firebase.firestore.FieldValue.increment(increment),
            last_updated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ Estadísticas globales actualizadas: ${field} ${isDelete ? '-' : '+'}${quantity}`);
    } catch (error) {
        console.error('❌ Error al actualizar estadísticas globales:', error.message);
        // No lanzar error para no bloquear la donación
    }
}

/**
 * Carga y muestra las estadísticas globales de la comunidad
 */
async function loadCommunityStats() {
    try {
        console.log('📊 Cargando estadísticas de la comunidad...');
        
        const statsDoc = await db.collection('donaciones_totales').doc('stats').get();
        
        if (statsDoc.exists) {
            const data = statsDoc.data();
            
            document.getElementById('communityTapitas').textContent =
                (data.total_tapitas || 0).toLocaleString();
            document.getElementById('communitySangre').textContent =
                (data.total_sangre || 0).toLocaleString();
            document.getElementById('communityCabello').textContent =
                (data.total_cabello || 0).toLocaleString();
            document.getElementById('communitySillas').textContent =
                (data.total_sillas || 0).toLocaleString();
            document.getElementById('communityMuletas').textContent =
                (data.total_muletas || 0).toLocaleString();
            document.getElementById('communityMedicamento').textContent =
                (data.total_medicamento || 0).toLocaleString();
            
            console.log('✅ Estadísticas de la comunidad cargadas');
        } else {
            console.log('ℹ️ No hay estadísticas globales aún');
            // Mostrar ceros
            document.getElementById('communityTapitas').textContent = '0';
            document.getElementById('communitySangre').textContent = '0';
            document.getElementById('communityCabello').textContent = '0';
            document.getElementById('communitySillas').textContent = '0';
            document.getElementById('communityMuletas').textContent = '0';
            document.getElementById('communityMedicamento').textContent = '0';
        }
    } catch (error) {
        console.error('❌ Error al cargar estadísticas de la comunidad:', error.message);
        // Mostrar ceros en caso de error
        document.getElementById('communityTapitas').textContent = '0';
        document.getElementById('communitySangre').textContent = '0';
        document.getElementById('communityCabello').textContent = '0';
        document.getElementById('communitySillas').textContent = '0';
        document.getElementById('communityMuletas').textContent = '0';
        document.getElementById('communityMedicamento').textContent = '0';
    }
}

/**
 * Genera un ID de donación en formato ddmmyyhhmmss_userId
 */
function generateDonationId(userId) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${day}${month}${year}${hours}${minutes}${seconds}_${userId}`;
}

/**
 * Guarda una donación en Firestore
 */
async function saveDonationToFirestore(donation) {
    const user = firebase.auth().currentUser;
    if (!user) {
        const error = new Error('No hay usuario autenticado');
        console.error('❌', error.message);
        throw error;
    }
    
    try {
        // Crear ID único en formato ddmmyyhhmmss_userId
        const donationId = generateDonationId(user.uid);
        
        // Validar datos antes de guardar
        if (!donation.type || !donation.date) {
            throw new Error('Datos de donación incompletos');
        }
        
        const quantity = parseInt(donation.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            throw new Error('Cantidad inválida: debe ser mayor a 0');
        }
        
        // Validación adicional para cabello
        if (donation.type === 'cabello' && (quantity < 30 || quantity > 60)) {
            throw new Error('Longitud de cabello inválida: debe estar entre 30 y 60 cm');
        }
        
        // Guardar en colección /donations
        await db.collection('donations').doc(donationId).set({
            user_id: user.uid,
            type: donation.type,
            quantity: quantity,
            date: donation.date,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Actualizar estadísticas del usuario en /users/{user_id}
        await updateUserStats(user.uid, donation.type, quantity);
        
        // Actualizar estadísticas globales de la comunidad
        await updateCommunityStats(donation.type, quantity, false);
        
        console.log('✅ Donación guardada en Firestore:', donationId);
        return donationId;
    } catch (error) {
        console.error('❌ Error al guardar donación:', error.message);
        
        // Mensajes de error más específicos
        if (error.code === 'permission-denied') {
            throw new Error('No tienes permisos para guardar donaciones. Verifica las reglas de Firestore.');
        } else if (error.code === 'unavailable') {
            throw new Error('No se puede conectar a Firestore. Verifica tu conexión a internet.');
        } else if (error.code === 'not-found') {
            throw new Error('La colección de Firestore no existe. Verifica la configuración.');
        }
        
        throw error;
    }
}

/**
 * Actualiza las estadísticas del usuario
 */
async function updateUserStats(userId, donationType, quantity) {
    if (!userId) {
        throw new Error('ID de usuario no proporcionado');
    }
    
    const userRef = db.collection('users').doc(userId);
    
    try {
        const userDoc = await userRef.get();
        const user = firebase.auth().currentUser;
        
        if (!user) {
            throw new Error('Usuario no autenticado');
        }
        
        if (!userDoc.exists) {
            // Crear documento de usuario si no existe
            console.log('📝 Creando perfil de usuario en Firestore...');
            await userRef.set({
                name: user.displayName || 'Usuario',
                email: user.email || '',
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
        console.error('❌ Error al actualizar estadísticas:', error.message);
        
        if (error.code === 'permission-denied') {
            throw new Error('No tienes permisos para actualizar tu perfil. Verifica las reglas de Firestore.');
        } else if (error.code === 'not-found') {
            throw new Error('No se pudo encontrar el documento del usuario.');
        }
        
        throw error;
    }
}

/**
 * Carga las donaciones del usuario desde Firestore
 */
async function loadDonationsFromFirestore() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.warn('⚠️ No hay usuario autenticado para cargar donaciones');
        return;
    }
    
    try {
        console.log('📥 Cargando donaciones desde Firestore...');
        
        const snapshot = await db.collection('donations')
            .where('user_id', '==', user.uid)
            .orderBy('timestamp', 'desc')
            .get();
        
        if (snapshot.empty) {
            console.log('ℹ️ No se encontraron donaciones para este usuario');
            donations = [];
        } else {
            donations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convertir timestamp de Firestore a fecha
                date: doc.data().date || new Date().toISOString().split('T')[0]
            }));
            console.log(`✅ ${donations.length} donaciones cargadas desde Firestore`);
        }
        
        renderDonations();
        await updateStatsFromFirestore();
        
    } catch (error) {
        console.error('❌ Error al cargar donaciones:', error.message);
        
        if (error.code === 'permission-denied') {
            alert('⚠️ No tienes permisos para ver las donaciones. Verifica las reglas de Firestore.');
        } else if (error.code === 'failed-precondition') {
            console.error('⚠️ Necesitas crear un índice en Firestore. Revisa la consola de Firebase.');
            alert('⚠️ Se necesita configurar un índice en Firestore. Revisa la consola del navegador para más detalles.');
        } else if (error.code === 'unavailable') {
            alert('⚠️ No se puede conectar a Firestore. Verifica tu conexión a internet.');
        } else {
            alert('⚠️ Error al cargar donaciones. Revisa la consola para más detalles.');
        }
        
        // Mostrar lista vacía en caso de error
        donations = [];
        renderDonations();
    }
}

/**
 * Actualiza las estadísticas desde Firestore
 */
async function updateStatsFromFirestore() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.warn('⚠️ No hay usuario autenticado para actualizar estadísticas');
        return;
    }
    
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            document.getElementById('totalTapitas').textContent =
                (userData.total_tapitas || 0).toLocaleString();
        } else {
            console.log('ℹ️ Perfil de usuario no encontrado, se creará con la primera donación');
            document.getElementById('totalTapitas').textContent = '0';
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
        console.error('❌ Error al actualizar estadísticas:', error.message);
        
        // Mostrar valores por defecto en caso de error
        document.getElementById('totalTapitas').textContent = '0';
        document.getElementById('totalSangre').textContent = '0';
        document.getElementById('totalOtros').textContent = '0';
    }
}

/**
 * Elimina una donación de Firestore
 */
async function deleteDonationFromFirestore(donationId) {
    if (!donationId) {
        throw new Error('ID de donación no proporcionado');
    }
    
    const user = firebase.auth().currentUser;
    if (!user) {
        throw new Error('No hay usuario autenticado');
    }
    
    try {
        console.log('🗑️ Eliminando donación:', donationId);
        
        const donationDoc = await db.collection('donations').doc(donationId).get();
        
        if (!donationDoc.exists) {
            throw new Error('Donación no encontrada en la base de datos');
        }
        
        const donationData = donationDoc.data();
        
        // Verificar que el usuario sea el dueño
        if (donationData.user_id !== user.uid) {
            throw new Error('No tienes permiso para eliminar esta donación');
        }
        
        // Eliminar de Firestore
        await db.collection('donations').doc(donationId).delete();
        
        // Actualizar estadísticas del usuario (restar)
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const updates = {
                total_donations: firebase.firestore.FieldValue.increment(-1)
            };
            
            if (donationData.type === 'tapitas') {
                updates.total_tapitas = firebase.firestore.FieldValue.increment(-donationData.quantity);
            }
            
            await userRef.update(updates);
        } else {
            console.warn('⚠️ Perfil de usuario no encontrado, no se actualizaron estadísticas');
        }
        
        // Actualizar estadísticas globales de la comunidad (restar)
        await updateCommunityStats(donationData.type, donationData.quantity, true);
        
        console.log('✅ Donación eliminada de Firestore');
        return true;
    } catch (error) {
        console.error('❌ Error al eliminar donación:', error.message);
        
        if (error.code === 'permission-denied') {
            throw new Error('No tienes permisos para eliminar esta donación. Verifica las reglas de Firestore.');
        } else if (error.code === 'not-found') {
            throw new Error('La donación no existe o ya fue eliminada.');
        } else if (error.code === 'unavailable') {
            throw new Error('No se puede conectar a Firestore. Verifica tu conexión a internet.');
        }
        
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
    
    // Validar que haya un tipo seleccionado
    if (!type) {
        alert('⚠️ Por favor selecciona un tipo de donación');
        return;
    }
    
    // Validar fecha
    if (!date) {
        alert('⚠️ Por favor selecciona una fecha');
        return;
    }
    
    // Validar cantidad según tipo
    const config = donationConfig[type];
    if (config && config.requiresQuantity) {
        const numQuantity = parseInt(quantity);
        
        // Validar que sea un número válido y positivo
        if (!quantity || isNaN(numQuantity) || numQuantity <= 0) {
            alert('⚠️ Por favor ingresa una cantidad válida (mayor a 0)');
            return;
        }
        
        // Validación especial para cabello (mínimo 30cm, máximo 60cm)
        if (type === 'cabello') {
            if (numQuantity < 30) {
                alert('⚠️ La longitud mínima para donar cabello es de 30 cm');
                return;
            }
            if (numQuantity > 60) {
                alert('⚠️ La longitud máxima permitida es de 60 cm. Si tu cabello es más largo, puedes registrar 60 cm.');
                return;
            }
        }
        
        // Validación para evitar cantidades excesivamente grandes (posible error de entrada)
        if (numQuantity > 1000000) {
            alert('⚠️ La cantidad ingresada parece demasiado grande. Por favor verifica.');
            return;
        }
    }
    
    const donation = {
        type: type,
        quantity: quantity || 1,
        date: date,
        notes: notes
    };
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Mostrar indicador de carga
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
        console.error('❌ Error completo:', error);
        
        // Mensajes de error más específicos
        let errorMessage = '❌ Error al guardar la donación.\n\n';
        
        if (error.message.includes('permisos') || error.message.includes('permission')) {
            errorMessage += 'Problema de permisos en Firestore. Verifica las reglas de seguridad.';
        } else if (error.message.includes('conexión') || error.message.includes('unavailable')) {
            errorMessage += 'No se puede conectar a la base de datos. Verifica tu conexión a internet.';
        } else if (error.message.includes('autenticado') || error.message.includes('auth')) {
            errorMessage += 'Sesión expirada. Por favor cierra sesión y vuelve a iniciar.';
        } else if (error.message.includes('incompletos') || error.message.includes('inválida')) {
            errorMessage += error.message;
        } else {
            errorMessage += 'Por favor intenta de nuevo. Si el problema persiste, revisa la consola del navegador.';
        }
        
        alert(errorMessage);
        
        // Restaurar botón en caso de error
        submitBtn.innerHTML = originalText;
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
        console.error('❌ Error completo:', error);
        
        // Mensajes de error más específicos
        let errorMessage = '❌ Error al eliminar la donación.\n\n';
        
        if (error.message.includes('no encontrada') || error.message.includes('not found')) {
            errorMessage += 'La donación no existe o ya fue eliminada.';
        } else if (error.message.includes('permiso') || error.message.includes('permission')) {
            errorMessage += 'No tienes permisos para eliminar esta donación.';
        } else if (error.message.includes('conexión') || error.message.includes('unavailable')) {
            errorMessage += 'No se puede conectar a la base de datos. Verifica tu conexión a internet.';
        } else {
            errorMessage += 'Por favor intenta de nuevo. Si el problema persiste, revisa la consola del navegador.';
        }
        
        alert(errorMessage);
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

/**
 * Inicializa el formulario de donaciones
 */
function initializeDonationForm() {
    const typeSelect = document.getElementById('donationType');
    if (typeSelect) {
        // Remover listener anterior si existe
        typeSelect.removeEventListener('change', handleDonationTypeChange);
        // Agregar nuevo listener
        typeSelect.addEventListener('change', handleDonationTypeChange);
        
        // Si ya hay un tipo seleccionado, mostrar el campo de cantidad
        if (typeSelect.value) {
            handleDonationTypeChange({ target: typeSelect });
        }
    }
    
    // Establecer fecha de hoy por defecto
    const dateInput = document.getElementById('donationDate');
    if (dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
    }
}

/**
 * Maneja el cambio de tipo de donación
 */
function handleDonationTypeChange(event) {
    const quantityField = document.getElementById('quantityField');
    const quantityInput = document.getElementById('donationQuantity');
    const quantityLabel = document.getElementById('quantityLabel');
    const quantityHint = document.getElementById('quantityHint');
    
    const selectedType = event.target.value;
    const config = donationConfig[selectedType];
    
    if (selectedType && config && config.requiresQuantity) {
        // Mostrar y habilitar el campo
        quantityField.style.display = 'block';
        quantityInput.disabled = false;
        quantityInput.required = true;
        quantityLabel.textContent = config.label;
        quantityInput.placeholder = config.placeholder;
        quantityHint.textContent = config.hint;
        
        // Configurar validación mínima para cabello
        if (selectedType === 'cabello') {
            quantityInput.min = 30;
            quantityInput.max = 60;
        } else {
            quantityInput.min = 1;
            quantityInput.max = 1000000;
        }
    } else if (!selectedType) {
        // Si no hay tipo seleccionado, mostrar pero deshabilitar
        quantityField.style.display = 'block';
        quantityInput.disabled = true;
        quantityInput.required = false;
        quantityInput.value = '';
        quantityLabel.textContent = 'Cantidad';
        quantityInput.placeholder = 'Primero selecciona un tipo de donación';
        quantityHint.textContent = 'Selecciona un tipo de donación para habilitar este campo';
    } else {
        // Tipo que no requiere cantidad
        quantityField.style.display = 'none';
        quantityInput.required = false;
        quantityInput.value = '';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar formulario de donaciones
    initializeDonationForm();
    
    // Cargar estadísticas de la comunidad al iniciar
    loadCommunityStats();
});
