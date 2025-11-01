// ===========================
// CONFIGURACIÓN DEL BACKEND
// ===========================

const BACKEND_CONFIG = {
    BASE_URL: 'http://localhost:8080',
    ENDPOINTS: {
        VALIDATE_CUIT: '/publico/empresas/existe/',
        REGISTER_COMPANY: '/publico/empresas/registro',
        LOGIN: '/publico/login',
        PROFILE: '/privado/empresas/perfil',
        // Endpoints para fincas/establecimientos
        REGISTER_FINCA: '/privado/establecimientos/registro',
        GET_ESTABLECIMIENTOS: '/privado/establecimientos',
        DEPARTAMENTOS: '/publico/departamentos',
        DISTRITOS: '/publico/distritos',
        ESPECIES: '/privado/especies',
        // Endpoints públicos para ofertas de empleo
        OFERTAS_PUBLICAS: '/publico/ofertas-empleo/vigentes',
        // Endpoints para manejo de tokens JWT
        REFRESH_TOKEN: '/publico/refresh',
        VALIDATE_TOKEN: '/privado/auth/validate',
        USER_PERMISSIONS: '/privado/user/permissions'
    },
    TIMEOUTS: {
        VALIDATION: 5000,
        REGISTRATION: 10000,
        LOGIN: 5000,
        PROFILE: 5000,
        TOKEN_REFRESH: 3000
    },
    DEVELOPMENT_MODE: true
};

// Configuración de autenticación
const AUTH_CONFIG = {
    endpoints: {
        login: '/publico/login',
    },
    storage: {
        tokenKey: 'cepas_lab_token',
        userKey: 'cepas_lab_user'
    },
    routes: {
        login: 'index.html'
    }
};

// Función para construir URLs del backend
function buildURL(endpoint, parameter = '') {
    return `${BACKEND_CONFIG.BASE_URL}${endpoint}${parameter}`;
}

// Función para realizar peticiones con configuración centralizada
async function fetchWithConfig(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
    };
    
    return fetch(url, { ...defaultOptions, ...options });
}

// Función para realizar peticiones autenticadas
async function fetchWithAuth(url, options = {}) {
    const token = obtenerToken();
    if (!token) {
        console.error('❌ No hay token de autenticación disponible');
        throw new Error('No hay token de autenticación');
    }

    // Asegurar que el token tiene el formato correcto
    const tokenFormatted = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': tokenFormatted,
            'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
    };
    
    // Merge de opciones manteniendo headers existentes
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };

    // Log detallado de la petición
    console.log('🚀 Petición autenticada:', {
        url,
        method: mergedOptions.method || 'GET',
        headers: {
            ...mergedOptions.headers,
            'Authorization': 'Bearer [TOKEN OCULTO]'
        }
    });
    
    // Usar directamente la URL que se pasa, no construirla de nuevo
    return fetchWithConfig(url, mergedOptions);
}

// ===========================
// UTILIDADES DE FECHA
// ===========================

/**
 * Parsea una fecha de forma segura evitando problemas de zona horaria
 * @param {string|Date} fechaInput - Fecha en formato string "YYYY-MM-DD" o objeto Date
 * @returns {Date|null} Objeto Date parseado o null si es inválido
 */
function parsearFechaSegura(fechaInput) {
    if (!fechaInput) return null;
    
    // Si ya es un objeto Date válido, devolverlo
    if (fechaInput instanceof Date && !isNaN(fechaInput.getTime())) {
        return fechaInput;
    }
    
    // Si es string en formato ISO "YYYY-MM-DD", parsear manualmente
    if (typeof fechaInput === 'string' && fechaInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = fechaInput.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Para otros formatos, usar el constructor Date normal
    const fecha = new Date(fechaInput);
    return isNaN(fecha.getTime()) ? null : fecha;
}

/**
 * Formatea una fecha en formato argentino DD/MM/YYYY
 * @param {string|Date} fechaInput - Fecha a formatear
 * @returns {string} Fecha formateada o 'No especificada'
 */
function formatearFechaArgentina(fechaInput) {
    const fecha = parsearFechaSegura(fechaInput);
    if (!fecha) return 'No especificada';
    
    return fecha.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// ===========================
// FUNCIONES DE NOTIFICACIONES
// ===========================

/**
 * Muestra un mensaje toast al usuario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje: 'success', 'error', 'warning', 'info'
 */
function showMessage(message, type = 'info') {
    const toastTypes = {
        success: { class: 'bg-success', icon: 'fas fa-check-circle' },
        error: { class: 'bg-danger', icon: 'fas fa-exclamation-circle' },
        warning: { class: 'bg-warning text-dark', icon: 'fas fa-exclamation-triangle' },
        info: { class: 'bg-primary', icon: 'fas fa-info-circle' }
    };

    const toastConfig = toastTypes[type] || toastTypes.info;

    const toastHtml = `
        <div class="toast align-items-center text-white ${toastConfig.class} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="${toastConfig.icon} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    // Crear o obtener contenedor de toasts
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    // Crear elemento toast
    const toastElement = document.createElement('div');
    toastElement.innerHTML = toastHtml;
    const toast = toastElement.firstElementChild;
    
    toastContainer.appendChild(toast);

    // Inicializar y mostrar toast
    const bsToast = new bootstrap.Toast(toast, { delay: 5000 });
    bsToast.show();

    // Limpiar después de ocultar
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

// ===========================
// FUNCIONES PARA OFERTAS LABORALES
// ===========================

/**
 * Cargar puestos de trabajo desde la API
 * @returns {Promise<Array>} Lista de puestos de trabajo
 */
async function cargarPuestosTrabajo() {
    try {
        console.log('🔄 Cargando puestos de trabajo...');
        const response = await fetchWithAuth('http://localhost:8080/privado/puestos-trabajo');
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expirado. Por favor, inicie sesión nuevamente.');
            }
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const puestos = await response.json();
        console.log('✅ Puestos de trabajo cargados:', puestos);
        return puestos || [];
    } catch (error) {
        console.error('❌ Error al cargar puestos de trabajo:', error);
        showMessage('Error al cargar puestos de trabajo: ' + error.message, 'error');
        return [];
    }
}

/**
 * Cargar especies desde la API para ofertas laborales
 * @returns {Promise<Array>} Lista de especies
 */
async function cargarEspeciesParaOfertas() {
    try {
        console.log('🔄 Cargando especies para ofertas...');
        const response = await fetchWithAuth('http://localhost:8080/privado/especies');
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expirado. Por favor, inicie sesión nuevamente.');
            }
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const especies = await response.json();
        console.log('✅ Especies cargadas para ofertas:', especies);
        return especies || [];
    } catch (error) {
        console.error('❌ Error al cargar especies para ofertas:', error);
        showMessage('Error al cargar especies: ' + error.message, 'error');
        return [];
    }
}

/**
 * Enviar nueva oferta laboral a la API
 * @param {Object} ofertaData - Datos de la oferta laboral
 * @returns {Promise<Object>} Respuesta del servidor
 */
async function enviarOfertaLaboral(ofertaData) {
    try {
        console.log('🚀 Enviando oferta laboral:', ofertaData);
        
        const response = await fetchWithAuth('http://localhost:8080/privado/ofertas-empleo/registro', {
            method: 'POST',
            body: JSON.stringify(ofertaData)
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expirado. Por favor, inicie sesión nuevamente.');
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error HTTP: ${response.status}`);
        }
        
        const resultado = await response.json();
        console.log('✅ Oferta laboral creada exitosamente:', resultado);
        return resultado;
    } catch (error) {
        console.error('❌ Error al enviar oferta laboral:', error);
        throw error;
    }
}

// ===========================
// NAVEGACIÓN AL DASHBOARD
// ===========================

/**
 * Abre el dashboard del usuario con todos sus datos
 */
async function abrirDashboardUsuario() {
    console.log('🎯 Abriendo dashboard del usuario...');
    
    try {
        // Verificar autenticación
        const tokenValid = validateCurrentToken();
        if (!tokenValid) {
            console.error('❌ Token inválido al abrir dashboard');
            mostrarErrorLogin('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
            cerrarSesion();
            return;
        }

        // Mostrar estado de carga en el offcanvas
        const dashboardOffcanvas = document.getElementById('dashboardOffcanvas');
        const dashboardContent = document.getElementById('dashboard-content');
        
        if (!dashboardOffcanvas || !dashboardContent) {
            console.error('❌ Elementos del dashboard no encontrados');
            return;
        }

        // Mostrar loading en el dashboard
        dashboardContent.innerHTML = `
            <div class="loading-container d-flex justify-content-center align-items-center" style="min-height: 400px;">
                <div class="text-center">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <h6 class="text-white">Cargando su perfil...</h6>
                </div>
            </div>
        `;

        // Abrir el offcanvas
        const bsOffcanvas = new bootstrap.Offcanvas(dashboardOffcanvas);
        bsOffcanvas.show();

        // Cargar datos del perfil
        console.log('📊 Cargando datos del perfil...');
        const perfil = await cargarPerfilEmpresa();
        
        console.log('🔍 Verificando datos del perfil recibidos:', {
            existe: !!perfil,
            tipo: typeof perfil,
            propiedades: perfil ? Object.keys(perfil) : 'N/A'
        });
        
        if (!perfil) {
            console.error('❌ No se pudo cargar el perfil de la empresa');
            dashboardContent.innerHTML = `
                <div class="error-state text-center py-5">
                    <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
                    <h6 class="text-white mb-3">Error cargando perfil</h6>
                    <p class="text-muted mb-4">No se pudieron cargar los datos de su perfil.</p>
                    <button class="btn btn-outline-primary" onclick="abrirDashboardUsuario()">
                        <i class="fas fa-redo me-2"></i>Reintentar
                    </button>
                </div>
            `;
            return;
        }

        // Generar contenido del dashboard
        console.log('🎨 Generando dashboard con datos del perfil...');
        console.log('📋 Datos del perfil para dashboard:', {
            idEmpresa: perfil.idEmpresa,
            razonSocial: perfil.razonSocial,
            cuit: perfil.cuit,
            fechaAlta: perfil.fechaAlta
        });
        generarDashboard(perfil);

        console.log('✅ Dashboard del usuario abierto correctamente');

    } catch (error) {
        console.error('❌ Error abriendo dashboard del usuario:', error);
        
        // Mostrar error en el dashboard
        const dashboardContent = document.getElementById('dashboard-content');
        if (dashboardContent) {
            dashboardContent.innerHTML = `
                <div class="error-state text-center py-5">
                    <i class="fas fa-times-circle text-danger mb-3" style="font-size: 3rem;"></i>
                    <h6 class="text-white mb-3">Error del sistema</h6>
                    <p class="text-muted mb-4">${error.message || 'Error inesperado al cargar el dashboard'}</p>
                    <button class="btn btn-outline-primary" onclick="abrirDashboardUsuario()">
                        <i class="fas fa-redo me-2"></i>Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// ===========================
// FUNCIONES DE PERFIL DE EMPRESA
// ===========================

async function cargarPerfilEmpresa() {
    try {
        console.log('🔄 Cargando perfil de empresa...');
        
        const url = buildURL(BACKEND_CONFIG.ENDPOINTS.PROFILE);
        console.log('📡 URL del perfil:', url);
        
        const response = await fetchWithAuth(url);
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', response.headers);
        
        if (!response.ok) {
            if (response.status === 401) {
                console.error('❌ Token expirado o inválido');
                cerrarSesion();
                actualizarInterfazLogin(false);
                return;
            }
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const perfil = await response.json();
        console.log('✅ Perfil cargado:', perfil);

        // Almacenar datos del perfil
        localStorage.setItem('perfil_empresa', JSON.stringify(perfil));

        // Actualizar navbar con avatar
        actualizarInterfazLogin(true, perfil);

        // Retornar el perfil para que pueda ser usado por abrirDashboardUsuario
        return perfil;

    } catch (error) {
        console.error('❌ Error cargando perfil:', error);
        
        // Manejo granular de errores
        let tipoError = 'DESCONOCIDO';
        let mensajeUsuario = 'Error inesperado al cargar el perfil';
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            tipoError = 'CONEXION';
            mensajeUsuario = 'No se pudo conectar con el servidor. Verifique su conexión a internet.';
        } else if (error.message.includes('401')) {
            tipoError = 'AUTENTICACION';
            mensajeUsuario = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
        } else if (error.message.includes('403')) {
            tipoError = 'AUTORIZACION';
            mensajeUsuario = 'No tiene permisos para acceder a esta información.';
        } else if (error.message.includes('404')) {
            tipoError = 'NO_ENCONTRADO';
            mensajeUsuario = 'No se encontró información de perfil para su empresa.';
        } else if (error.message.includes('500')) {
            tipoError = 'SERVIDOR';
            mensajeUsuario = 'Error interno del servidor. Inténtelo más tarde.';
        }
        
        console.error(`🔍 Tipo de error identificado: ${tipoError}`);
        mostrarErrorPerfil(mensajeUsuario);
        
        // No retornar nada en caso de error
        return null;
    }
}

function actualizarPerfilUI(perfil) {
    // Actualizar el header del dashboard
    const headerProfile = document.querySelector('.profile-header');
    if (headerProfile) {
        headerProfile.innerHTML = `
            <div class="profile-info">
                <h4 class="mb-0">${perfil.razonSocial}</h4>
                <p class="text-muted mb-2">CUIT: ${perfil.cuit}</p>
                <small class="text-muted">
                    <i class="fas fa-calendar-alt me-1"></i>
                    Miembro desde: ${new Date(perfil.fechaAlta).toLocaleDateString()}
                </small>
            </div>
        `;
    }

    // Actualizar sección de datos completos
    const profileSection = document.querySelector('.profile-details');
    if (profileSection) {
        profileSection.innerHTML = `
            <div class="card dashboard-card">
                <div class="card-body">
                    <h5 class="card-title mb-4">Datos de la Empresa</h5>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="text-muted small">ID Empresa</div>
                            <p class="mb-0">${perfil.idEmpresa}</p>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="text-muted small">CUIT</div>
                            <p class="mb-0">${perfil.cuit}</p>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="text-muted small">Razón Social</div>
                            <p class="mb-0">${perfil.razonSocial}</p>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="text-muted small">Fecha de Alta</div>
                            <p class="mb-0">${new Date(perfil.fechaAlta).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

function mostrarErrorPerfil(mensaje) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'alert alert-danger';
    errorContainer.textContent = `Error cargando perfil: ${mensaje}`;
    document.body.appendChild(errorContainer);
}

// Función para generar el contenido completo del dashboard
function generarDashboard(perfil) {
    console.log('🔄 Iniciando generación del dashboard...', perfil);
    const dashboardContent = document.getElementById('dashboard-content');
    console.log('📍 Dashboard content element:', dashboardContent);
    
    dashboardContent.innerHTML = `
        <style>
            .dashboard-container {
                background: #000000;
                color: #FFFFFF;
                min-height: 100vh;
                padding: 2rem;
            }
            .dashboard-card {
                background: #2A2A2A;
                border: 1px solid #444444;
                border-radius: 8px;
                color: #FFFFFF;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            }
            .btn-primary-custom {
                background: linear-gradient(135deg, #4A90E2, #357ABD);
                border: none;
                color: white;
                font-weight: 600;
                padding: 12px 24px;
                border-radius: 6px;
                transition: all 0.3s ease;
            }
            .btn-primary-custom:hover {
                background: linear-gradient(135deg, #357ABD, #2E6DA4);
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(74, 144, 226, 0.3);
            }
            .text-muted-custom {
                color: #CCCCCC !important;
            }
            .profile-header {
                background: linear-gradient(135deg, #4A90E2, #357ABD);
                border-radius: 8px;
                padding: 2rem;
                margin-bottom: 2rem;
                text-align: left;
                box-shadow: 0 8px 16px rgba(74, 144, 226, 0.2);
            }
            .company-details {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                padding: 1rem;
                margin: 1rem 0;
            }
            .company-details p {
                margin-bottom: 0.5rem !important;
                font-size: 0.95rem;
            }
            .company-status .badge {
                padding: 0.5rem 1rem;
                font-size: 0.85rem;
            }
            .stats-card {
                background: #2A2A2A;
                border: 1px solid #444444;
                border-radius: 8px;
                padding: 1.5rem;
                text-align: center;
                transition: transform 0.3s ease;
            }
            .stats-card:hover {
                transform: translateY(-5px);
            }
            .stats-number {
                font-size: 2.5rem;
                font-weight: bold;
                color: #4A90E2;
            }
            .empty-state {
                text-align: center;
                padding: 3rem;
                color: #CCCCCC;
            }
            .empty-state i {
                font-size: 4rem;
                color: #4A90E2;
                margin-bottom: 1rem;
            }
            /* Estilos para el mapa de establecimientos */
            .mapa-container {
                background: #2A2A2A;
                border: 1px solid #444444;
                border-radius: 8px;
                padding: 0;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            }
            #mapa-establecimientos {
                height: 400px;
                width: 100%;
                border-radius: 8px;
                z-index: 1;
            }
            .mapa-loading {
                height: 400px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #2A2A2A;
                border-radius: 8px;
                color: #FFFFFF;
            }
            .mapa-error {
                height: 400px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #2A2A2A;
                border-radius: 8px;
                color: #FFFFFF;
                text-align: center;
                padding: 2rem;
            }
            
            /* Estilos para controles de filtrado de ofertas */
            .ofertas-filter-controls {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .ofertas-filter-controls .btn-group .filter-btn {
                transition: all 0.3s ease;
                font-size: 0.875rem;
                font-weight: 500;
                padding: 0.375rem 0.75rem;
                border-radius: 6px !important;
                position: relative;
            }
            
            .ofertas-filter-controls .filter-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            }
            
            .ofertas-filter-controls .filter-btn.active {
                font-weight: 600;
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
            }
            
            .ofertas-filter-controls .filter-btn[data-filter="todas"].active {
                background-color: #4A90E2 !important;
                border-color: #4A90E2 !important;
                color: white !important;
            }
            
            .ofertas-filter-controls .filter-btn[data-filter="vigentes"].active {
                background-color: #27AE60 !important;
                border-color: #27AE60 !important;
                color: white !important;
            }
            
            .ofertas-filter-controls .filter-btn[data-filter="cerradas"].active {
                background-color: #6c757d !important;
                border-color: #6c757d !important;
                color: white !important;
            }
            
            /* Badge de estado para ofertas */
            .oferta-status-badge {
                font-size: 0.75rem;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-weight: 600;
            }
            
            .oferta-status-badge.vigente {
                background-color: rgba(39, 174, 96, 0.1);
                color: #27AE60;
                border: 1px solid #27AE60;
            }
            
            .oferta-status-badge.cerrada {
                background-color: rgba(108, 117, 125, 0.1);
                color: #6c757d;
                border: 1px solid #6c757d;
            }
            
            /* Loading state para filtros */
            .ofertas-filter-controls .filter-btn.loading {
                opacity: 0.6;
                pointer-events: none;
            }
            
            .ofertas-filter-controls .filter-btn.loading i {
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
        
        <div class="dashboard-container">
            <!-- Header del perfil con todos los datos de la empresa -->
            <div class="profile-header">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h3 class="mb-2">${perfil.razonSocial}</h3>
                        
                        <!-- Datos completos de la empresa -->
                        <div class="company-details mb-3">
                            <div class="row">
                                <div class="col-sm-6">
                                    <p class="mb-1 opacity-75">
                                        <i class="fas fa-id-card me-2"></i>
                                        <strong>ID Empresa:</strong> ${perfil.idEmpresa}
                                    </p>
                                    <p class="mb-1 opacity-75">
                                        <i class="fas fa-file-invoice me-2"></i>
                                        <strong>CUIT:</strong> ${perfil.cuit}
                                    </p>
                                </div>
                                <div class="col-sm-6">
                                    <p class="mb-1 opacity-75">
                                        <i class="fas fa-calendar-alt me-2"></i>
                                        <strong>Miembro desde:</strong> ${new Date(perfil.fechaAlta).toLocaleDateString()}
                                    </p>
                                    <p class="mb-1 opacity-75">
                                        <i class="fas fa-clock me-2"></i>
                                        <strong>Hora de registro:</strong> ${new Date(perfil.fechaAlta).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Badge de estado -->
                        <div class="company-status">
                            <span class="badge bg-success">
                                <i class="fas fa-check-circle me-1"></i>
                                Empresa Activa
                            </span>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="avatar-lg">
                            <i class="fas fa-building fa-3x"></i>
                        </div>
                        <div class="mt-2">
                            <small class="opacity-75">
                                <i class="fas fa-user-tie me-1"></i>
                                Perfil Empresarial
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats cards -->
            <div class="row mb-4">
                <div class="col-md-3 mb-3">
                    <div class="stats-card">
                        <div class="stats-number">0</div>
                        <div class="text-muted-custom">Fincas Registradas</div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="stats-card">
                        <div class="stats-number">0</div>
                        <div class="text-muted-custom">Ofertas Activas</div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="stats-card">
                        <div class="stats-number">0</div>
                        <div class="text-muted-custom">Trabajadores</div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="stats-card">
                        <div class="stats-number">0</div>
                        <div class="text-muted-custom">Solicitudes</div>
                    </div>
                </div>
            </div>

            <!-- Gestión de Fincas -->
            <div class="row">
                <div class="col-12">
                    <div class="dashboard-card p-4">
                        <h5 class="mb-4">
                            <i class="fas fa-clipboard-list me-2 text-primary"></i>
                            Gestión de Fincas
                        </h5>
                        <div class="empty-state" id="empty-fincas">
                            <i class="fas fa-plus-circle"></i>
                            <h6 class="text-muted-custom">No hay fincas registradas</h6>
                            <p class="text-muted-custom mb-4">Comienza agregando tu primera propiedad agrícola</p>
                            <button class="btn btn-primary-custom" onclick="abrirWizardFinca()">
                                <i class="fas fa-plus me-2"></i>Agregar Primera Finca
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mapa de Establecimientos -->
            <div class="row mt-4">
                <div class="col-12">
                    <div class="dashboard-card p-4">
                        <h5 class="mb-4">
                            <i class="fas fa-map-marked-alt me-2 text-info"></i>
                            Mapa de Establecimientos
                        </h5>
                        <div id="mapa-container" class="mapa-container">
                            <!-- Loading state -->
                            <div id="mapa-loading" class="mapa-loading">
                                <div class="text-center">
                                    <div class="spinner-border text-info mb-3" role="status">
                                        <span class="visually-hidden">Cargando...</span>
                                    </div>
                                    <h6 class="text-white">Cargando establecimientos...</h6>
                                    <p class="text-muted-custom mb-0">Preparando mapa interactivo</p>
                                </div>
                            </div>
                            <!-- Mapa (se mostrará cuando esté listo) -->
                            <div id="mapa-establecimientos" style="display: none;"></div>
                            <!-- Error state -->
                            <div id="mapa-error" class="mapa-error" style="display: none;">
                                <div>
                                    <i class="fas fa-map-marker-alt text-warning mb-3" style="font-size: 3rem;"></i>
                                    <h6 class="text-white mb-3">Error cargando mapa</h6>
                                    <p class="text-muted-custom mb-4">No se pudieron cargar los establecimientos en el mapa.</p>
                                    <button class="btn btn-outline-info" onclick="cargarMapaEstablecimientos()">
                                        <i class="fas fa-redo me-2"></i>Reintentar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Ofertas de Trabajo Disponibles -->
            <div class="row mt-4">
                <div class="col-12">
                    <div class="dashboard-card p-4">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h5 class="mb-0">
                                <i class="fas fa-briefcase me-2 text-info"></i>
                                Ofertas de Trabajo Disponibles
                            </h5>
                            
                            <!-- Controles de filtrado -->
                            <div class="ofertas-filter-controls">
                                <div class="btn-group" role="group" aria-label="Filtros de ofertas">
                                    <button type="button" 
                                            class="btn btn-outline-light btn-sm filter-btn" 
                                            id="filtro-todas"
                                            onclick="aplicarFiltroOfertas(null)"
                                            data-filter="todas">
                                        <i class="fas fa-list me-1"></i>Todas
                                    </button>
                                    <button type="button" 
                                            class="btn btn-outline-success btn-sm filter-btn" 
                                            id="filtro-vigentes"
                                            onclick="aplicarFiltroOfertas(true)"
                                            data-filter="vigentes">
                                        <i class="fas fa-check-circle me-1"></i>Vigentes
                                    </button>
                                    <button type="button" 
                                            class="btn btn-outline-secondary btn-sm filter-btn" 
                                            id="filtro-cerradas"
                                            onclick="aplicarFiltroOfertas(false)"
                                            data-filter="cerradas">
                                        <i class="fas fa-times-circle me-1"></i>Cerradas
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Estados visuales de la sección -->
                        <div id="ofertas-loading" class="ofertas-loading d-none">
                            <div class="text-center py-4">
                                <div class="spinner-border text-info mb-3" role="status">
                                    <span class="visually-hidden">Cargando...</span>
                                </div>
                                <h6 class="text-white">Cargando ofertas de trabajo...</h6>
                                <p class="text-muted-custom">Obteniendo ofertas disponibles</p>
                            </div>
                        </div>
                        
                        <div id="ofertas-content" class="ofertas-content">
                            <!-- Contenido dinámico se cargará aquí -->
                            <div class="text-center py-4">
                                <i class="fas fa-briefcase text-muted mb-3"></i>
                                <h6 class="text-white mb-3">Cargando ofertas...</h6>
                                <p class="text-muted-custom">Iniciando sistema de gestión de ofertas</p>
                            </div>
                        </div>
                        
                        <div id="ofertas-error" class="ofertas-error d-none">
                            <div class="text-center py-4">
                                <i class="fas fa-exclamation-triangle text-warning mb-3"></i>
                                <h6 class="text-white mb-3">Error cargando ofertas</h6>
                                <p class="text-muted-custom mb-4">No se pudieron cargar las ofertas de trabajo.</p>
                                <button class="btn btn-outline-info" onclick="cargarOfertasEmpleo()">
                                    <i class="fas fa-redo me-2"></i>Reintentar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Wizard Agregar Finca -->
        <div class="modal fade" id="wizardFincaModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content bg-dark text-white">
                    <div class="modal-header border-secondary">
                        <h5 class="modal-title">
                            <i class="fas fa-seedling me-2 text-success"></i>
                            Agregar Nueva Finca
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="wizard-content">
                        <!-- Contenido del wizard se carga aquí -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Inicializar la carga de establecimientos después de generar el dashboard
    // Usar Promise.resolve() para permitir que el DOM se renderice antes
    Promise.resolve().then(() => {
        setTimeout(() => {
            console.log('🔄 Iniciando carga de establecimientos tras renderizado...');
            inicializarEstablecimientos();
            
            // Cargar mapa de establecimientos después de la inicialización de fincas
            setTimeout(() => {
                console.log('🗺️ Iniciando carga del mapa de establecimientos...');
                cargarMapaEstablecimientos();
            }, 500);

            // Cargar ofertas de empleo después del mapa
            setTimeout(() => {
                console.log('💼 Iniciando carga de ofertas de empleo...');
                inicializarFiltrosOfertas();
                cargarOfertasEmpleo();
            }, 800);
        }, 200);
    });
    
    console.log('✅ Dashboard generado completamente');
}

// ===========================
// FUNCIONES DEL WIZARD DE FINCA
// ===========================

// Variable global para manejar el estado del wizard
let wizardData = {
    paso: 1,
    datos: {}
};

// Función para abrir el wizard de finca
function abrirWizardFinca() {
    console.log('🚀 Iniciando wizard de finca...');
    
    try {
        // Reiniciar datos del wizard
        wizardData = { paso: 1, datos: {} };
        
        // Llamar a la nueva función que maneja el mapa correctamente
        abrirWizardRegistroConMapa();
        
    } catch (error) {
        console.error('❌ Error al abrir wizard:', error);
        alert('Error al abrir el formulario de finca. Por favor recarga la página.');
    }
}

function mostrarErrorPerfil2(mensaje) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'alert alert-danger alert-dismissible fade show';
    errorContainer.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertBefore(errorContainer, mainContent.firstChild);
    }
}

// ===========================
// WIZARD PASO 1: FORMULARIO DE DATOS
// ===========================

function cargarPaso1() {
    const wizardContent = document.getElementById('wizard-content');
    wizardContent.innerHTML = `
        <div class="wizard-progress mb-4">
            <div class="row">
                <div class="col-6">
                    <div class="step active">
                        <div class="step-number">1</div>
                        <div class="step-label">Datos de la Finca</div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="step">
                        <div class="step-number">2</div>
                        <div class="step-label">Confirmación</div>
                    </div>
                </div>
            </div>
        </div>

        <form id="finca-form" novalidate>
            <div class="row">
                <!-- Nombre del Establecimiento -->
                <div class="col-12 mb-3">
                    <label for="nombreEstablecimiento" class="form-label">
                        Nombre del Establecimiento <span class="text-danger">*</span>
                    </label>
                    <input type="text" class="form-control bg-secondary text-white border-secondary" 
                           id="nombreEstablecimiento" required minlength="3">
                    <div class="field-feedback"></div>
                </div>

                <!-- Departamento -->
                <div class="col-md-6 mb-3">
                    <label for="idDepartamento" class="form-label">
                        Departamento <span class="text-danger">*</span>
                    </label>
                    <select class="form-select text-white" 
                            id="idDepartamento" required>
                        <option value="">Seleccione un departamento...</option>
                    </select>
                    <div class="field-feedback"></div>
                </div>

                <!-- Distrito -->
                <div class="col-md-6 mb-3">
                    <label for="idDistrito" class="form-label">
                        Distrito <span class="text-danger">*</span>
                    </label>
                    <select class="form-select text-white" 
                            id="idDistrito" required disabled>
                        <option value="">Primero seleccione un departamento</option>
                    </select>
                    <div class="field-feedback"></div>
                </div>

                <!-- Dirección -->
                <div class="col-md-8 mb-3">
                    <label for="calle" class="form-label">
                        Calle <span class="text-danger">*</span>
                    </label>
                    <input type="text" class="form-control text-white" 
                           id="calle" required>
                    <div class="field-feedback"></div>
                </div>
                <div class="col-md-4 mb-3">
                    <label for="numeracion" class="form-label">
                        Número <span class="text-danger">*</span>
                    </label>
                    <input type="text" class="form-control text-white" 
                           id="numeracion" required>
                    <div class="field-feedback"></div>
                </div>

                <!-- Código Postal y Coordenadas -->
                <div class="col-md-4 mb-3">
                    <label for="codigoPostal" class="form-label">
                        Código Postal <span class="text-danger">*</span>
                    </label>
                    <input type="text" class="form-control text-white" 
                           id="codigoPostal" required pattern="[0-9]{4,5}">
                    <div class="field-feedback"></div>
                </div>
                <div class="col-md-4 mb-3">
                    <label for="longitud" class="form-label">
                        Longitud <span class="text-danger">*</span>
                    </label>
                    <input type="number" class="form-control text-white" 
                           id="longitud" step="0.000001" min="-180" max="180" required>
                    <div class="field-feedback"></div>
                </div>
                <div class="col-md-4 mb-3">
                    <label for="latitud" class="form-label">
                        Latitud <span class="text-danger">*</span>
                    </label>
                    <input type="number" class="form-control text-white" 
                           id="latitud" step="0.000001" min="-90" max="90" required>
                    <div class="field-feedback"></div>
                </div>

                <!-- Mapa Leaflet -->
                <div class="col-12 mb-3">
                    <label class="form-label">
                        <i class="fas fa-map-marker-alt me-2"></i>Ubicación en el Mapa
                    </label>
                    <div class="map-container">
                        <div class="map-controls mb-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="d-flex gap-2">
                                    <!-- Botón Buscar Ubicación -->
                                    <button type="button" class="btn btn-search-location btn-sm" 
                                            id="buscarUbicacionBtn" onclick="buscarUbicacion()" disabled>
                                        <span class="btn-text">
                                            <i class="fas fa-search-location me-1"></i>Buscar
                                        </span>
                                        <span class="btn-loading d-none">
                                            <div class="spinner-border spinner-border-sm me-1" role="status"></div>
                                            Buscando...
                                        </span>
                                    </button>
                                    
                                    <!-- Controles de vista del mapa -->
                                    <div class="btn-group" role="group">
                                        <button type="button" class="btn btn-outline-success btn-sm" 
                                                id="mapSatellite" onclick="cambiarVistaMapaFinca('satellite')">
                                            <i class="fas fa-satellite me-1"></i>Satelital
                                        </button>
                                        <button type="button" class="btn btn-success btn-sm" 
                                                id="mapClassic" onclick="cambiarVistaMapaFinca('classic')">
                                            <i class="fas fa-map me-1"></i>Clásico
                                        </button>
                                    </div>
                                </div>
                                <small class="text-muted">Haga clic en el mapa para establecer la ubicación</small>
                            </div>
                        </div>
                        <div id="mapFinca" style="height: 300px; border-radius: 8px; overflow: hidden; border: 1px solid #444444;"></div>
                    </div>
                </div>

                <!-- Especies -->
                <div class="col-12 mb-3">
                    <label for="especiesSelector" class="form-label">
                        Especies Cultivadas <span class="text-danger">*</span>
                    </label>
                    <button type="button" class="btn btn-outline-secondary w-100 text-start" 
                            id="especiesSelector"
                            onclick="console.log('🖱️ Click en especies selector detectado'); if(typeof abrirModalEspecies === 'function') abrirModalEspecies(); else console.error('abrirModalEspecies no disponible');"
                            style="background: #404040; border-color: #666666; color: white; min-height: 50px;">
                        <div class="d-flex justify-content-between align-items-center">
                            <span id="especiesSelectorText">Seleccione las especies que cultiva...</span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                    </button>
                    <div class="field-feedback"></div>
                    <small class="text-muted">Puede seleccionar hasta 5 especies diferentes</small>
                </div>
            </div>

            <div class="modal-footer border-secondary">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                    <i class="fas fa-times me-2"></i>Cancelar
                </button>
                <button type="button" class="btn btn-primary-custom" onclick="validarYContinuarPaso2()">
                    <i class="fas fa-arrow-right me-2"></i>Siguiente
                </button>
            </div>
        </form>

        <style>
            .wizard-progress .step {
                text-align: center;
                padding: 1rem;
                border-radius: 8px;
                background: #2A2A2A;
                border: 2px solid #444444;
                margin: 0 0.5rem;
            }
            .wizard-progress .step.active {
                background: linear-gradient(135deg, #4A90E2, #357ABD);
                border-color: #4A90E2;
            }
            .step-number {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background: #444444;
                color: white;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 0.5rem;
                font-weight: bold;
            }
            .step.active .step-number {
                background: white;
                color: #4A90E2;
            }
            .step-label {
                font-size: 0.9rem;
                font-weight: 600;
            }
            .field-feedback {
                margin-top: 0.25rem;
                font-size: 0.875rem;
            }
            .especies-checkbox {
                margin: 0.5rem;
                padding: 0.75rem;
                border: 2px solid #444444;
                border-radius: 6px;
                background: #2A2A2A;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .especies-checkbox:hover {
                border-color: #4A90E2;
            }
            .especies-checkbox.selected {
                border-color: #27AE60;
                background: rgba(39, 174, 96, 0.1);
            }
        </style>
    `;

    // Cargar datos iniciales
    cargarDepartamentos();
    // cargarEspecies(); // Ahora se carga automáticamente en el modal de especies
    
    // Configurar eventos
    configurarEventosPaso1();
    
    // Configurar modal de especies después de crear el wizard
    if (typeof configurarModalEspecies === 'function') {
        setTimeout(() => {
            configurarModalEspecies();
        }, 100);
    }
}

// ===========================
// CARGA DINÁMICA DE DATOS
// ===========================

async function cargarDepartamentos() {
    try {
        const response = await fetchWithConfig(buildURL(BACKEND_CONFIG.ENDPOINTS.DEPARTAMENTOS));
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const departamentos = await response.json();
        const select = document.getElementById('idDepartamento');
        
        select.innerHTML = '<option value="">Seleccione un departamento...</option>';
        
        departamentos.forEach(depto => {
            const option = document.createElement('option');
            option.value = depto.idDepartamento;
            option.textContent = depto.nombreDepartamento;
            select.appendChild(option);
        });
        
        console.log('✅ Departamentos cargados:', departamentos.length);
        
    } catch (error) {
        console.error('❌ Error cargando departamentos:', error);
        const select = document.getElementById('idDepartamento');
        select.innerHTML = '<option value="">Error cargando departamentos</option>';
        mostrarMensajeError('Error al cargar departamentos. Verifique su conexión.');
    }
}

async function cargarDistritos(idDepartamento) {
    const selectDistrito = document.getElementById('idDistrito');
    
    try {
        selectDistrito.disabled = true;
        selectDistrito.innerHTML = '<option value="">Cargando distritos...</option>';
        
        const response = await fetchWithConfig(buildURL(BACKEND_CONFIG.ENDPOINTS.DISTRITOS, `/${idDepartamento}`));
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const distritos = await response.json();
        
        selectDistrito.innerHTML = '<option value="">Seleccione un distrito...</option>';
        
        distritos.forEach(distrito => {
            const option = document.createElement('option');
            option.value = distrito.idDistrito;
            option.textContent = distrito.nombreDistrito;
            selectDistrito.appendChild(option);
        });
        
        selectDistrito.disabled = false;
        console.log('✅ Distritos cargados:', distritos.length);
        
    } catch (error) {
        console.error('❌ Error cargando distritos:', error);
        selectDistrito.innerHTML = '<option value="">Error cargando distritos</option>';
        selectDistrito.disabled = false;
        mostrarMensajeError('Error al cargar distritos. Verifique su conexión.');
    }
}

// Función de carga de especies movida a especies-modal.js
/*
async function cargarEspecies() {
    const dropdownMenu = document.getElementById('especiesDropdownMenu');
    
    try {
        const response = await fetchWithAuth(buildURL(BACKEND_CONFIG.ENDPOINTS.ESPECIES));
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expirado. Por favor, inicie sesión nuevamente.');
            }
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const especies = await response.json();
        
        // Limpiar el menú dropdown
        dropdownMenu.innerHTML = `
            <li class="dropdown-header text-white">
                <small id="especiesCounter">Seleccione hasta 5 especies (0/5 seleccionadas)</small>
            </li>
            <li><hr class="dropdown-divider" style="border-color: #666666;"></li>
        `;
        
        // Agregar cada especie como checkbox
        especies.forEach(especie => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <label class="dropdown-item d-flex align-items-center text-white" 
                       style="background: transparent; cursor: pointer; min-height: 50px;"
                       onmouseover="this.style.background='#555555'" 
                       onmouseout="this.style.background='transparent'"
                       ontouchstart="this.style.background='#555555'"
                       ontouchend="this.style.background='transparent'">
                    <input type="checkbox" 
                           class="form-check-input" 
                           id="especie_${especie.idEspecie}" 
                           value="${especie.idEspecie}"
                           onchange="toggleEspecieCheckbox(${especie.idEspecie}, '${especie.nombreEspecie.replace(/'/g, "\\'")}')">
                    <i class="fas fa-seedling text-success"></i>
                    <span style="flex: 1; margin-left: 12px; margin-right: 12px;">${especie.nombreEspecie}</span>
                    <i class="fas fa-check text-success" 
                       id="check_${especie.idEspecie}" 
                       style="display: none; font-size: 18px;"></i>
                </label>
            `;
            dropdownMenu.appendChild(listItem);
        });
        
        console.log('✅ Especies cargadas en dropdown:', especies.length);
        
    } catch (error) {
        console.error('❌ Error cargando especies:', error);
        dropdownMenu.innerHTML = `
            <li class="dropdown-header text-white">
                <small>Error al cargar especies</small>
            </li>
            <li><hr class="dropdown-divider" style="border-color: #666666;"></li>
            <li class="dropdown-item text-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${error.message}
            </li>
        `;
    }
}
*/

// Variables globales para especies (manejadas en especies-modal.js)
// let especiesSeleccionadas = [];

// Función de especies removida - ahora en especies-modal.js
// function toggleEspecieCheckbox(idEspecie, nombreEspecie) { ... }

function mostrarMensajeError(mensaje) {
    // Crear toast de error
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-danger border-0';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-exclamation-circle me-2"></i>
                ${mensaje}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remover del DOM después de que se oculte
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// ===========================
// CONFIGURACIÓN DE EVENTOS Y VALIDACIONES
// ===========================

function configurarEventosPaso1() {
    console.log('🔧 Configurando eventos del Paso 1...');
    
    // CRÍTICO: Asegurar que todos los elementos estén disponibles
    setTimeout(() => {
        try {
            // Evento cambio de departamento para cargar distritos
            const selectDepartamento = document.getElementById('idDepartamento');
            if (selectDepartamento) {
                selectDepartamento.addEventListener('change', function() {
                    console.log('📍 Departamento seleccionado:', this.value);
                    const idDepartamento = this.value;
                    if (idDepartamento) {
                        cargarDistritos(idDepartamento);
                    } else {
                        const selectDistrito = document.getElementById('idDistrito');
                        selectDistrito.innerHTML = '<option value="">Primero seleccione un departamento</option>';
                        selectDistrito.disabled = true;
                    }
                    validarCampo(this);
                });
                console.log('✅ Event listener de departamento configurado');
            }

            // REFUERZO: Event listeners para asegurar interactividad
            const campos = ['nombreEstablecimiento', 'calle', 'numeracion', 'codigoPostal', 'latitud', 'longitud', 'idDistrito'];
            
            campos.forEach(campoId => {
                const campo = document.getElementById(campoId);
                if (campo) {
                    // Múltiples event listeners para máxima compatibilidad
                    ['blur', 'change', 'input', 'keyup', 'focus'].forEach(evento => {
                        campo.addEventListener(evento, function(e) {
                            console.log(`🎯 Evento ${evento} en ${campoId}:`, e.target.value);
                            
                            if (evento === 'blur') {
                                validarCampo(campo);
                            } else if (evento === 'input' || evento === 'keyup') {
                                // Limpiar errores mientras escribe
                                campo.classList.remove('is-invalid');
                                const feedback = campo.parentNode.querySelector('.field-feedback');
                                if (feedback) feedback.innerHTML = '';
                            }
                        });
                    });
                    
                    // FORZAR activación de campo
                    campo.style.pointerEvents = 'auto';
                    campo.removeAttribute('readonly');
                    campo.removeAttribute('disabled');
                    
                    console.log(`✅ Campo ${campoId} configurado y activado`);
                }
            });

            // Event listener para el dropdown de especies
            const dropdownEspecies = document.getElementById('especiesDropdown');
            if (dropdownEspecies) {
                // Prevenir que el dropdown se cierre al hacer clic en checkboxes
                const dropdownMenu = document.getElementById('especiesDropdownMenu');
                if (dropdownMenu) {
                    dropdownMenu.addEventListener('click', function(e) {
                        e.stopPropagation();
                    });
                }
                
                // Mejorar comportamiento en móviles
                if (window.innerWidth <= 768) {
                    // Cerrar dropdown al hacer clic fuera en móviles
                    document.addEventListener('click', function(e) {
                        const dropdown = document.querySelector('#especiesDropdown');
                        const menu = document.querySelector('#especiesDropdownMenu');
                        
                        if (dropdown && menu && !dropdown.contains(e.target) && !menu.contains(e.target)) {
                            const bsDropdown = bootstrap.Dropdown.getInstance(dropdown);
                            if (bsDropdown) {
                                bsDropdown.hide();
                            }
                        }
                    });
                }
                
                console.log('✅ Dropdown de especies configurado');
            }
            
            console.log('✅ Todos los event listeners configurados');
            
        } catch (error) {
            console.error('❌ Error configurando eventos:', error);
        }
    }, 100);
}

function validarCampo(campo) {
    const valor = campo.value.trim();
    let esValido = true;
    let mensaje = '';

    // Validaciones específicas por campo
    switch (campo.id) {
        case 'nombreEstablecimiento':
            if (!valor) {
                esValido = false;
                mensaje = 'El nombre del establecimiento es obligatorio';
            } else if (valor.length < 3) {
                esValido = false;
                mensaje = 'El nombre debe tener al menos 3 caracteres';
            }
            break;

        case 'calle':
        case 'numeracion':
            if (!valor) {
                esValido = false;
                mensaje = 'Este campo es obligatorio';
            }
            break;

        case 'codigoPostal':
            if (!valor) {
                esValido = false;
                mensaje = 'El código postal es obligatorio';
            } else if (!/^[0-9]{4,5}$/.test(valor)) {
                esValido = false;
                mensaje = 'El código postal debe tener 4 o 5 dígitos';
            }
            break;

        case 'latitud':
            if (!valor) {
                esValido = false;
                mensaje = 'La latitud es obligatoria';
            } else {
                const lat = parseFloat(valor);
                if (isNaN(lat) || lat < -90 || lat > 90) {
                    esValido = false;
                    mensaje = 'La latitud debe estar entre -90 y 90';
                }
            }
            break;

        case 'longitud':
            if (!valor) {
                esValido = false;
                mensaje = 'La longitud es obligatoria';
            } else {
                const lng = parseFloat(valor);
                if (isNaN(lng) || lng < -180 || lng > 180) {
                    esValido = false;
                    mensaje = 'La longitud debe estar entre -180 y 180';
                }
            }
            break;

        case 'idDepartamento':
        case 'idDistrito':
            if (!valor) {
                esValido = false;
                mensaje = 'Debe seleccionar una opción';
            }
            break;
    }

    // Aplicar feedback visual
    mostrarFeedbackCampo(campo, esValido, mensaje);
    return esValido;
}

// Función de validación de especies removida - ahora en especies-modal.js
// function validarEspecies() { ... }

function mostrarFeedbackCampo(campo, esValido, mensaje) {
    const feedback = campo.parentNode.querySelector('.field-feedback');
    
    // Limpiar clases previas
    campo.classList.remove('is-valid', 'is-invalid');
    
    if (mensaje) {
        if (esValido) {
            campo.classList.add('is-valid');
            if (feedback) {
                feedback.innerHTML = `<div class="text-success"><i class="fas fa-check-circle me-1"></i>${mensaje}</div>`;
            }
        } else {
            campo.classList.add('is-invalid');
            if (feedback) {
                feedback.innerHTML = `<div class="text-danger"><i class="fas fa-exclamation-circle me-1"></i>${mensaje}</div>`;
            }
        }
    } else if (feedback) {
        feedback.innerHTML = '';
    }
}

// ===========================
// VALIDACIÓN Y PASO 2
// ===========================

function validarYContinuarPaso2() {
    const campos = ['nombreEstablecimiento', 'calle', 'numeracion', 'codigoPostal', 'latitud', 'longitud', 'idDepartamento', 'idDistrito'];
    let todosValidos = true;

    // Validar todos los campos
    campos.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (campo && !validarCampo(campo)) {
            todosValidos = false;
        }
    });

    // Validar especies
    if (typeof validarCampoEspecies === 'function' && !validarCampoEspecies()) {
        todosValidos = false;
    }

    if (!todosValidos) {
        mostrarMensajeError('Por favor, complete todos los campos obligatorios correctamente.');
        return;
    }

    // Recopilar datos del formulario
    const especiesIds = typeof obtenerEspeciesSeleccionadas === 'function' ? obtenerEspeciesSeleccionadas() : [];
    
    wizardData.datos = {
        nombreEstablecimiento: document.getElementById('nombreEstablecimiento').value.trim(),
        calle: document.getElementById('calle').value.trim(),
        numeracion: document.getElementById('numeracion').value.trim(),
        codigoPostal: document.getElementById('codigoPostal').value.trim(),
        latitud: parseFloat(document.getElementById('latitud').value),
        longitud: parseFloat(document.getElementById('longitud').value),
        idDepartamento: parseInt(document.getElementById('idDepartamento').value),
        idDistrito: parseInt(document.getElementById('idDistrito').value),
        idsEspecies: especiesIds
    };

    // Obtener nombres de especies para mostrar en confirmación
    const especiesNombres = especiesIds.map(id => {
        if (typeof especiesDisponibles !== 'undefined') {
            const especie = especiesDisponibles.find(e => e.idEspecie === id);
            return especie ? especie.nombreEspecie : `Especie ${id}`;
        }
        return `Especie ${id}`;
    });

    // Obtener nombres para mostrar en confirmación
    wizardData.datosDisplay = {
        nombreEstablecimiento: wizardData.datos.nombreEstablecimiento,
        direccion: `${wizardData.datos.calle} ${wizardData.datos.numeracion}`,
        codigoPostal: wizardData.datos.codigoPostal,
        coordenadas: `${wizardData.datos.latitud}, ${wizardData.datos.longitud}`,
        departamento: document.getElementById('idDepartamento').selectedOptions[0].text,
        distrito: document.getElementById('idDistrito').selectedOptions[0].text,
        especies: especiesNombres
    };

    // Avanzar al paso 2
    wizardData.paso = 2;
    cargarPaso2();
}

function cargarPaso2() {
    const wizardContent = document.getElementById('wizard-content');
    const datos = wizardData.datosDisplay;
    
    wizardContent.innerHTML = `
        <div class="wizard-progress mb-4">
            <div class="row">
                <div class="col-6">
                    <div class="step">
                        <div class="step-number">✓</div>
                        <div class="step-label">Datos de la Finca</div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="step active">
                        <div class="step-number">2</div>
                        <div class="step-label">Confirmación</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="confirmation-container">
            <div class="text-center mb-4">
                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                <h4>Confirmar Registro de Finca</h4>
                <p class="text-muted">Revise los datos antes de proceder con el registro</p>
            </div>

            <div class="row">
                <div class="col-lg-8 mx-auto">
                    <div class="confirmation-card p-4 mb-4">
                        <h5 class="border-bottom border-secondary pb-2 mb-3">
                            <i class="fas fa-building me-2 text-primary"></i>
                            Información del Establecimiento
                        </h5>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <div class="text-muted small">Nombre</div>
                                <p class="mb-0 fw-bold">${datos.nombreEstablecimiento}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <div class="text-muted small">Dirección</div>
                                <p class="mb-0">${datos.direccion}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <div class="text-muted small">Código Postal</div>
                                <p class="mb-0">${datos.codigoPostal}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <div class="text-muted small">Coordenadas</div>
                                <p class="mb-0">
                                    <i class="fas fa-map-marker-alt me-1 text-danger"></i>
                                    ${datos.coordenadas}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="confirmation-card p-4 mb-4">
                        <h5 class="border-bottom border-secondary pb-2 mb-3">
                            <i class="fas fa-map-marked-alt me-2 text-info"></i>
                            Ubicación Administrativa
                        </h5>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="text-muted small">Departamento</label>
                                <p class="mb-0 fw-bold">${datos.departamento}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="text-muted small">Distrito</label>
                                <p class="mb-0 fw-bold">${datos.distrito}</p>
                            </div>
                        </div>
                    </div>

                    <div class="confirmation-card p-4">
                        <h5 class="border-bottom border-secondary pb-2 mb-3">
                            <i class="fas fa-seedling me-2 text-success"></i>
                            Especies Cultivadas (${datos.especies.length})
                        </h5>
                        <div class="especies-list">
                            ${datos.especies.map(especie => 
                                `<span class="badge bg-success me-2 mb-2 p-2">
                                    <i class="fas fa-leaf me-1"></i>${especie}
                                </span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal-footer border-secondary">
            <button type="button" class="btn btn-secondary" onclick="volverPaso1()">
                <i class="fas fa-arrow-left me-2"></i>Volver
            </button>
            <button type="button" class="btn btn-success" onclick="confirmarRegistro()" id="btn-confirmar">
                <i class="fas fa-check me-2"></i>Confirmar Registro
            </button>
        </div>

        <style>
            .confirmation-card {
                background: #2A2A2A;
                border: 1px solid #444444;
                border-radius: 8px;
                transition: transform 0.3s ease;
            }
            .confirmation-card:hover {
                transform: translateY(-2px);
            }
            .especies-list .badge {
                font-size: 0.9rem;
            }
        </style>
    `;
}

function volverPaso1() {
    wizardData.paso = 1;
    cargarPaso1();
    
    // Restaurar datos en el formulario
    setTimeout(() => {
        const datos = wizardData.datos;
        if (datos.nombreEstablecimiento) document.getElementById('nombreEstablecimiento').value = datos.nombreEstablecimiento;
        if (datos.calle) document.getElementById('calle').value = datos.calle;
        if (datos.numeracion) document.getElementById('numeracion').value = datos.numeracion;
        if (datos.codigoPostal) document.getElementById('codigoPostal').value = datos.codigoPostal;
        if (datos.latitud) document.getElementById('latitud').value = datos.latitud;
        if (datos.longitud) document.getElementById('longitud').value = datos.longitud;
        if (datos.idDepartamento) {
            document.getElementById('idDepartamento').value = datos.idDepartamento;
            cargarDistritos(datos.idDepartamento).then(() => {
                document.getElementById('idDistrito').value = datos.idDistrito;
            });
        }
        
        // Restaurar especies seleccionadas
        if (datos.idsEspecies && datos.especies) {
            // Limpiar selecciones anteriores
            especiesSeleccionadas = [];
            
            // Restaurar cada especie
            datos.idsEspecies.forEach((id, index) => {
                const checkbox = document.getElementById(`especie_${id}`);
                if (checkbox) {
                    checkbox.checked = true;
                    const checkIcon = document.getElementById(`check_${id}`);
                    if (checkIcon) checkIcon.style.display = 'inline';
                    
                    // Agregar a la variable global
                    if (datos.especies[index]) {
                        especiesSeleccionadas.push({ 
                            id: id, 
                            nombre: datos.especies[index] 
                        });
                    }
                }
            });
            
            // Actualizar UI
            const counter = document.getElementById('especiesCounter');
            const buttonText = document.getElementById('especiesButtonText');
            
            if (counter) {
                counter.textContent = `Seleccione hasta 5 especies (${especiesSeleccionadas.length}/5 seleccionadas)`;
            }
            
            if (buttonText) {
                if (especiesSeleccionadas.length === 1) {
                    buttonText.textContent = especiesSeleccionadas[0].nombre;
                } else if (especiesSeleccionadas.length > 1) {
                    buttonText.textContent = `${especiesSeleccionadas.length} especies seleccionadas`;
                }
            }
            
            if (typeof validarCampoEspecies === 'function') {
                validarCampoEspecies();
            }
        }
    }, 500);
}

// ===========================
// GESTIÓN DE ESTABLECIMIENTOS
// ===========================

/**
 * Carga la lista de establecimientos desde el backend
 * @returns {Promise<Array>} Array de establecimientos o array vacío si no hay datos
 */
async function cargarEstablecimientos() {
    console.log('🏢 Iniciando carga de establecimientos...');
    
    try {
        // Verificar autenticación antes de la petición
        const tokenStatus = await validateCurrentToken();
        if (!tokenStatus.valid) {
            console.warn('🔒 Token inválido, no se pueden cargar establecimientos');
            return [];
        }

        // Realizar petición autenticada
        const url = buildURL(BACKEND_CONFIG.ENDPOINTS.GET_ESTABLECIMIENTOS);
        console.log('📡 Solicitando establecimientos desde:', url);

        const response = await fetchWithAuth(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        // Verificar respuesta exitosa
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.warn('🔒 Sin autorización para cargar establecimientos');
                return [];
            }
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }

        // Procesar datos
        const establecimientos = await response.json();
        console.log(`✅ Establecimientos cargados: ${establecimientos.length} encontrados`);
        console.log('📋 Datos recibidos:', establecimientos);

        // Validar estructura de datos
        if (!Array.isArray(establecimientos)) {
            console.warn('⚠️ Respuesta no es un array, devolviendo array vacío');
            return [];
        }

        return establecimientos;

    } catch (error) {
        console.error('❌ Error cargando establecimientos:', error);
        
        // Manejo específico de errores de red
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.error('🌐 Error de conexión con el servidor');
        }
        
        return [];
    }
}

/**
 * Renderiza los establecimientos en el dashboard
 * @param {Array} establecimientos - Array de establecimientos
 */
function renderizarEstablecimientos(establecimientos) {
    const containerFincas = document.getElementById('empty-fincas');
    if (!containerFincas) {
        console.error('❌ Contenedor #empty-fincas no encontrado');
        return;
    }

    console.log(`🎨 Renderizando ${establecimientos.length} establecimientos`);

    // Si no hay establecimientos, mostrar estado vacío
    if (!establecimientos || establecimientos.length === 0) {
        mostrarEstadoVacio(containerFincas);
        return;
    }

    // Renderizar establecimientos
    const html = generarHtmlEstablecimientos(establecimientos);
    containerFincas.innerHTML = html;

    // Actualizar contador en stats si existe
    actualizarContadorEstablecimientos(establecimientos.length);
}

/**
 * Muestra el estado vacío cuando no hay establecimientos
 * @param {HTMLElement} container - Contenedor donde mostrar el estado
 */
function mostrarEstadoVacio(container) {
    container.innerHTML = `
        <div class="empty-state text-center py-5">
            <i class="fas fa-plus-circle text-primary mb-3" style="font-size: 3rem;"></i>
            <h6 class="text-muted-custom mb-3">No hay fincas registradas</h6>
            <p class="text-muted-custom mb-4">Comienza agregando tu primera propiedad agrícola</p>
            <button class="btn btn-primary-custom" onclick="abrirWizardFinca()">
                <i class="fas fa-plus me-2"></i>Agregar Primera Finca
            </button>
        </div>
    `;
}

/**
 * Muestra el estado de carga
 * @param {HTMLElement} container - Contenedor donde mostrar el estado
 */
function mostrarEstadoCargando(container) {
    container.innerHTML = `
        <div class="loading-state text-center py-5">
            <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <h6 class="text-muted-custom">Cargando establecimientos...</h6>
        </div>
    `;
}

/**
 * Genera el HTML para mostrar los establecimientos
 * @param {Array} establecimientos - Array de establecimientos
 * @returns {string} HTML generado
 */
function generarHtmlEstablecimientos(establecimientos) {
    const establecimientosHtml = establecimientos.map(est => `
        <div class="col-lg-6 col-xl-4 mb-4">
            <div class="establecimiento-card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 text-success">
                        <i class="fas fa-seedling me-2"></i>
                        ${est.nombreEstablecimiento}
                    </h6>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-light" type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-dark">
                            <li><a class="dropdown-item" href="#" onclick="verDetalleEstablecimiento(${est.idEstablecimiento})">
                                <i class="fas fa-eye me-2"></i>Ver Detalles
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="editarEstablecimiento(${est.idEstablecimiento})">
                                <i class="fas fa-edit me-2"></i>Editar
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="eliminarEstablecimiento(${est.idEstablecimiento}, '${est.nombreEstablecimiento.replace(/'/g, "\\'")}')">
                                <i class="fas fa-trash me-2"></i>Eliminar
                            </a></li>
                        </ul>
                    </div>
                </div>
                <div class="card-body">
                    <div class="establecimiento-info">
                        <div class="info-item mb-2">
                            <i class="fas fa-map-marker-alt text-primary me-2"></i>
                            <span class="text-light">${est.calle} ${est.numeracion}, CP ${est.codigoPostal}</span>
                        </div>
                        <div class="info-item mb-2">
                            <i class="fas fa-map text-info me-2"></i>
                            <span class="text-muted">${est.nombreDistrito}, ${est.nombreDepartamento}</span>
                        </div>
                        <div class="info-item mb-3">
                            <i class="fas fa-leaf text-success me-2"></i>
                            <span class="text-light">${est.especies.length} especie(s): ${est.especies.slice(0, 3).join(', ')}${est.especies.length > 3 ? '...' : ''}</span>
                        </div>
                        <div class="coordinates-info">
                            <small class="text-muted">
                                <i class="fas fa-globe me-1"></i>
                                Lat: ${est.latitud.toFixed(5)}, Lng: ${est.longitud.toFixed(5)}
                            </small>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-success">
                            <i class="fas fa-check-circle me-1"></i>Activo
                        </span>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary" onclick="verEnMapa(${est.latitud}, ${est.longitud})">
                                <i class="fas fa-map-marked-alt me-1"></i>Ver en Mapa
                            </button>
                            <button class="btn btn-sm btn-success" onclick="crearOfertaLaboral(${est.idEstablecimiento}, '${est.nombreEstablecimiento}')">
                                <i class="fas fa-briefcase me-1"></i>Crear Oferta Laboral
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    return `
        <div class="establecimientos-container">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h6 class="text-light mb-0">
                    <i class="fas fa-clipboard-list me-2 text-primary"></i>
                    Mis Establecimientos (${establecimientos.length})
                </h6>
                <button class="btn btn-primary btn-sm" onclick="abrirWizardFinca()">
                    <i class="fas fa-plus me-2"></i>Agregar Nuevo
                </button>
            </div>
            <div class="row">
                ${establecimientosHtml}
            </div>
        </div>
    `;
}

