const firebaseConfig = {
  apiKey: "AIzaSyBLmwonD8wBMZLtdQLaq6QpB_8eHOaEBI0",
  authDomain: "oasis-gdl.firebaseapp.com",
  projectId: "oasis-gdl",
  storageBucket: "oasis-gdl.firebasestorage.app",
  messagingSenderId: "220105308763",
  appId: "1:220105308763:web:67f08d0d646dff68399d7e",
  measurementId: "G-DEZRR8MJDM"

};


// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Configurar el proveedor de Google
const googleProvider = new firebase.auth.GoogleAuthProvider();

/**
 * Inicia sesión con Google
 */
function loginWithGoogle() {
    auth.signInWithPopup(googleProvider)
        .then((result) => {
            console.log('Usuario autenticado:', result.user);
        })
        .catch((error) => {
            console.error('Error al iniciar sesión:', error);
            alert('Error al iniciar sesión: ' + error.message);
        });
}

/**
 * Cierra la sesión del usuario
 */
function logout() {
    auth.signOut()
        .then(() => {
            console.log('Sesión cerrada');
        })
        .catch((error) => {
            console.error('Error al cerrar sesión:', error);
        });
}

/**
 * Observador del estado de autenticación
 */
auth.onAuthStateChanged((user) => {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userPhoto = document.getElementById('userPhoto');
    
    // Elementos del sidebar
    const sidebarUserInfo = document.getElementById('sidebarUserInfo');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserPhoto = document.getElementById('sidebarUserPhoto');
    const misDonacionesBtn = document.getElementById('misDonacionesBtn');

    if (user) {
        // Usuario autenticado
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        userName.textContent = user.displayName || 'Usuario';
        userEmail.textContent = user.email;
        userPhoto.src = user.photoURL || 'https://via.placeholder.com/50';
        
        // Mostrar info en sidebar
        if (sidebarUserInfo) {
            sidebarUserInfo.style.display = 'flex';
            sidebarUserName.textContent = user.displayName || 'Usuario';
            sidebarUserPhoto.src = user.photoURL || 'https://via.placeholder.com/50';
        }
        
        // Mostrar botón de Mis Donaciones
        if (misDonacionesBtn) {
            misDonacionesBtn.style.display = 'flex';
        }
        
        // Cargar donaciones del usuario
        if (typeof loadDonations === 'function') {
            loadDonations();
        }
        
        // Cargar estadísticas de la comunidad
        if (typeof loadCommunityStats === 'function') {
            loadCommunityStats();
        }
    } else {
        // Usuario no autenticado
        loginBtn.style.display = 'flex';
        userInfo.style.display = 'none';
        
        // Ocultar info en sidebar
        if (sidebarUserInfo) {
            sidebarUserInfo.style.display = 'none';
        }
        
        // Ocultar botón de Mis Donaciones
        if (misDonacionesBtn) {
            misDonacionesBtn.style.display = 'none';
        }
    }
});