/**
 * Actualiza el contador de establecimientos en las estadísticas
 * @param {number} cantidad - Cantidad de establecimientos
 */
function actualizarContadorEstablecimientos(cantidad) {
    const statsNumbers = document.querySelectorAll('.stats-card .stats-number');
    if (statsNumbers.length > 0) {
        statsNumbers[0].textContent = cantidad.toString();
        console.log(`📊 Contador actualizado: ${cantidad} establecimientos`);
    }
}

// ===========================
// FUNCIONES DE ACCIÓN DE ESTABLECIMIENTOS
// ===========================

/**
 * Ver detalles de un establecimiento
 * @param {number} idEstablecimiento - ID del establecimiento
 */
function verDetalleEstablecimiento(idEstablecimiento) {
    console.log(`👁️ Ver detalles del establecimiento: ${idEstablecimiento}`);
    // TODO: Implementar modal de detalles
    alert(`Ver detalles del establecimiento ID: ${idEstablecimiento}`);
}

/**
 * Editar un establecimiento
 * @param {number} idEstablecimiento - ID del establecimiento
 */
function editarEstablecimiento(idEstablecimiento) {
    console.log(`✏️ Editar establecimiento: ${idEstablecimiento}`);
    // TODO: Implementar modal de edición
    alert(`Editar establecimiento ID: ${idEstablecimiento}`);
}

/**
 * Eliminar un establecimiento
 * @param {number} idEstablecimiento - ID del establecimiento
 */
function eliminarEstablecimiento(idEstablecimiento) {
    console.log(`🗑️ Eliminar establecimiento: ${idEstablecimiento}`);
    if (confirm('¿Está seguro que desea eliminar este establecimiento?')) {
        // TODO: Implementar eliminación
        alert(`Eliminar establecimiento ID: ${idEstablecimiento}`);
    }
}

/**
 * Ver establecimiento en el mapa
 * @param {number} latitud - Latitud del establecimiento
 * @param {number} longitud - Longitud del establecimiento
 */
function verEnMapa(latitud, longitud) {
    console.log(`🗺️ Ver en mapa: ${latitud}, ${longitud}`);
    // TODO: Implementar vista de mapa
    window.open(`https://www.google.com/maps?q=${latitud},${longitud}`, '_blank');
}

/**
 * Crear oferta laboral para un establecimiento
 * @param {number} idEstablecimiento - ID del establecimiento
 * @param {string} nombreEstablecimiento - Nombre del establecimiento
 */
async function crearOfertaLaboral(idEstablecimiento, nombreEstablecimiento) {
    console.log(`💼 Crear oferta laboral para establecimiento: ${idEstablecimiento} - ${nombreEstablecimiento}`);
    
    // Mostrar modal con loading inicial
    const modalHtml = `
        <div class="modal fade" id="modalCrearOferta" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content bg-dark border-primary">
                    <div class="modal-header border-secondary bg-gradient" style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);">
                        <h4 class="modal-title text-white fw-bold">
                            <i class="fas fa-briefcase me-3 text-success fs-4"></i>
                            Crear Nueva Oferta Laboral
                        </h4>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4" style="background: #1e1e1e;">
                        <div class="mb-4 p-4 bg-gradient rounded-3 border border-primary" style="background: linear-gradient(135deg, #0d4377 0%, #14547a 100%);">
                            <h5 class="text-white mb-2">
                                <i class="fas fa-building me-3 text-info fs-5"></i>
                                Establecimiento: <span class="text-warning">${nombreEstablecimiento}</span>
                            </h5>
                            <p class="text-light mb-0"><small><i class="fas fa-id-card me-2"></i>ID: ${idEstablecimiento}</small></p>
                        </div>
                        
                        <div id="loadingContent" class="text-center py-5">
                            <div class="spinner-border text-primary mb-3" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                            <p class="text-light">Cargando datos para el formulario...</p>
                        </div>
                        
                        <form id="formCrearOferta" style="display: none;">
                            <div class="row g-4">
                                <div class="col-md-6">
                                    <label class="form-label text-light fw-semibold fs-6">
                                        <i class="fas fa-briefcase me-2 text-primary"></i>Puesto de Trabajo
                                    </label>
                                    <select class="form-select form-select-lg bg-dark text-light border-secondary" 
                                            id="idPuestoTrabajo" required>
                                        <option value="">Seleccionar puesto...</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-light fw-semibold fs-6">
                                        <i class="fas fa-leaf me-2 text-success"></i>Especie (Opcional)
                                    </label>
                                    <select class="form-select form-select-lg bg-dark text-light border-secondary" 
                                            id="idEspecie">
                                        <option value="">Sin especie específica</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row g-4 mt-2">
                                <div class="col-md-6">
                                    <label class="form-label text-light fw-semibold fs-6">
                                        <i class="fas fa-users me-2 text-warning"></i>Vacantes Disponibles
                                    </label>
                                    <input type="number" class="form-control form-control-lg bg-dark text-light border-secondary" 
                                           id="vacantes" min="1" value="1" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-light fw-semibold fs-6">
                                        <i class="fas fa-calendar-times me-2 text-danger"></i>Fecha de Cierre
                                    </label>
                                    <input type="date" class="form-control form-control-lg bg-dark text-light border-secondary" 
                                           id="fechaCierre" required>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer border-secondary p-4" style="background: #1a1a1a;">
                        <button type="button" class="btn btn-secondary btn-lg px-4" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-success btn-lg px-4 ms-3" 
                                onclick="guardarOfertaLaboral(${idEstablecimiento})" 
                                id="btnGuardarOferta" disabled>
                            <i class="fas fa-save me-2"></i>Crear Oferta Laboral
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Eliminar modal existente si existe
    const existingModal = document.getElementById('modalCrearOferta');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalCrearOferta'));
    modal.show();
    
    // Cargar datos de forma asíncrona
    try {
        console.log('🔄 Cargando datos para el formulario...');
        
        // Cargar puestos de trabajo y especies en paralelo
        const [puestos, especies] = await Promise.all([
            cargarPuestosTrabajo(),
            cargarEspeciesParaOfertas()
        ]);
        
        // Llenar dropdown de puestos de trabajo
        const selectPuestos = document.getElementById('idPuestoTrabajo');
        if (selectPuestos) {
            puestos.forEach(puesto => {
                const option = document.createElement('option');
                option.value = puesto.id || puesto.idPuestoTrabajo;
                option.textContent = puesto.nombre || puesto.descripcion;
                selectPuestos.appendChild(option);
            });
        }
        
        // Llenar dropdown de especies
        const selectEspecies = document.getElementById('idEspecie');
        if (selectEspecies && especies.length > 0) {
            especies.forEach(especie => {
                const option = document.createElement('option');
                option.value = especie.id || especie.idEspecie;
                option.textContent = especie.nombre;
                selectEspecies.appendChild(option);
            });
        }
        
        // Establecer fecha mínima (mañana)
        const fechaCierre = document.getElementById('fechaCierre');
        if (fechaCierre) {
            const mañana = new Date();
            mañana.setDate(mañana.getDate() + 1);
            fechaCierre.min = mañana.toISOString().split('T')[0];
        }
        
        // Ocultar loading y mostrar formulario
        document.getElementById('loadingContent').style.display = 'none';
        document.getElementById('formCrearOferta').style.display = 'block';
        document.getElementById('btnGuardarOferta').disabled = false;
        
        console.log('✅ Formulario de oferta laboral listo');
        
    } catch (error) {
        console.error('❌ Error al cargar datos del formulario:', error);
        
        // Mostrar error en el modal
        document.getElementById('loadingContent').innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle text-warning fs-1 mb-3"></i>
                <h5 class="text-warning">Error al cargar datos</h5>
                <p class="text-light">${error.message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-refresh me-2"></i>Recargar página
                </button>
            </div>
        `;
        
        showMessage('Error al cargar datos del formulario: ' + error.message, 'error');
    }
}

/**
 * Crear oferta laboral con API integrada
 * @param {number} idEstablecimiento - ID del establecimiento
 */
async function crearOfertaLaboral(idEstablecimiento) {
    console.log('🏢 Creando oferta laboral para establecimiento:', idEstablecimiento);
    
    try {
        showMessage('Cargando datos del formulario...', 'info');
        
        // Cargar datos necesarios
        await Promise.all([
            cargarPuestosTrabajo(),
            cargarEspeciesParaOfertas()
        ]);
        
        // Crear HTML del modal con dropdowns dinámicos
        const modalHtml = `
        <div class="modal fade" id="modalCrearOferta" tabindex="-1" aria-labelledby="modalCrearOfertaLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content bg-dark border-secondary">
                    <div class="modal-header border-secondary" style="background: #2c2c2c;">
                        <h5 class="modal-title text-light fw-bold" id="modalCrearOfertaLabel">
                            <i class="fas fa-briefcase me-2 text-warning"></i>
                            Nueva Oferta Laboral
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4" style="background: #1e1e1e;">
                        <form id="formOfertaLaboral">
                            <div class="row g-4">
                                <div class="col-md-6">
                                    <label class="form-label text-light fw-semibold fs-6">
                                        <i class="fas fa-hammer me-2 text-primary"></i>Puesto de Trabajo *
                                    </label>
                                    <select class="form-select form-select-lg bg-dark text-light border-secondary" 
                                            id="idPuestoTrabajo" required>
                                        <option value="">Seleccionar puesto...</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-light fw-semibold fs-6">
                                        <i class="fas fa-seedling me-2 text-success"></i>Especie (Opcional)
                                    </label>
                                    <select class="form-select form-select-lg bg-dark text-light border-secondary" 
                                            id="idEspecie">
                                        <option value="">No especifica especie</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row g-4 mt-2">
                                <div class="col-md-6">
                                    <label class="form-label text-light fw-semibold fs-6">
                                        <i class="fas fa-calendar-times me-2 text-danger"></i>Fecha de Cierre *
                                    </label>
                                    <input type="date" class="form-control form-control-lg bg-dark text-light border-secondary" 
                                           id="fechaCierre" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-light fw-semibold fs-6">
                                        <i class="fas fa-users me-2 text-warning"></i>Vacantes Disponibles *
                                    </label>
                                    <input type="number" class="form-control form-control-lg bg-dark text-light border-secondary" 
                                           id="vacantes" min="1" value="1" required>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer border-secondary p-4" style="background: #1a1a1a;">
                        <button type="button" class="btn btn-secondary btn-lg px-4" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-success btn-lg px-4 ms-3" id="btnGuardarOferta" onclick="guardarOfertaLaboral(${idEstablecimiento})">
                            <i class="fas fa-save me-2"></i>Crear Oferta Laboral
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Eliminar modal existente si existe
        const existingModal = document.getElementById('modalCrearOferta');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalCrearOferta'));
        modal.show();
        
        // Establecer fecha mínima como mañana
        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);
        document.getElementById('fechaCierre').min = mañana.toISOString().split('T')[0];
        
        // Cargar y poblar dropdowns después de mostrar el modal
        await poblarDropdowns();
        
        showMessage('Formulario listo para completar', 'success');
        
    } catch (error) {
        console.error('❌ Error cargando formulario:', error);
        showMessage('Error al cargar datos del formulario: ' + error.message, 'error');
    }
}

/**
 * Poblar dropdowns del modal de ofertas laborales
 */
async function poblarDropdowns() {
    try {
        console.log('🔄 Poblando dropdowns del formulario...');
        
        // Cargar datos en paralelo
        const [puestos, especies] = await Promise.all([
            cargarPuestosTrabajo(),
            cargarEspeciesParaOfertas()
        ]);
        
        console.log('📋 Datos de puestos recibidos:', puestos);
        console.log('📋 Datos de especies recibidos:', especies);
        
        // Mostrar estructura detallada del primer puesto para debugging
        if (Array.isArray(puestos) && puestos.length > 0) {
            console.log('🔍 Estructura del primer puesto:', JSON.stringify(puestos[0], null, 2));
            console.log('🔍 Campos disponibles en puesto:', Object.keys(puestos[0]));
        }
        
        // Mostrar estructura detallada de la primera especie para debugging
        if (Array.isArray(especies) && especies.length > 0) {
            console.log('🔍 Estructura de la primera especie:', JSON.stringify(especies[0], null, 2));
            console.log('🔍 Campos disponibles en especie:', Object.keys(especies[0]));
        }
        
        // Poblar dropdown de puestos de trabajo
        const selectPuestos = document.getElementById('idPuestoTrabajo');
        if (selectPuestos && Array.isArray(puestos) && puestos.length > 0) {
            // Limpiar opciones existentes (excepto la primera)
            while (selectPuestos.children.length > 1) {
                selectPuestos.removeChild(selectPuestos.lastChild);
            }
            
            puestos.forEach(puesto => {
                const option = document.createElement('option');
                option.value = puesto.id || puesto.idPuestoTrabajo || puesto.codigo;
                
                // Usar nombrePuestoTrabajo como campo principal
                const nombrePuesto = puesto.nombrePuestoTrabajo || 
                                   puesto.nombrePuesto || 
                                   puesto.nombre || 
                                   puesto.descripcion || 
                                   puesto.title || 
                                   puesto.label || 
                                   `Puesto ${option.value}`;
                
                option.textContent = nombrePuesto;
                selectPuestos.appendChild(option);
                console.log(`✅ Agregado puesto: ID=${option.value}, Nombre="${nombrePuesto}"`);
            });
            console.log(`✅ ${puestos.length} puestos de trabajo agregados al dropdown`);
        } else {
            console.warn('⚠️ No se encontraron puestos de trabajo válidos:', puestos);
        }
        
        // Poblar dropdown de especies
        const selectEspecies = document.getElementById('idEspecie');
        if (selectEspecies && Array.isArray(especies) && especies.length > 0) {
            // Limpiar opciones existentes (excepto la primera)
            while (selectEspecies.children.length > 1) {
                selectEspecies.removeChild(selectEspecies.lastChild);
            }
            
            especies.forEach(especie => {
                const option = document.createElement('option');
                option.value = especie.id || especie.idEspecie || especie.codigo;
                
                // Intentar diferentes campos para el nombre
                const nombreEspecie = especie.nombre || 
                                     especie.descripcion || 
                                     especie.nombreEspecie || 
                                     especie.nombreComun || 
                                     especie.nombreCientifico || 
                                     especie.title || 
                                     especie.label || 
                                     `Especie ${option.value}`;
                
                option.textContent = nombreEspecie;
                selectEspecies.appendChild(option);
                console.log(`✅ Agregada especie: ID=${option.value}, Nombre="${nombreEspecie}"`);
            });
            console.log(`✅ ${especies.length} especies agregadas al dropdown`);
        } else {
            console.warn('⚠️ No se encontraron especies válidas o el endpoint devolvió vacío:', especies);
        }
        
    } catch (error) {
        console.error('❌ Error poblando dropdowns:', error);
        showMessage('Error al cargar opciones del formulario: ' + error.message, 'error');
    }
}

/**
 * Guardar oferta laboral para el API
 * @param {number} idEstablecimiento - ID del establecimiento
 */
async function guardarOfertaLaboral(idEstablecimiento) {
    console.log('💾 Guardando oferta laboral para establecimiento:', idEstablecimiento);
    
    try {
        // Mostrar loading en el botón
        const btnGuardar = document.getElementById('btnGuardarOferta');
        const originalText = btnGuardar.innerHTML;
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
        
        // Recopilar datos del formulario según el formato de la API
        const formData = {
            fechaCierre: document.getElementById('fechaCierre').value,
            vacantes: parseInt(document.getElementById('vacantes').value),
            idPuestoTrabajo: parseInt(document.getElementById('idPuestoTrabajo').value),
            idEspecie: document.getElementById('idEspecie').value ? parseInt(document.getElementById('idEspecie').value) : null,
            idEstablecimiento: parseInt(idEstablecimiento)
        };
        
        console.log('📋 Datos a enviar:', formData);
        
        // Validar datos requeridos
        if (!formData.fechaCierre) {
            throw new Error('La fecha de cierre es obligatoria');
        }
        
        if (!formData.vacantes || formData.vacantes <= 0) {
            throw new Error('El número de vacantes debe ser mayor a cero');
        }
        
        if (!formData.idPuestoTrabajo) {
            throw new Error('Debe seleccionar un puesto de trabajo');
        }
        
        if (!formData.idEstablecimiento) {
            throw new Error('ID del establecimiento requerido');
        }
        
        // Validar que la fecha de cierre sea futura
        const fechaCierre = new Date(formData.fechaCierre);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fechaCierre <= hoy) {
            throw new Error('La fecha de cierre debe ser posterior a hoy');
        }
        
        // Enviar datos al backend
        const resultado = await enviarOfertaLaboral(formData);
        
        console.log('✅ Oferta laboral creada exitosamente:', resultado);
        showMessage('¡Oferta laboral creada exitosamente!', 'success');
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalCrearOferta'));
        modal.hide();
        
        // Limpiar modal del DOM después de un breve delay
        setTimeout(() => {
            const modalElement = document.getElementById('modalCrearOferta');
            if (modalElement) {
                modalElement.remove();
            }
        }, 500);
        
    } catch (error) {
        console.error('❌ Error guardando oferta laboral:', error);
        showMessage('Error al crear oferta laboral: ' + error.message, 'error');
        
        // Restaurar botón
        const btnGuardar = document.getElementById('btnGuardarOferta');
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = '<i class="fas fa-save me-2"></i>Crear Oferta Laboral';
        }
    }
}

// ===========================
// INTEGRACIÓN CON DASHBOARD
// ===========================

/**
 * Inicializa la carga de establecimientos en el dashboard
 */
async function inicializarEstablecimientos() {
    console.log('🚀 Inicializando gestión de establecimientos...');
    
    // Verificar que el dashboard esté completamente renderizado
    let containerFincas = document.getElementById('empty-fincas');
    let intentos = 0;
    const maxIntentos = 10;
    
    // Esperar hasta que el elemento esté disponible
    while (!containerFincas && intentos < maxIntentos) {
        console.log(`⏳ Esperando renderizado del DOM... Intento ${intentos + 1}/${maxIntentos}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        containerFincas = document.getElementById('empty-fincas');
        intentos++;
    }
    
    if (!containerFincas) {
        console.warn('⚠️ Contenedor de fincas no encontrado después de 10 intentos');
        return;
    }
    
    console.log('✅ Contenedor de fincas encontrado, procediendo con inicialización...');

    // Mostrar estado de carga
    mostrarEstadoCargando(containerFincas);

    try {
        // Cargar establecimientos
        const establecimientos = await cargarEstablecimientos();
        
        // Renderizar en la UI
        renderizarEstablecimientos(establecimientos);
        
        console.log('✅ Gestión de establecimientos inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando establecimientos:', error);
        
        // Mostrar estado de error
        containerFincas.innerHTML = `
            <div class="error-state text-center py-5">
                <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
                <h6 class="text-muted-custom mb-3">Error cargando establecimientos</h6>
                <p class="text-muted-custom mb-4">No se pudieron cargar los datos. Verifique su conexión.</p>
                <button class="btn btn-outline-primary" onclick="inicializarEstablecimientos()">
                    <i class="fas fa-redo me-2"></i>Reintentar
                </button>
            </div>
        `;
    }
}

// ===========================
// ACCIONES DE ESTABLECIMIENTOS
// ===========================

/**
 * Ver detalles de un establecimiento
 */
async function verDetalleEstablecimiento(idEstablecimiento) {
    console.log('👁️ Mostrando detalles del establecimiento:', idEstablecimiento);
    
    try {
        // Obtener datos del establecimiento
        const establecimiento = await obtenerEstablecimientoPorId(idEstablecimiento);
        
        if (!establecimiento) {
            showMessage('No se pudo cargar la información del establecimiento', 'error');
            return;
        }

        // Crear modal con detalles
        const modalHtml = `
            <div class="modal fade" id="detalleEstablecimientoModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content bg-dark">
                        <div class="modal-header border-secondary">
                            <h5 class="modal-title text-white">
                                <i class="fas fa-building me-2"></i>
                                ${establecimiento.nombreEstablecimiento}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6 class="text-primary mb-3">
                                        <i class="fas fa-info-circle me-2"></i>Información General
                                    </h6>
                                    <div class="mb-3">
                                        <small class="text-muted">ID Establecimiento</small>
                                        <p class="text-white mb-0">${establecimiento.idEstablecimiento}</p>
                                    </div>
                                    <div class="mb-3">
                                        <small class="text-muted">Nombre</small>
                                        <p class="text-white mb-0">${establecimiento.nombreEstablecimiento}</p>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="text-primary mb-3">
                                        <i class="fas fa-map-marker-alt me-2"></i>Ubicación
                                    </h6>
                                    <div class="mb-3">
                                        <small class="text-muted">Dirección</small>
                                        <p class="text-white mb-0">${establecimiento.calle} ${establecimiento.numeracion}</p>
                                    </div>
                                    <div class="mb-3">
                                        <small class="text-muted">Código Postal</small>
                                        <p class="text-white mb-0">${establecimiento.codigoPostal}</p>
                                    </div>
                                    <div class="mb-3">
                                        <small class="text-muted">Distrito</small>
                                        <p class="text-white mb-0">${establecimiento.nombreDistrito}</p>
                                    </div>
                                    <div class="mb-3">
                                        <small class="text-muted">Departamento</small>
                                        <p class="text-white mb-0">${establecimiento.nombreDepartamento}</p>
                                    </div>
                                    ${establecimiento.latitud && establecimiento.longitud ? `
                                    <div class="mb-3">
                                        <small class="text-muted">Coordenadas</small>
                                        <p class="text-white mb-0">${establecimiento.latitud}, ${establecimiento.longitud}</p>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                            ${establecimiento.especies && establecimiento.especies.length > 0 ? `
                            <div class="row mt-4">
                                <div class="col-12">
                                    <h6 class="text-primary mb-3">
                                        <i class="fas fa-seedling me-2"></i>Especies Cultivadas
                                    </h6>
                                    <div class="row">
                                        ${establecimiento.especies.map(especie => `
                                            <div class="col-md-4 mb-2">
                                                <span class="badge bg-success">${especie.nombre || especie}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer border-secondary">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-primary" onclick="editarEstablecimiento(${establecimiento.idEstablecimiento})">
                                <i class="fas fa-edit me-2"></i>Editar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Eliminar modal existente si hay uno
        const existingModal = document.getElementById('detalleEstablecimientoModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('detalleEstablecimientoModal'));
        modal.show();

        // Limpiar modal después de cerrar
        document.getElementById('detalleEstablecimientoModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });

    } catch (error) {
        console.error('❌ Error mostrando detalles:', error);
        showMessage('Error al cargar los detalles del establecimiento', 'error');
    }
}

/**
 * Obtener establecimiento por ID
 */
async function obtenerEstablecimientoPorId(idEstablecimiento) {
    return await executeWithTokenRetry(async () => {
        const response = await fetch(`${BACKEND_CONFIG.GET_ESTABLECIMIENTOS}/${idEstablecimiento}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }, 'Obtener establecimiento');
}

/**
 * Editar establecimiento
 */
function editarEstablecimiento(idEstablecimiento) {
    console.log('✏️ Editando establecimiento:', idEstablecimiento);
    // Por ahora, mostrar mensaje de funcionalidad en desarrollo
    showMessage('Funcionalidad de edición en desarrollo. Próximamente disponible.', 'info');
}

/**
 * Eliminar establecimiento con confirmación
 */
function eliminarEstablecimiento(idEstablecimiento, nombreEstablecimiento) {
    console.log('🗑️ Eliminando establecimiento:', idEstablecimiento, nombreEstablecimiento);
    
    // Mostrar modal de confirmación
    const confirmationHtml = `
        <div class="modal fade" id="confirmarEliminacionModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content bg-dark">
                    <div class="modal-header border-secondary">
                        <h5 class="modal-title text-white">
                            <i class="fas fa-exclamation-triangle text-warning me-2"></i>
                            Confirmar Eliminación
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-white">
                        <p>¿Está seguro que desea eliminar el establecimiento?</p>
                        <div class="alert alert-warning">
                            <strong>${nombreEstablecimiento}</strong><br>
                            <small>ID: ${idEstablecimiento}</small>
                        </div>
                        <p class="text-danger">
                            <strong>⚠️ Esta acción no se puede deshacer.</strong>
                        </p>
                    </div>
                    <div class="modal-footer border-secondary">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-danger" onclick="confirmarEliminacionEstablecimiento(${idEstablecimiento}, '${nombreEstablecimiento.replace(/'/g, "\\'")}')">
                            <i class="fas fa-trash me-2"></i>Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Eliminar modal existente si hay uno
    const existingModal = document.getElementById('confirmarEliminacionModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', confirmationHtml);

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('confirmarEliminacionModal'));
    modal.show();

    // Limpiar modal después de cerrar
    document.getElementById('confirmarEliminacionModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

/**
 * Confirmar eliminación definitiva
 */
async function confirmarEliminacionEstablecimiento(idEstablecimiento, nombreEstablecimiento) {
    console.log('🗑️ Confirmando eliminación del establecimiento:', idEstablecimiento);
    
    try {
        // Cerrar modal de confirmación
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmarEliminacionModal'));
        if (modal) {
            modal.hide();
        }

        // Mostrar loading
        showMessage('Eliminando establecimiento...', 'info');

        // Realizar eliminación
        await executeWithTokenRetry(async () => {
            const response = await fetch(`${BACKEND_CONFIG.GET_ESTABLECIMIENTOS}/${idEstablecimiento}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            return response.json();
        }, 'Eliminar establecimiento');

        // Mostrar éxito
        showMessage(`Establecimiento "${nombreEstablecimiento}" eliminado exitosamente`, 'success');

        // Recargar lista de establecimientos
        setTimeout(async () => {
            await inicializarEstablecimientos();
        }, 1000);

    } catch (error) {
        console.error('❌ Error eliminando establecimiento:', error);
        showMessage('Error al eliminar el establecimiento. Inténtelo nuevamente.', 'error');
    }
}

// ===========================
// REGISTRO DE FINCA
// ===========================
// REGISTRO DE ESTABLECIMIENTO
// ===========================
// REGISTRO DE ESTABLECIMIENTO CON MANEJO ROBUSTO JWT
// ===========================

async function confirmarRegistroMejorado() {
    const btnConfirmar = document.getElementById('btn-confirmar');
    const btnVolver = document.querySelector('.modal-footer .btn-secondary');
    
    console.log('🚀 Iniciando proceso de registro de establecimiento...');
    
    // PASO 1: Prueba de integración - Verificación inicial
    console.log('🏁 Iniciando prueba de integración del registro...');
    console.group('1️⃣ Verificación del estado inicial');
    const tokenInicial = obtenerToken();
    console.log('🔑 Token inicial:', tokenInicial ? 'Presente' : 'No disponible');
    console.log('📦 Datos en localStorage:', {
        jwt: localStorage.getItem('jwt_token') ? 'Presente' : 'No disponible',
        user: localStorage.getItem('user_data') ? 'Presente' : 'No disponible'
    });
    console.groupEnd();
    
    // PASO 2: Verificar token JWT
    console.group('2️⃣ Validación del token JWT');
    console.log('🔑 Verificando token JWT antes del registro...');
    const tokenValido = await validateCurrentToken();
    console.log('✅ Resultado de validación:', tokenValido);
    console.groupEnd();
    
    if (!tokenValido.valid) {
        console.group('3️⃣ Intento de refresh del token');
        console.log('❌ Token inválido. Intentando refresh...');
        const refreshExitoso = await autoRefreshToken();
        if (!refreshExitoso) {
            console.error('💥 No se pudo refrescar el token. Abortando registro.');
            console.groupEnd();
            alert('Error de autenticación. Por favor, inicia sesión nuevamente.');
            // Restaurar botones
            btnConfirmar.disabled = false;
            btnVolver.disabled = false;
            btnConfirmar.innerHTML = 'Confirmar Registro';
            return;
        }
        console.log('✅ Token refrescado exitosamente');
        console.groupEnd();
    }
    
    // Deshabilitar botones durante el proceso
    btnConfirmar.disabled = true;
    btnVolver.disabled = true;
    btnConfirmar.innerHTML = '<div class="spinner-border spinner-border-sm me-2" role="status"></div>Registrando establecimiento...';

    try {
        // Logs de debugging para JWT - DESPUÉS de validar el token
        logTokenDebugInfo('DESPUÉS DE VALIDAR TOKEN - confirmarRegistro');
        
        // PASO 4: Preparación de datos
        console.group('6️⃣ Preparación de datos para envío');
        const datosEnvio = {
            nombreEstablecimiento: wizardData.datos.nombreEstablecimiento,
            calle: wizardData.datos.calle,
            numeracion: wizardData.datos.numeracion,
            codigoPostal: wizardData.datos.codigoPostal,
            latitud: parseFloat(wizardData.datos.latitud),
            longitud: parseFloat(wizardData.datos.longitud),
            idDistrito: parseInt(wizardData.datos.idDistrito),
            idsEspecies: Array.isArray(wizardData.datos.idsEspecies) 
                ? wizardData.datos.idsEspecies.map(id => parseInt(id))
                : [parseInt(wizardData.datos.idsEspecies)]
        };

        // Validación exhaustiva de datos
        console.log('📋 Datos preparados:', JSON.stringify(datosEnvio, null, 2));
        console.log('� Validación de tipos:', {
            nombreEstablecimiento: typeof datosEnvio.nombreEstablecimiento,
            calle: typeof datosEnvio.calle,
            numeracion: typeof datosEnvio.numeracion,
            codigoPostal: typeof datosEnvio.codigoPostal,
            latitud: `${typeof datosEnvio.latitud} (${datosEnvio.latitud})`,
            longitud: `${typeof datosEnvio.longitud} (${datosEnvio.longitud})`,
            idDistrito: `${typeof datosEnvio.idDistrito} (${datosEnvio.idDistrito})`,
            idsEspecies: `array[${datosEnvio.idsEspecies.length}] (${datosEnvio.idsEspecies.join(', ')})`
        });
        console.groupEnd();
        
        if (!datosEnvio.nombreEstablecimiento || !datosEnvio.calle || !datosEnvio.numeracion || 
            !datosEnvio.codigoPostal || !datosEnvio.idDistrito || !datosEnvio.idsEspecies?.length ||
            isNaN(datosEnvio.latitud) || isNaN(datosEnvio.longitud) || isNaN(datosEnvio.idDistrito)) {
            throw new Error('Faltan datos obligatorios para el registro');
        }

        // Ejecutar registro con retry automático de token
        const establecimientoRegistrado = await executeWithTokenRetry(async () => {
            
            const url = buildURL(BACKEND_CONFIG.ENDPOINTS.REGISTER_FINCA);
            console.log('🌐 URL COMPLETA DE PETICIÓN:', url);
            console.log('📤 DATOS A ENVIAR:', JSON.stringify(datosEnvio, null, 2));
            console.log('🔑 TOKEN ANTES DE PETICIÓN:', localStorage.getItem('jwt_token') ? 'Token presente' : 'No hay token');

            // Realizar petición autenticada al backend
            const response = await fetchWithAuth(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosEnvio)
            });

            console.log('📡 RESPUESTA COMPLETA - Status:', response.status);
            console.log('📡 RESPUESTA COMPLETA - Status Text:', response.statusText);
            console.log('📡 RESPUESTA COMPLETA - Headers:', [...response.headers.entries()]);
            console.log('📡 RESPUESTA COMPLETA - URL:', response.url);

            // PASO 6: Manejo de errores HTTP
            if (!response.ok) {
                console.group('❌ Error en el registro');
                let errorMessage = 'Error desconocido del servidor';
                
                try {
                    const errorData = await response.json();
                    console.error('📝 Detalles del error:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorData: errorData,
                        headers: Object.fromEntries([...response.headers.entries()])
                    });
                    
                    switch (response.status) {
                        case 401:
                            console.error('❌ Token expirado o inválido (401)');
                            throw new Error('401: Token expirado o inválido');
                            
                        case 403:
                            console.error('❌ Acceso prohibido (403)');
                            errorMessage = 'No tiene permisos para realizar esta operación. Verifique sus credenciales.';
                            
                            // Si es 403, también intentar renovar token para el retry
                            if (errorData.message && errorData.message.includes('token')) {
                                throw new Error('403: Token sin permisos válidos');
                            }
                            throw new Error(errorMessage);
                            
                        case 400:
                            errorMessage = errorData.message || errorData.error || 'Datos inválidos. Verifique la información ingresada.';
                            if (errorData.errors && Array.isArray(errorData.errors)) {
                                errorMessage = errorData.errors.join(', ');
                            }
                            break;
                            
                        case 409:
                            errorMessage = 'Ya existe un establecimiento con estos datos.';
                            break;
                            
                        case 422:
                            errorMessage = 'Los datos enviados no cumplen con los requisitos del servidor.';
                            break;
                            
                        case 500:
                            errorMessage = 'Error interno del servidor. Intente nuevamente en unos momentos.';
                            break;
                            
                        default:
                            errorMessage = `Error del servidor (${response.status}): ${errorData.message || response.statusText}`;
                    }
                } catch (parseError) {
                    console.error('❌ Error parsing respuesta de error:', parseError);
                    errorMessage = `Error del servidor (${response.status}): ${response.statusText}`;
                }
                
                throw new Error(errorMessage);
            }

            // Procesar respuesta exitosa
            const establecimiento = await response.json();
            console.log('✅ ESTABLECIMIENTO REGISTRADO EXITOSAMENTE:', establecimiento);
            console.log('✅ TIPO DE RESPUESTA:', typeof establecimiento);
            console.log('✅ PROPIEDADES DE LA RESPUESTA:', Object.keys(establecimiento));

            // Validar estructura de respuesta
            if (!establecimiento) {
                throw new Error('Respuesta vacía del servidor');
            }
            
            return establecimiento;
            
        }, 'Registro de Establecimiento');

        console.log('🎉 PROCESO DE REGISTRO COMPLETADO EXITOSAMENTE');
        console.log('🎉 DATOS DEL ESTABLECIMIENTO REGISTRADO:', establecimientoRegistrado);

        // Mostrar mensaje de éxito con datos del establecimiento
        mostrarRegistroExitoso(establecimientoRegistrado);

        // Cerrar modal después de mostrar éxito
        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('wizardFincaModal'));
            if (modal) {
                modal.hide();
            }
            
            // Actualizar dashboard con el nuevo establecimiento
            actualizarDashboardConEstablecimiento(establecimientoRegistrado);
        }, 3000);

    } catch (error) {
        console.error('❌ Error completo en registro de establecimiento:', error);
        
        // Restaurar estado de botones
        btnConfirmar.disabled = false;
        btnVolver.disabled = false;
        btnConfirmar.innerHTML = '<i class="fas fa-check me-2"></i>Confirmar Registro';
        
        // Mostrar error específico al usuario con diferentes mensajes según el tipo
        let userMessage = error.message;
        
        if (error.message.includes('401') || error.message.includes('403')) {
            userMessage = 'Su sesión ha expirado o no tiene permisos. La página se recargará para iniciar sesión nuevamente.';
            
            // Toast de advertencia y redirección automática
            mostrarMensajeError(userMessage);
            
            setTimeout(() => {
                cerrarSesion();
                window.location.reload();
            }, 3000);
            
        } else if (error.message.includes('Sesión expirada')) {
            mostrarMensajeError('Su sesión ha expirado. La página se recargará para iniciar sesión nuevamente.');
            
            setTimeout(() => {
                cerrarSesion();
                window.location.reload();
            }, 3000);
            
        } else {
            mostrarMensajeError(`Error al registrar el establecimiento: ${userMessage}`);
        }
        
        // Agregar animación de error al botón
        btnConfirmar.classList.add('btn-error');
        setTimeout(() => {
            btnConfirmar.classList.remove('btn-error');
        }, 1000);
    }
}

// Función original mantenida como respaldo
async function confirmarRegistro() {
    // Redirigir a la versión mejorada con manejo robusto de JWT
    return await confirmarRegistroMejorado();
}

function mostrarRegistroExitoso(establecimiento) {
    const wizardContent = document.getElementById('wizard-content');
    
    wizardContent.innerHTML = `
        <div class="text-center py-5">
            <div class="success-animation mb-4">
                <i class="fas fa-check-circle fa-5x text-success"></i>
            </div>
            <h3 class="text-success mb-3">¡Establecimiento Registrado Exitosamente!</h3>
            <p class="text-muted mb-4">
                Su establecimiento "${establecimiento.nombreEstablecimiento || establecimiento.nombre}" ha sido registrado correctamente.
            </p>
            
            <div class="card bg-dark border-success mx-auto" style="max-width: 400px;">
                <div class="card-body">
                    <h6 class="card-title text-success">
                        <i class="fas fa-info-circle me-2"></i>
                        Detalles del Registro
                    </h6>
                    <ul class="list-unstyled mb-0 text-start">
                        <li><strong>ID:</strong> ${establecimiento.idEstablecimiento || establecimiento.id}</li>
                        <li><strong>Nombre:</strong> ${establecimiento.nombreEstablecimiento || establecimiento.nombre}</li>
                        <li><strong>Estado:</strong> <span class="badge bg-success">Activo</span></li>
                    </ul>
                </div>
            </div>
            
            <div class="mt-4">
                <p class="text-muted small">
                    <i class="fas fa-clock me-1"></i>
                    Esta ventana se cerrará automáticamente en unos segundos
                </p>
            </div>
        </div>

        <style>
            .success-animation i {
                animation: successPulse 2s ease-in-out infinite;
            }
            
            @keyframes successPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
        </style>
    `;
}

function actualizarDashboardConFinca(finca) {
    // Actualizar la sección de fincas en el dashboard
    const emptyFincas = document.getElementById('empty-fincas');
    if (emptyFincas) {
        emptyFincas.innerHTML = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <div class="finca-card p-3 border border-success rounded">
                        <h6 class="text-success mb-2">
                            <i class="fas fa-check-circle me-2"></i>
                            ${finca.nombreEstablecimiento || finca.nombre}
                        </h6>
                        <p class="text-muted small mb-2">
                            <i class="fas fa-map-marker-alt me-1"></i>
                            ${wizardData.datosDisplay.direccion}
                        </p>
                        <p class="text-muted small mb-0">
                            <i class="fas fa-seedling me-1"></i>
                            ${wizardData.datosDisplay.especies.length} especie(s) cultivada(s)
                        </p>
                        <span class="badge bg-success mt-2">Registrada recientemente</span>
                    </div>
                </div>
                <div class="col-md-6 mb-3 d-flex align-items-center justify-content-center">
                    <button class="btn btn-outline-primary" onclick="abrirWizardFinca()">
                        <i class="fas fa-plus me-2"></i>Agregar Otra Finca
                    </button>
                </div>
            </div>
        `;
    }

    // Actualizar contador de fincas
    const statsNumber = document.querySelector('.stats-card .stats-number');
    if (statsNumber && statsNumber.textContent === '0') {
        statsNumber.textContent = '1';
    }

    // Mostrar toast de éxito
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-check-circle me-2"></i>
                ¡Finca registrada exitosamente!
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    // Crear contenedor de toasts si no existe
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Función mejorada para actualizar dashboard con establecimiento registrado
function actualizarDashboardConEstablecimiento(establecimiento) {
    console.log('📊 Actualizando dashboard con establecimiento:', establecimiento);
    
    // Recargar todos los establecimientos para mostrar el estado actualizado
    setTimeout(async () => {
        try {
            console.log('🔄 Recargando lista de establecimientos...');
            await inicializarEstablecimientos();
            console.log('✅ Lista de establecimientos recargada exitosamente');
        } catch (error) {
            console.error('❌ Error recargando establecimientos:', error);
            // En caso de error, mostrar feedback básico
            showMessage('Establecimiento registrado, pero la lista podría no estar actualizada. Recargue la página.', 'warning');
        }
    }, 1000);

    // Mostrar toast de éxito mejorado
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-check-circle me-2"></i>
                ¡Establecimiento "${establecimiento.nombreEstablecimiento || establecimiento.nombre}" registrado exitosamente!
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    // Crear contenedor de toasts si no existe
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 5000 });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
    
    console.log('✅ Dashboard actualizado correctamente');
}

// ===========================
// FUNCIONES DE FEEDBACK VISUAL
// ===========================

// Mostrar feedback de campo
function showFieldFeedback(input, isValid, message) {
	// Limpiar estados previos
	input.classList.remove('is-valid', 'is-invalid', 'shake');
	
	// Buscar o crear div de feedback
	let feedbackDiv = input.parentNode.querySelector('.field-feedback');
	if (!feedbackDiv) {
		feedbackDiv = document.createElement('div');
		feedbackDiv.className = 'field-feedback';
		input.parentNode.appendChild(feedbackDiv);
	}
	
	if (isValid) {
		input.classList.add('is-valid');
		feedbackDiv.className = 'field-feedback text-success';
		feedbackDiv.innerHTML = `<i class="fas fa-check-circle me-1"></i>${message}`;
	} else {
		input.classList.add('is-invalid');
		feedbackDiv.className = 'field-feedback text-danger';
		feedbackDiv.innerHTML = `<i class="fas fa-exclamation-circle me-1"></i>${message}`;
		input.classList.add('shake');
		setTimeout(() => input.classList.remove('shake'), 500);
	}
}

// Función genérica para agregar contador de caracteres con colores
function addCharacterCounter(inputId, maxLength, options = {}) {
	const input = document.getElementById(inputId);
	if (!input) return;
	
	const config = {
		warningThreshold: options.warningThreshold || Math.floor(maxLength * 0.8), // 80% por defecto
		dangerThreshold: options.dangerThreshold || Math.floor(maxLength * 0.92),   // 92% por defecto
		allowOnlyNumbers: options.allowOnlyNumbers || false,
		allowUppercase: options.allowUppercase || false,
		customRegex: options.customRegex || null,
		...options
	};
	
	// Crear contenedor para el contador si no existe
	if (!input.parentNode.querySelector('.char-counter')) {
		const counter = document.createElement('div');
		counter.className = 'char-counter';
		counter.textContent = `0/${maxLength}`;
		input.parentNode.style.position = 'relative';
		input.parentNode.appendChild(counter);
	}
	
	// Event listener para el input
	input.addEventListener('input', function() {
		let value = this.value;
		
		// Verificar si el campo tiene conversión automática a mayúsculas
		const hasUppercaseConverter = this.getAttribute('data-uppercase') === 'true';
		
		// Aplicar transformaciones según configuración
		if (config.allowOnlyNumbers) {
			value = value.replace(/\D/g, '');
		} else if (config.customRegex && !hasUppercaseConverter) {
			// Solo aplicar regex si NO tiene conversión automática a mayúsculas
			value = value.replace(config.customRegex, '');
		} else if (config.customRegex && hasUppercaseConverter) {
			// Si tiene conversión automática, permitir minúsculas temporalmente
			// Convertir a mayúsculas antes de aplicar el regex
			const upperValue = value.toUpperCase();
			value = upperValue.replace(config.customRegex, '');
		}
		
		if (config.allowUppercase && !hasUppercaseConverter) {
			// Solo convertir aquí si NO tiene un convertidor automático
			value = value.toUpperCase();
		}
		
		// Limitar caracteres
		value = value.slice(0, maxLength);
		this.value = value;
		
		// Actualizar contador
		const counter = this.parentNode.querySelector('.char-counter');
		if (counter) {
			const currentLength = value.length;
			counter.textContent = `${currentLength}/${maxLength}`;
			
			// Cambiar color según la cantidad de caracteres
			counter.classList.remove('warning', 'danger');
			if (currentLength >= config.dangerThreshold) {
				counter.classList.add('danger');
			} else if (currentLength >= config.warningThreshold) {
				counter.classList.add('warning');
			}
		}
	});
}

// Agregar estado de carga a botón o contenedor
function addLoadingState(element, message = 'Procesando...') {
	// Si es un botón
	if (element.tagName === 'BUTTON' || element.tagName === 'INPUT') {
		const originalText = element.textContent;
		const originalDisabled = element.disabled;
		
		element.disabled = true;
		element.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>${message}`;
		element.classList.add('loading');
		
		return function removeLoading() {
			element.disabled = originalDisabled;
			element.textContent = originalText;
			element.classList.remove('loading');
		};
	} else {
		// Si es un contenedor, crear un div de loading
		const loadingDiv = document.createElement('div');
		loadingDiv.className = 'mb-3 loading-state';
		loadingDiv.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>${message}`;
		element.appendChild(loadingDiv);
		
		return function removeLoading() {
			const loadingDiv = element.querySelector('.loading-state');
			if (loadingDiv) loadingDiv.remove();
		};
	}
}

// Función para convertir automáticamente texto a mayúsculas mientras se escribe
function addUppercaseConverter(inputId) {
	const input = document.getElementById(inputId);
	if (!input) return;
	
	console.log(`Configurando conversión automática para: ${inputId}`);
	
	// Función principal para convertir a mayúsculas
	function convertToUppercase() {
		const start = input.selectionStart;
		const end = input.selectionEnd;
		const value = input.value;
		const upperValue = value.toUpperCase();
		
		if (value !== upperValue) {
			input.value = upperValue;
			input.setSelectionRange(start, end);
			
			// Breve feedback visual
			input.classList.add('uppercase-converting');
			setTimeout(() => input.classList.remove('uppercase-converting'), 100);
			
			console.log(`Convertido: "${value}" → "${upperValue}"`);
		}
	}
	
	// Event listeners para todos los tipos de entrada
	input.addEventListener('input', function(e) {
		setTimeout(convertToUppercase, 0);
	});
	
	input.addEventListener('keydown', function(e) {
		setTimeout(convertToUppercase, 0);
	});
	
	input.addEventListener('keyup', function(e) {
		setTimeout(convertToUppercase, 0);
	});
	
	input.addEventListener('paste', function(e) {
		setTimeout(convertToUppercase, 10);
	});
	
	input.addEventListener('change', function(e) {
		convertToUppercase();
	});
	
	// Configurar el campo para mayúsculas
	input.style.textTransform = 'uppercase';
	input.setAttribute('data-uppercase', 'true');
	input.setAttribute('autocapitalize', 'characters');
	
	// Convertir valor inicial
	if (input.value) {
		input.value = input.value.toUpperCase();
	}
	
	console.log(`✅ Campo ${inputId} configurado para conversión automática`);
}

// ===========================
// VALIDACIÓN DE CUIT
// ===========================

// Función para validar formato de CUIT argentino
function validateCUITFormat(cuit) {
	// Remover guiones y espacios
	const cleanCuit = cuit.replace(/[-\s]/g, '');
	
	// Verificar que tenga exactamente 11 dígitos
	if (!/^\d{11}$/.test(cleanCuit)) {
		return { valid: false, message: 'El CUIT debe tener 11 dígitos' };
	}
	
	// Algoritmo de verificación de CUIT argentino
	const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
	const digits = cleanCuit.split('').map(Number);
	const checkDigit = digits[10];
	
	let sum = 0;
	for (let i = 0; i < 10; i++) {
		sum += digits[i] * weights[i];
	}
	
	const remainder = sum % 11;
	let expectedCheckDigit = 11 - remainder;
	
	if (expectedCheckDigit === 11) expectedCheckDigit = 0;
	if (expectedCheckDigit === 10) expectedCheckDigit = 9;
	
	if (checkDigit !== expectedCheckDigit) {
		return { valid: false, message: 'CUIT inválido - dígito verificador incorrecto' };
	}
	
	return { valid: true, message: 'Formato de CUIT válido' };
}

// Variable para almacenar timeouts de debounce
let cuitValidationTimeout = null;

// Función para validar CUIT con el backend
async function validateCUITWithBackend(cuit, inputElement) {
	try {
		// Mostrar estado de carga
		showCUITLoading(inputElement, true);
		
		// Construir URL del endpoint
		const url = buildURL(BACKEND_CONFIG.ENDPOINTS.VALIDATE_CUIT, cuit);
		console.log(`🔍 Validando CUIT: ${cuit} en endpoint: ${url}`);
		
		const response = await fetchWithConfig(url, {
			method: 'GET',
			signal: AbortSignal.timeout(BACKEND_CONFIG.TIMEOUTS.VALIDATION)
		});
		
		console.log(`📡 Response status: ${response.status}`);
		
		if (response.ok) {
			const exists = await response.json();
			console.log('📄 Response data:', exists);
			
			// Ocultar estado de carga
			showCUITLoading(inputElement, false);
			
			if (exists === true) {
				showFieldFeedback(inputElement, false, 'Este CUIT ya está registrado en el sistema');
				console.log('❌ CUIT ya registrado en base de datos');
				return { available: false, exists: true };
			} else {
				showFieldFeedback(inputElement, true, '¡CUIT disponible para registro!');
				console.log('✅ CUIT disponible para registro');
				return { available: true, exists: false };
			}
		} else if (response.status === 404) {
			// 404 puede significar que no existe (disponible)
			showCUITLoading(inputElement, false);
			showFieldFeedback(inputElement, true, '¡CUIT disponible para registro!');
			console.log('✅ CUIT disponible (404 - no encontrado en BD)');
			return { available: true, exists: false };
		} else {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		
	} catch (error) {
		console.error('❌ Error al validar CUIT:', error);
		showCUITLoading(inputElement, false);
		
		// Diferentes mensajes según el tipo de error
		if (error.name === 'TimeoutError') {
			showFieldFeedback(inputElement, false, 'Timeout: El servidor tardó demasiado en responder');
		} else if (error.name === 'TypeError' && error.message.includes('fetch')) {
			showFieldFeedback(inputElement, false, 'Error de conexión: Verifique que el servidor backend esté ejecutándose');
		} else {
			showFieldFeedback(inputElement, false, 'Error al validar CUIT. Intente nuevamente');
		}
		
		return { available: null, error: error.message };
	}
}

// Función para mostrar/ocultar estado de carga en el campo CUIT
function showCUITLoading(inputElement, show) {
	const loadingIcon = inputElement.parentNode.querySelector('.cuit-loading');
	
	if (show) {
		if (!loadingIcon) {
			const icon = document.createElement('div');
			icon.className = 'cuit-loading';
			icon.innerHTML = '<i class="fas fa-spinner fa-spin text-primary"></i>';
			icon.style.position = 'absolute';
			icon.style.right = '12px';
			icon.style.top = '50%';
			icon.style.transform = 'translateY(-50%)';
			icon.style.zIndex = '10';
			
			// Asegurar posición relativa en el contenedor
			if (getComputedStyle(inputElement.parentNode).position === 'static') {
				inputElement.parentNode.style.position = 'relative';
			}
			
			inputElement.parentNode.appendChild(icon);
		}
	} else {
		if (loadingIcon) {
			loadingIcon.remove();
		}
	}
}

// Función principal para validar CUIT (formato + backend)
function validateCUIT(inputElement) {
	const cuit = inputElement.value.trim();
	
	// Limpiar timeout anterior
	if (cuitValidationTimeout) {
		clearTimeout(cuitValidationTimeout);
	}
	
	// Si está vacío, limpiar feedback
	if (cuit === '') {
		showFieldFeedback(inputElement, false, '');
		showCUITLoading(inputElement, false);
		return;
	}
	
	// Validar formato primero
	const formatValidation = validateCUITFormat(cuit);
	if (!formatValidation.valid) {
		showFieldFeedback(inputElement, false, formatValidation.message);
		showCUITLoading(inputElement, false);
		return;
	}
	
	// Si el formato es válido, validar con backend usando debounce
	cuitValidationTimeout = setTimeout(async () => {
		await validateCUITWithBackend(cuit, inputElement);
	}, 500); // Debounce de 500ms
}

// Inicialización del mapa principal de la página (no el del wizard)
document.addEventListener('DOMContentLoaded', function() {
	// --- Función de ojo para mostrar/ocultar contraseña ---
	function addPasswordToggle(inputId) {
		const input = document.getElementById(inputId);
		if (!input) return;
		let wrapper = input.parentNode;
		// Evitar duplicar el icono
		if (wrapper.querySelector('.password-toggle')) return;
		const toggle = document.createElement('span');
		toggle.className = 'password-toggle';
		toggle.style.cursor = 'pointer';
		toggle.style.position = 'absolute';
		toggle.style.right = '12px';
		toggle.style.top = '50%';
		toggle.style.transform = 'translateY(-50%)';
		toggle.innerHTML = '<i class="bi bi-eye-slash" style="font-size:1.2em;"></i>';
		// Crear contenedor relativo si no existe
		if (getComputedStyle(wrapper).position === 'static') {
			wrapper.style.position = 'relative';
		}
		wrapper.appendChild(toggle);
		toggle.addEventListener('click', function() {
			if (input.type === 'password') {
				input.type = 'text';
				toggle.innerHTML = '<i class="bi bi-eye" style="font-size:1.2em;"></i>';
			} else {
				input.type = 'password';
				toggle.innerHTML = '<i class="bi bi-eye-slash" style="font-size:1.2em;"></i>';
			}
		});
	}
	addPasswordToggle('password');
	addPasswordToggle('password2');

	// Inicializar autocompletado por DNI - NOTA: Los event listeners ya están configurados arriba
	console.log('🔧 Sistema de autocompletado DNI inicializado correctamente');
	console.log('📝 Event listeners agregados a campos DNI para autocompletado automático');
	
	// Función de prueba para autocompletado (temporal para debugging)
	window.testAutocompletado = async function(dni) {
		console.log('🧪 Probando autocompletado con DNI:', dni);
		const resultado = await consultarPersonaPorDni(dni);
		console.log('🧪 Resultado:', resultado);
		return resultado;
	};
	
	// Función de prueba para simular blur event
	window.testBlur = function() {
		const dniField = document.getElementById('dni');
		if (dniField) {
			console.log('🧪 Simulando blur en campo DNI con valor:', dniField.value);
			dniField.dispatchEvent(new Event('blur'));
		} else {
			console.log('❌ Campo DNI no encontrado');
		}
	};
	
	// Función para verificar el estado completo del autocompletado
	window.debugAutocompletado = function() {
		console.log('🔍 === DIAGNÓSTICO DE AUTOCOMPLETADO ===');
		
		// Verificar campos existentes
		const campos = {
			dni: document.getElementById('dni'),
			nombre: document.getElementById('nombre'),
			apellido: document.getElementById('apellido'),
			email: document.getElementById('email'),
			telefono: document.getElementById('telefono')
		};
		
		console.log('📋 Campos encontrados:', {
			dni: !!campos.dni,
			nombre: !!campos.nombre,
			apellido: !!campos.apellido,
			email: !!campos.email,
			telefono: !!campos.telefono
		});
		
		// Verificar event listeners
		if (campos.dni) {
			console.log('📝 Valor actual del DNI:', campos.dni.value);
			console.log('🎯 Clases del campo DNI:', campos.dni.className);
			
			// Verificar si tiene event listeners
			const clonedNode = campos.dni.cloneNode(true);
			console.log('👂 ¿Tiene event listeners?', campos.dni !== clonedNode);
		}
		
		// Probar conectividad con backend
		console.log('🌐 Probando conectividad con backend...');
		fetch('http://localhost:9090/api/persona/12345678')
			.then(response => {
				console.log('📡 Respuesta del servidor:', {
					status: response.status,
					statusText: response.statusText,
					url: response.url
				});
				return response.text();
			})
			.then(text => {
				console.log('📄 Cuerpo de respuesta:', text);
			})
			.catch(error => {
				console.error('❌ Error de conectividad:', error);
			});
		
		return campos;
	};

	// Función de test completa para autocompletado
	window.testAutocompletadoCompleto = async function(dniTest = '35876866') {
		console.log('🧪 === INICIANDO TEST COMPLETO DE AUTOCOMPLETADO ===');
		console.log('🧪 DNI de prueba:', dniTest);
		
		// 1. Verificar que los campos existen
		const campos = {
			dni: document.getElementById('dni'),
			nombre: document.getElementById('nombre'),
			apellido: document.getElementById('apellido'),
			email: document.getElementById('email'),
			telefono: document.getElementById('telefono')
		};
		
		console.log('🧪 1. Verificando campos...');
		let camposFaltantes = [];
		Object.keys(campos).forEach(key => {
			if (!campos[key]) {
				camposFaltantes.push(key);
			}
		});
		
		if (camposFaltantes.length > 0) {
			console.error('❌ Campos faltantes:', camposFaltantes);
			return false;
		}
		console.log('✅ Todos los campos están presentes');
		
		// 2. Simular ingreso de DNI
		console.log('🧪 2. Simulando ingreso de DNI...');
		campos.dni.value = dniTest;
		campos.dni.focus();
		
		// 3. Probar consulta directa al backend
		console.log('🧪 3. Probando consulta al backend...');
		try {
			const resultado = await consultarPersonaPorDni(dniTest);
			console.log('✅ Resultado de consulta:', resultado);
			
			if (resultado) {
				console.log('✅ Persona encontrada en backend');
				console.log('📄 Datos:', {
					nombre: resultado.nombrePersona,
					apellido: resultado.apellido,
					email: resultado.email,
					telefono: resultado.telefono
				});
			} else {
				console.log('⚠️ Persona no encontrada en backend (DNI no existe)');
			}
		} catch (error) {
			console.error('❌ Error al consultar backend:', error);
			return false;
		}
		
		// 4. Probar autocompletado completo
		console.log('🧪 4. Probando autocompletado completo...');
		try {
			await autocompletarPersona('dni', 'nombre', 'apellido', 'email', 'telefono');
			console.log('✅ Autocompletado ejecutado sin errores');
			
			// Verificar si los campos se llenaron
			console.log('📋 Valores después del autocompletado:', {
				nombre: campos.nombre.value,
				apellido: campos.apellido.value,
				email: campos.email.value,
				telefono: campos.telefono.value
			});
			
			console.log('📋 Estados de campos:', {
				nombre: { readOnly: campos.nombre.readOnly, classes: campos.nombre.className },
				apellido: { readOnly: campos.apellido.readOnly, classes: campos.apellido.className },
				email: { readOnly: campos.email.readOnly, classes: campos.email.className },
				telefono: { readOnly: campos.telefono.readOnly, classes: campos.telefono.className }
			});
			
		} catch (error) {
			console.error('❌ Error en autocompletado:', error);
			return false;
		}
		
		// 5. Simular evento blur para probar event listeners
		console.log('🧪 5. Simulando evento blur...');
		campos.dni.dispatchEvent(new Event('blur'));
		
		console.log('🧪 === TEST COMPLETO FINALIZADO ===');
		return true;
	};

	// Función para analizar específicamente qué datos llegan con un DNI
	window.analizarDatosDNI = async function(dni = '35668877') {
		console.log('📊 === ANÁLISIS ESPECÍFICO DE DATOS PARA DNI ===');
		console.log('📊 DNI a analizar:', dni);
		
		try {
			// 1. Hacer la consulta directa
			const url = `http://localhost:9090/personas/persona/${dni}`;
			console.log('📊 URL consultada:', url);
			
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				mode: 'cors'
			});
			
			console.log('📊 Status de respuesta:', response.status);
			console.log('📊 Headers de respuesta:', Object.fromEntries(response.headers.entries()));
			
			if (response.ok) {
				const rawData = await response.text();
				console.log('📊 Datos RAW (texto):', rawData);
				
				const jsonData = JSON.parse(rawData);
				console.log('📊 Datos parseados (JSON):', jsonData);
				
				// Analizar estructura detalladamente
				console.log('📊 === ESTRUCTURA DETALLADA ===');
				console.log('📊 Tipo:', typeof jsonData);
				console.log('📊 Constructor:', jsonData.constructor.name);
				console.log('📊 Propiedades:', Object.getOwnPropertyNames(jsonData));
				console.log('📊 Valores:');
				
				Object.entries(jsonData).forEach(([key, value]) => {
					console.log(`📊   ${key}: "${value}" (${typeof value})`);
					if (value === null) console.log(`📊     ⚠️ VALOR NULL`);
					if (value === undefined) console.log(`📊     ⚠️ VALOR UNDEFINED`);
					if (value === '') console.log(`📊     ⚠️ STRING VACÍO`);
				});
				
				// Probar el autocompletado con estos datos
				console.log('📊 === SIMULANDO AUTOCOMPLETADO ===');
				const camposPrueba = {
					nombrePersona: jsonData.nombrePersona || jsonData.nombre || '',
					apellido: jsonData.apellido || '',
					email: jsonData.email || jsonData.correo || '',
					telefono: jsonData.telefono || jsonData.tel || jsonData.celular || ''
				};
				console.log('📊 Campos que se autocompletarían:', camposPrueba);
				
				return jsonData;
			} else {
				console.log('📊 ❌ No se encontró persona con DNI:', dni);
				console.log('📊 Status:', response.status);
				const errorText = await response.text();
				console.log('📊 Error texto:', errorText);
				return null;
			}
			
		} catch (error) {
			console.error('📊 ❌ Error al analizar DNI:', error);
		return null;
	}
};

// Función para abrir el endpoint directamente en el navegador
window.abrirEndpointEnNavegador = function(dni = '35876866') {
	const url = `http://localhost:9090/personas/persona/${dni}`;
	console.log('🌐 Abriendo en navegador:', url);
	console.log('🌐 Copia esta URL y ábrela en una nueva pestaña:', url);
	// Si el navegador lo permite, abrir automáticamente
	try {
		window.open(url, '_blank');
		console.log('✅ URL abierta en nueva pestaña');
	} catch (error) {
		console.log('⚠️ No se pudo abrir automáticamente. Copia la URL manualmente.');
	}
	return url;
};

// Función completa de depuración del sistema de autocompletado
window.depurarAutocompletado = async function(dni = '35876866') {
	console.log('🔧 === DEPURACIÓN COMPLETA DEL AUTOCOMPLETADO ===');
	console.log('🔧 DNI de prueba:', dni);
	
	// 1. Verificar conexión al backend
	console.log('🔧 1. Verificando conexión al backend...');
	try {
		const testResponse = await fetch('http://localhost:9090/');
		console.log('✅ Backend disponible en puerto 9090');
	} catch (error) {
		console.error('❌ Backend no disponible en puerto 9090:', error);
		return false;
	}
	
	// 2. Probar endpoint específico
	console.log('🔧 2. Probando endpoint personas/persona...');
	const resultado = await window.probarEndpointPersonas(dni);
	
	// 3. Verificar campos del DOM
	console.log('🔧 3. Verificando campos del formulario...');
	const campos = {
		dni: document.getElementById('dni'),
		nombre: document.getElementById('nombre'),
		apellido: document.getElementById('apellido'),
		email: document.getElementById('email'),
		telefono: document.getElementById('telefono')
	};
	
	let camposFaltantes = [];
	Object.keys(campos).forEach(key => {
		if (!campos[key]) {
			camposFaltantes.push(key);
		}
	});
	
	if (camposFaltantes.length > 0) {
		console.error('❌ Campos faltantes en el DOM:', camposFaltantes);
		return false;
	} else {
		console.log('✅ Todos los campos están presentes en el DOM');
	}
	
	// 4. Probar autocompletado completo
	console.log('🔧 4. Probando autocompletado completo...');
	if (resultado) {
		console.log('✅ Persona encontrada, probando autocompletado...');
		campos.dni.value = dni;
		await ejecutarAutocompletado('dni');
		console.log('✅ Autocompletado ejecutado');
	} else {
		console.log('⚠️ Persona no encontrada, probando comportamiento de DNI no existente...');
		campos.dni.value = dni;
		await ejecutarAutocompletado('dni');
		console.log('✅ Comportamiento de DNI no existente probado');
	}
	
	// 5. Resumen
	console.log('🔧 === RESUMEN DE DEPURACIÓN ===');
	console.log('✅ Backend: Disponible');
	console.log('✅ Endpoint: personas/persona/{dni}');
	console.log('✅ Campos DOM: Presentes');
	console.log(resultado ? '✅ Autocompletado: Funcional' : '⚠️ Autocompletado: DNI no existe (normal)');
	
	return true;
};	// Coincidencia visual de contraseñas
	const passwordInput = document.getElementById('password');
	const password2Input = document.getElementById('password2');
	if (password2Input && passwordInput) {
		// Mensaje de éxito
		let successMsg = document.getElementById('password-success-msg');
		if (!successMsg) {
			successMsg = document.createElement('div');
			successMsg.id = 'password-success-msg';
			successMsg.className = 'text-success mt-1';
			password2Input.parentNode.appendChild(successMsg);
		}
		function updatePasswordMatch() {
			const passwordValue = passwordInput.value;
			const password2Value = password2Input.value;
			let password2Icon = document.getElementById('password2-icon');
			if (!password2Icon) {
				password2Icon = document.createElement('span');
				password2Icon.id = 'password2-icon';
				password2Icon.style.marginLeft = '8px';
				password2Input.parentNode.appendChild(password2Icon);
			}
			// Validación de exactamente 6 caracteres
			if (passwordValue.length !== 6 || password2Value.length !== 6) {
				password2Icon.innerHTML = '';
				successMsg.textContent = '';
				return;
			}
			if (!password2Value) {
				password2Icon.innerHTML = '';
				successMsg.textContent = '';
			} else if (passwordValue !== password2Value) {
				password2Icon.innerHTML = '<i class="bi bi-x-circle-fill" style="color:#dc3545;font-size:1.2em;vertical-align:middle;"></i>';
				successMsg.textContent = '';
			} else {
				password2Icon.innerHTML = '<i class="bi bi-check-circle-fill" style="color:#198754;font-size:1.2em;vertical-align:middle;"></i>';
				successMsg.textContent = '¡Sus contraseñas coinciden!';
			}
		}
		password2Input.addEventListener('input', function() {
			this.value = this.value.replace(/\s/g, '').slice(0, 6);
			updatePasswordMatch();
		});
		passwordInput.addEventListener('input', function() {
			this.value = this.value.replace(/\s/g, '').slice(0, 6);
			updatePasswordMatch();
		});
	}


	// Inicializar mapa principal (requiere Leaflet.js incluido)
	/*
	var map = L.map('map').setView([-32.89, -68.83], 8); // Mendoza

	// Capa estándar OSM
	var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 18,
		attribution: '© OpenStreetMap contributors'
	});

	// Capa satelital Esri World Imagery (gratuita)
	// Capa satelital MapTiler (gratuita, sin API key para pruebas limitadas)
	// Capa satelital Esri World Imagery (gratuita)
	var esriSatLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
		maxZoom: 18,
		attribution: 'Tiles © Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
	});

	// Control de capas
	var baseMaps = {
		"Mapa estándar": osmLayer,
		"Vista satelital": esriSatLayer
	};
	osmLayer.addTo(map);
	L.control.layers(baseMaps).addTo(map);
	*/

	// --- Lógica del wizard de registro de empleador ---
	const paso1 = document.getElementById('form-registro-empleador-paso1');
	const paso2 = document.getElementById('form-registro-empleador-paso2'); // Este es el paso de confirmación
	const btnSiguiente1 = document.getElementById('btn-siguiente-paso1');
	const btnAnterior3 = document.getElementById('btn-anterior-paso5'); // Actualizado para el botón correcto

	// Paso 1: Datos de empresa
	if (btnSiguiente1) {
		btnSiguiente1.addEventListener('click', function() {
			const cuitInput = document.getElementById('cuit');
			const razonInput = document.getElementById('razonSocial');
			const cuitValue = cuitInput.value.trim();
			const razonValue = razonInput.value.trim();
			let errorMsg = '';
			
			// Validar CUIT obligatorio y formato
			if (!cuitValue) {
				errorMsg = 'El campo CUIT es obligatorio.';
			} else if (!(/^\d{11}$/.test(cuitValue))) {
				errorMsg = 'El CUIT debe tener exactamente 11 números.';
			} else if (cuitInput.classList.contains('is-invalid')) {
				// Verificar si el CUIT ya está registrado (campo marcado como inválido por validación backend)
				const feedbackDiv = cuitInput.parentNode.querySelector('.field-feedback');
				if (feedbackDiv && feedbackDiv.textContent.includes('ya está registrado')) {
					errorMsg = 'No puede continuar: el CUIT ya está registrado en el sistema.';
				}
			}
			
			// Validar Razón Social obligatorio
			let razonErrorMsg = '';
			if (!razonValue) {
				razonErrorMsg = 'El campo Razón Social es obligatorio.';
			}
			
			// Mostrar error CUIT
			let errorDiv = document.getElementById('cuit-error');
			if (!errorDiv) {
				errorDiv = document.createElement('div');
				errorDiv.id = 'cuit-error';
				errorDiv.className = 'text-danger mt-1';
				cuitInput.parentNode.appendChild(errorDiv);
			}
			if (errorMsg) {
				errorDiv.textContent = errorMsg;
				cuitInput.classList.add('is-invalid');
				cuitInput.focus();
			} else {
				errorDiv.textContent = '';
				cuitInput.classList.remove('is-invalid');
			}
			
			// Mostrar error Razón Social
			let razonErrorDiv = document.getElementById('razonSocial-error');
			if (!razonErrorDiv) {
				razonErrorDiv = document.createElement('div');
				razonErrorDiv.id = 'razonSocial-error';
				razonErrorDiv.className = 'text-danger mt-1';
				razonInput.parentNode.appendChild(razonErrorDiv);
			}
			if (razonErrorMsg) {
				razonErrorDiv.textContent = razonErrorMsg;
				razonInput.classList.add('is-invalid');
				if (!errorMsg) razonInput.focus();
			} else {
				razonErrorDiv.textContent = '';
				razonInput.classList.remove('is-invalid');
			}
			
			// Validar contraseñas
			const passwordInput = document.getElementById('password');
			const password2Input = document.getElementById('password2');
			const passwordValue = passwordInput.value;
			const password2Value = password2Input.value;
			let passwordErrorMsg = '';
			let password2ErrorMsg = '';
			
			// Validar contraseña principal
			if (!passwordValue) {
				passwordErrorMsg = 'La contraseña es obligatoria.';
			} else if (passwordValue.length !== 6) {
				passwordErrorMsg = 'La contraseña debe tener exactamente 6 caracteres.';
			} else if (passwordValue.includes(' ')) {
				passwordErrorMsg = 'La contraseña no puede contener espacios.';
			}
			
			// Validar confirmación de contraseña
			if (!password2Value) {
				password2ErrorMsg = 'Debe repetir la contraseña.';
			} else if (password2Value !== passwordValue) {
				password2ErrorMsg = 'Las contraseñas no coinciden.';
			}
			
			// Mostrar error contraseña
			let passwordErrorDiv = document.getElementById('password-error');
			if (!passwordErrorDiv) {
				passwordErrorDiv = document.createElement('div');
				passwordErrorDiv.id = 'password-error';
				passwordErrorDiv.className = 'text-danger mt-1';
				passwordInput.parentNode.appendChild(passwordErrorDiv);
			}
			if (passwordErrorMsg) {
				passwordErrorDiv.textContent = passwordErrorMsg;
				passwordInput.classList.add('is-invalid');
				if (!errorMsg && !razonErrorMsg) passwordInput.focus();
			} else {
				passwordErrorDiv.textContent = '';
				passwordInput.classList.remove('is-invalid');
			}
			
			// Mostrar error repetir contraseña
			let password2ErrorDiv = document.getElementById('password2-error');
			if (!password2ErrorDiv) {
				password2ErrorDiv = document.createElement('div');
				password2ErrorDiv.id = 'password2-error';
				password2ErrorDiv.className = 'text-danger mt-1';
				password2Input.parentNode.appendChild(password2ErrorDiv);
			}
			if (password2ErrorMsg) {
				password2ErrorDiv.textContent = password2ErrorMsg;
				password2Input.classList.add('is-invalid');
				if (!errorMsg && !razonErrorMsg && !passwordErrorMsg) password2Input.focus();
			} else {
				password2ErrorDiv.textContent = '';
				password2Input.classList.remove('is-invalid');
			}
			
			// Si hay algún error, no avanzar
			if (errorMsg || razonErrorMsg || passwordErrorMsg || password2ErrorMsg) return;
			
			// Llenar datos de confirmación
			llenarResumenConfirmacion();
			
			paso1.classList.add('d-none');
			paso2.classList.remove('d-none');
			
			// Actualizar barra de progreso
			const progressBar = document.querySelector('.wizard-progress-bar-inner');
			if (progressBar) progressBar.style.width = '100%';
			
			// Actualizar labels de pasos
			const wizardLabels = document.querySelectorAll('.wizard-step-label');
			wizardLabels.forEach((el, idx) => {
				if (idx === 1) {
					el.classList.add('active');
				}
			});
		});
		
		// Solo permitir números y máximo 11 caracteres en el input CUIT
		const cuitInput = document.getElementById('cuit');
		if (cuitInput) {
			let debounceTimeout;
			cuitInput.addEventListener('input', function() {
				this.value = this.value.replace(/\D/g, '').slice(0, 11);
				clearTimeout(debounceTimeout);
				
				const cuitValue = this.value.trim();
				
				if (!cuitValue) {
					showFieldFeedback(this, false, 'El campo CUIT es obligatorio.');
					return;
				} 
				
				if (!/^\d{11}$/.test(cuitValue)) {
					showFieldFeedback(this, false, 'El CUIT debe tener exactamente 11 números.');
					return;
				}
				
				// Validación en backend con debounce
				const tempDiv = this.parentNode.querySelector('.field-feedback');
				if (tempDiv) {
					tempDiv.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Validando CUIT...';
				}
				
				debounceTimeout = setTimeout(() => {
					fetch(`http://localhost:8080/publico/empresas/existe/${encodeURIComponent(cuitValue)}`)
						.then(response => response.json())
						.then(data => {
							if (data && data.disponible) {
								showFieldFeedback(this, true, '¡CUIT disponible!');
							} else {
								showFieldFeedback(this, false, 'El CUIT ya está registrado.');
							}
						})
						.catch(() => {
							showFieldFeedback(this, false, 'Error al validar CUIT en el servidor.');
						});
				}, 400);
			});
		}
		
		// Forzar mayúsculas en Razón Social
		const razonInput = document.getElementById('razonSocial');
		if (razonInput) {
			razonInput.addEventListener('input', function() {
				this.value = this.value.toUpperCase();
			});
		}
		
		// Validación de contraseñas en tiempo real
		const passwordInput = document.getElementById('password');
		const password2Input = document.getElementById('password2');
		
		if (passwordInput) {
			passwordInput.addEventListener('input', function() {
				// No permitir espacios en contraseña
				this.value = this.value.replace(/\s/g, '');
				
				// Validar coincidencia si hay confirmación
				if (password2Input && password2Input.value) {
					validatePasswordMatch();
				}
			});
		}
		
		if (password2Input) {
			password2Input.addEventListener('input', function() {
				// No permitir espacios en confirmación
				this.value = this.value.replace(/\s/g, '');
				
				// Validar coincidencia en tiempo real
				validatePasswordMatch();
			});
		}
		
		// Función para validar coincidencia de contraseñas
		function validatePasswordMatch() {
			const password = passwordInput.value;
			const password2 = password2Input.value;
			
			let password2ErrorDiv = document.getElementById('password2-error');
			if (!password2ErrorDiv) {
				password2ErrorDiv = document.createElement('div');
				password2ErrorDiv.id = 'password2-error';
				password2ErrorDiv.className = 'text-danger mt-1';
				password2Input.parentNode.appendChild(password2ErrorDiv);
			}
			
			if (password2 && password2 !== password) {
				password2ErrorDiv.textContent = 'Las contraseñas no coinciden.';
				password2Input.classList.add('is-invalid');
				password2Input.classList.remove('is-valid');
			} else if (password2 && password2 === password && password.length === 6) {
				password2ErrorDiv.textContent = '';
				password2Input.classList.remove('is-invalid');
				password2Input.classList.add('is-valid');
			} else if (password2 === '') {
				password2ErrorDiv.textContent = '';
				password2Input.classList.remove('is-invalid', 'is-valid');
			}
		}
	}

	// Paso 2: Confirmación
	if (btnAnterior3) {
		btnAnterior3.addEventListener('click', function() {
			paso3.classList.add('d-none');
			paso1.classList.remove('d-none');
			
			// Actualizar barra de progreso
			const progressBar = document.querySelector('.wizard-progress-bar-inner');
			if (progressBar) progressBar.style.width = '50%';
			
			// Actualizar labels de pasos
			const wizardLabels = document.querySelectorAll('.wizard-step-label');
			wizardLabels.forEach((el, idx) => {
				if (idx === 1) {
					el.classList.remove('active');
				}
			});
		});
	}
	
	// Configuración de contadores de caracteres
	addCharacterCounter('cuit', 11, { 
		allowOnlyNumbers: true,
		warningThreshold: 9,
		dangerThreshold: 10
	});
	
	addCharacterCounter('razonSocial', 50, { 
		allowUppercase: true, 
		customRegex: /[^A-Z0-9\s\.\,\-\_]/g,
		warningThreshold: 40,
		dangerThreshold: 47
	});
	
	// Campos de contraseña - exactamente 6 caracteres
	addCharacterCounter('password', 6, { 
		warningThreshold: 5,
		dangerThreshold: 6
	});
	
	addCharacterCounter('password2', 6, { 
		warningThreshold: 5,
		dangerThreshold: 6
	});
	
	// Inicialización completada
	console.log('✅ Wizard de 2 pasos inicializado correctamente');
	
	// === FUNCIONES DE UTILIDAD ===
});

// --- EFECTO SCROLL PARA NAVBAR TRANSPARENTE ---
document.addEventListener('DOMContentLoaded', function() {
	const navbar = document.getElementById('transparent-navbar');
	const bannerContainer = document.querySelector('.banner-container');
	
	window.addEventListener('scroll', function() {
		// Obtener la altura del video section
		const videoSectionHeight = bannerContainer ? bannerContainer.offsetHeight : 500;
		
		// Ocultar navbar cuando se salga de la sección del video
		if (navbar && window.scrollY > videoSectionHeight - 100) {
			navbar.classList.add('scrolled');
		} else if (navbar) {
			navbar.classList.remove('scrolled');
		}
	});
});

// Funcionalidad de registro exitoso
document.addEventListener('DOMContentLoaded', function() {
	const btnConfirmarRegistro = document.getElementById('btn-confirmar-registro');
	if (btnConfirmarRegistro) {
		btnConfirmarRegistro.addEventListener('click', function(e) {
			e.preventDefault();
			
			// Recopilar todos los datos del wizard
			const datosRegistro = recopilarDatosWizard();
			
			if (datosRegistro) {
				// Deshabilitar botón y mostrar estado de carga
				const removeLoading = addLoadingState(btnConfirmarRegistro, 'Registrando...');
				
				// Enviar datos al backend
				enviarRegistroAlBackend(datosRegistro)
					.then(response => {
						// Registro exitoso
						removeLoading();
						mostrarMensajeExito();
						
						setTimeout(function() {
							// Cerrar modal de registro
							const modalRegistro = document.getElementById('modalRegistroEmpleador');
							if (modalRegistro) {
								const modalInstance = bootstrap.Modal.getInstance(modalRegistro);
								if (modalInstance) modalInstance.hide();
							}
							
							// Cargar perfil y abrir dashboard
							setTimeout(function() {
								cargarPerfilEmpresa();
							}, 500);
						}, 1500);
					})
					.catch(error => {
						// Error en el registro
						removeLoading();
						mostrarMensajeError(error.message);
					});
			}
		});
	}
});

// Función para recopilar todos los datos del wizard
function recopilarDatosWizard() {
	try {
		// Paso 1: Datos de empresa
		const cuit = document.getElementById('cuit')?.value?.trim();
		const razonSocial = document.getElementById('razonSocial')?.value?.trim();
		const password = document.getElementById('password')?.value;
		const password2 = document.getElementById('password2')?.value;
		
		// Validaciones básicas
		if (!cuit || !razonSocial || !password || !password2) {
			throw new Error('Faltan datos obligatorios en el paso 1');
		}
		
		// Validación de longitud máxima de razón social
		if (razonSocial.length > 255) {
			throw new Error('La razón social no puede exceder los 255 caracteres');
		}
		
		// Validaciones de contraseña
		if (password.length < 6) {
			throw new Error('La contraseña debe tener al menos 6 caracteres');
		}
		
		if (password.includes(' ')) {
			throw new Error('La contraseña no puede contener espacios');
		}
		
		if (password !== password2) {
			throw new Error('Las contraseñas no coinciden');
		}
		
		// Estructurar JSON según el DTO esperado por el backend (EmpresaRegistroDTO)
		const datosRegistro = {
			cuit: cuit,
			razonSocial: razonSocial,
			contrasenia: password
		};

		return datosRegistro;
	} catch (error) {
		console.error('Error recopilando datos del wizard:', error);
		mostrarMensajeError(error.message);
		return null;
	}
}

// Función para enviar registro al backend
async function enviarRegistroAlBackend(datos) {
	try {
		// Log para confirmar los datos enviados
		console.log('📤 JSON enviado al backend:', JSON.stringify(datos, null, 2));
		
		const response = await fetch('http://localhost:8080/publico/empresas/registro', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(datos)
		});
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || `Error HTTP: ${response.status}`);
		}
		
		const resultado = await response.json();
		console.log('Registro exitoso:', resultado);
		return resultado;
		
	} catch (error) {
		console.error('Error enviando registro al backend:', error);
		throw error;
	}
}

// Función para mostrar mensaje de éxito
function mostrarMensajeExito() {
	// Buscar el container del paso 5 para mostrar el mensaje
	const paso5 = document.getElementById('form-registro-empleador-paso5');
	if (paso5) {
		const mensajeExito = document.createElement('div');
		mensajeExito.className = 'alert alert-success mt-3';
		mensajeExito.innerHTML = `
			<i class="fas fa-check-circle me-2"></i>
			<strong>¡Registro exitoso!</strong> Su empresa ha sido registrada correctamente.
			Será redirigido al dashboard en unos segundos...
		`;
		paso5.appendChild(mensajeExito);
	}
}

// Función para mostrar mensaje de error
function mostrarMensajeError(mensaje) {
	// Buscar el container del paso 5 para mostrar el mensaje
	const paso5 = document.getElementById('form-registro-empleador-paso5');
	if (paso5) {
		// Eliminar mensajes anteriores
		const mensajesAnteriores = paso5.querySelectorAll('.alert');
		mensajesAnteriores.forEach(alert => alert.remove());
		
		const mensajeError = document.createElement('div');
		mensajeError.className = 'alert alert-danger mt-3';
		mensajeError.innerHTML = `
			<i class="fas fa-exclamation-triangle me-2"></i>
			<strong>Error en el registro:</strong> ${mensaje}
		`;
		paso5.appendChild(mensajeError);
	}
}

// ========================================================================================
// FUNCIONALIDAD DE AUTOCOMPLETADO POR DNI
// ========================================================================================

/**
 * Consulta los datos de una persona por DNI
 * @param {string} dni - DNI a consultar
 * @returns {Promise<Object|null>} - Datos de la persona o null si no existe
 */
async function consultarPersonaPorDni(dni) {
	console.log('🔍 Consultando DNI:', dni);
	
	// Validar que el DNI tenga al menos 7 dígitos
	if (!dni || dni.trim().length < 7) {
		console.log('❌ DNI inválido o muy corto:', dni);
		return null;
	}

	try {
		const url = `http://localhost:9090/personas/persona-registrada/${dni.trim()}`;
		console.log('🌐 Haciendo fetch a:', url);
		
		// Agregar headers para CORS si es necesario
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			mode: 'cors' // Asegurarse de que permita CORS
		});
		
		console.log('📡 Response recibida:', {
			status: response.status,
			statusText: response.statusText,
			ok: response.ok,
			headers: Object.fromEntries(response.headers.entries())
		});
		
		if (response.ok) {
			const persona = await response.json();
			console.log('✅ Persona encontrada:', persona);
			
			// ⭐ ANÁLISIS DETALLADO DE LOS DATOS RECIBIDOS ⭐
			console.log('📊 === ANÁLISIS COMPLETO DEL OBJETO PERSONA ===');
			console.log('🔍 Tipo de dato:', typeof persona);
			console.log('🔍 Es array?:', Array.isArray(persona));
			console.log('🔍 Propiedades del objeto:', Object.keys(persona));
			console.log('🔍 Valores de cada propiedad:');
			
			// Analizar cada propiedad individualmente
			for (const [key, value] of Object.entries(persona)) {
				console.log(`   📌 ${key}: ${value} (tipo: ${typeof value})`);
			}
			
			// Verificar propiedades específicas que usamos en el autocompletado
			console.log('🎯 === MAPEO DE CAMPOS PARA AUTOCOMPLETADO ===');
			console.log('🎯 nombrePersona:', persona.nombrePersona);
			console.log('🎯 apellido:', persona.apellido);
			console.log('🎯 email:', persona.email);
			console.log('🎯 telefono:', persona.telefono);
			
			// Verificar si hay propiedades adicionales útiles
			console.log('🔍 === PROPIEDADES ADICIONALES DISPONIBLES ===');
			const propsUsadas = ['nombrePersona', 'apellido', 'email', 'telefono'];
			const propsAdicionales = Object.keys(persona).filter(key => !propsUsadas.includes(key));
			console.log('🔍 Propiedades no utilizadas:', propsAdicionales);
			propsAdicionales.forEach(prop => {
				console.log(`   📌 ${prop}: ${persona[prop]} (disponible pero no usado)`);
			});
			
			return persona;
		} else if (response.status === 404) {
			console.log('⚠️ Persona no encontrada (404) - Esto es normal');
			return null;
		} else {
			console.error('❌ Error del servidor:', response.status, response.statusText);
			// Intentar leer el cuerpo del error
			try {
				const errorText = await response.text();
				console.error('❌ Detalle del error:', errorText);
			} catch (e) {
				console.error('❌ No se pudo leer el detalle del error');
			}
			return null;
		}
	} catch (error) {
		console.error('❌ Error de red/conexión:', error);
		console.error('❌ Tipo de error:', error.name);
		console.error('❌ Mensaje:', error.message);
		
		// Verificar si es un problema de CORS
		if (error.name === 'TypeError' && error.message.includes('fetch')) {
			console.error('🚫 Posible problema de CORS o servidor no disponible');
		}
		
		return null;
	}
}

/**
 * Autocompleta los campos de una persona basado en el DNI
 * @param {string} dniFieldId - ID del campo DNI
 * @param {string} nombreFieldId - ID del campo nombre
 * @param {string} apellidoFieldId - ID del campo apellido  
 * @param {string} emailFieldId - ID del campo email
 * @param {string} telefonoFieldId - ID del campo teléfono
 * @returns {Object|null} - El objeto persona si se encontró, null si no
 */
async function autocompletarPersona(dniFieldId, nombreFieldId, apellidoFieldId, emailFieldId, telefonoFieldId) {
	console.log('🚀 Iniciando autocompletado para:', dniFieldId); // DEBUG
	
	const dniField = document.getElementById(dniFieldId);
	const nombreField = document.getElementById(nombreFieldId);
	const apellidoField = document.getElementById(apellidoFieldId);
	const emailField = document.getElementById(emailFieldId);
	const telefonoField = document.getElementById(telefonoFieldId);

	if (!dniField || !nombreField || !apellidoField || !emailField || !telefonoField) {
		console.error('❌ No se encontraron todos los campos necesarios para autocompletado');
		console.log('Campos encontrados:', {
			dni: !!dniField,
			nombre: !!nombreField, 
			apellido: !!apellidoField,
			email: !!emailField,
			telefono: !!telefonoField
		}); // DEBUG
		return null;
	}

	const dni = dniField.value.trim();
	console.log('📝 DNI ingresado:', dni); // DEBUG
	
	if (!dni) {
		console.log('⚠️ DNI vacío, limpiando campos'); // DEBUG
		// Si no hay DNI, limpiar y habilitar campos (EXCEPTO contraseñas)
		limpiarYHabilitarCampos(nombreField, apellidoField, emailField, telefonoField);
		return null;
	}

	// Mostrar indicador de carga con feedback visual
	dniField.classList.add('is-loading');
	dniField.setAttribute('title', 'Consultando datos...');
	
	// Agregar mensaje de carga temporal
	let loadingMsg = document.getElementById('dni-loading-msg');
	if (!loadingMsg) {
		loadingMsg = document.createElement('div');
		loadingMsg.id = 'dni-loading-msg';
		loadingMsg.className = 'text-info mt-1';
		dniField.parentNode.appendChild(loadingMsg);
	}
	loadingMsg.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Consultando datos en el sistema...';
	console.log('⏳ Agregando indicador de carga'); // DEBUG

	try {
		const persona = await consultarPersonaPorDni(dni);
		console.log('🔄 Resultado de consultarPersonaPorDni:', persona); // DEBUG
		
		if (persona) {
			console.log('✅ Autocompletando con datos de persona existente'); // DEBUG
			console.log('🎯 === MAPEO DE DATOS AL FORMULARIO ===');
			
			// Mostrar datos originales y como se mapean
			const datosOriginales = {
				nombrePersona: persona.nombrePersona,
				apellido: persona.apellido,
				email: persona.email,
				telefono: persona.telefono
			};
			console.log('🎯 Datos originales del backend:', datosOriginales);
			
			// Persona encontrada: autocompletar SOLO datos básicos (NO contraseñas)
			const nombreValor = persona.nombrePersona || '';
			const apellidoValor = persona.apellido || '';
			const emailValor = persona.email || '';
			const telefonoValor = persona.telefono || '';
			
			console.log('🎯 Valores que se asignarán:');
			console.log('🎯   nombre: "' + nombreValor + '"');
			console.log('🎯   apellido: "' + apellidoValor + '"');
			console.log('🎯   email: "' + emailValor + '"');
			console.log('🎯   telefono: "' + telefonoValor + '"');
			
			// Asignar valores
			nombreField.value = nombreValor;
			apellidoField.value = apellidoValor;
			emailField.value = emailValor;
			telefonoField.value = telefonoValor;
			
			console.log('🎯 Valores asignados en el DOM:');
			console.log('🎯   ' + nombreField.id + '.value = "' + nombreField.value + '"');
			console.log('🎯   ' + apellidoField.id + '.value = "' + apellidoField.value + '"');
			console.log('🎯   ' + emailField.id + '.value = "' + emailField.value + '"');
			console.log('🎯   ' + telefonoField.id + '.value = "' + telefonoField.value + '"');
			
			// Deshabilitar SOLO campos de datos básicos (NO contraseñas)
			deshabilitarCampos(nombreField, apellidoField, emailField, telefonoField);
			
			// Agregar clase visual para indicar campos autocompletados
			agregarClaseAutocompletado(nombreField, apellidoField, emailField, telefonoField);
			
			console.log('🔒 Campos bloqueados para edición'); // DEBUG
			
			// Mostrar mensaje de éxito
			const loadingMsg = document.getElementById('dni-loading-msg');
			if (loadingMsg) {
				loadingMsg.className = 'text-success mt-1';
				loadingMsg.innerHTML = '<i class="fas fa-check-circle me-1"></i>Datos encontrados y autocompletados';
				setTimeout(() => loadingMsg.remove(), 3000);
			}
			
			return persona; // Retornar la persona encontrada
		} else {
			console.log('📝 Persona no encontrada, habilitando edición manual'); // DEBUG
			// Persona no encontrada: limpiar y habilitar campos para edición manual
			// IMPORTANTE: Solo limpiamos datos básicos, NO las contraseñas
			limpiarYHabilitarCampos(nombreField, apellidoField, emailField, telefonoField);
			
			// Mostrar mensaje informativo
			const loadingMsg = document.getElementById('dni-loading-msg');
			if (loadingMsg) {
				loadingMsg.className = 'text-warning mt-1';
				loadingMsg.innerHTML = '<i class="fas fa-info-circle me-1"></i>DNI no encontrado. Complete los datos manualmente';
				setTimeout(() => loadingMsg.remove(), 5000);
			}
			
			return null; // No se encontró persona
		}
	} catch (error) {
		console.error('❌ Error en autocompletado:', error);
		// En caso de error, permitir edición manual (EXCEPTO contraseñas)
		limpiarYHabilitarCampos(nombreField, apellidoField, emailField, telefonoField);
		return null; // Error en la consulta
	} finally {
		// Quitar indicador de carga
		dniField.classList.remove('is-loading');
		dniField.removeAttribute('title');
		
		// Limpiar mensaje de carga si hay error
		const loadingMsg = document.getElementById('dni-loading-msg');
		if (loadingMsg && loadingMsg.className.includes('text-info')) {
			loadingMsg.className = 'text-danger mt-1';
			loadingMsg.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>Error al consultar datos';
			setTimeout(() => loadingMsg.remove(), 3000);
		}
		
		console.log('✅ Autocompletado terminado'); // DEBUG
	}
}

/**
 * Deshabilita los campos para solo lectura
 */
function deshabilitarCampos(...campos) {
	campos.forEach(campo => {
		campo.readOnly = true;
		campo.classList.add('campo-autocompletado');
		campo.classList.remove('campo-editable');
	});
}

/**
 * Limpia y habilita los campos para edición manual
 */
function limpiarYHabilitarCampos(...campos) {
	campos.forEach(campo => {
		campo.value = '';
		campo.readOnly = false;
		campo.classList.remove('campo-autocompletado');
		campo.classList.add('campo-editable');
	});
}

/**
 * Agrega clase visual para campos autocompletados
 */
function agregarClaseAutocompletado(...campos) {
	campos.forEach(campo => {
		campo.classList.add('campo-autocompletado');
		campo.classList.remove('campo-editable');
	});
}

/**
 * Ejecuta el autocompletado para el formulario de empresa
 */
async function ejecutarAutocompletado(dniFieldId) {
	console.log('🚀 Ejecutando autocompletado para empresa...');
	const persona = await autocompletarPersona(dniFieldId, 'nombre', 'apellido', 'email', 'telefono');
	
	// Si encontró una persona, deshabilitar contraseñas. Si no, habilitarlas.
	if (persona) {
		deshabilitarContraseniasPersonaExistente('password', 'password2');
	} else {
		habilitarContraseniasPersonaNueva('password', 'password2');
	}
}

/**
 * Deshabilita los campos de contraseña para usuarios ya registrados
 * @param {string} passwordFieldId - ID del campo contraseña
 * @param {string} password2FieldId - ID del campo repetir contraseña
 */
function deshabilitarContraseniasPersonaExistente(passwordFieldId, password2FieldId) {
	const passwordField = document.getElementById(passwordFieldId);
	const password2Field = document.getElementById(password2FieldId);
	
	if (passwordField) {
		passwordField.readOnly = true;
		passwordField.value = '';
		passwordField.placeholder = 'No requerida para usuario existente';
		passwordField.classList.add('campo-autocompletado');
		passwordField.classList.remove('campo-editable');
	}
	
	if (password2Field) {
		password2Field.readOnly = true;
		password2Field.value = '';
		password2Field.placeholder = 'No requerida para usuario existente';
		password2Field.classList.add('campo-autocompletado');
		password2Field.classList.remove('campo-editable');
	}
	
	// Agregar mensaje explicativo
	mostrarMensajeContrasenaExistente(passwordFieldId);
}

/**
 * Habilita los campos de contraseña para usuarios nuevos
 * @param {string} passwordFieldId - ID del campo contraseña
 * @param {string} password2FieldId - ID del campo repetir contraseña
 */
function habilitarContraseniasPersonaNueva(passwordFieldId, password2FieldId) {
	const passwordField = document.getElementById(passwordFieldId);
	const password2Field = document.getElementById(password2FieldId);
	
	if (passwordField) {
		passwordField.readOnly = false;
		passwordField.placeholder = 'Ingrese una contraseña';
		passwordField.classList.remove('campo-autocompletado');
		passwordField.classList.add('campo-editable');
	}
	
	if (password2Field) {
		password2Field.readOnly = false;
		password2Field.placeholder = 'Repita la contraseña';
		password2Field.classList.remove('campo-autocompletado');
		password2Field.classList.add('campo-editable');
	}
	
	// Quitar mensaje explicativo si existe
	quitarMensajeContrasenaExistente(passwordFieldId);
}

/**
 * Muestra mensaje explicativo para contraseñas de usuarios existentes
 * @param {string} passwordFieldId - ID del campo contraseña principal
 */
function mostrarMensajeContrasenaExistente(passwordFieldId) {
	const passwordField = document.getElementById(passwordFieldId);
	if (!passwordField) return;
	
	// Quitar mensaje anterior si existe
	quitarMensajeContrasenaExistente(passwordFieldId);
	
	// Crear nuevo mensaje
	const mensaje = document.createElement('div');
	mensaje.id = 'password-existing-msg-' + passwordFieldId;
	mensaje.className = 'text-info mt-1';
	mensaje.innerHTML = '<i class="fas fa-info-circle me-1"></i>No es necesaria la contraseña para usuarios ya registrados';
	
	// Agregar después del campo de contraseña
	passwordField.parentNode.appendChild(mensaje);
}

/**
 * Quita el mensaje explicativo de contraseñas
 * @param {string} passwordFieldId - ID del campo contraseña principal
 */
function quitarMensajeContrasenaExistente(passwordFieldId) {
	const mensaje = document.getElementById('password-existing-msg-' + passwordFieldId);
	if (mensaje) {
		mensaje.remove();
	}
}

// ========================================================================================
// FUNCIONES DE TESTING Y VERIFICACIÓN DE DATOS
// ========================================================================================

// Función para probar con DNIs que probablemente existan
window.probarDNIsComunes = async function() {
	console.log('🔍 === PROBANDO DNIs COMUNES ===');
	
	// Lista de DNIs comunes para probar
	const dnisComunes = [
		'12345678', '87654321', '11111111', '22222222', '33333333',
		'10000000', '20000000', '30000000', '40000000', '50000000',
		'35876866', '35668877', '12000000', '25000000', '18000000'
	];
	
	console.log('🔍 Probando con', dnisComunes.length, 'DNIs diferentes...');
	
	for (const dni of dnisComunes) {
		console.log(`🔍 Probando DNI: ${dni}`);
		try {
			const resultado = await consultarPersonaPorDni(dni);
			if (resultado) {
				console.log(`✅ ¡ENCONTRADO! DNI: ${dni}`, resultado);
				console.log(`✅ Usa este DNI para probar el autocompletado: ${dni}`);
				return dni; // Retornar el primer DNI que encuentre
			} else {
				console.log(`❌ No encontrado: ${dni}`);
			}
		} catch (error) {
			console.log(`❌ Error con ${dni}:`, error);
		}
		
		// Pausa pequeña para no saturar el servidor
		await new Promise(resolve => setTimeout(resolve, 100));
	}
	
	console.log('❌ No se encontraron DNIs válidos en la lista');
	return null;
};

// Función para verificar qué endpoints están disponibles
window.verificarEndpoints = async function() {
	console.log('🌐 === VERIFICANDO ENDPOINTS DISPONIBLES ===');
	
	const endpoints = [
		'http://localhost:9090/personas/persona',
		'http://localhost:9090/personas',
		'http://localhost:9090/api/personas',
		'http://localhost:9090/persona',
		'http://localhost:9090/personas/list',
		'http://localhost:9090/personas/all'
	];
	
	for (const endpoint of endpoints) {
		try {
			console.log(`🌐 Probando: ${endpoint}`);
			const response = await fetch(endpoint);
			console.log(`📡 ${endpoint} - Status: ${response.status}`);
			
			if (response.ok) {
				const data = await response.json();
				console.log(`✅ ${endpoint} - Datos:`, data);
				
				// Si es un array, mostrar algunos DNIs
				if (Array.isArray(data) && data.length > 0) {
					console.log(`✅ DNIs disponibles en ${endpoint}:`);
					data.slice(0, 5).forEach(persona => {
						console.log(`   - DNI: ${persona.dni || persona.id} (${persona.nombre || persona.nombrePersona})`);
					});
				}
			}
		} catch (error) {
			console.log(`❌ ${endpoint} - Error:`, error);
		}
	}
};


// ==========================================
// FUNCIONALIDAD DE LOGIN Y AUTENTICACIÓN
// ==========================================

// Función para validar formato CUIT
function validarCUITLogin(cuit) {
	if (!cuit || cuit.trim() === '') {
		return { valido: false, mensaje: 'El CUIT es obligatorio' };
	}
	
	const cuitLimpio = cuit.replace(/[-\s]/g, '');
	if (!/^\d{11}$/.test(cuitLimpio)) {
		return { valido: false, mensaje: 'El CUIT debe tener 11 dígitos' };
	}
	
	return { valido: true, cuit: cuitLimpio };
}

// Función para validar contraseña
function validarContrasenaLogin(contrasenia) {
	if (!contrasenia || contrasenia.trim() === '') {
		return { valido: false, mensaje: 'La contraseña es obligatoria' };
	}
	
	if (contrasenia.length < 6) {
		return { valido: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' };
	}
	
	return { valido: true, contrasenia: contrasenia };
}

// Función para enviar credenciales al backend
async function autenticarUsuario(cuit, contrasenia) {
	try {
		console.log('🔐 Iniciando autenticación para CUIT:', cuit);
		
		const credenciales = {
			cuit: cuit,
			contrasenia: contrasenia
		};
		
		console.log('📤 Enviando credenciales al backend:', JSON.stringify(credenciales, null, 2));
		
		const response = await fetchWithConfig(buildURL(BACKEND_CONFIG.ENDPOINTS.LOGIN), {
			method: 'POST',
			body: JSON.stringify(credenciales)
		});
		
		console.log('📥 Respuesta del backend:', response.status, response.statusText);
		
		if (response.ok) {
			const data = await response.json();
			console.log('✅ Login exitoso, JWT recibido');
			
			// Almacenar datos del usuario autenticado
			const userData = {
				cuit: cuit,
				token: data.token
			};
			
			return { 
				exito: true, 
				datos: {
					token: data.token,
					usuario: userData
				}
			};
		} else if (response.status === 401) {
			console.log('❌ Credenciales inválidas (401)');
			return { exito: false, mensaje: 'DNI o contraseña incorrectos' };
		} else if (response.status === 404) {
			console.log('❌ Usuario no encontrado (404)');
			return { exito: false, mensaje: 'El usuario no existe' };
		} else {
			console.log('❌ Error del servidor:', response.status);
			const errorText = await response.text();
			console.log('❌ Detalles:', errorText);
			return { exito: false, mensaje: 'Error del servidor. Intenta nuevamente.' };
		}
		
	} catch (error) {
		console.error('❌ Error de conexión:', error);
		return { exito: false, mensaje: 'Error de conexión. Verifica tu internet.' };
	}
}

// Función para almacenar datos de sesión
function almacenarSesion(token, datosUsuario) {
	try {
		localStorage.setItem(AUTH_CONFIG.storage.tokenKey, token);
		localStorage.setItem(AUTH_CONFIG.storage.userKey, JSON.stringify(datosUsuario));
		console.log('✅ Sesión almacenada correctamente');
		return true;
	} catch (error) {
		console.error('❌ Error almacenando sesión:', error);
		return false;
	}
}

// Función para obtener token almacenado
function obtenerToken() {
    const token = localStorage.getItem(AUTH_CONFIG.storage.tokenKey);
    if (!token) {
        console.warn('🔒 Token no encontrado en localStorage');
        return null;
    }
    console.log('🔑 Token obtenido de localStorage:', token ? 'Presente' : 'No disponible');
    return token;
}

function guardarToken(token) {
    if (!token) {
        console.error('❌ Intento de guardar token inválido');
        return false;
    }
    try {
        localStorage.setItem(AUTH_CONFIG.storage.tokenKey, token);
        console.log('✅ Token guardado en localStorage');
        // Disparar evento para sincronización entre pestañas
        window.dispatchEvent(new Event('tokenUpdated'));
        return true;
    } catch (error) {
        console.error('❌ Error guardando token:', error);
        return false;
    }
}

// Función para obtener datos del usuario
function obtenerUsuario() {
    try {
        const userData = localStorage.getItem(AUTH_CONFIG.storage.userKey);
		return userData ? JSON.parse(userData) : null;
	} catch (error) {
		console.error('❌ Error obteniendo datos de usuario:', error);
		return null;
	}
}

// ===========================
// SISTEMA ROBUSTO DE MANEJO JWT
// ===========================

// Función para decodificar JWT sin validar (solo para leer datos)
function decodeJWT(token) {
	try {
		if (!token) return null;
		
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		
		const payload = JSON.parse(atob(parts[1]));
		return payload;
	} catch (error) {
		console.error('❌ Error decodificando JWT:', error);
		return null;
	}
}

// Función para validar si el token actual es válido
function validateCurrentToken() {
	const token = obtenerToken();
	
	if (!token) {
		console.log('🔐 No hay token almacenado');
		return { valid: false, reason: 'NO_TOKEN' };
	}
	
	// Decodificar token para verificar expiración
	const payload = decodeJWT(token);
	if (!payload) {
		console.log('🔐 Token mal formado');
		return { valid: false, reason: 'MALFORMED_TOKEN' };
	}
	
	// Verificar expiración (exp está en segundos)
	const now = Math.floor(Date.now() / 1000);
	const expirationTime = payload.exp;
	
	if (!expirationTime) {
		console.log('🔐 Token sin fecha de expiración');
		return { valid: false, reason: 'NO_EXPIRATION' };
	}
	
	if (now >= expirationTime) {
		console.log('🔐 Token expirado');
		return { valid: false, reason: 'EXPIRED', expiredAt: new Date(expirationTime * 1000) };
	}
	
	// Verificar si está próximo a expirar (menos de 5 minutos)
	const timeToExpire = expirationTime - now;
	const isNearExpiry = timeToExpire < 300; // 5 minutos
	
	console.log(`🔐 Token válido, expira en ${Math.floor(timeToExpire / 60)} minutos`);
	
	return { 
		valid: true, 
		nearExpiry: isNearExpiry,
		expiresAt: new Date(expirationTime * 1000),
		timeToExpire: timeToExpire,
		payload: payload
	};
}

// Función para renovar token automáticamente
async function autoRefreshToken() {
	try {
		console.log('🔄 Intentando renovar token...');
		
		const currentToken = obtenerToken();
		if (!currentToken) {
			throw new Error('No hay token para renovar');
		}
		
		const url = buildURL(BACKEND_CONFIG.ENDPOINTS.REFRESH_TOKEN);
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${currentToken}`
			},
			timeout: BACKEND_CONFIG.TIMEOUTS.TOKEN_REFRESH
		});
		
		if (!response.ok) {
			if (response.status === 401) {
				throw new Error('Token no se puede renovar, requiere login');
			}
			throw new Error(`Error del servidor: ${response.status}`);
		}
		
		const data = await response.json();
		const newToken = data.token || data.accessToken || data.jwt;
		
		if (!newToken) {
			throw new Error('Respuesta no contiene nuevo token');
		}
		
		// Guardar nuevo token
		localStorage.setItem(AUTH_CONFIG.storage.tokenKey, newToken);
		console.log('✅ Token renovado exitosamente');
		
		return { success: true, token: newToken };
		
	} catch (error) {
		console.error('❌ Error renovando token:', error);
		return { success: false, error: error.message };
	}
}

// Función para logs detallados de debugging JWT
function logTokenDebugInfo(operation = 'general') {
	if (!BACKEND_CONFIG.DEVELOPMENT_MODE) return;
	
	console.group(`🔐 JWT Debug Info - ${operation}`);
	
	const token = obtenerToken();
	console.log('Token presente:', !!token);
	
	if (token) {
		console.log('Token length:', token.length);
		console.log('Token preview:', token.substring(0, 50) + '...');
		
		const payload = decodeJWT(token);
		if (payload) {
			console.log('Payload:', payload);
			console.log('Issued at:', new Date(payload.iat * 1000));
			console.log('Expires at:', new Date(payload.exp * 1000));
			console.log('Subject:', payload.sub);
			console.log('Roles:', payload.roles || payload.authorities);
		}
	}
	
	const validation = validateCurrentToken();
	console.log('Validation result:', validation);
	
	console.groupEnd();
}

// Función para ejecutar operación con retry automático de token
async function executeWithTokenRetry(operation, operationName = 'unknown') {
    const maxRetries = 2;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Ejecutando ${operationName} - Intento ${attempt}/${maxRetries}`);
            
            // Verificar token antes de la operación
            const tokenValidation = await validateCurrentToken();
            console.log('🔑 Estado del token:', tokenValidation);
            
            if (!tokenValidation.valid) {
                console.log(`🔐 Token inválido: ${tokenValidation.reason || 'Token expirado'}`);
                
                if (tokenValidation.reason === 'NO_TOKEN') {
                    throw new Error('No hay token de autenticación. Debe iniciar sesión.');
                }
                
                // Intentar renovar token
                console.log('🔄 Intentando renovar token...');
                const refreshSuccess = await autoRefreshToken();
                if (!refreshSuccess) {
                    console.error('❌ Fallo en refresh del token');
                    throw new Error('No se pudo renovar el token. Inicie sesión nuevamente.');
                }
                console.log('✅ Token renovado exitosamente');
            }
            
            // Ejecutar operación
            try {
                const result = await operation();
                console.log(`✅ ${operationName} ejecutada exitosamente`);
                return result;
            } catch (operationError) {
                console.error(`❌ Error en operación:`, operationError);
                
                // Manejar específicamente errores 403
                if (operationError.status === 403 || 
                    (operationError.message && operationError.message.includes('403'))) {
                    console.log('🔒 Error 403 detectado - Intentando refresh del token...');
                    const refreshSuccess = await autoRefreshToken();
                    if (!refreshSuccess) {
                        throw new Error('Error de autorización. Inicie sesión nuevamente.');
                    }
                    // Reintentar con nuevo token
                    return await operation();
                }
                throw operationError;
            }
            
        } catch (error) {
            lastError = error;
			console.error(`❌ Error en ${operationName} - Intento ${attempt}:`, error);
			
			// Si es error de autenticación y no es el último intento, renovar token
			if ((error.message.includes('401') || error.message.includes('403')) && attempt < maxRetries) {
				console.log('🔄 Error de autenticación, intentando renovar token...');
				const refreshResult = await autoRefreshToken();
				
				if (!refreshResult.success) {
					console.error('❌ No se pudo renovar token:', refreshResult.error);
					throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
				}
				
				// Continuar al siguiente intento
				continue;
			}
			
			// Si no es error de auth o es el último intento, fallar
			if (attempt === maxRetries) {
				throw lastError;
			}
		}
	}
	
	throw lastError;
}

// Función para cerrar sesión
function cerrarSesion() {
	// Cerrar el panel del dashboard si está abierto
	const dashboardOffcanvas = document.getElementById('dashboardOffcanvas');
	if (dashboardOffcanvas) {
		const offcanvasInstance = bootstrap.Offcanvas.getInstance(dashboardOffcanvas);
		if (offcanvasInstance) {
			console.log('🔄 Cerrando panel del dashboard...');
			offcanvasInstance.hide();
		}
	}
	
	// Limpiar datos de sesión
	localStorage.removeItem(AUTH_CONFIG.storage.tokenKey);
	localStorage.removeItem(AUTH_CONFIG.storage.userKey);
	localStorage.removeItem('perfil_empresa');
	
	console.log('✅ Sesión cerrada y panel cerrado');
	actualizarInterfazLogin(false);
}

// Función para verificar si el usuario está autenticado
function estaAutenticado() {
	const token = obtenerToken();
	return token !== null && token !== '';
}

// Función para actualizar la interfaz según el estado de autenticación
function actualizarInterfazLogin(autenticado) {
	const btnLogin = document.getElementById('btn-login');
	const btnRegistro = document.getElementById('btn-registro');
	
	if (autenticado) {
		const usuario = obtenerUsuario();
		const nombreUsuario = usuario ? usuario.razonSocial || usuario.cuit : 'Usuario';
		
		// Ocultar el botón de login
		if (btnLogin) {
			btnLogin.style.display = 'none';
		}
		
		// Reemplazar el botón "Registro Empleador" con el dropdown del usuario
		if (btnRegistro) {
			btnRegistro.parentElement.outerHTML = `
				<li class="nav-item dropdown">
					<a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
						<i class="fas fa-user me-1"></i>${nombreUsuario}
					</a>
					<ul class="dropdown-menu" aria-labelledby="userDropdown">
						<li><a class="dropdown-item" href="#" id="btn-continuar-registro"><i class="fas fa-user-circle me-2"></i>Mi perfil</a></li>
						<li><hr class="dropdown-divider"></li>
						<li><a class="dropdown-item" href="#" id="btn-logout"><i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión</a></li>
					</ul>
				</li>
			`;
			
			// Agregar event listener para abrir dashboard (Mi perfil)
			document.getElementById('btn-continuar-registro').addEventListener('click', function(e) {
				e.preventDefault();
				
				// Verificar autenticación antes de abrir dashboard
				const isAuthenticated = validateCurrentToken();
				if (!isAuthenticated) {
					console.warn('Usuario no autenticado para acceder al dashboard');
					mostrarErrorLogin('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
					cerrarSesion();
					return;
				}
				
				// Abrir dashboard del usuario
				abrirDashboardUsuario();
			});
			
			// Agregar event listener para logout
			document.getElementById('btn-logout').addEventListener('click', function(e) {
				e.preventDefault();
				
				// Cerrar el dropdown primero
				const dropdown = document.getElementById('userDropdown');
				if (dropdown) {
					const dropdownInstance = bootstrap.Dropdown.getInstance(dropdown);
					if (dropdownInstance) {
						dropdownInstance.hide();
					}
				}
				
				// Esperar un momento para que se cierre el dropdown antes de cerrar sesión
				setTimeout(() => {
					cerrarSesion();
				}, 200);
			});
		}
		
	} else {
		// Mostrar el botón de login
		if (btnLogin) {
			btnLogin.style.display = 'block';
		}
		
		// Restaurar botón de "Registro Empleador"
		const userDropdown = document.getElementById('userDropdown');
		if (userDropdown) {
			userDropdown.parentElement.outerHTML = `
				<li class="nav-item">
					<a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#modalRegistroEmpleador" id="btn-registro" onclick="return false;">Registro Empleador</a>
				</li>
			`;
		}
	}
}

// Función para mostrar mensajes de error en el formulario
function mostrarErrorLogin(mensaje) {
	// Buscar o crear container de error
	let errorContainer = document.getElementById('login-error');
	if (!errorContainer) {
		errorContainer = document.createElement('div');
		errorContainer.id = 'login-error';
		errorContainer.className = 'alert alert-danger mt-3';
		errorContainer.style.display = 'none';
		
		const form = document.getElementById('form-login');
		form.insertBefore(errorContainer, form.querySelector('.d-grid'));
	}
	
	errorContainer.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i>${mensaje}`;
	errorContainer.style.display = 'block';
	
	// Ocultar el error después de 5 segundos
	setTimeout(() => {
		errorContainer.style.display = 'none';
	}, 5000);
}

// Función principal de manejo del login
async function manejarLogin() {
	const dni = document.getElementById('dni-login').value;
	const contrasenia = document.getElementById('password-login').value;
	
	// Validar DNI
	const validacionDNI = validarDNI(dni);
	if (!validacionDNI.valido) {
		mostrarErrorLogin(validacionDNI.mensaje);
		return;
	}
	
	// Validar contraseña
	const validacionContrasenia = validarContrasenaLogin(contrasenia);
	if (!validacionContrasenia.valido) {
		mostrarErrorLogin(validacionContrasenia.mensaje);
		return;
	}
	
	// Deshabilitar botón mientras se procesa
	const btnIniciarSesion = document.getElementById('btn-iniciar-sesion');
	const textoOriginal = btnIniciarSesion.innerHTML;
	btnIniciarSesion.disabled = true;
	btnIniciarSesion.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Iniciando...';
	
	try {
		// Intentar autenticar
		const resultado = await autenticarUsuario(validacionDNI.dni, validacionContrasenia.contrasenia);
		
		if (resultado.exito) {
			// Login exitoso
			console.log('✅ Login exitoso');
			
			// Almacenar sesión (ajustar según la estructura de tu JWT)
			const token = resultado.datos.token || resultado.datos.jwt || resultado.datos;
			const datosUsuario = {
				dni: validacionDNI.dni,
				// Agregar más datos según lo que devuelva tu backend
				nombre: resultado.datos.nombre || resultado.datos.nombreUsuario,
				email: resultado.datos.email
			};
			
			if (almacenarSesion(token, datosUsuario)) {
				// Cerrar modal
				const modal = bootstrap.Modal.getInstance(document.getElementById('modalLogin'));
				modal.hide();
				
				// Actualizar interfaz
				actualizarInterfazLogin(true);
				
				// Limpiar formulario
				document.getElementById('form-login').reset();
				
				// ✅ REDIRECCIÓN AL PANEL DE CONTROL
				console.log('🔄 Redirigiendo al dashboard...');
				
				// Esperar un momento para que se complete el cierre del modal
				setTimeout(() => {
					// Cargar perfil y abrir dashboard
					cargarPerfilEmpresa();
					// O usar: actualizar UI sin redirigir
				}, 500);
				
				console.log('✅ Sesión iniciada correctamente');
			}
		} else {
			// Login falló
			mostrarErrorLogin(resultado.mensaje);
		}
		
	} catch (error) {
		console.error('❌ Error inesperado en login:', error);
		mostrarErrorLogin('Error inesperado. Intenta nuevamente.');
	} finally {
		// Restaurar botón
		btnIniciarSesion.disabled = false;
		btnIniciarSesion.innerHTML = textoOriginal;
	}
}

// Función para agregar token JWT a las peticiones
function agregarAutorizacion(headers = {}) {
	const token = obtenerToken();
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}
	return headers;
}

// Función wrapper para fetch con autenticación automática
async function fetchConAuth(url, options = {}) {
	// Agregar headers de autorización
	options.headers = agregarAutorizacion(options.headers || {});
	
	try {
		const response = await fetch(url, options);
		
		// Verificar si el token expiró (401)
		if (response.status === 401) {
			console.log('🔒 Token expirado o inválido, cerrando sesión');
			cerrarSesion();
			// Opcional: Mostrar modal de login automáticamente
			// const modalLogin = new bootstrap.Modal(document.getElementById('modalLogin'));
			// modalLogin.show();
		}
		
		return response;
	} catch (error) {
		console.error('❌ Error en petición autenticada:', error);
		throw error;
	}
}

// Función para verificar validez del token (opcional)
async function verificarToken() {
	const token = obtenerToken();
	if (!token) return false;
	
	try {
		// Hacer una petición al endpoint del perfil para verificar el token
		const response = await fetchConAuth(buildURL(BACKEND_CONFIG.ENDPOINTS.PROFILE), {
			method: 'GET'
		});
		
		return response.ok;
	} catch (error) {
		console.error('❌ Error verificando token:', error);
		return false;
	}
}

// Event listeners cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
	// Event listener para el botón de iniciar sesión
	const btnIniciarSesion = document.getElementById('btn-iniciar-sesion');
	if (btnIniciarSesion) {
		btnIniciarSesion.addEventListener('click', manejarLogin);
	}
	
	// Event listener para submit del formulario (Enter)
	const formLogin = document.getElementById('form-login');
	if (formLogin) {
		formLogin.addEventListener('submit', function(e) {
			e.preventDefault();
			manejarLogin();
		});
	}
	
// Verificar si ya hay una sesión activa al cargar la página
if (estaAutenticado()) {
    // Validar el token con el backend antes de redirigir
    verificarToken().then(valido => {
        if (valido) {
            actualizarInterfazLogin(true);
            // Si ya hay token válido, cargar perfil
            cargarPerfilEmpresa();
        } else {
            // Token inválido, limpiar y mostrar login
            localStorage.removeItem(AUTH_CONFIG.storage.tokenKey);
            localStorage.removeItem(AUTH_CONFIG.storage.userKey);
            actualizarInterfazLogin(false);
            // Opcional: mostrar mensaje de sesión expirada
            if (window.location.pathname.endsWith('index.html')) {
                alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            }
        }
    }).catch(() => {
        // Error de red, limpiar y mostrar login
        localStorage.removeItem(AUTH_CONFIG.storage.tokenKey);
        localStorage.removeItem(AUTH_CONFIG.storage.userKey);
        actualizarInterfazLogin(false);
        if (window.location.pathname.endsWith('index.html')) {
            alert('No se pudo validar la sesión. Por favor, inicia sesión nuevamente.');
        }
    });
}
	
	// Función para manejar el proceso de login
	async function manejarLogin() {
		const cuitInput = document.getElementById('cuit-login');
		const passwordInput = document.getElementById('password-login');
		const btnIniciarSesion = document.getElementById('btn-iniciar-sesion');
		const errorDiv = document.getElementById('login-error');
		
		// Validar campos
		const cuitValidation = validarCUITLogin(cuitInput.value);
		const passwordValidation = validarContrasenaLogin(passwordInput.value);
		
		// Mostrar errores si los hay
		if (!cuitValidation.valido || !passwordValidation.valido) {
			errorDiv.querySelector('span').textContent = 
				!cuitValidation.valido ? cuitValidation.mensaje : passwordValidation.mensaje;
			errorDiv.classList.remove('d-none');
			return;
		}
		
		// Ocultar error previo
		errorDiv.classList.add('d-none');
		
		// Deshabilitar botón y mostrar loading
		const removeLoading = addLoadingState(btnIniciarSesion, 'Iniciando sesión...');
		
		try {
			const resultado = await autenticarUsuario(cuitValidation.cuit, passwordValidation.contrasenia);
			
			if (resultado.exito) {
				// Almacenar datos de sesión
				almacenarSesion(resultado.datos.token, resultado.datos.usuario);
				
				// Actualizar interfaz
				actualizarInterfazLogin(true);
				
				// Cerrar modal
				const modal = bootstrap.Modal.getInstance(document.getElementById('modalLogin'));
				if (modal) modal.hide();
				
				// Limpiar formulario
				formLogin.reset();
				
				// Cargar perfil y abrir dashboard
				cargarPerfilEmpresa();
			} else {
				errorDiv.querySelector('span').textContent = resultado.mensaje;
				errorDiv.classList.remove('d-none');
			}
		} catch (error) {
			console.error('Error en login:', error);
			errorDiv.querySelector('span').textContent = 'Error al intentar iniciar sesión. Por favor intente nuevamente.';
			errorDiv.classList.remove('d-none');
		} finally {
			// Restaurar botón
			removeLoading();
		}
	}
	
	// Aplicar validaciones en tiempo real al CUIT
	const cuitInput = document.getElementById('cuit-login');
	if (cuitInput) {
		cuitInput.addEventListener('input', function() {
			// Permitir solo números
			this.value = this.value.replace(/[^0-9]/g, '');
			// Limitar a 11 dígitos
			if (this.value.length > 11) {
				this.value = this.value.slice(0, 11);
			}
		});
	}
});

/* ===================================
   WIZARD PROGRESS SYSTEM - JAVASCRIPT
   =================================== */

class WizardProgressManager {
    constructor(wizardContainer) {
        this.container = wizardContainer;
        this.progressBar = wizardContainer.querySelector('.wizard-progress-bar-inner');
        this.steps = wizardContainer.querySelectorAll('.wizard-step-label');
        this.currentStep = 0;
        this.totalSteps = this.steps.length;
        
        this.initializeWizard();
    }
    
    initializeWizard() {
        // Configurar eventos de click en pasos navegables
        this.steps.forEach((step, index) => {
            step.addEventListener('click', () => {
                if (this.canNavigateToStep(index)) {
                    this.goToStep(index);
                }
            });
        });
        
        // Establecer estado inicial
        this.updateProgress();
    }
    
    canNavigateToStep(stepIndex) {
        // Permitir navegación a pasos completados o el paso actual
        return stepIndex <= this.currentStep || this.steps[stepIndex].classList.contains('completed');
    }
    
    goToStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.totalSteps) return;
        
        // Animar transición
        this.animateStepTransition(this.currentStep, stepIndex);
        this.currentStep = stepIndex;
        this.updateProgress();
    }
    
    nextStep() {
        if (this.currentStep < this.totalSteps - 1) {
            // Marcar paso actual como completado
            this.completeStep(this.currentStep);
            this.currentStep++;
            this.updateProgress();
            
            // Feedback visual de progreso
            this.showProgressFeedback();
        }
    }
    
    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateProgress();
        }
    }
    
    completeStep(stepIndex) {
        const step = this.steps[stepIndex];
        if (!step) return;
        
        // Agregar estado loading temporalmente
        step.classList.add('loading');
        step.classList.remove('active');
        
        // Simular procesamiento
        setTimeout(() => {
            step.classList.remove('loading');
            step.classList.add('completed');
            
            // Efecto de confetti virtual
            this.triggerCompletionEffect(step);
        }, 800);
    }
    
    updateProgress() {
        // Actualizar barra de progreso
        const progressPercentage = (this.currentStep / (this.totalSteps - 1)) * 100;
        this.progressBar.style.width = `${progressPercentage}%`;
        
        // Actualizar estados de pasos
        this.steps.forEach((step, index) => {
            step.classList.remove('active');
            
            if (index < this.currentStep) {
                if (!step.classList.contains('completed')) {
                    step.classList.add('completed');
                    this.triggerCompletionEffect(step);
                }
            } else if (index === this.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('completed');
            }
        });
        
        // Actualizar color de barra según progreso
        this.updateProgressBarColor(progressPercentage);
    }
    
    updateProgressBarColor(percentage) {
        if (percentage === 100) {
            this.progressBar.style.background = `linear-gradient(90deg, 
                var(--success-green) 0%, 
                var(--light-green) 100%)`;
            this.progressBar.style.boxShadow = '0 0 20px rgba(39, 174, 96, 0.6)';
        } else if (percentage >= 50) {
            this.progressBar.style.background = `linear-gradient(90deg, 
                var(--primary-blue) 0%, 
                var(--accent-blue) 100%)`;
            this.progressBar.style.boxShadow = '0 0 20px rgba(74, 144, 226, 0.4)';
        } else {
            this.progressBar.style.background = `linear-gradient(90deg, 
                var(--warning-orange) 0%, 
                var(--light-orange) 100%)`;
            this.progressBar.style.boxShadow = '0 0 20px rgba(243, 156, 18, 0.4)';
        }
    }
    
    animateStepTransition(fromStep, toStep) {
        const fromElement = this.steps[fromStep];
        const toElement = this.steps[toStep];
        
        if (fromElement) {
            fromElement.style.transform = 'scale(0.9)';
            setTimeout(() => {
                fromElement.style.transform = '';
            }, 200);
        }
        
        if (toElement) {
            toElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                toElement.style.transform = '';
            }, 300);
        }
    }
    
    triggerCompletionEffect(stepElement) {
        // Crear efecto de partículas/confetti
        const rect = stepElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 8; i++) {
            this.createParticle(centerX, centerY);
        }
        
        // Efecto de pulso
        stepElement.style.animation = 'completedBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    }
    
    createParticle(x, y) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 6px;
            height: 6px;
            background: var(--success-green);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            left: ${x}px;
            top: ${y}px;
        `;
        
        document.body.appendChild(particle);
        
        // Animar partícula
        const angle = (Math.PI * 2 * Math.random());
        const distance = 50 + Math.random() * 50;
        const duration = 800 + Math.random() * 400;
        
        particle.animate([
            { 
                transform: 'translate(0, 0) scale(1)', 
                opacity: 1 
            },
            { 
                transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
                opacity: 0 
            }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }).onfinish = () => {
            particle.remove();
        };
    }
    
    showProgressFeedback() {
        // Mostrar toast de progreso
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-green);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 9999;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        toast.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            Paso ${this.currentStep} completado
        `;
        
        document.body.appendChild(toast);
        
        // Animar entrada
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // Métodos públicos para uso externo
    setStepCompleted(stepIndex, completed = true) {
        const step = this.steps[stepIndex];
        if (!step) return;
        
        if (completed) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else {
            step.classList.remove('completed');
        }
    }
    
    setStepLoading(stepIndex, loading = true) {
        const step = this.steps[stepIndex];
        if (!step) return;
        
        if (loading) {
            step.classList.add('loading');
            step.classList.remove('active', 'completed');
        } else {
            step.classList.remove('loading');
        }
    }
    
    reset() {
        this.currentStep = 0;
        this.steps.forEach(step => {
            step.classList.remove('active', 'completed', 'loading');
        });
        this.updateProgress();
    }
    
    finish() {
        // Completar todos los pasos
        this.currentStep = this.totalSteps - 1;
        this.steps.forEach((step, index) => {
            if (index <= this.currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            }
        });
        this.updateProgress();
        
        // Efecto final
        this.showCompletionCelebration();
    }
    
    showCompletionCelebration() {
        const celebration = document.createElement('div');
        celebration.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, var(--success-green), var(--light-green));
            color: white;
            padding: 30px;
            border-radius: 16px;
            z-index: 9999;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            animation: celebrationPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        `;
        celebration.innerHTML = `
            <i class="fas fa-trophy" style="font-size: 3rem; margin-bottom: 1rem; color: #FFD700;"></i>
            <h3 style="margin: 0 0 0.5rem 0;">¡Registro Completado!</h3>
            <p style="margin: 0; opacity: 0.9;">Todos los pasos han sido finalizados exitosamente</p>
        `;
        
        document.body.appendChild(celebration);
        
        // Crear confetti masivo
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createParticle(
                    window.innerWidth * Math.random(),
                    -10
                );
            }, i * 50);
        }
        
        // Remover celebración después de 4 segundos
        setTimeout(() => {
            celebration.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => celebration.remove(), 300);
        }, 4000);
    }
}

// Inicializar wizard automáticamente
document.addEventListener('DOMContentLoaded', function() {
    const wizardContainers = document.querySelectorAll('.wizard-progress');
    const wizards = [];
    
    wizardContainers.forEach(container => {
        const wizard = new WizardProgressManager(container);
        wizards.push(wizard);
        
        // Hacer accesible globalmente
        container.wizardManager = wizard;
    });
    
    // Hacer disponible globalmente
    window.wizardManagers = wizards;
});

// Agregar estilos de animación adicionales
const additionalStyles = `
    @keyframes celebrationPop {
        0% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(0.3) rotate(-10deg); 
        }
        100% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1) rotate(0deg); 
        }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
`;

// Inyectar estilos adicionales
if (!document.querySelector('#wizard-additional-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'wizard-additional-styles';
    styleSheet.textContent = additionalStyles;
    document.head.appendChild(styleSheet);
}

// Función utilitaria para obtener el primer wizard
function getFirstWizard() {
    const container = document.querySelector('.wizard-progress');
    return container ? container.wizardManager : null;
}

// Función para validar paso actual (ejemplo de integración)
function validateCurrentWizardStep() {
    const wizard = getFirstWizard();
    if (!wizard) return false;
    
    // Aquí puedes agregar tu lógica de validación
    // Por ejemplo, validar formularios del paso actual
    
    const currentStepElement = wizard.steps[wizard.currentStep];
    const stepIndex = wizard.currentStep;
    
    // Simulación de validación
    const isValid = Math.random() > 0.3; // 70% de probabilidad de ser válido
    
    if (isValid) {
        wizard.completeStep(stepIndex);
        return true;
    } else {
        // Mostrar error
        showWizardStepError(stepIndex, 'Por favor complete todos los campos requeridos');
        return false;
    }
}

function showWizardStepError(stepIndex, message) {
    const errorToast = document.createElement('div');
    errorToast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bs-danger);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    errorToast.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Paso ${stepIndex + 1}:</strong><br>
        ${message}
    `;
    
    document.body.appendChild(errorToast);
    
    setTimeout(() => {
        errorToast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        errorToast.style.transform = 'translateX(100%)';
        setTimeout(() => errorToast.remove(), 300);
    }, 4000);
}

// Función para llenar el resumen de confirmación
function llenarResumenConfirmacion() {
	const cuitElement = document.getElementById('cuit');
	const razonSocialElement = document.getElementById('razonSocial');
	const passwordElement = document.getElementById('password');
	
	// Validar que los elementos existen
	if (!cuitElement || !razonSocialElement || !passwordElement) {
		console.error('No se encontraron algunos campos del formulario');
		return;
	}
	
	const cuit = cuitElement.value;
	const razonSocial = razonSocialElement.value;
	const password = passwordElement.value;
	
	// Obtener la lista de confirmación
	const confirmacionLista = document.getElementById('confirmacion-lista');
	if (!confirmacionLista) return;
	
	// Limpiar lista anterior
	confirmacionLista.innerHTML = '';
	
	// Agregar elementos a la lista
	const items = [
		{ label: 'CUIT', value: cuit },
		{ label: 'Razón Social', value: razonSocial },
		{ label: 'Contraseña', value: '•'.repeat(password.length) }
	];
	
	items.forEach(item => {
		const listItem = document.createElement('li');
		listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
		listItem.innerHTML = `
			<strong>${item.label}:</strong>
			<span>${item.value}</span>
		`;
		confirmacionLista.appendChild(listItem);
	});
}

// ===========================
// INICIALIZACIÓN VALIDACIÓN CUIT
// ===========================

// Inicializar validación de CUIT cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
	const cuitInput = document.getElementById('cuit');
	
	if (cuitInput) {
		console.log('🚀 Inicializando validación de CUIT');
		
		// Configurar contenedor como relativo para posicionamiento del spinner
		if (getComputedStyle(cuitInput.parentNode).position === 'static') {
			cuitInput.parentNode.style.position = 'relative';
		}
		
		// Agregar clase para identificar el contenedor
		cuitInput.parentNode.classList.add('input-container');
		
		// Event listener para validación en tiempo real
		cuitInput.addEventListener('input', function() {
			validateCUIT(this);
		});
		
		// Event listener para validación al perder el foco
		cuitInput.addEventListener('blur', function() {
			if (this.value.trim()) {
				validateCUIT(this);
			}
		});
		
		// Event listener para limpiar feedback cuando se enfoca
		cuitInput.addEventListener('focus', function() {
			// Solo limpiar si no hay error de formato
			const formatValidation = validateCUITFormat(this.value.trim());
			if (formatValidation.valid || this.value.trim() === '') {
				// No limpiar, mantener el feedback para ver el estado
			}
		});
		
		console.log('✅ Validación de CUIT inicializada correctamente');
	} else {
		// Campo CUIT no encontrado - esto es normal en páginas que no son de registro
		// console.warn('⚠️ Campo CUIT no encontrado en el DOM');
	}
});

// Función para abrir el wizard de registro desde cualquier parte de la aplicación
function abrirWizardRegistro() {
	console.log('🎯 Abriendo wizard de registro...');
	
	// Verificar si estamos en la página principal
	const modal = document.getElementById('modalRegistroEmpleador');
	if (modal) {
		// Mostrar el modal
		const modalInstance = new bootstrap.Modal(modal);
		modalInstance.show();
		
		// Reinicializar el wizard si es necesario
		setTimeout(() => {
			const wizard = new RegistroWizard();
			console.log('✅ Wizard reinicializado');
		}, 300);
		
	} else {
		// Si no estamos en la página principal, redirigir
		console.log('🔄 Redirigiendo a página principal...');
		window.location.href = 'index.html';
		
		// Guardar un flag para abrir el modal automáticamente
		sessionStorage.setItem('openWizardOnLoad', 'true');
	}
}

// Al cargar la página, verificar si se debe abrir el wizard automáticamente
document.addEventListener('DOMContentLoaded', function() {
	if (sessionStorage.getItem('openWizardOnLoad') === 'true') {
		sessionStorage.removeItem('openWizardOnLoad');
		
		// Esperar a que todo se cargue
		setTimeout(() => {
			abrirWizardRegistro();
		}, 1000);
	}
	
	// Verificar conectividad con el backend al cargar
	if (BACKEND_CONFIG.DEVELOPMENT_MODE) {
		console.log('🔧 Modo desarrollo: verificando conectividad con backend...');
		setTimeout(async () => {
			try {
				const testUrl = buildURL(BACKEND_CONFIG.ENDPOINTS.VALIDATE_CUIT, '00000000000');
				const response = await fetchWithConfig(testUrl, {
					method: 'GET',
					signal: AbortSignal.timeout(3000)
				});
				console.log(`✅ Backend conectado correctamente (status: ${response.status})`);
			} catch (error) {
				console.warn('⚠️ No se pudo conectar con el backend:', error.message);
				console.log('🔧 Asegúrate de que el servidor Spring Boot esté ejecutándose en puerto 8080');
			}
		}, 1000);
	}
});

// ============================================================================
// FUNCIONES PARA MAPA DE LEAFLET EN WIZARD DE FINCA
// ============================================================================

let mapFinca = null;
let mapFincaMarker = null;
let mapFincaSatelliteLayer = null;
let mapFincaClassicLayer = null;

// Inicializar el mapa de Leaflet para el wizard de finca
function inicializarMapaFinca() {
	console.log('🗺️ Inicializando mapa de Leaflet para wizard...');
	
	try {
		// Verificar si Leaflet está disponible
		if (typeof L === 'undefined') {
			console.error('❌ Leaflet no está cargado');
			setTimeout(() => {
				console.log('⏳ Reintentando cargar mapa en 2 segundos...');
				inicializarMapaFinca();
			}, 2000);
			return;
		}

		// Verificar que el contenedor del mapa existe
		const mapContainer = document.getElementById('mapFinca');
		if (!mapContainer) {
			console.error('❌ Contenedor del mapa #mapFinca no encontrado');
			return;
		}

		console.log('✅ Contenedor del mapa encontrado');

		// Si el mapa ya existe, destruirlo
		if (mapFinca) {
			console.log('🔄 Destruyendo mapa existente...');
			mapFinca.remove();
			mapFinca = null;
			mapFincaMarker = null;
		}

		// Crear el mapa centrado en Mendoza
		mapFinca = L.map('mapFinca', {
			center: [-32.8895, -68.8458], // Mendoza
			zoom: 10,
			zoomControl: true,
			scrollWheelZoom: true,
			doubleClickZoom: true,
			dragging: true
		});

		console.log('✅ Mapa creado exitosamente');

		// Capa satelital (Google Satellite)
		mapFincaSatelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
			attribution: '© Google',
			maxZoom: 20
		});

		// Capa clásica (OpenStreetMap)
		mapFincaClassicLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© OpenStreetMap contributors',
			maxZoom: 19
		});

		// Agregar capa clásica por defecto
		mapFincaClassicLayer.addTo(mapFinca);
		console.log('✅ Capa clásica agregada');

		// Evento de click en el mapa
		mapFinca.on('click', function(e) {
			const lat = e.latlng.lat;
			const lng = e.latlng.lng;
			
			console.log(`🗺️ Click en mapa: Lat ${lat}, Lng ${lng}`);
			
			// Actualizar campos de coordenadas
			const latInput = document.getElementById('latitud');
			const lngInput = document.getElementById('longitud');
			
			if (latInput) latInput.value = lat.toFixed(6);
			if (lngInput) lngInput.value = lng.toFixed(6);
			
			// Agregar o mover marcador
			if (mapFincaMarker) {
				mapFincaMarker.setLatLng([lat, lng]);
			} else {
				mapFincaMarker = L.marker([lat, lng], {
					draggable: true
				}).addTo(mapFinca);
				
				// Evento cuando se arrastra el marcador
				mapFincaMarker.on('dragend', function(e) {
					const position = e.target.getLatLng();
					if (latInput) latInput.value = position.lat.toFixed(6);
					if (lngInput) lngInput.value = position.lng.toFixed(6);
					console.log(`🗺️ Marcador arrastrado a: Lat ${position.lat}, Lng ${position.lng}`);
				});
			}
			
			// Trigger validation
			if (typeof validarCampo === 'function') {
				if (latInput) validarCampo(latInput);
				if (lngInput) validarCampo(lngInput);
			}
		});

		// Eventos para actualizar mapa cuando se cambien las coordenadas manualmente
		const latInput = document.getElementById('latitud');
		const lngInput = document.getElementById('longitud');
		
		if (latInput) latInput.addEventListener('input', actualizarMarcadorDesdeCoordenadas);
		if (lngInput) lngInput.addEventListener('input', actualizarMarcadorDesdeCoordenadas);

		// Forzar redimensionamiento del mapa
		setTimeout(() => {
			mapFinca.invalidateSize();
			console.log('🗺️ Mapa redimensionado');
		}, 100);
		
		// Inicializar eventos para búsqueda de ubicación
		setTimeout(() => {
			const camposCalle = document.getElementById('calle');
			const camposNumero = document.getElementById('numeracion');
			
			if (camposCalle && camposNumero) {
				camposCalle.addEventListener('input', actualizarEstadoBotonBusqueda);
				camposNumero.addEventListener('input', actualizarEstadoBotonBusqueda);
				
				// Estado inicial del botón
				actualizarEstadoBotonBusqueda();
				console.log('✅ Eventos de búsqueda de ubicación inicializados');
			}
		}, 200);

		console.log('✅ Mapa de Leaflet inicializado correctamente');
		
	} catch (error) {
		console.error('❌ Error al inicializar mapa:', error);
		// Mostrar mensaje de error en el contenedor del mapa
		const mapContainer = document.getElementById('mapFinca');
		if (mapContainer) {
			mapContainer.innerHTML = `
				<div class="d-flex align-items-center justify-content-center h-100 text-center">
					<div>
						<i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
						<p class="text-muted">Error al cargar el mapa</p>
						<button class="btn btn-sm btn-outline-primary" onclick="inicializarMapaFinca()">
							<i class="fas fa-redo me-1"></i>Reintentar
						</button>
					</div>
				</div>
			`;
		}
	}
}

// Cambiar vista del mapa (satelital/clásico)
function cambiarVistaMapaFinca(tipo) {
	if (!mapFinca) {
		console.warn('⚠️ Mapa no inicializado, intentando inicializar...');
		inicializarMapaFinca();
		setTimeout(() => cambiarVistaMapaFinca(tipo), 1000);
		return;
	}
	
	try {
		// Remover capas existentes
		if (mapFinca.hasLayer(mapFincaSatelliteLayer)) {
			mapFinca.removeLayer(mapFincaSatelliteLayer);
		}
		if (mapFinca.hasLayer(mapFincaClassicLayer)) {
			mapFinca.removeLayer(mapFincaClassicLayer);
		}
		
		// Agregar la capa seleccionada
		if (tipo === 'satellite') {
			mapFincaSatelliteLayer.addTo(mapFinca);
			
			// Actualizar botones
			const btnSatellite = document.getElementById('mapSatellite');
			const btnClassic = document.getElementById('mapClassic');
			
			if (btnSatellite) {
				btnSatellite.classList.remove('btn-outline-success');
				btnSatellite.classList.add('btn-success');
			}
			if (btnClassic) {
				btnClassic.classList.remove('btn-success');
				btnClassic.classList.add('btn-outline-success');
			}
		} else {
			mapFincaClassicLayer.addTo(mapFinca);
			
			// Actualizar botones
			const btnSatellite = document.getElementById('mapSatellite');
			const btnClassic = document.getElementById('mapClassic');
			
			if (btnClassic) {
				btnClassic.classList.remove('btn-outline-success');
				btnClassic.classList.add('btn-success');
			}
			if (btnSatellite) {
				btnSatellite.classList.remove('btn-success');
				btnSatellite.classList.add('btn-outline-success');
			}
		}
		
		console.log(`🗺️ Vista cambiada a: ${tipo}`);
		
	} catch (error) {
		console.error('❌ Error al cambiar vista del mapa:', error);
	}
}

// Actualizar marcador cuando se cambien las coordenadas manualmente
function actualizarMarcadorDesdeCoordenadas() {
	if (!mapFinca) return;
	
	const lat = parseFloat(document.getElementById('latitud').value);
	const lng = parseFloat(document.getElementById('longitud').value);
	
	if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
		if (mapFincaMarker) {
			mapFincaMarker.setLatLng([lat, lng]);
		} else {
			mapFincaMarker = L.marker([lat, lng], {
				draggable: true
			}).addTo(mapFinca);
			
			mapFincaMarker.on('dragend', function(e) {
				const position = e.target.getLatLng();
				document.getElementById('latitud').value = position.lat.toFixed(6);
				document.getElementById('longitud').value = position.lng.toFixed(6);
			});
		}
		
		// Centrar mapa en la nueva posición
		mapFinca.setView([lat, lng], mapFinca.getZoom());
	}
}

// ============================================================================
// FUNCIONES PARA BÚSQUEDA DE UBICACIÓN POR DIRECCIÓN
// ============================================================================

// Validar que los campos necesarios estén completos
function validarCamposDireccion() {
	const calle = document.getElementById('calle')?.value?.trim();
	const numero = document.getElementById('numeracion')?.value?.trim();
	
	return calle && numero;
}

// Habilitar/deshabilitar botón según validación
function actualizarEstadoBotonBusqueda() {
	const btn = document.getElementById('buscarUbicacionBtn');
	if (btn) {
		btn.disabled = !validarCamposDireccion();
	}
}

// Función principal de búsqueda de ubicación
async function buscarUbicacion() {
	console.log('🔍 Iniciando búsqueda de ubicación...');
	
	if (!validarCamposDireccion()) {
		mostrarFeedbackBusqueda('error', 'Complete los campos de Calle y Número antes de buscar');
		return;
	}
	
	const btn = document.getElementById('buscarUbicacionBtn');
	const btnText = btn.querySelector('.btn-text');
	const btnLoading = btn.querySelector('.btn-loading');
	
	try {
		// Mostrar estado de carga
		btn.disabled = true;
		btnText.classList.add('d-none');
		btnLoading.classList.remove('d-none');
		
		// Construir dirección completa
		const calle = document.getElementById('calle').value.trim();
		const numero = document.getElementById('numeracion').value.trim();
		const codigoPostal = document.getElementById('codigoPostal').value.trim();
		
		let direccionCompleta = `${calle} ${numero}`;
		if (codigoPostal) {
			direccionCompleta += `, ${codigoPostal}`;
		}
		direccionCompleta += ', Mendoza, Argentina';
		
		console.log('📍 Buscando dirección:', direccionCompleta);
		
		// Llamar a la API de geocodificación
		const resultado = await geocodificarDireccion(direccionCompleta);
		
		if (resultado.success) {
			actualizarMapaConUbicacion(resultado.lat, resultado.lng, resultado.direccionEncontrada);
			mostrarFeedbackBusqueda('success', `Ubicación encontrada: ${resultado.direccionEncontrada}`);
			
			// Animación de éxito en el botón
			btn.classList.add('success');
			setTimeout(() => btn.classList.remove('success'), 600);
		} else {
			mostrarFeedbackBusqueda('error', resultado.error);
			
			// Animación de error en el botón
			btn.classList.add('error');
			setTimeout(() => btn.classList.remove('error'), 500);
		}
		
	} catch (error) {
		console.error('❌ Error en búsqueda de ubicación:', error);
		mostrarFeedbackBusqueda('error', 'Error de conexión. Verifique su internet e intente nuevamente.');
		
		btn.classList.add('error');
		setTimeout(() => btn.classList.remove('error'), 500);
		
	} finally {
		// Restaurar estado del botón
		btn.disabled = false;
		btnText.classList.remove('d-none');
		btnLoading.classList.add('d-none');
	}
}

// Función para detectar servidor correcto con proxy
async function detectarServidorProxy() {
    // Usar puerto 3000 para el proxy/servidor combinado
    const PROXY_PORT = 3000;
    
    try {
        // Primero verificar que el servidor responda
        const testResponse = await fetch(`http://localhost:${PROXY_PORT}/`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(2000)
        });
        
        if (testResponse.ok) {
            console.log(`✅ Servidor encontrado en puerto ${PROXY_PORT}`);
            // Ahora verificar que el endpoint de API existe
            try {
                const apiResponse = await fetch(`http://localhost:${PROXY_PORT}/api/geocoding?q=test`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000)
                });
                
                if (apiResponse.ok || apiResponse.status === 400) {
                    console.log(`✅ API de geocodificación disponible en puerto ${PROXY_PORT}`);
                    return `http://localhost:${PROXY_PORT}`;
                }
            } catch (apiError) {
                console.log(`⚠️ Servidor encontrado pero API no disponible:`, apiError.message);
                // Aún así devolvemos la URL del servidor
                return `http://localhost:${PROXY_PORT}`;
            }
        }
    } catch (error) {
        console.log(`❌ Servidor no disponible en puerto ${PROXY_PORT}:`, error.message);
    }
    
    // Si no encuentra servidor proxy, mostrar instrucciones
    throw new Error('No se encontró servidor proxy. Ejecute "python server.py" desde la terminal.');
}

// Función para geocodificar usando API de Nominatim a través de proxy local
async function geocodificarDireccion(direccion) {
    try {
        const encodedAddress = encodeURIComponent(direccion);
		
		// Detectar servidor proxy automáticamente
		let baseUrl;
		try {
			baseUrl = await detectarServidorProxy();
		} catch (error) {
			console.error('❌ Error detectando servidor proxy:', error);
			
			// Mostrar instrucciones específicas al usuario
			mostrarInstruccionesServidor();
			throw new Error('Servidor proxy no disponible. Consulte las instrucciones.');
		}
		
		const url = `${baseUrl}/api/geocoding?q=${encodedAddress}`;
		
		console.log('🌐 URL de geocodificación (proxy local):', url);
		console.log('📍 Dirección a geocodificar:', direccion);
		
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		
		if (!response.ok) {
			throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
		}
		
		const data = await response.json();
		console.log('📊 Respuesta del proxy:', data);
		
		if (!data.success || !data.results || data.results.length === 0) {
			return {
				success: false,
				error: 'No se encontró la dirección especificada. Verifique los datos e intente nuevamente.'
			};
		}
		
		const resultados = data.results;
		console.log('📊 Resultados de geocodificación:', resultados);
		
		// Filtrar resultados que estén en Mendoza
		const resultadosMendoza = resultados.filter(resultado => {
			const address = resultado.address || {};
			return address.state === 'Mendoza' || 
				   address.city === 'Mendoza' ||
				   resultado.display_name.toLowerCase().includes('mendoza');
		});
		
		let mejorResultado = resultadosMendoza.length > 0 ? resultadosMendoza[0] : resultados[0];
		
		// Validar que esté en Argentina
		if (!mejorResultado.address?.country_code || mejorResultado.address.country_code !== 'ar') {
			return {
				success: false,
				error: 'La dirección encontrada está fuera de Argentina. Verifique los datos.'
			};
		}
		
		const lat = parseFloat(mejorResultado.lat);
		const lng = parseFloat(mejorResultado.lon);
		
		// Validar coordenadas de Mendoza (aproximadas)
		if (lat < -36 || lat > -30 || lng < -71 || lng > -66) {
			console.warn('⚠️ Coordenadas fuera del rango esperado para Mendoza');
		}
		
		console.log('✅ Geocodificación exitosa:', { lat, lng });
		
		return {
			success: true,
			lat: lat,
			lng: lng,
			direccionEncontrada: mejorResultado.display_name,
			detalles: mejorResultado.address
		};
		
	} catch (error) {
		console.error('❌ Error en geocodificación:', error);
		return {
			success: false,
			error: 'Error al conectar con el servicio de mapas. Intente nuevamente.'
		};
	}
}

// Función para mostrar instrucciones del servidor proxy
function mostrarInstruccionesServidor() {
	const toast = document.createElement('div');
	toast.className = 'toast align-items-center text-white bg-warning border-0';
	toast.setAttribute('role', 'alert');
	toast.setAttribute('aria-live', 'assertive');
	toast.setAttribute('aria-atomic', 'true');
	toast.innerHTML = `
		<div class="d-flex">
			<div class="toast-body">
				<i class="fas fa-exclamation-triangle me-2"></i>
				<strong>Servidor Proxy Requerido:</strong><br>
				1. Abra una terminal en VS Code<br>
				2. Ejecute: <code>python server.py</code><br>
				3. Acceda a: <code>http://localhost:3001</code>
			</div>
			<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
		</div>
	`;
	
	// Crear contenedor de toasts si no existe
	let toastContainer = document.querySelector('.toast-container');
	if (!toastContainer) {
		toastContainer = document.createElement('div');
		toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
		toastContainer.style.zIndex = '9999';
		document.body.appendChild(toastContainer);
	}
	
	toastContainer.appendChild(toast);
	const bsToast = new bootstrap.Toast(toast, { delay: 8000 });
	bsToast.show();
	
	toast.addEventListener('hidden.bs.toast', () => {
		toast.remove();
	});
}

// Actualizar el mapa con la ubicación encontrada
function actualizarMapaConUbicacion(lat, lng, direccion) {
	if (!mapFinca) {
		console.error('❌ Mapa no disponible');
		return;
	}
	
	console.log(`🗺️ Actualizando mapa con ubicación: ${lat}, ${lng}`);
	
	// Actualizar campos de coordenadas
	const latInput = document.getElementById('latitud');
	const lngInput = document.getElementById('longitud');
	
	if (latInput) latInput.value = lat.toFixed(6);
	if (lngInput) lngInput.value = lng.toFixed(6);
	
	// Centrar mapa con animación suave
	mapFinca.setView([lat, lng], 16, {
		animate: true,
		duration: 1.5
	});
	
	// Crear marcador especial con popup
	if (mapFincaMarker) {
		mapFinca.removeLayer(mapFincaMarker);
	}
	
	// Marcador con color especial para ubicación encontrada
	const iconoUbicacion = L.divIcon({
		className: 'marcador-ubicacion-encontrada',
		html: '<i class="fas fa-map-marker-alt"></i>',
		iconSize: [30, 30],
		iconAnchor: [15, 30],
		popupAnchor: [0, -30]
	});
	
	mapFincaMarker = L.marker([lat, lng], {
		icon: iconoUbicacion,
		draggable: true
	}).addTo(mapFinca);
	
	// Popup con información
	mapFincaMarker.bindPopup(`
		<div class="popup-ubicacion">
			<h6><i class="fas fa-map-marker-alt text-success"></i> Ubicación Encontrada</h6>
			<p class="mb-1 small">${direccion}</p>
			<small class="text-muted">Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</small>
		</div>
	`).openPopup();
	
	// Evento cuando se arrastra el marcador
	mapFincaMarker.on('dragend', function(e) {
		const position = e.target.getLatLng();
		if (latInput) latInput.value = position.lat.toFixed(6);
		if (lngInput) lngInput.value = position.lng.toFixed(6);
		console.log(`🗺️ Marcador arrastrado a: ${position.lat}, ${position.lng}`);
	});
	
	// Trigger validation
	if (typeof validarCampo === 'function') {
		if (latInput) validarCampo(latInput);
		if (lngInput) validarCampo(lngInput);
	}
	
	// Highlight temporal del marcador
	setTimeout(() => {
		if (mapFincaMarker) {
			mapFincaMarker.setIcon(L.divIcon({
				className: 'marcador-ubicacion-normal',
				html: '<i class="fas fa-map-marker-alt"></i>',
				iconSize: [25, 25],
				iconAnchor: [12.5, 25],
				popupAnchor: [0, -25]
			}));
		}
	}, 3000);
}

// Mostrar feedback visual de la búsqueda
function mostrarFeedbackBusqueda(tipo, mensaje) {
	const toast = document.createElement('div');
	toast.className = `toast align-items-center text-white border-0 ${tipo === 'success' ? 'bg-success' : 'bg-danger'}`;
	toast.setAttribute('role', 'alert');
	toast.setAttribute('aria-live', 'assertive');
	toast.setAttribute('aria-atomic', 'true');
	
	const icono = tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
	
	toast.innerHTML = `
		<div class="d-flex">
			<div class="toast-body">
				<i class="fas ${icono} me-2"></i>
				${mensaje}
			</div>
			<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
		</div>
	`;
	
	// Crear contenedor de toasts si no existe
	let toastContainer = document.querySelector('.toast-container-search');
	if (!toastContainer) {
		toastContainer = document.createElement('div');
		toastContainer.className = 'toast-container toast-container-search position-fixed top-0 end-0 p-3';
		toastContainer.style.zIndex = '9999';
		document.body.appendChild(toastContainer);
	}
	
	toastContainer.appendChild(toast);
	const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
	bsToast.show();
	
	toast.addEventListener('hidden.bs.toast', () => {
		toast.remove();
	});
	
	console.log(`📢 Feedback mostrado: ${tipo} - ${mensaje}`);
}

// Modificar la función abrirWizardRegistro para inicializar el mapa
function abrirWizardRegistroConMapa() {
	// Verificar que el elemento modal existe
	const modalElement = document.getElementById('wizardFincaModal');
	if (!modalElement) {
		console.error('❌ Modal wizardFincaModal no encontrado');
		return;
	}
	
	console.log('✅ Modal element encontrado');
	
	// Crear instancia del modal con configuraciones explícitas
	const modal = new bootstrap.Modal(modalElement, {
		backdrop: 'static',
		keyboard: true,
		focus: true
	});
	
	console.log('✅ Modal Bootstrap inicializado');
	
	// Cargar contenido del paso 1
	cargarPaso1();
	
	console.log('✅ Contenido Paso 1 cargado');
	
	// Mostrar modal
	modal.show();
	
	console.log('✅ Modal mostrado');
	
	// CRÍTICO: Inicializar el mapa después de que el modal esté completamente visible
	modalElement.addEventListener('shown.bs.modal', function() {
		console.log('🗺️ Modal completamente visible, inicializando mapa...');
		setTimeout(() => {
			inicializarMapaFinca();
		}, 300);
	}, { once: true });
	
	// CRÍTICO: Corregir backdrop después de mostrar
	setTimeout(() => {
		const backdrop = document.querySelector('.modal-backdrop');
		if (backdrop) {
			backdrop.style.pointerEvents = 'none';
			console.log('✅ Backdrop configurado para no bloquear eventos');
		}
		
		const modalDialog = modalElement.querySelector('.modal-dialog');
		if (modalDialog) {
			modalDialog.style.pointerEvents = 'auto';
			console.log('✅ Modal-dialog configurado para recibir eventos');
		}
		
		const firstInput = modalElement.querySelector('input:not([disabled])');
		if (firstInput) {
			firstInput.focus();
			firstInput.click();
			console.log('✅ Focus y click establecido en primer input');
		}
	}, 500);
}

// ============================================================================
// FUNCIONES PARA MAPA DE ESTABLECIMIENTOS EN DASHBOARD
// ============================================================================

let mapEstablecimientos = null;
let marcadoresEstablecimientos = [];

/**
 * Cargar establecimientos desde el endpoint para mostrar en el mapa
 */
async function cargarEstablecimientosParaMapa() {
    console.log('🗺️ Cargando establecimientos para el mapa...');
    
    try {
        const url = buildURL(BACKEND_CONFIG.ENDPOINTS.GET_ESTABLECIMIENTOS);
        console.log('📡 URL establecimientos:', url);
        
        const response = await fetchWithAuth(url);
        
        if (!response.ok) {
            if (response.status === 401) {
                console.error('❌ Token expirado al cargar establecimientos');
                cerrarSesion();
                throw new Error('Sesión expirada');
            }
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const establecimientos = await response.json();
        console.log('✅ Establecimientos cargados para mapa:', establecimientos);
        console.log('🔍 Número total de establecimientos recibidos:', establecimientos.length);
        
        // Log detallado de cada establecimiento
        establecimientos.forEach((est, index) => {
            console.log(`📋 Establecimiento ${index + 1}:`, {
                id: est.idEstablecimiento,
                nombre: est.nombreEstablecimiento,
                latitud: est.latitud,
                longitud: est.longitud,
                latitudTipo: typeof est.latitud,
                longitudTipo: typeof est.longitud
            });
        });
        
        // Validar que los datos tengan coordenadas - VALIDACIÓN MEJORADA
        const establecimientosValidos = establecimientos.filter(est => {
            // Convertir a números para validación robusta
            const lat = parseFloat(est.latitud);
            const lng = parseFloat(est.longitud);
            
            // Verificar que existan, sean números válidos y estén en rango Argentina
            const latValida = est.latitud !== null && est.latitud !== undefined && 
                             est.latitud !== '' && !isNaN(lat) && 
                             lat >= -55 && lat <= -21; // Rango aproximado Argentina
            
            const lngValida = est.longitud !== null && est.longitud !== undefined && 
                             est.longitud !== '' && !isNaN(lng) && 
                             lng >= -73 && lng <= -53; // Rango aproximado Argentina
            
            const esValido = latValida && lngValida;
            
            // Log detallado para debugging
            if (!esValido) {
                console.warn(`⚠️ Establecimiento ${est.nombreEstablecimiento} descartado:`, {
                    id: est.idEstablecimiento,
                    latitudOriginal: est.latitud,
                    longitudOriginal: est.longitud,
                    latitudConvertida: lat,
                    longitudConvertida: lng,
                    latitudValida: latValida,
                    longitudValida: lngValida,
                    razon: !latValida ? 'Latitud inválida' : 'Longitud inválida'
                });
            }
            
            return esValido;
        });
        
        console.log(`📍 Establecimientos con coordenadas válidas: ${establecimientosValidos.length}/${establecimientos.length}`);
        
        // Log de establecimientos descartados
        const establecimientosInvalidos = establecimientos.filter(est => 
            !est.latitud || !est.longitud || 
            isNaN(est.latitud) || isNaN(est.longitud)
        );
        
        if (establecimientosInvalidos.length > 0) {
            console.warn('⚠️ Establecimientos con coordenadas inválidas:', establecimientosInvalidos.map(est => ({
                id: est.idEstablecimiento,
                nombre: est.nombreEstablecimiento,
                latitud: est.latitud,
                longitud: est.longitud
            })));
        }
        
        return establecimientosValidos;
        
    } catch (error) {
        console.error('❌ Error cargando establecimientos para mapa:', error);
        throw error;
    }
}

/**
 * Inicializar el mapa de establecimientos en el dashboard
 */
function inicializarMapaEstablecimientos() {
    console.log('🗺️ Inicializando mapa de establecimientos...');
    
    try {
        // Verificar si Leaflet está disponible
        if (typeof L === 'undefined') {
            console.error('❌ Leaflet no está cargado');
            throw new Error('Leaflet no disponible');
        }

        // Verificar que el contenedor del mapa existe
        const mapContainer = document.getElementById('mapa-establecimientos');
        if (!mapContainer) {
            console.error('❌ Contenedor del mapa #mapa-establecimientos no encontrado');
            throw new Error('Contenedor del mapa no encontrado');
        }

        console.log('✅ Contenedor del mapa encontrado');

        // Si el mapa ya existe, destruirlo
        if (mapEstablecimientos) {
            console.log('🔄 Destruyendo mapa existente...');
            mapEstablecimientos.remove();
            mapEstablecimientos = null;
            marcadoresEstablecimientos = [];
        }

        // Crear el mapa centrado en Argentina (Mendoza como referencia)
        mapEstablecimientos = L.map('mapa-establecimientos', {
            center: [-32.8895, -68.8458], // Mendoza, Argentina
            zoom: 6, // Zoom más amplio para ver toda Argentina
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            dragging: true
        });

        console.log('✅ Mapa de establecimientos creado exitosamente');

        // Agregar capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(mapEstablecimientos);

        console.log('✅ Capa de mapa agregada');

        // Forzar redimensionamiento del mapa
        setTimeout(() => {
            mapEstablecimientos.invalidateSize();
            console.log('🗺️ Mapa de establecimientos redimensionado');
        }, 100);

        console.log('✅ Mapa de establecimientos inicializado correctamente');
        return mapEstablecimientos;
        
    } catch (error) {
        console.error('❌ Error al inicializar mapa de establecimientos:', error);
        throw error;
    }
}

/**
 * Agregar marcadores de establecimientos al mapa
 */
function agregarMarcadoresEstablecimientos(establecimientos) {
    console.log('📍 Agregando marcadores de establecimientos al mapa...');
    
    try {
        if (!mapEstablecimientos) {
            throw new Error('Mapa no inicializado');
        }

        // Limpiar marcadores existentes
        marcadoresEstablecimientos.forEach(marcador => {
            mapEstablecimientos.removeLayer(marcador);
        });
        marcadoresEstablecimientos = [];

        if (!establecimientos || establecimientos.length === 0) {
            console.log('ℹ️ No hay establecimientos para mostrar en el mapa');
            return;
        }

        console.log(`🗺️ Procesando ${establecimientos.length} establecimientos para marcadores...`);

        // Array para rastrear coordenadas usadas y aplicar offset
        let coordenadasUsadas = [];
        let marcadoresCreados = 0;
        let marcadoresConOffset = 0;

        // Agregar marcador por cada establecimiento
        establecimientos.forEach((establecimiento, index) => {
            console.log(`🔄 Procesando establecimiento ${index + 1}/${establecimientos.length}:`, establecimiento.nombreEstablecimiento);
            
            try {
                let lat = parseFloat(establecimiento.latitud);
                let lng = parseFloat(establecimiento.longitud);

                console.log(`📐 Coordenadas originales: Lat=${lat}, Lng=${lng}`);

                if (isNaN(lat) || isNaN(lng)) {
                    console.warn(`⚠️ Coordenadas inválidas para establecimiento ${establecimiento.nombreEstablecimiento}: lat=${lat}, lng=${lng}`);
                    return;
                }

                // Verificar si hay coordenadas muy cercanas
                const coordCercana = coordenadasUsadas.find(coord => {
                    const distancia = Math.sqrt(Math.pow(coord.lat - lat, 2) + Math.pow(coord.lng - lng, 2));
                    return distancia < 0.001; // Menos de ~100 metros
                });

                // Aplicar offset si hay coordenadas muy cercanas
                if (coordCercana) {
                    console.warn(`⚠️ Coordenadas muy cercanas detectadas para ${establecimiento.nombreEstablecimiento}`);
                    console.log(`🔄 Aplicando offset para separar marcadores...`);
                    
                    // Aplicar offset pequeño pero visible
                    const offsetBase = 0.002; // Aproximadamente 200 metros
                    const offsetAngle = (coordenadasUsadas.length * 60) * (Math.PI / 180); // 60 grados de separación
                    
                    lat += Math.cos(offsetAngle) * offsetBase;
                    lng += Math.sin(offsetAngle) * offsetBase;
                    
                    marcadoresConOffset++;
                    console.log(`✅ Offset aplicado: Nueva posición [${lat.toFixed(6)}, ${lng.toFixed(6)}]`);
                }

                // Crear popup con información del establecimiento
                const popupContent = crearPopupEstablecimiento(establecimiento);

                // Crear marcador con icono personalizado si tiene offset
                let marcador;
                if (coordCercana) {
                    // Icono diferente para marcadores con offset
                    const iconoOffset = L.divIcon({
                        html: `<div style="background: #ff6b6b; border: 2px solid #fff; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
                        className: 'marcador-offset',
                        iconSize: [25, 25],
                        iconAnchor: [12.5, 12.5]
                    });
                    
                    marcador = L.marker([lat, lng], { icon: iconoOffset })
                        .addTo(mapEstablecimientos)
                        .bindPopup(popupContent);
                } else {
                    // Icono normal para marcadores sin offset
                    const iconoNormal = L.divIcon({
                        html: `<div style="background: #007bff; border: 2px solid #fff; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
                        className: 'marcador-normal',
                        iconSize: [25, 25],
                        iconAnchor: [12.5, 12.5]
                    });
                    
                    marcador = L.marker([lat, lng], { icon: iconoNormal })
                        .addTo(mapEstablecimientos)
                        .bindPopup(popupContent);
                }

                marcadoresEstablecimientos.push(marcador);
                coordenadasUsadas.push({ lat: lat, lng: lng, nombre: establecimiento.nombreEstablecimiento });
                marcadoresCreados++;

                console.log(`✅ Marcador ${marcadoresCreados} agregado exitosamente: ${establecimiento.nombreEstablecimiento} en [${lat.toFixed(6)}, ${lng.toFixed(6)}]`);

            } catch (error) {
                console.error(`❌ Error agregando marcador para ${establecimiento.nombreEstablecimiento}:`, error);
            }
        });

        // Resumen detallado
        console.log('\n📊 RESUMEN DE MARCADORES:');
        console.log(`✅ Total marcadores creados: ${marcadoresCreados}/${establecimientos.length}`);
        console.log(`🔄 Marcadores con offset aplicado: ${marcadoresConOffset}`);
        console.log(`🎯 Marcadores visibles en mapa: ${marcadoresEstablecimientos.length}`);
        
        if (marcadoresCreados !== establecimientos.length) {
            console.warn(`⚠️ DISCREPANCIA: Se esperaban ${establecimientos.length} marcadores, se crearon ${marcadoresCreados}`);
        }

        // Ajustar vista del mapa para mostrar todos los establecimientos
        if (marcadoresEstablecimientos.length > 0) {
            ajustarVistaMapaAEstablecimientos(establecimientos);
        }

    } catch (error) {
        console.error('❌ Error agregando marcadores de establecimientos:', error);
        throw error;
    }
}

/**
    }
}

/**
 * Crear contenido HTML para popup de establecimiento
 */
function crearPopupEstablecimiento(establecimiento) {
    const direccion = `${establecimiento.calle} ${establecimiento.numeracion}`;
    const especies = establecimiento.especies && establecimiento.especies.length > 0 
        ? establecimiento.especies.join(', ') 
        : 'No especificadas';

    return `
        <div class="popup-establecimiento" style="font-family: Arial, sans-serif; font-size: 14px; max-width: 300px;">
            <h6 style="margin: 0 0 8px 0; font-weight: bold; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 4px;">
                <i class="fas fa-map-marker-alt" style="color: #e74c3c; margin-right: 5px;"></i>
                ${establecimiento.nombreEstablecimiento}
            </h6>
            
            <div style="margin-bottom: 8px;">
                <strong style="color: #34495e;">📍 Dirección:</strong><br>
                <span style="color: #7f8c8d;">${direccion}</span><br>
                <span style="color: #7f8c8d;">${establecimiento.nombreDistrito}, ${establecimiento.nombreDepartamento}</span><br>
                <small style="color: #95a5a6;">CP: ${establecimiento.codigoPostal}</small>
            </div>

            <div style="margin-bottom: 8px;">
                <strong style="color: #34495e;">🌱 Especies:</strong><br>
                <span style="color: #27ae60; font-style: ${establecimiento.especies && establecimiento.especies.length > 0 ? 'normal' : 'italic'};">
                    ${especies}
                </span>
            </div>

            <div style="margin-bottom: 4px;">
                <strong style="color: #34495e;">🌐 Coordenadas:</strong><br>
                <small style="color: #7f8c8d; font-family: monospace;">
                    Lat: ${parseFloat(establecimiento.latitud).toFixed(6)}<br>
                    Lng: ${parseFloat(establecimiento.longitud).toFixed(6)}
                </small>
            </div>

            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ecf0f1;">
                <small style="color: #95a5a6;">
                    <i class="fas fa-id-badge" style="margin-right: 3px;"></i>
                    ID: ${establecimiento.idEstablecimiento}
                </small>
            </div>
        </div>
    `;
}

/**
 * Ajustar la vista del mapa para mostrar todos los establecimientos
 */
function ajustarVistaMapaAEstablecimientos(establecimientos) {
    console.log('🔍 Ajustando vista del mapa para mostrar establecimientos...');
    
    try {
        if (!mapEstablecimientos || !establecimientos || establecimientos.length === 0) {
            return;
        }

        if (establecimientos.length === 1) {
            // Si hay solo un establecimiento, centrar en él
            const est = establecimientos[0];
            const lat = parseFloat(est.latitud);
            const lng = parseFloat(est.longitud);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                mapEstablecimientos.setView([lat, lng], 14);
                console.log(`✅ Mapa centrado en único establecimiento: ${est.nombreEstablecimiento}`);
            }
        } else {
            // Si hay múltiples establecimientos, calcular bounds inteligente
            const coordenadas = [];
            let latMin = Infinity, latMax = -Infinity;
            let lngMin = Infinity, lngMax = -Infinity;
            
            establecimientos.forEach(est => {
                const lat = parseFloat(est.latitud);
                const lng = parseFloat(est.longitud);
                
                if (!isNaN(lat) && !isNaN(lng)) {
                    coordenadas.push([lat, lng]);
                    latMin = Math.min(latMin, lat);
                    latMax = Math.max(latMax, lat);
                    lngMin = Math.min(lngMin, lng);
                    lngMax = Math.max(lngMax, lng);
                }
            });

            if (coordenadas.length > 0) {
                const deltaLat = latMax - latMin;
                const deltaLng = lngMax - lngMin;
                
                // Calcular distancia máxima entre puntos
                const distanciaMaxima = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);
                
                console.log(`📏 Análisis de dispersión:`, {
                    establecimientos: coordenadas.length,
                    deltaLat: deltaLat.toFixed(6),
                    deltaLng: deltaLng.toFixed(6),
                    distanciaMaxima: distanciaMaxima.toFixed(6)
                });
                
                if (distanciaMaxima < 0.01) {
                    // Establecimientos muy cercanos (< 1km aprox)
                    console.log('🔍 Establecimientos muy cercanos detectados, aplicando zoom especial');
                    
                    // Calcular centro y aplicar zoom alto
                    const centroLat = (latMin + latMax) / 2;
                    const centroLng = (lngMin + lngMax) / 2;
                    
                    // Crear bounds mínimos para asegurar que ambos marcadores sean visibles
                    const paddingMinimo = 0.005; // Aproximadamente 500m de padding
                    const boundsExtendidos = [
                        [latMin - paddingMinimo, lngMin - paddingMinimo],
                        [latMax + paddingMinimo, lngMax + paddingMinimo]
                    ];
                    
                    mapEstablecimientos.fitBounds(boundsExtendidos, {
                        padding: [30, 30],
                        maxZoom: 16 // Zoom alto para establecimientos cercanos
                    });
                    
                    console.log(`✅ Zoom inteligente aplicado para establecimientos cercanos en [${centroLat.toFixed(6)}, ${centroLng.toFixed(6)}]`);
                    
                } else {
                    // Establecimientos dispersos, usar fitBounds normal
                    const group = new L.featureGroup(marcadoresEstablecimientos);
                    
                    if (marcadoresEstablecimientos.length > 0) {
                        mapEstablecimientos.fitBounds(group.getBounds(), {
                            padding: [20, 20],
                            maxZoom: 15
                        });
                        
                        console.log(`✅ Vista normal ajustada para ${coordenadas.length} establecimientos dispersos`);
                    } else {
                        // Fallback si no hay marcadores en el grupo
                        const bounds = coordenadas.map(coord => coord);
                        mapEstablecimientos.fitBounds(bounds, {
                            padding: [20, 20],
                            maxZoom: 15
                        });
                        
                        console.log(`✅ Vista ajustada usando coordenadas directas`);
                    }
                }
                
                // Verificación post-ajuste
                setTimeout(() => {
                    const centroFinal = mapEstablecimientos.getCenter();
                    const zoomFinal = mapEstablecimientos.getZoom();
                    console.log(`🎯 Estado final del mapa: Centro=[${centroFinal.lat.toFixed(6)}, ${centroFinal.lng.toFixed(6)}], Zoom=${zoomFinal}`);
                }, 100);
            }
        }

    } catch (error) {
        console.error('❌ Error ajustando vista del mapa:', error);
    }
}

/**
 * Función de debugging para inspeccionar el estado del mapa
 */
window.debugMapa = function() {
    console.log('🔍 === DEBUG MAPA ESTABLECIMIENTOS ===');
    console.log('📊 Estado del mapa:', {
        mapaInicializado: !!mapEstablecimientos,
        numeroMarcadores: marcadoresEstablecimientos.length,
        marcadores: marcadoresEstablecimientos.map(m => ({
            posicion: m.getLatLng(),
            popup: m.getPopup() ? m.getPopup().getContent() : 'Sin popup'
        }))
    });
    
    if (mapEstablecimientos) {
        console.log('🗺️ Centro del mapa:', mapEstablecimientos.getCenter());
        console.log('🔍 Zoom actual:', mapEstablecimientos.getZoom());
        console.log('📐 Bounds del mapa:', mapEstablecimientos.getBounds());
    }
    
    // Recargar establecimientos para debugging
    cargarEstablecimientosParaMapa().then(establecimientos => {
        console.log('🔄 Establecimientos recargados para debug:', establecimientos);
    }).catch(error => {
        console.error('❌ Error recargando establecimientos:', error);
    });
};

/**
 * 🔍 FUNCIÓN DE VERIFICACIÓN POST-RENDERIZADO
 * Verifica que todos los marcadores esperados estén visibles en el mapa
 * Utilizar en consola: verificarMarcadoresEnMapa()
 */
window.verificarMarcadoresEnMapa = async function() {
    console.log('🔍 INICIANDO VERIFICACIÓN POST-RENDERIZADO...');
    console.log('='.repeat(50));
    
    try {
        // 1. Obtener datos esperados del endpoint
        console.log('📡 PASO 1: Obteniendo datos del endpoint...');
        const url = buildURL(BACKEND_CONFIG.ENDPOINTS.GET_ESTABLECIMIENTOS);
        const response = await fetchWithAuth(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const datosOriginales = await response.json();
        console.log(`📊 Total de establecimientos en endpoint: ${datosOriginales.length}`);
        
        // 2. Filtrar establecimientos válidos (misma lógica que cargarEstablecimientosParaMapa)
        const establecimientosValidos = datosOriginales.filter(est => {
            const lat = parseFloat(est.latitud);
            const lng = parseFloat(est.longitud);
            
            const latValida = est.latitud !== null && est.latitud !== undefined && 
                             est.latitud !== '' && !isNaN(lat) && 
                             lat >= -55 && lat <= -21;
            
            const lngValida = est.longitud !== null && est.longitud !== undefined && 
                             est.longitud !== '' && !isNaN(lng) && 
                             lng >= -73 && lng <= -53;
            
            return latValida && lngValida;
        });
        
        console.log(`✅ Establecimientos con coordenadas válidas: ${establecimientosValidos.length}`);
        
        // 3. Contar marcadores en el DOM
        console.log('\n🗺️  PASO 2: Contando marcadores en el DOM...');
        const marcadoresEnDOM = document.querySelectorAll('.leaflet-marker-icon').length;
        const marcadoresNormales = document.querySelectorAll('.marcador-normal').length;
        const marcadoresOffset = document.querySelectorAll('.marcador-offset').length;
        
        console.log(`🎯 Marcadores totales en DOM: ${marcadoresEnDOM}`);
        console.log(`🔵 Marcadores normales: ${marcadoresNormales}`);
        console.log(`🔴 Marcadores con offset: ${marcadoresOffset}`);
        
        // 4. Verificar estado del array de marcadores en JavaScript
        console.log('\n📝 PASO 3: Verificando array JavaScript...');
        const marcadoresEnArray = window.marcadoresEstablecimientos ? window.marcadoresEstablecimientos.length : 0;
        console.log(`📊 Marcadores en array JS: ${marcadoresEnArray}`);
        
        // 5. Verificar estado del mapa Leaflet
        console.log('\n🗺️  PASO 4: Verificando layers del mapa...');
        let marcadoresEnLeaflet = 0;
        if (window.mapEstablecimientos) {
            window.mapEstablecimientos.eachLayer(function(layer) {
                if (layer instanceof L.Marker) {
                    marcadoresEnLeaflet++;
                }
            });
            console.log(`🍃 Marcadores en layers Leaflet: ${marcadoresEnLeaflet}`);
        } else {
            console.log('❌ El mapa no está inicializado');
        }
        
        // 6. Análisis de discrepancias
        console.log('\n📋 PASO 5: Análisis de consistencia...');
        console.log('-'.repeat(40));
        
        const resumen = {
            datosOriginales: datosOriginales.length,
            establecimientosValidos: establecimientosValidos.length,
            marcadoresDOM: marcadoresEnDOM,
            marcadoresArray: marcadoresEnArray,
            marcadoresLeaflet: marcadoresEnLeaflet
        };
        
        console.table(resumen);
        
        // 7. Detectar problemas
        const problemas = [];
        
        if (establecimientosValidos.length !== marcadoresDOM) {
            problemas.push(`Discrepancia DOM: ${establecimientosValidos.length} válidos vs ${marcadoresDOM} en DOM`);
        }
        
        if (marcadoresArray !== marcadoresDOM) {
            problemas.push(`Discrepancia Array: ${marcadoresArray} en array vs ${marcadoresDOM} en DOM`);
        }
        
        if (marcadoresLeaflet !== marcadoresDOM) {
            problemas.push(`Discrepancia Leaflet: ${marcadoresLeaflet} en layers vs ${marcadoresDOM} en DOM`);
        }
        
        if (establecimientosValidos.length > marcadoresDOM) {
            problemas.push(`MARCADORES FALTANTES: ${establecimientosValidos.length - marcadoresDOM} marcadores no se renderizaron`);
        }
        
        // 8. Reporte final
        console.log('\n🎯 PASO 6: Reporte final...');
        console.log('='.repeat(50));
        
        if (problemas.length === 0) {
            console.log('✅ PERFECTO: Todos los marcadores están correctamente renderizados');
            console.log(`🎉 ${establecimientosValidos.length} establecimientos → ${marcadoresDOM} marcadores visibles`);
        } else {
            console.log('⚠️  PROBLEMAS DETECTADOS:');
            problemas.forEach((problema, index) => {
                console.log(`   ${index + 1}. ${problema}`);
            });
            
            console.log('\n💡 SUGERENCIAS:');
            if (establecimientosValidos.length > marcadoresDOM) {
                console.log('   🔧 Revisar función agregarMarcadoresEstablecimientos()');
                console.log('   🔧 Verificar que no haya errores en el forEach');
                console.log('   🔧 Comprobar si hay coordenadas duplicadas que se superponen');
            }
        }
        
        // 9. Información detallada por establecimiento
        if (establecimientosValidos.length <= 5) {
            console.log('\n📍 DETALLE POR ESTABLECIMIENTO:');
            establecimientosValidos.forEach((est, index) => {
                console.log(`${index + 1}. ${est.nombreEstablecimiento}:`);
                console.log(`   📍 Coordenadas: [${est.latitud}, ${est.longitud}]`);
                console.log(`   🆔 ID: ${est.idEstablecimiento}`);
            });
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('🎯 VERIFICACIÓN POST-RENDERIZADO FINALIZADA');
        
        return {
            datosOriginales: datosOriginales.length,
            establecimientosValidos: establecimientosValidos.length,
            marcadoresVisibles: marcadoresDOM,
            problemas: problemas,
            estado: problemas.length === 0 ? 'CORRECTO' : 'CON_PROBLEMAS'
        };
        
    } catch (error) {
        console.error('❌ Error en verificación post-renderizado:', error);
        return null;
    }
};

/**
 * Función para obtener TODAS las coordenadas de establecimientos del endpoint
 */
window.obtenerTodasLasCoordenadas = async function() {
    console.log('🌐 === OBTENIENDO TODAS LAS COORDENADAS ===');
    
    try {
        const url = buildURL(BACKEND_CONFIG.ENDPOINTS.GET_ESTABLECIMIENTOS);
        console.log('📡 Consultando endpoint:', url);
        
        const response = await fetchWithAuth(url);
        
        if (!response.ok) {
            console.error(`❌ Error HTTP ${response.status}`);
            return;
        }
        
        const establecimientos = await response.json();
        console.log('📋 DATOS COMPLETOS DEL ENDPOINT:', establecimientos);
        console.log('📊 TOTAL DE ESTABLECIMIENTOS:', establecimientos.length);
        
        console.log('\n🗺️ === TODAS LAS COORDENADAS ===');
        
        const coordenadasTabla = [];
        
        establecimientos.forEach((est, index) => {
            const coordenada = {
                'Nº': index + 1,
                'ID': est.idEstablecimiento,
                'Nombre': est.nombreEstablecimiento,
                'Latitud': est.latitud,
                'Longitud': est.longitud,
                'Lat Tipo': typeof est.latitud,
                'Lng Tipo': typeof est.longitud,
                'Lat Válida': !isNaN(parseFloat(est.latitud)),
                'Lng Válida': !isNaN(parseFloat(est.longitud)),
                'Coordenadas Válidas': est.latitud && est.longitud && !isNaN(parseFloat(est.latitud)) && !isNaN(parseFloat(est.longitud))
            };
            
            coordenadasTabla.push(coordenada);
            
            console.log(`📍 ${index + 1}. ${est.nombreEstablecimiento}:`);
            console.log(`   🆔 ID: ${est.idEstablecimiento}`);
            console.log(`   📐 Latitud: ${est.latitud} (${typeof est.latitud})`);
            console.log(`   📐 Longitud: ${est.longitud} (${typeof est.longitud})`);
            console.log(`   ✅ Válidas: ${coordenada['Coordenadas Válidas']}`);
            console.log(`   📍 Ubicación: ${est.nombreDistrito}, ${est.nombreDepartamento}`);
            console.log('   ─────────────────────────────────────');
        });
        
        console.log('\n📊 TABLA RESUMEN DE COORDENADAS:');
        console.table(coordenadasTabla);
        
        // Análisis de coordenadas
        const conCoordenadas = establecimientos.filter(est => 
            est.latitud && est.longitud && 
            !isNaN(parseFloat(est.latitud)) && !isNaN(parseFloat(est.longitud))
        );
        
        const sinCoordenadas = establecimientos.filter(est => 
            !est.latitud || !est.longitud || 
            isNaN(parseFloat(est.latitud)) || isNaN(parseFloat(est.longitud))
        );
        
        console.log('\n📈 ANÁLISIS:');
        console.log(`✅ Con coordenadas válidas: ${conCoordenadas.length}`);
        console.log(`❌ Sin coordenadas válidas: ${sinCoordenadas.length}`);
        
        if (sinCoordenadas.length > 0) {
            console.log('\n⚠️ ESTABLECIMIENTOS SIN COORDENADAS VÁLIDAS:');
            sinCoordenadas.forEach(est => {
                console.log(`   - ${est.nombreEstablecimiento} (ID: ${est.idEstablecimiento})`);
                console.log(`     Lat: ${est.latitud}, Lng: ${est.longitud}`);
            });
        }
        
        // Retornar datos para uso externo
        return {
            total: establecimientos.length,
            conCoordenadas: conCoordenadas.length,
            sinCoordenadas: sinCoordenadas.length,
            establecimientos: establecimientos,
            coordenadas: coordenadasTabla
        };
        
    } catch (error) {
        console.error('❌ Error obteniendo coordenadas:', error);
        return null;
    }
};

/**
 * Función principal para cargar el mapa de establecimientos
 */
async function cargarMapaEstablecimientos() {
    console.log('🗺️ Iniciando carga completa del mapa de establecimientos...');
    
    const loadingElement = document.getElementById('mapa-loading');
    const mapaElement = document.getElementById('mapa-establecimientos');
    const errorElement = document.getElementById('mapa-error');
    
    try {
        // Mostrar loading y ocultar otros estados
        if (loadingElement) loadingElement.style.display = 'flex';
        if (mapaElement) mapaElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'none';
        
        // Cargar datos de establecimientos
        const establecimientos = await cargarEstablecimientosParaMapa();
        
        // Inicializar mapa
        inicializarMapaEstablecimientos();
        
        // Agregar marcadores
        agregarMarcadoresEstablecimientos(establecimientos);
        
        // Mostrar mapa y ocultar loading
        if (loadingElement) loadingElement.style.display = 'none';
        if (mapaElement) mapaElement.style.display = 'block';
        
        console.log('✅ Mapa de establecimientos cargado exitosamente');
        
    } catch (error) {
        console.error('❌ Error cargando mapa de establecimientos:', error);
        
        // Mostrar error y ocultar otros estados
        if (loadingElement) loadingElement.style.display = 'none';
        if (mapaElement) mapaElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'flex';
    }
}

/**
 * 🔍 FUNCIÓN DE DEBUG COMPLETA: Diagnóstico exhaustivo del mapa
 * Utilizar en consola: diagnosticoCompletoMapa()
 */
window.diagnosticoCompletoMapa = async function() {
    console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DEL MAPA...');
    console.log('='.repeat(60));
    
    try {
        // 1. Obtener datos del endpoint
        console.log('📡 PASO 1: Obteniendo datos del endpoint...');
        const url = buildURL(BACKEND_CONFIG.ENDPOINTS.GET_ESTABLECIMIENTOS);
        const response = await fetchWithAuth(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Datos recibidos exitosamente');
        console.log(`📊 Total de establecimientos recibidos: ${data.length}`);
        
        // 2. Análisis detallado de cada establecimiento
        console.log('\n📍 PASO 2: Análisis de coordenadas por establecimiento:');
        console.log('-'.repeat(50));
        
        let validCount = 0;
        let invalidCount = 0;
        let duplicateCoords = [];
        let coordenadas = [];
        
        data.forEach((est, index) => {
            const latitud = parseFloat(est.latitud);
            const longitud = parseFloat(est.longitud);
            const esValido = est.latitud && est.longitud && !isNaN(latitud) && !isNaN(longitud);
            
            console.log(`\n📍 Establecimiento ${index + 1}:`);
            console.log(`   ID: ${est.idEstablecimiento}`);
            console.log(`   Nombre: ${est.nombreEstablecimiento}`);
            console.log(`   Dirección: ${est.direccion || 'No especificada'}`);
            console.log(`   Latitud: ${est.latitud} (${typeof est.latitud}) → ${latitud}`);
            console.log(`   Longitud: ${est.longitud} (${typeof est.longitud}) → ${longitud}`);
            console.log(`   Estado: ${esValido ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
            
            if (esValido) {
                validCount++;
                const coord = `${latitud.toFixed(6)},${longitud.toFixed(6)}`;
                
                // Buscar coordenadas muy cercanas (< 100 metros aprox)
                const existeCoordCercana = coordenadas.find(c => {
                    const [existLat, existLng] = c.split(',').map(parseFloat);
                    const distancia = Math.sqrt(
                        Math.pow((latitud - existLat) * 111000, 2) + 
                        Math.pow((longitud - existLng) * 111000 * Math.cos(latitud * Math.PI / 180), 2)
                    );
                    return distancia < 100; // Menos de 100 metros
                });
                
                if (existeCoordCercana) {
                    duplicateCoords.push({
                        coordenada: coord,
                        establecimiento: est.nombreEstablecimiento,
                        cercana: existeCoordCercana
                    });
                    console.log(`   ⚠️  COORDENADA MUY CERCANA A: ${existeCoordCercana}`);
                }
                
                coordenadas.push(coord);
            } else {
                invalidCount++;
                console.log(`   🔍 Razón: lat=${est.latitud}, lng=${est.longitud}, NaN lat=${isNaN(latitud)}, NaN lng=${isNaN(longitud)}`);
            }
        });
        
        // 3. Resumen del análisis
        console.log('\n📋 PASO 3: Resumen del diagnóstico:');
        console.log('-'.repeat(50));
        console.log(`✅ Establecimientos con coordenadas válidas: ${validCount}`);
        console.log(`❌ Establecimientos con coordenadas inválidas: ${invalidCount}`);
        console.log(`🔄 Coordenadas muy cercanas encontradas: ${duplicateCoords.length}`);
        
        if (duplicateCoords.length > 0) {
            console.log('\n⚠️  COORDENADAS MUY CERCANAS DETECTADAS (< 100m):');
            duplicateCoords.forEach((dup, index) => {
                console.log(`   ${index + 1}. ${dup.establecimiento} - ${dup.coordenada}`);
                console.log(`      Cercana a: ${dup.cercana}`);
            });
        }
        
        // 4. Verificar marcadores en el DOM
        console.log('\n🗺️  PASO 4: Verificando marcadores en el DOM:');
        console.log('-'.repeat(50));
        
        const marcadoresEnDOM = document.querySelectorAll('.leaflet-marker-icon').length;
        console.log(`🎯 Marcadores visibles en el mapa: ${marcadoresEnDOM}`);
        console.log(`📊 Esperados vs Reales: ${validCount} esperados / ${marcadoresEnDOM} visibles`);
        
        if (validCount !== marcadoresEnDOM) {
            console.log(`⚠️  DISCREPANCIA DETECTADA: Faltan ${validCount - marcadoresEnDOM} marcadores`);
            
            // Verificar si el problema es de superposición
            if (duplicateCoords.length > 0) {
                console.log('💡 Posible causa: Marcadores superpuestos por coordenadas muy cercanas');
            }
        } else {
            console.log('✅ PERFECTO: Todos los marcadores están visibles');
        }
        
        // 5. Verificar el estado del mapa
        console.log('\n🗺️  PASO 5: Estado del mapa Leaflet:');
        console.log('-'.repeat(50));
        
        if (window.mapaEstablecimientos) {
            const centro = window.mapaEstablecimientos.getCenter();
            const zoom = window.mapaEstablecimientos.getZoom();
            console.log(`📍 Centro del mapa: ${centro.lat.toFixed(6)}, ${centro.lng.toFixed(6)}`);
            console.log(`🔍 Nivel de zoom: ${zoom}`);
            
            // Contar layers de marcadores
            let contadorMarcadores = 0;
            window.mapaEstablecimientos.eachLayer(function(layer) {
                if (layer instanceof L.Marker) {
                    contadorMarcadores++;
                }
            });
            console.log(`🎯 Marcadores en layers de Leaflet: ${contadorMarcadores}`);
        } else {
            console.log('❌ El mapa no está inicializado');
        }
        
        // 6. Recomendaciones
        console.log('\n💡 PASO 6: Recomendaciones:');
        console.log('-'.repeat(50));
        
        if (duplicateCoords.length > 0) {
            console.log('🔧 SOLUCIÓN 1: Aplicar offset a coordenadas muy cercanas');
            console.log('   Código sugerido: offset de ±0.001° para separar marcadores');
        }
        
        if (invalidCount > 0) {
            console.log('🔧 SOLUCIÓN 2: Revisar y corregir coordenadas inválidas en BD');
        }
        
        if (validCount !== marcadoresEnDOM) {
            console.log('🔧 SOLUCIÓN 3: Investigar función agregarMarcadoresEstablecimientos()');
            console.log('   Verificar que el forEach procese todos los elementos');
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🎯 DIAGNÓSTICO COMPLETO FINALIZADO');
        console.log('💬 Para ejecutar debug simple: obtenerTodasLasCoordenadas()');
        console.log('💬 Para ver solo marcadores: document.querySelectorAll(".leaflet-marker-icon")');
        
        return {
            totalRecibidos: data.length,
            validos: validCount,
            invalidos: invalidCount,
            coordenadasCercanas: duplicateCoords.length,
            marcadoresVisibles: marcadoresEnDOM,
            mapaInicializado: !!window.mapaEstablecimientos,
            data: data
        };
        
    } catch (error) {
        console.error('❌ Error en diagnóstico completo:', error);
        return null;
    }
};

// ===========================
// SISTEMA DE OFERTAS DE TRABAJO
// ===========================

// Configuración para ofertas
const OFERTAS_CONFIG = {
    ENDPOINT: '/privado/ofertas-empleo',
    ESTADOS: {
        BORRADOR: { label: 'Borrador', color: 'secondary', icon: 'fas fa-edit' },
        ACTIVA: { label: 'Activa', color: 'success', icon: 'fas fa-check-circle' },
        PAUSADA: { label: 'Pausada', color: 'warning', icon: 'fas fa-pause-circle' },
        CERRADA: { label: 'Cerrada', color: 'danger', icon: 'fas fa-times-circle' }
    },
    MODALIDADES: {
        TIEMPO_COMPLETO: 'Tiempo Completo',
        MEDIO_TIEMPO: 'Medio Tiempo',
        TEMPORAL: 'Temporal/Estacional',
        POR_HORAS: 'Por Horas',
        COSECHA: 'Solo Cosecha'
    }
};

// Variable global para ofertas
let ofertasCache = [];
let filtroActualOfertas = null; // null = todas, true = vigentes, false = no vigentes

/**
 * Función principal para cargar ofertas de empleo con filtro opcional
 * @param {boolean|null} vigente - null: todas las ofertas, true: solo vigentes, false: solo no vigentes  
 */
async function cargarOfertasEmpleo(vigente = null) {
    const loadingDiv = document.getElementById('ofertas-loading');
    const contentDiv = document.getElementById('ofertas-content');
    const errorDiv = document.getElementById('ofertas-error');

    try {
        // Mostrar estado de carga
        mostrarEstadoOfertas('loading');

        // Verificar autenticación usando la función existente
        const tokenValidation = validateCurrentToken();
        if (!tokenValidation.valid) {
            if (tokenValidation.reason === 'NO_TOKEN') {
                throw new Error('AUTH_TOKEN_MISSING');
            } else if (tokenValidation.reason === 'EXPIRED') {
                throw new Error('TOKEN_EXPIRED');
            } else {
                throw new Error('INVALID_TOKEN');
            }
        }

        // Guardar filtro actual
        filtroActualOfertas = vigente;

        // Construir URL con parámetro vigente si es necesario
        let endpoint = buildURL(OFERTAS_CONFIG.ENDPOINT);
        if (vigente !== null) {
            endpoint += `?vigente=${vigente}`;
        }

        console.log(`🔄 Cargando ofertas de empleo... ${vigente !== null ? `(vigente=${vigente})` : '(todas)'}`);

        // Usar fetchWithAuth que ya maneja la autenticación
        const response = await fetchWithAuth(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Manejo específico de códigos de estado HTTP
        if (!response.ok) {
            switch (response.status) {
                case 401:
                    throw new Error('UNAUTHORIZED');
                case 403:
                    throw new Error('FORBIDDEN');
                case 404:
                    throw new Error('ENDPOINT_NOT_FOUND');
                case 500:
                    throw new Error('SERVER_ERROR');
                case 503:
                    throw new Error('SERVICE_UNAVAILABLE');
                default:
                    throw new Error(`HTTP_ERROR_${response.status}`);
            }
        }

        const responseText = await response.text();

        // Verificar si la respuesta está vacía
        if (!responseText || responseText.trim() === '') {
            throw new Error('EMPTY_RESPONSE');
        }

        let ofertas;
        try {
            ofertas = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Error parseando JSON:', parseError);
            throw new Error('INVALID_JSON');
        }

        // Verificar que las ofertas sean un array
        if (!Array.isArray(ofertas)) {
            console.error('❌ Formato de datos inválido:', ofertas);
            throw new Error('INVALID_DATA_FORMAT');
        }

        // Guardar en cache
        ofertasCache = ofertas;

        console.log(`✅ ${ofertas.length} ofertas cargadas exitosamente`);

        // Mostrar contenido y renderizar ofertas
        mostrarEstadoOfertas('content');
        renderizarOfertas(ofertas);

    } catch (error) {
        console.error('❌ Error cargando ofertas:', error);
        mostrarEstadoOfertas('error');
        mostrarErrorEspecificoOfertas(error.message);
    }
}

/**
 * Función para mostrar diferentes estados de la sección ofertas
 */
function mostrarEstadoOfertas(estado) {
    const loadingDiv = document.getElementById('ofertas-loading');
    const contentDiv = document.getElementById('ofertas-content');
    const errorDiv = document.getElementById('ofertas-error');

    // Ocultar todos los estados
    loadingDiv.classList.add('d-none');
    contentDiv.classList.add('d-none');
    errorDiv.classList.add('d-none');

    // Mostrar el estado solicitado
    switch (estado) {
        case 'loading':
            loadingDiv.classList.remove('d-none');
            break;
        case 'content':
            contentDiv.classList.remove('d-none');
            break;
        case 'error':
            errorDiv.classList.remove('d-none');
            break;
    }
}

/**
 * Función para renderizar ofertas en cards
 */
function renderizarOfertas(ofertas) {
    const contentDiv = document.getElementById('ofertas-content');
    
    if (!ofertas || ofertas.length === 0) {
        const tipoFiltro = obtenerDescripcionFiltroActual();
        contentDiv.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-briefcase text-muted mb-3" style="font-size: 3rem;"></i>
                <h5 class="text-white mb-3">No hay ofertas disponibles</h5>
                <p class="text-muted mb-4">No se encontraron ofertas para el filtro "${tipoFiltro}".</p>
                ${estadoFiltroOfertas.actual === null ? `
                    <div class="alert alert-info text-center">
                        <i class="fas fa-info-circle me-2"></i>
                        No hay ofertas de empleo creadas aún.
                    </div>
                ` : `
                    <button class="btn btn-outline-info" onclick="aplicarFiltroOfertas(null)">
                        <i class="fas fa-list me-2"></i>Ver Todas las Ofertas
                    </button>
                `}
            </div>
        `;
        return;
    }

    // Estadísticas simplificadas
    const estadisticas = calcularEstadisticasOfertasReales(ofertas);
    const tipoFiltro = obtenerDescripcionFiltroActual();
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h6 class="text-white mb-0">
                    <i class="fas fa-chart-bar me-2 text-info"></i>
                    ${ofertas.length} ${ofertas.length === 1 ? 'Oferta' : 'Ofertas'} - ${tipoFiltro}
                </h6>
                <small class="text-muted">
                    <i class="fas fa-info-circle me-1"></i>
                    Total en sistema: ${estadisticas.vigentes} vigente${estadisticas.vigentes !== 1 ? 's' : ''} • 
                    ${estadisticas.noVigentes} cerrada${estadisticas.noVigentes !== 1 ? 's' : ''}
                </small>
            </div>
        </div>
        <div class="row" id="ofertas-grid">
    `;

    // Generar cards de ofertas adaptadas a la estructura real del backend
    ofertas.forEach(oferta => {
        // Determinar estado basado en vigente y fecha de cierre
        const fechaCierreDate = parsearFechaSegura(oferta.fechaCierre);
        const esVigente = oferta.vigente && fechaCierreDate && fechaCierreDate > new Date();
        const estadoBadge = esVigente ? 
            { color: 'success', icon: 'fas fa-check-circle', label: 'Vigente' } :
            { color: 'secondary', icon: 'fas fa-times-circle', label: 'Cerrada' };
        
        // Formatear fechas usando función segura
        const fechaAlta = formatearFechaArgentina(oferta.fechaAlta);
        const fechaCierre = formatearFechaArgentina(oferta.fechaCierre);
        
        html += `
            <div class="col-md-6 col-lg-4 mb-4" data-vigente="${oferta.vigente}">
                <div class="card bg-dark border-secondary h-100 oferta-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title text-white mb-0" title="${escapeHtml(oferta.nombrePuesto)}">
                                ${truncarTexto(escapeHtml(oferta.nombrePuesto), 40)}
                            </h5>
                            <span class="badge bg-${estadoBadge.color} ms-2">
                                <i class="${estadoBadge.icon} me-1"></i>${estadoBadge.label}
                            </span>
                        </div>
                        
                        <h6 class="text-info mb-2">
                            <i class="fas fa-building me-1"></i>
                            ${escapeHtml(oferta.nombreEstablecimiento)}
                        </h6>
                        
                        <div class="mb-3">
                            ${oferta.nombreEspecie ? `
                                <span class="badge bg-info text-dark">
                                    <i class="fas fa-seedling me-1"></i>${escapeHtml(oferta.nombreEspecie)}
                                </span>
                            ` : ''}
                        </div>
                        
                        <div class="row text-center mb-3">
                            <div class="col-6">
                                <small class="text-muted">� Vacantes</small>
                                <div class="text-white fw-bold">
                                    ${oferta.vacantes} puesto${oferta.vacantes !== 1 ? 's' : ''}
                                </div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">� Cierre</small>
                                <div class="text-white" title="Fecha límite de aplicación">
                                    ${fechaCierre}
                                </div>
                            </div>
                        </div>
                        
                        <div class="row text-center mb-3">
                            <div class="col-12">
                                <small class="text-muted">📅 Publicada</small>
                                <div class="text-white-50 small">
                                    ${fechaAlta}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-footer bg-transparent border-secondary">
                        <div class="btn-group w-100" role="group">
                            <button class="btn btn-outline-info btn-sm" onclick="verDetallesOferta(${oferta.idOfertaEmpleo})" title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-warning btn-sm" onclick="editarOferta(${oferta.idOfertaEmpleo})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="eliminarOferta(${oferta.idOfertaEmpleo})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    contentDiv.innerHTML = html;
}

/**
 * Función para calcular estadísticas de ofertas basada en la estructura real del backend
 */
function calcularEstadisticasOfertasReales(ofertas) {
    const ahora = new Date();
    const vigentes = ofertas.filter(o => {
        const fechaCierre = parsearFechaSegura(o.fechaCierre);
        return o.vigente && fechaCierre && fechaCierre > ahora;
    }).length;
    const noVigentes = ofertas.length - vigentes;
    
    return {
        vigentes,
        noVigentes,
        total: ofertas.length
    };
}
function calcularEstadisticasOfertas(ofertas) {
    return ofertas.reduce((stats, oferta) => {
        switch (oferta.estado) {
            case 'ACTIVA':
                stats.activas++;
                break;
            case 'BORRADOR':
                stats.borradores++;
                break;
            case 'PAUSADA':
                stats.pausadas++;
                break;
            case 'CERRADA':
                stats.cerradas++;
                break;
        }
        return stats;
    }, { activas: 0, borradores: 0, pausadas: 0, cerradas: 0 });
}

/**
 * Función para mostrar errores específicos de ofertas
 */
function mostrarErrorEspecificoOfertas(errorType) {
    const errorDiv = document.getElementById('ofertas-error');
    let iconClass = 'fas fa-exclamation-triangle';
    let title = 'Error cargando ofertas';
    let message = 'No se pudieron cargar las ofertas de trabajo.';
    let buttonText = 'Reintentar';
    let buttonAction = 'cargarOfertasEmpleo()';

    switch (errorType) {
        case 'AUTH_TOKEN_MISSING':
            iconClass = 'fas fa-lock';
            title = 'Sesión no válida';
            message = 'No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.';
            buttonText = 'Ir al Login';
            buttonAction = 'window.location.href = "index.html"';
            break;

        case 'TOKEN_EXPIRED':
            iconClass = 'fas fa-clock';
            title = 'Sesión expirada';
            message = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
            buttonText = 'Renovar Sesión';
            buttonAction = 'renovarSesion()';
            break;

        case 'UNAUTHORIZED':
            iconClass = 'fas fa-user-slash';
            title = 'Acceso no autorizado';
            message = 'No tienes permisos para acceder a esta información.';
            buttonText = 'Verificar Sesión';
            buttonAction = 'verificarSesionOfertas()';
            break;

        case 'FORBIDDEN':
            iconClass = 'fas fa-ban';
            title = 'Acceso prohibido';
            message = 'Tu cuenta no tiene permisos para gestionar ofertas de empleo.';
            buttonText = 'Contactar Soporte';
            buttonAction = 'contactarSoporte()';
            break;

        case 'ENDPOINT_NOT_FOUND':
            iconClass = 'fas fa-search';
            title = 'Servicio no disponible';
            message = 'El servicio de ofertas no está disponible en este momento.';
            buttonText = 'Reportar Problema';
            buttonAction = 'reportarProblema("ofertas")';
            break;

        case 'SERVER_ERROR':
            iconClass = 'fas fa-server';
            title = 'Error del servidor';
            message = 'Hay un problema en el servidor. Por favor, intenta nuevamente.';
            buttonText = 'Reintentar';
            buttonAction = 'setTimeout(cargarOfertasEmpleo, 3000)';
            break;

        case 'EMPTY_RESPONSE':
            iconClass = 'fas fa-inbox';
            title = 'Respuesta vacía';
            message = 'El servidor devolvió una respuesta vacía.';
            break;

        case 'INVALID_JSON':
            iconClass = 'fas fa-code';
            title = 'Error de formato';
            message = 'Los datos recibidos tienen un formato incorrecto.';
            break;

        default:
            if (errorType.includes('Network')) {
                iconClass = 'fas fa-wifi';
                title = 'Sin conexión';
                message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
                buttonText = 'Verificar Conexión';
                buttonAction = 'verificarConexion()';
            }
            break;
    }

    errorDiv.innerHTML = `
        <div class="text-center py-5">
            <i class="${iconClass} text-warning mb-3"></i>
            <h5 class="text-white mb-3">${title}</h5>
            <p class="text-muted mb-4">${message}</p>
            <button class="btn btn-outline-info" onclick="${buttonAction}">
                <i class="fas fa-redo me-2"></i>${buttonText}
            </button>
        </div>
    `;
}

// Funciones auxiliares
function truncarTexto(texto, maxLength) {
    if (!texto) return '';
    return texto.length > maxLength ? texto.substring(0, maxLength) + '...' : texto;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatearSalario(salario) {
    if (!salario || salario === 0) return 'A convenir';
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(salario);
}

function formatearFecha(fecha) {
    if (!fecha) return 'No disponible';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Las ofertas se inicializan desde el dashboard cuando se abre

// ===========================
// FUNCIONES DE FILTRADO DE OFERTAS
// ===========================

/**
 * Estado global del filtro de ofertas
 */
let estadoFiltroOfertas = {
    actual: null, // null = todas, true = vigentes, false = cerradas
    loading: false
};

/**
 * Aplica un filtro específico a las ofertas
 * @param {boolean|null} filtro - null: todas, true: vigentes, false: cerradas
 */
async function aplicarFiltroOfertas(filtro) {
    // Evitar múltiples clicks simultáneos
    if (estadoFiltroOfertas.loading) {
        console.log('⏳ Filtro ya en progreso, ignorando click');
        return;
    }

    try {
        // Marcar como loading
        estadoFiltroOfertas.loading = true;
        actualizarEstadoBotonesFiltro(filtro, true);

        console.log(`🔄 Aplicando filtro de ofertas: ${filtro === null ? 'todas' : filtro ? 'vigentes' : 'cerradas'}`);

        // Cargar ofertas con el filtro seleccionado
        await cargarOfertasEmpleo(filtro);

        // Actualizar estado
        estadoFiltroOfertas.actual = filtro;
        actualizarEstadoBotonesFiltro(filtro, false);

        // Mostrar feedback al usuario
        const tipoFiltro = filtro === null ? 'todas las ofertas' : filtro ? 'ofertas vigentes' : 'ofertas cerradas';
        showMessage(`Mostrando ${tipoFiltro}`, 'info');

    } catch (error) {
        console.error('❌ Error aplicando filtro:', error);
        showMessage('Error al aplicar filtro. Inténtelo nuevamente.', 'error');
        
        // Restaurar estado anterior
        actualizarEstadoBotonesFiltro(estadoFiltroOfertas.actual, false);
    } finally {
        estadoFiltroOfertas.loading = false;
    }
}

/**
 * Actualiza el estado visual de los botones de filtro
 * @param {boolean|null} filtroActivo - Filtro actualmente activo
 * @param {boolean} loading - Si está en estado de carga
 */
function actualizarEstadoBotonesFiltro(filtroActivo, loading = false) {
    const botones = {
        todas: document.getElementById('filtro-todas'),
        vigentes: document.getElementById('filtro-vigentes'),
        cerradas: document.getElementById('filtro-cerradas')
    };

    // Verificar que los botones existan
    if (!botones.todas || !botones.vigentes || !botones.cerradas) {
        console.warn('⚠️ No se encontraron todos los botones de filtro');
        return;
    }

    // Remover estados activos previos
    Object.values(botones).forEach(btn => {
        btn.classList.remove('active', 'loading');
        btn.disabled = loading;
    });

    // Aplicar estado de loading si es necesario
    if (loading) {
        Object.values(botones).forEach(btn => {
            btn.classList.add('loading');
        });
    }

    // Activar el botón correspondiente
    if (filtroActivo === null) {
        botones.todas.classList.add('active');
    } else if (filtroActivo === true) {
        botones.vigentes.classList.add('active');
    } else if (filtroActivo === false) {
        botones.cerradas.classList.add('active');
    }
}

/**
 * Inicializa los controles de filtro con el estado por defecto
 */
function inicializarFiltrosOfertas() {
    // Establecer "Todas" como filtro por defecto
    estadoFiltroOfertas.actual = null;
    actualizarEstadoBotonesFiltro(null, false);
}

/**
 * Obtiene el texto descriptivo del filtro actual
 * @returns {string} Descripción del filtro activo
 */
function obtenerDescripcionFiltroActual() {
    const filtro = estadoFiltroOfertas.actual;
    if (filtro === null) return 'todas las ofertas';
    if (filtro === true) return 'ofertas vigentes';
    if (filtro === false) return 'ofertas cerradas';
    return 'filtro desconocido';
}

// ===========================
// SISTEMA DE OFERTAS PÚBLICAS
// ===========================

/**
 * Estado global para ofertas públicas
 */
const estadoOfertasPublicas = {
    ofertas: [],
    filtros: {
        puesto: '',
        orden: 'fecha'
    },
    ubicacion: {
        lat: null,
        lon: null,
        disponible: false
    },
    cargando: false,
    puestosCargados: false
};

/**
 * Construye parámetros de consulta para el endpoint público
 * @param {Object} filtros - Filtros a aplicar
 * @returns {string} Query string construido
 */
function buildQueryParamsPublico(filtros = {}) {
    const params = new URLSearchParams();
    
    if (filtros.puesto && filtros.puesto.trim()) {
        params.append('puesto', filtros.puesto.trim());
    }
    
    if (filtros.orden) {
        params.append('orden', filtros.orden);
    }
    
    if (filtros.orden === 'distancia' && estadoOfertasPublicas.ubicacion.lat && estadoOfertasPublicas.ubicacion.lon) {
        params.append('lat', estadoOfertasPublicas.ubicacion.lat.toString());
        params.append('lon', estadoOfertasPublicas.ubicacion.lon.toString());
    }
    
    return params.toString();
}

/**
 * Obtiene la ubicación del usuario usando Geolocation API
 * @returns {Promise<Object>} Coordenadas del usuario
 */
function getUbicacionUsuario() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocalización no soportada por este navegador'));
            return;
        }
        
        const opciones = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutos
        };
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                estadoOfertasPublicas.ubicacion = {
                    ...coords,
                    disponible: true
                };
                resolve(coords);
            },
            (error) => {
                console.error('Error obteniendo ubicación:', error);
                estadoOfertasPublicas.ubicacion.disponible = false;
                reject(error);
            },
            opciones
        );
    });
}

/**
 * Carga ofertas públicas desde el endpoint sin autenticación
 * @param {Object} filtros - Filtros a aplicar
 * @returns {Promise<Array>} Lista de ofertas públicas
 */
async function cargarOfertasPublicas(filtros = {}) {
    try {
        estadoOfertasPublicas.cargando = true;
        mostrarEstadoCargaPublicas(true);
        
        // Construir URL con parámetros
        const queryString = buildQueryParamsPublico(filtros);
        const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.OFERTAS_PUBLICAS}${queryString ? '?' + queryString : ''}`;
        
        console.log('🌐 Cargando ofertas públicas desde:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const ofertas = await response.json();
        console.log('✅ Ofertas públicas cargadas:', ofertas.length);
        
        estadoOfertasPublicas.ofertas = ofertas;
        estadoOfertasPublicas.filtros = { ...filtros };
        
        renderizarOfertasPublicas(ofertas);
        actualizarContadorOfertasPublicas(ofertas.length);
        
        // Actualizar mapa si está disponible
        if (mapaOfertasPublicas.instancia) {
            agregarOfertasAlMapa(ofertas);
        }
        
        // Actualizar filtros dinámicos si es la primera carga
        if (!estadoOfertasPublicas.puestosCargados) {
            actualizarFiltrosPuestos(ofertas);
            estadoOfertasPublicas.puestosCargados = true;
        }
        
        return ofertas;
        
    } catch (error) {
        console.error('❌ Error cargando ofertas públicas:', error);
        mostrarErrorOfertasPublicas(error);
        return [];
    } finally {
        estadoOfertasPublicas.cargando = false;
        mostrarEstadoCargaPublicas(false);
    }
}

/**
 * Actualiza el selector de puestos con los datos reales del backend
 * @param {Array} ofertas - Lista de ofertas para extraer puestos únicos
 */
function actualizarFiltrosPuestos(ofertas) {
    const selector = document.getElementById('filtro-puesto-publico');
    if (!selector) return;
    
    // Extraer puestos únicos
    const puestosUnicos = [...new Set(ofertas
        .map(oferta => oferta.nombrePuestoTrabajo)
        .filter(puesto => puesto && puesto.trim())
    )].sort();
    
    // Guardar el valor actual
    const valorActual = selector.value;
    
    // Limpiar opciones existentes (excepto "Todos los puestos")
    selector.innerHTML = '<option value="">Todos los puestos</option>';
    
    // Agregar opciones dinámicas
    puestosUnicos.forEach(puesto => {
        const option = document.createElement('option');
        option.value = puesto;
        option.textContent = puesto;
        selector.appendChild(option);
    });
    
    // Restaurar valor si aún existe
    if (valorActual && puestosUnicos.includes(valorActual)) {
        selector.value = valorActual;
    }
    
    console.log('📋 Filtros de puestos actualizados:', puestosUnicos.length, 'puestos únicos');
}

// ===========================
// SISTEMA DE MAPA OFERTAS PÚBLICAS
// ===========================

/**
 * Estado global del mapa de ofertas públicas
 */
const mapaOfertasPublicas = {
    instancia: null,
    marcadores: [],
    clusters: null,
    capas: {
        clasica: null,
        satelital: null
    },
    configuracion: {
        centro: [-32.8908, -68.8272], // Mendoza, Argentina
        zoom: 10,
        maxZoom: 18
    }
};

/**
 * Inicializa el mapa de ofertas públicas
 */
function inicializarMapaOfertasPublicas() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.warn('⚠️ Container del mapa no encontrado');
        return;
    }
    
    console.log('🗺️ Inicializando mapa de ofertas públicas...');
    
    // Crear instancia del mapa
    mapaOfertasPublicas.instancia = L.map('map', {
        center: mapaOfertasPublicas.configuracion.centro,
        zoom: mapaOfertasPublicas.configuracion.zoom,
        maxZoom: mapaOfertasPublicas.configuracion.maxZoom,
        zoomControl: true
    });
    
    // Configurar capas de mapa
    configurarCapasMapaPublico();
    
    // Agregar controles personalizados
    agregarControlesMapaPublico();
    
    // Configurar eventos del mapa
    configurarEventosMapaPublico();
    
    console.log('✅ Mapa de ofertas públicas inicializado');
}

/**
 * Configura las capas del mapa (clásica y satelital)
 */
function configurarCapasMapaPublico() {
    // Capa clásica (OpenStreetMap)
    mapaOfertasPublicas.capas.clasica = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    });
    
    // Capa satelital (Esri World Imagery)
    mapaOfertasPublicas.capas.satelital = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri © DigitalGlobe © GeoEye © Earthstar Geographics © CNES/Airbus DS © USDA © USGS © AeroGRID © IGN',
        maxZoom: 18
    });
    
    // Agregar capa clásica por defecto
    mapaOfertasPublicas.capas.clasica.addTo(mapaOfertasPublicas.instancia);
}

/**
 * Agrega controles personalizados al mapa
 */
function agregarControlesMapaPublico() {
    // Control para cambiar entre capas
    const controlCapas = L.control.layers({
        'Vista Clásica': mapaOfertasPublicas.capas.clasica,
        'Vista Satelital': mapaOfertasPublicas.capas.satelital
    }, {}, {
        position: 'topright'
    });
    
    controlCapas.addTo(mapaOfertasPublicas.instancia);
    
    // Control de escala
    L.control.scale({
        position: 'bottomleft',
        metric: true,
        imperial: false
    }).addTo(mapaOfertasPublicas.instancia);
}

/**
 * Configura eventos del mapa
 */
function configurarEventosMapaPublico() {
    // Evento de clic en el mapa (para futuras funcionalidades)
    mapaOfertasPublicas.instancia.on('click', function(e) {
        console.log('🗺️ Click en mapa:', e.latlng);
    });
    
    // Evento de cambio de zoom
    mapaOfertasPublicas.instancia.on('zoomend', function() {
        console.log('🔍 Zoom actual:', mapaOfertasPublicas.instancia.getZoom());
    });
}

/**
 * Agrega ofertas al mapa como marcadores
 * @param {Array} ofertas - Lista de ofertas a mostrar
 */
function agregarOfertasAlMapa(ofertas) {
    if (!mapaOfertasPublicas.instancia) {
        console.warn('⚠️ Mapa no inicializado');
        return;
    }
    
    // Limpiar marcadores existentes
    limpiarMarcadoresMapaPublico();
    
    console.log('📍 Agregando', ofertas.length, 'ofertas al mapa...');
    
    ofertas.forEach(oferta => {
        // Validar coordenadas
        if (!oferta.latitud || !oferta.longitud) {
            console.warn('⚠️ Oferta sin coordenadas:', oferta.idOfertaEmpleo);
            return;
        }
        
        // Crear marcador
        const marcador = crearMarcadorOferta(oferta);
        
        // Agregar al mapa y al array de marcadores
        marcador.addTo(mapaOfertasPublicas.instancia);
        mapaOfertasPublicas.marcadores.push({
            marcador: marcador,
            oferta: oferta
        });
    });
    
    // Ajustar vista para mostrar todas las ofertas
    if (mapaOfertasPublicas.marcadores.length > 0) {
        ajustarVistaMapaOfertas();
    }
}

/**
 * Crea un marcador para una oferta específica
 * @param {Object} oferta - Datos de la oferta
 * @returns {L.Marker} Marcador de Leaflet
 */
function crearMarcadorOferta(oferta) {
    // Determinar icono según el puesto de trabajo
    const icono = obtenerIconoPorPuesto(oferta.nombrePuestoTrabajo);
    
    // Crear popup con información de la oferta
    const popupContent = crearPopupOferta(oferta);
    
    // Crear marcador
    const marcador = L.marker([oferta.latitud, oferta.longitud], { 
        icon: icono,
        title: `${oferta.nombrePuestoTrabajo} - ${oferta.nombreEstablecimiento}`
    });
    
    // Configurar popup
    marcador.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'popup-oferta-publica'
    });
    
    // Agregar evento de clic
    marcador.on('click', function() {
        resaltarTarjetaOferta(oferta.idOfertaEmpleo);
    });
    
    // Agregar ID para referencia
    marcador._ofertaId = oferta.idOfertaEmpleo;
    
    return marcador;
}

/**
 * Limpia todos los marcadores del mapa
 */
function limpiarMarcadoresMapaPublico() {
    mapaOfertasPublicas.marcadores.forEach(item => {
        mapaOfertasPublicas.instancia.removeLayer(item.marcador);
    });
    mapaOfertasPublicas.marcadores = [];
}

/**
 * Ajusta la vista del mapa para mostrar todas las ofertas
 */
function ajustarVistaMapaOfertas() {
    if (mapaOfertasPublicas.marcadores.length === 0) return;
    
    // Crear grupo de marcadores para obtener bounds
    const grupo = new L.featureGroup(mapaOfertasPublicas.marcadores.map(item => item.marcador));
    
    // Ajustar vista con padding
    mapaOfertasPublicas.instancia.fitBounds(grupo.getBounds(), {
        padding: [20, 20]
    });
}

/**
 * Obtiene el icono apropiado según el tipo de puesto
 * @param {string} puesto - Nombre del puesto de trabajo
 * @returns {L.Icon} Icono de Leaflet
 */
function obtenerIconoPorPuesto(puesto) {
    // Definir iconos según el tipo de trabajo
    const iconos = {
        'operario': { icon: 'fa-wrench', color: '#2E8B57' },
        'supervisor': { icon: 'fa-user-tie', color: '#4169E1' },
        'tecnico': { icon: 'fa-cog', color: '#FF8C00' },
        'administrativo': { icon: 'fa-file-alt', color: '#9932CC' },
        'contador': { icon: 'fa-calculator', color: '#8B4513' },
        'ventas': { icon: 'fa-handshake', color: '#DC143C' },
        'marketing': { icon: 'fa-bullhorn', color: '#FF1493' },
        'gerente': { icon: 'fa-crown', color: '#DAA520' },
        'chofer': { icon: 'fa-truck', color: '#708090' },
        'seguridad': { icon: 'fa-shield-alt', color: '#556B2F' },
        'limpieza': { icon: 'fa-broom', color: '#20B2AA' },
        'cocina': { icon: 'fa-utensils', color: '#FF6347' },
        'mozo': { icon: 'fa-concierge-bell', color: '#4682B4' },
        'default': { icon: 'fa-briefcase', color: '#696969' }
    };
    
    // Buscar icono por palabra clave en el puesto
    let iconConfig = iconos.default;
    const puestoLower = puesto.toLowerCase();
    
    for (const [key, config] of Object.entries(iconos)) {
        if (puestoLower.includes(key)) {
            iconConfig = config;
            break;
        }
    }
    
    // Crear HTML del icono
    const iconHtml = `
        <div class="marker-oferta-publica" style="background-color: ${iconConfig.color}">
            <i class="fas ${iconConfig.icon}"></i>
        </div>
    `;
    
    return L.divIcon({
        html: iconHtml,
        className: 'custom-marker-oferta',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
}

/**
 * Crea el contenido HTML del popup para una oferta
 * @param {Object} oferta - Datos de la oferta
 * @returns {string} HTML del popup
 */
function crearPopupOferta(oferta) {
    // Parsear fecha de cierre de forma segura
    const fechaCierre = parsearFechaSegura(oferta.fechaCierre);
    const fechaCierreFormateada = formatearFechaArgentina(oferta.fechaCierre);
    
    // Calcular días hasta el cierre
    const hoy = new Date();
    const diasRestantes = fechaCierre ? Math.ceil((fechaCierre - hoy) / (1000 * 60 * 60 * 24)) : 0;
    
    // Determinar clase de urgencia
    let claseUrgencia = 'text-success';
    let textoUrgencia = 'Tiempo suficiente';
    
    if (diasRestantes <= 7) {
        claseUrgencia = 'text-danger';
        textoUrgencia = '¡Cierra pronto!';
    } else if (diasRestantes <= 15) {
        claseUrgencia = 'text-warning';
        textoUrgencia = 'Cierre próximo';
    }
    
    return `
        <div class="popup-oferta-content">
            <div class="popup-header">
                <h6 class="mb-1 text-primary">
                    <i class="fas fa-building me-1"></i>
                    ${oferta.nombreEstablecimiento}
                </h6>
                <span class="badge bg-primary">${oferta.nombreEspecie}</span>
            </div>
            
            <div class="popup-body mt-2">
                <div class="row g-2">
                    <div class="col-12">
                        <strong class="text-dark">
                            <i class="fas fa-briefcase me-1"></i>
                            ${oferta.nombrePuestoTrabajo}
                        </strong>
                    </div>
                    
                    <div class="col-6">
                        <small class="text-muted">
                            <i class="fas fa-users me-1"></i>
                            ${oferta.vacantes} vacante${oferta.vacantes !== 1 ? 's' : ''}
                        </small>
                    </div>
                    
                    <div class="col-6">
                        <small class="${claseUrgencia}">
                            <i class="fas fa-clock me-1"></i>
                            ${diasRestantes} días
                        </small>
                    </div>
                    
                    <div class="col-12 mt-2">
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>
                            Cierra: ${fechaCierreFormateada}
                        </small>
                    </div>
                </div>
            </div>
            
            <div class="popup-footer mt-3">
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary flex-fill" 
                            onclick="scrollToOferta('${oferta.idOfertaEmpleo}')">
                        <i class="fas fa-eye me-1"></i>
                        Ver Detalles
                    </button>
                    <button class="btn btn-sm btn-success flex-fill" 
                            onclick="contactarEmpresa('${oferta.idOfertaEmpleo}')">
                        <i class="fas fa-envelope me-1"></i>
                        Contactar
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Resalta la tarjeta de oferta correspondiente cuando se hace clic en un marcador
 * @param {string} idOferta - ID de la oferta a resaltar
 */
function resaltarTarjetaOferta(idOferta) {
    // Remover resaltado previo
    document.querySelectorAll('.card-oferta-destacada').forEach(card => {
        card.classList.remove('card-oferta-destacada');
    });
    
    // Encontrar y resaltar la tarjeta
    const tarjeta = document.querySelector(`[data-oferta-id="${idOferta}"]`);
    if (tarjeta) {
        tarjeta.classList.add('card-oferta-destacada');
        tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remover resaltado después de 3 segundos
        setTimeout(() => {
            tarjeta.classList.remove('card-oferta-destacada');
        }, 3000);
    }
}

/**
 * Hace scroll hasta una oferta específica desde el mapa
 * @param {string} idOferta - ID de la oferta
 */
function scrollToOferta(idOferta) {
    const tarjeta = document.querySelector(`[data-oferta-id="${idOferta}"]`);
    if (tarjeta) {
        tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
        resaltarTarjetaOferta(idOferta);
    }
}

// ===========================
// SISTEMA DE CAMBIO DE VISTA (LISTA/MAPA)
// ===========================

/**
 * Estado actual de la vista
 */
let vistaActual = 'lista'; // 'lista' o 'mapa'

/**
 * Cambia entre vista de lista y mapa
 * @param {string} vista - 'lista' o 'mapa'
 */
function cambiarVista(vista) {
    vistaActual = vista;
    
    const btnLista = document.getElementById('btn-vista-lista');
    const btnMapa = document.getElementById('btn-vista-mapa');
    const containerOfertas = document.getElementById('ofertas-publicas-container');
    const containerMapa = document.getElementById('mapa-container');
    const tituloVista = document.getElementById('vista-actual-titulo');
    
    if (!btnLista || !btnMapa || !containerOfertas || !containerMapa || !tituloVista) {
        console.warn('⚠️ Elementos de vista no encontrados');
        return;
    }
    
    console.log('🔄 Cambiando vista a:', vista);
    
    if (vista === 'mapa') {
        // Activar vista mapa
        btnMapa.classList.remove('btn-outline-primary');
        btnMapa.classList.add('btn-primary');
        btnLista.classList.remove('btn-primary');
        btnLista.classList.add('btn-outline-primary');
        
        containerOfertas.classList.add('d-none');
        containerMapa.classList.remove('d-none');
        tituloVista.textContent = 'Mapa de Ofertas';
        
        // Inicializar mapa si no existe
        if (!mapaOfertasPublicas.instancia) {
            setTimeout(() => {
                inicializarMapaOfertasPublicas();
                if (estadoOfertasPublicas.ofertas.length > 0) {
                    agregarOfertasAlMapa(estadoOfertasPublicas.ofertas);
                }
            }, 100);
        } else {
            // Redimensionar mapa existente
            setTimeout(() => {
                mapaOfertasPublicas.instancia.invalidateSize();
                if (estadoOfertasPublicas.ofertas.length > 0) {
                    agregarOfertasAlMapa(estadoOfertasPublicas.ofertas);
                }
            }, 100);
        }
        
    } else {
        // Activar vista lista
        btnLista.classList.remove('btn-outline-primary');
        btnLista.classList.add('btn-primary');
        btnMapa.classList.remove('btn-primary');
        btnMapa.classList.add('btn-outline-primary');
        
        containerMapa.classList.add('d-none');
        containerOfertas.classList.remove('d-none');
        tituloVista.textContent = 'Lista de Ofertas';
    }
    
    // Actualizar contador
    actualizarContadorOfertas();
}

/**
 * Actualiza el contador de ofertas según la vista
 */
function actualizarContadorOfertas() {
    const badge = document.getElementById('total-ofertas-badge');
    const contador = document.getElementById('contador-ofertas-publicas');
    
    if (!badge || !contador) return;
    
    const total = estadoOfertasPublicas.ofertas.length;
    const filtradas = estadoOfertasPublicas.ofertasFiltradas.length;
    
    let texto = '';
    if (total === filtradas) {
        texto = `${total} ofertas`;
    } else {
        texto = `${filtradas} de ${total} ofertas`;
    }
    
    badge.textContent = texto;
    contador.textContent = texto;
    
    // Actualizar color del badge según disponibilidad
    badge.className = 'badge ms-2';
    contador.className = 'badge bg-success fs-6';
    
    if (filtradas === 0) {
        badge.classList.add('bg-secondary');
        contador.classList.remove('bg-success');
        contador.classList.add('bg-secondary');
    } else if (filtradas < total) {
        badge.classList.add('bg-warning');
    } else {
        badge.classList.add('bg-info');
    }
}

/**
 * Renderiza las ofertas públicas en la interfaz
 * @param {Array} ofertas - Lista de ofertas a mostrar
 */
function renderizarOfertasPublicas(ofertas) {
    const container = document.getElementById('ofertas-publicas-container');
    if (!container) {
        console.error('Container de ofertas públicas no encontrado');
        return;
    }
    
    if (!ofertas || ofertas.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle me-2"></i>
                    No se encontraron ofertas disponibles con los filtros seleccionados.
                </div>
            </div>
        `;
        return;
    }
    
    const ofertasHTML = ofertas.map(oferta => {
        // Parsear fecha de cierre de forma segura
        const fechaCierreDate = parsearFechaSegura(oferta.fechaCierre);
        const fechaCierre = formatearFechaArgentina(oferta.fechaCierre);
        
        // Determinar urgencia basada en fecha de cierre
        const hoy = new Date();
        const diasRestantes = fechaCierreDate ? Math.ceil((fechaCierreDate - hoy) / (1000 * 60 * 60 * 24)) : 0;
        const urgenciaClase = diasRestantes <= 7 ? 'text-danger' : diasRestantes <= 15 ? 'text-warning' : 'text-success';
        
        // Determinar color del header según vacantes
        const headerColor = oferta.vacantes >= 5 ? 'bg-success' : oferta.vacantes >= 3 ? 'bg-primary' : 'bg-warning';
        
        return `
            <div class="col-lg-6 col-xl-4 mb-4">
                <div class="card h-100 shadow-sm border-0 oferta-publica-card" data-oferta-id="${oferta.idOfertaEmpleo}" data-lat="${oferta.latitud}" data-lng="${oferta.longitud}">
                    <div class="card-header ${headerColor} text-white">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-briefcase me-2"></i>
                            ${oferta.nombrePuestoTrabajo || 'Puesto no especificado'}
                        </h5>
                        <small class="opacity-75">
                            <i class="fas fa-seedling me-1"></i>
                            ${oferta.nombreEspecie || 'Especie no especificada'}
                        </small>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <h6 class="fw-bold text-primary">
                                <i class="fas fa-building me-1"></i>
                                ${oferta.nombreEstablecimiento || 'Establecimiento no especificado'}
                            </h6>
                        </div>
                        
                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <small class="text-muted">
                                    <i class="fas fa-users me-1"></i>
                                    Vacantes
                                </small>
                                <div class="fw-bold ${oferta.vacantes >= 3 ? 'text-success' : 'text-warning'}">
                                    ${oferta.vacantes || 1} ${oferta.vacantes === 1 ? 'puesto' : 'puestos'}
                                </div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">
                                    <i class="fas fa-map-marker-alt me-1"></i>
                                    Ubicación
                                </small>
                                <div class="fw-bold small">
                                    <span class="text-info" title="Latitud: ${oferta.latitud}, Longitud: ${oferta.longitud}">
                                        Ver en mapa
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <small class="text-muted">
                                <i class="fas fa-calendar-times me-1"></i>
                                Fecha de cierre
                            </small>
                            <div class="fw-bold ${urgenciaClase}">
                                ${fechaCierre}
                                ${diasRestantes > 0 ? `<small class="ms-1">(${diasRestantes} días)</small>` : '<small class="ms-1">(Vencida)</small>'}
                            </div>
                        </div>
                    </div>
                    <div class="card-footer bg-light d-flex gap-2">
                        <button class="btn btn-primary btn-sm flex-fill" onclick="contactarEmpresa('${oferta.idOfertaEmpleo}')">
                            <i class="fas fa-phone me-1"></i>
                            Contactar
                        </button>
                        <button class="btn btn-outline-success btn-sm" onclick="verEnMapa('${oferta.idOfertaEmpleo}')" title="Ver en mapa">
                            <i class="fas fa-map-marker-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = ofertasHTML;
}

/**
 * Muestra estado de carga para ofertas públicas
 * @param {boolean} cargando - Si está cargando o no
 */
function mostrarEstadoCargaPublicas(cargando) {
    const container = document.getElementById('ofertas-publicas-container');
    const spinner = document.getElementById('ofertas-publicas-spinner');
    
    if (cargando) {
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando ofertas...</span>
                    </div>
                    <p class="mt-3 text-muted">Cargando ofertas disponibles...</p>
                </div>
            `;
        }
    }
    
    if (spinner) {
        spinner.style.display = cargando ? 'block' : 'none';
    }
}

/**
 * Muestra errores relacionados con ofertas públicas
 * @param {Error} error - Error a mostrar
 */
function mostrarErrorOfertasPublicas(error) {
    const container = document.getElementById('ofertas-publicas-container');
    if (!container) return;
    
    let mensaje = 'Error desconocido';
    let icono = 'exclamation-triangle';
    
    if (error.message.includes('HTTP')) {
        mensaje = 'No se pudieron cargar las ofertas. Verifique su conexión.';
        icono = 'wifi';
    } else if (error.message.includes('Geolocalización')) {
        mensaje = 'No se pudo obtener su ubicación. El ordenamiento por distancia no estará disponible.';
        icono = 'map-marker-alt';
    }
    
    container.innerHTML = `
        <div class="col-12">
            <div class="alert alert-warning text-center">
                <i class="fas fa-${icono} me-2"></i>
                ${mensaje}
                <br>
                <button class="btn btn-outline-primary btn-sm mt-2" onclick="cargarOfertasPublicas()">
                    <i class="fas fa-refresh me-1"></i>
                    Reintentar
                </button>
            </div>
        </div>
    `;
}

/**
 * Actualiza el contador de ofertas públicas
 * @param {number} cantidad - Número de ofertas
 */
function actualizarContadorOfertasPublicas(cantidad) {
    const contador = document.getElementById('contador-ofertas-publicas');
    if (contador) {
        contador.textContent = `${cantidad} ofertas disponibles`;
    }
}

/**
 * Aplica filtros a las ofertas públicas
 * @param {Object} nuevos_filtros - Filtros a aplicar
 */
async function aplicarFiltrosOfertasPublicas(nuevos_filtros = {}) {
    const filtros = {
        ...estadoOfertasPublicas.filtros,
        ...nuevos_filtros
    };
    
    // Si se requiere ordenamiento por distancia, obtener ubicación
    if (filtros.orden === 'distancia' && !estadoOfertasPublicas.ubicacion.disponible) {
        try {
            await getUbicacionUsuario();
            actualizarEstadoBotonGeolocalizacion(true);
        } catch (error) {
            console.warn('No se pudo obtener ubicación para ordenamiento por distancia');
            mostrarNotificacionGeolocalizacion(false);
            // Cambiar a ordenamiento por fecha si no hay ubicación
            filtros.orden = 'fecha';
        }
    }
    
    await cargarOfertasPublicas(filtros);
    actualizarInterfazFiltrosPublicos(filtros);
}

/**
 * Maneja el cambio en el selector de puesto
 */
function onCambioPuestoPublico() {
    const selector = document.getElementById('filtro-puesto-publico');
    if (selector) {
        aplicarFiltrosOfertasPublicas({ puesto: selector.value });
    }
}

/**
 * Maneja el cambio de ordenamiento
 * @param {string} orden - Tipo de orden (fecha|distancia)
 */
async function onCambioOrdenPublico(orden) {
    await aplicarFiltrosOfertasPublicas({ orden });
}

/**
 * Solicita permisos de geolocalización y actualiza ofertas
 */
async function solicitarGeolocalizacion() {
    try {
        mostrarEstadoGeolocalizacion('cargando');
        await getUbicacionUsuario();
        mostrarEstadoGeolocalizacion('exito');
        
        // Si el orden actual es distancia, recargar ofertas
        if (estadoOfertasPublicas.filtros.orden === 'distancia') {
            await aplicarFiltrosOfertasPublicas();
        }
    } catch (error) {
        mostrarEstadoGeolocalizacion('error');
        console.error('Error obteniendo geolocalización:', error);
    }
}

/**
 * Actualiza la interfaz de filtros públicos
 * @param {Object} filtros - Filtros activos
 */
function actualizarInterfazFiltrosPublicos(filtros) {
    // Actualizar selector de puesto
    const selectorPuesto = document.getElementById('filtro-puesto-publico');
    if (selectorPuesto) {
        selectorPuesto.value = filtros.puesto || '';
    }
    
    // Actualizar botones de ordenamiento
    document.querySelectorAll('.btn-orden-publico').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.orden === filtros.orden) {
            btn.classList.add('active');
        }
    });
    
    // Actualizar estado de geolocalización
    actualizarEstadoBotonGeolocalizacion(estadoOfertasPublicas.ubicacion.disponible);
}

/**
 * Actualiza el estado visual del botón de geolocalización
 * @param {boolean} disponible - Si la ubicación está disponible
 */
function actualizarEstadoBotonGeolocalizacion(disponible) {
    const boton = document.getElementById('btn-geolocalizacion');
    if (boton) {
        if (disponible) {
            boton.innerHTML = '<i class="fas fa-map-marker-alt text-success"></i> Ubicación activa';
            boton.classList.remove('btn-outline-secondary');
            boton.classList.add('btn-outline-success');
        } else {
            boton.innerHTML = '<i class="fas fa-map-marker-alt"></i> Activar ubicación';
            boton.classList.remove('btn-outline-success');
            boton.classList.add('btn-outline-secondary');
        }
    }
}

/**
 * Muestra el estado de la geolocalización
 * @param {string} estado - Estado (cargando|exito|error)
 */
function mostrarEstadoGeolocalizacion(estado) {
    const boton = document.getElementById('btn-geolocalizacion');
    if (!boton) return;
    
    switch (estado) {
        case 'cargando':
            boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Obteniendo ubicación...';
            boton.disabled = true;
            break;
        case 'exito':
            boton.innerHTML = '<i class="fas fa-map-marker-alt text-success"></i> Ubicación activa';
            boton.disabled = false;
            break;
        case 'error':
            boton.innerHTML = '<i class="fas fa-map-marker-alt text-danger"></i> Error de ubicación';
            boton.disabled = false;
            setTimeout(() => {
                actualizarEstadoBotonGeolocalizacion(false);
            }, 3000);
            break;
    }
}

/**
 * Inicializa el sistema de ofertas públicas
 */
async function inicializarOfertasPublicas() {
    console.log('🚀 Inicializando sistema de ofertas públicas');
    
    // Inicializar vista por defecto (lista)
    vistaActual = 'lista';
    
    // Configurar botones de vista
    const btnLista = document.getElementById('btn-vista-lista');
    const btnMapa = document.getElementById('btn-vista-mapa');
    
    if (btnLista && btnMapa) {
        btnLista.classList.add('btn-primary');
        btnLista.classList.remove('btn-outline-primary');
        btnMapa.classList.add('btn-outline-primary');
        btnMapa.classList.remove('btn-primary');
    }
    
    // Cargar ofertas por defecto (ordenadas por fecha)
    await cargarOfertasPublicas({ orden: 'fecha' });
    
    // Configurar event listeners
    configurarEventListenersOfertasPublicas();
    
    console.log('✅ Sistema de ofertas públicas inicializado');
}

/**
 * Configura los event listeners para ofertas públicas
 */
function configurarEventListenersOfertasPublicas() {
    // Selector de puesto
    const selectorPuesto = document.getElementById('filtro-puesto-publico');
    if (selectorPuesto) {
        selectorPuesto.addEventListener('change', onCambioPuestoPublico);
    }
    
    // Botones de ordenamiento
    document.querySelectorAll('.btn-orden-publico').forEach(btn => {
        btn.addEventListener('click', () => {
            onCambioOrdenPublico(btn.dataset.orden);
        });
    });
    
    // Botón de geolocalización
    const btnGeo = document.getElementById('btn-geolocalizacion');
    if (btnGeo) {
        btnGeo.addEventListener('click', solicitarGeolocalizacion);
    }
}

/**
 * Función placeholder para contactar empresa
 * @param {string} ofertaId - ID de la oferta
 */
function contactarEmpresa(ofertaId) {
    // Por ahora mostrar modal de información
    alert(`Para contactar con esta empresa, debe registrarse como trabajador en la plataforma.\n\nOferta ID: ${ofertaId}`);
}

/**
 * Función para mostrar oferta en el mapa
 * @param {string} ofertaId - ID de la oferta
 */
function verEnMapa(ofertaId) {
    console.log('🗺️ Mostrando oferta en mapa:', ofertaId);
    
    // Cambiar a vista mapa si no estamos en ella
    if (vistaActual !== 'mapa') {
        cambiarVista('mapa');
    }
    
    // Esperar a que el mapa esté listo
    setTimeout(() => {
        const oferta = estadoOfertasPublicas.ofertas.find(o => o.idOfertaEmpleo.toString() === ofertaId);
        if (oferta && mapaOfertasPublicas.instancia) {
            // Centrar el mapa en la oferta
            mapaOfertasPublicas.instancia.setView([oferta.latitud, oferta.longitud], 16);
            
            // Buscar y abrir popup del marcador
            const marcadorItem = mapaOfertasPublicas.marcadores.find(item => 
                item.marcador._ofertaId === ofertaId
            );
            
            if (marcadorItem) {
                marcadorItem.marcador.openPopup();
                
                // Animar el marcador
                setTimeout(() => {
                    const markerElement = marcadorItem.marcador._icon;
                    if (markerElement) {
                        markerElement.style.animation = 'bounce 0.6s ease-in-out 3';
                    }
                }, 300);
            }
        }
    }, vistaActual === 'mapa' ? 100 : 600);
}

// ===========================
// INICIALIZACIÓN OFERTAS PÚBLICAS
// ===========================

// Inicializar ofertas públicas cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar ofertas públicas si estamos en index.html
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        console.log('🏠 Página de inicio detectada, inicializando ofertas públicas...');
        
        // Esperar un poco para que la página se cargue completamente
        setTimeout(() => {
            inicializarOfertasPublicas();
        }, 500);
    }
});