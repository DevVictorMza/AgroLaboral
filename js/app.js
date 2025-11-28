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
        UPDATE_EMPRESA: '/privado/empresas',
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
 * @param {number} idEstablecimiento - ID del establecimiento (opcional)
 * @returns {Promise<Array>} Lista de especies
 */
async function cargarEspeciesParaOfertas(idEstablecimiento) {
    try {
        console.log('🔄 Cargando especies para ofertas...');
        console.log('🆔 ID de establecimiento recibido:', idEstablecimiento);
        
        // Si se proporciona ID del establecimiento, buscar en caché local
        if (idEstablecimiento) {
            console.log('🔍 Buscando establecimiento en caché...');
            
            // Verificar que existe el caché
            if (!window.establecimientosCache || !Array.isArray(window.establecimientosCache)) {
                console.warn('⚠️ Caché de establecimientos no disponible o inválida');
                console.log('📊 Estado del caché:', window.establecimientosCache);
                return [];
            }
            
            console.log(`📦 Caché disponible con ${window.establecimientosCache.length} establecimientos`);
            
            // Buscar el establecimiento específico en caché
            const establecimiento = window.establecimientosCache.find(
                est => est.idEstablecimiento === idEstablecimiento || est.id === idEstablecimiento
            );
            
            if (!establecimiento) {
                console.warn(`⚠️ Establecimiento ${idEstablecimiento} no encontrado en caché`);
                console.log('📋 IDs disponibles en caché:', 
                    window.establecimientosCache.map(e => e.idEstablecimiento || e.id)
                );
                return [];
            }
            
            console.log('✅ Establecimiento encontrado:', establecimiento.nombreEstablecimiento || establecimiento.nombre);
            console.log('📋 Datos del establecimiento:', establecimiento);
            
            // Extraer especies del establecimiento
            const especies = establecimiento.especies || [];
            
            console.log(`🌿 Especies del establecimiento: ${especies.length} encontradas`);
            if (especies.length > 0) {
                console.log('📊 Listado de especies:');
                console.table(especies);
            } else {
                console.warn('⚠️ El establecimiento no tiene especies registradas');
            }
            
            return especies;
        }
        
        // Si no hay ID, retornar array vacío (no cargar todas las especies)
        console.warn('⚠️ No se proporcionó ID de establecimiento');
        return [];
        
    } catch (error) {
        console.error('❌ Error al cargar especies para ofertas:', error);
        console.error('📍 Stack trace:', error.stack);
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

        // Mostrar estado de carga en el modal
        const dashboardOffcanvas = document.getElementById('dashboardOffcanvas');
        const dashboardContent = document.getElementById('dashboard-content');
        
        if (!dashboardOffcanvas || !dashboardContent) {
            console.error('❌ Elementos del dashboard no encontrados');
            return;
        }

        // Mostrar loading en el dashboard
        dashboardContent.innerHTML = `
            <div class="loading-container d-flex justify-content-center align-items-center">
                <div class="text-center">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <h5 class="text-white">Cargando Panel de Control...</h5>
                    <p class="text-muted">Preparando su dashboard empresarial</p>
                </div>
            </div>
        `;

        // Abrir el modal fullscreen
        const bsModal = new bootstrap.Modal(dashboardOffcanvas, {
            backdrop: false,
            keyboard: true,
            focus: true
        });
        
        // Forzar estilos de fullscreen antes de mostrar
        dashboardOffcanvas.style.position = 'fixed';
        dashboardOffcanvas.style.top = '0';
        dashboardOffcanvas.style.left = '0';
        dashboardOffcanvas.style.width = '100vw';
        dashboardOffcanvas.style.height = '100vh';
        dashboardOffcanvas.style.margin = '0';
        dashboardOffcanvas.style.padding = '0';
        dashboardOffcanvas.style.zIndex = '1060';
        
        const modalDialog = dashboardOffcanvas.querySelector('.modal-dialog');
        if (modalDialog) {
            modalDialog.style.position = 'fixed';
            modalDialog.style.top = '0';
            modalDialog.style.left = '0';
            modalDialog.style.width = '100vw';
            modalDialog.style.height = '100vh';
            modalDialog.style.margin = '0';
            modalDialog.style.padding = '0';
            modalDialog.style.maxWidth = '100vw';
            modalDialog.style.maxHeight = '100vh';
        }
        
        const modalContent = dashboardOffcanvas.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.width = '100vw';
            modalContent.style.height = '100vh';
            modalContent.style.border = 'none';
            modalContent.style.borderRadius = '0';
        }
        
        bsModal.show();
        
        // Asegurar fullscreen después de que se muestre
        dashboardOffcanvas.addEventListener('shown.bs.modal', function() {
            // Forzar estilos después de que el modal se haya mostrado
            this.style.position = 'fixed';
            this.style.top = '0';
            this.style.left = '0';
            this.style.width = '100vw';
            this.style.height = '100vh';
            this.style.margin = '0';
            this.style.padding = '0';
            
            const dialog = this.querySelector('.modal-dialog');
            if (dialog) {
                dialog.style.position = 'fixed';
                dialog.style.top = '0';
                dialog.style.left = '0';
                dialog.style.width = '100vw';
                dialog.style.height = '100vh';
                dialog.style.margin = '0';
                dialog.style.padding = '0';
                dialog.style.maxWidth = '100vw';
                dialog.style.maxHeight = '100vh';
                dialog.style.transform = 'none';
            }
            
            const content = this.querySelector('.modal-content');
            if (content) {
                content.style.width = '100vw';
                content.style.height = '100vh';
                content.style.border = 'none';
                content.style.borderRadius = '0';
            }
            
            // Eliminar backdrop si existe
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            
            // Asegurar que body no tenga padding-right
            document.body.style.paddingRight = '0';
            document.body.style.overflow = 'hidden';
        });

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

// ============= FUNCIONES PARA EDITAR EMPRESA =============

function abrirModalEditarEmpresa() {
    console.log('🔧 Abriendo modal de edición de empresa');
    
    try {
        // Obtener los datos actuales del perfil desde localStorage
        const perfilJSON = localStorage.getItem('perfil_empresa');
        
        if (!perfilJSON) {
            showMessage('No se pudo cargar la información de la empresa', 'error');
            return;
        }
        
        const perfilActual = JSON.parse(perfilJSON);
        console.log('📋 Perfil cargado:', perfilActual);
        
        // Prellenar el formulario con la razón social actual
        const inputRazonSocial = document.getElementById('editRazonSocial');
        if (inputRazonSocial) {
            inputRazonSocial.value = perfilActual.razonSocial || '';
        }
        
        // Limpiar campos de contraseña
        const inputContrasenia = document.getElementById('editContrasenia');
        const inputContraseniaConfirmar = document.getElementById('editContraseniaConfirmar');
        
        if (inputContrasenia) inputContrasenia.value = '';
        if (inputContraseniaConfirmar) inputContraseniaConfirmar.value = '';
        
        // Remover validaciones previas
        const form = document.getElementById('formEditarEmpresa');
        if (form) {
            form.classList.remove('was-validated');
            // Limpiar mensajes de validación personalizados
            if (inputContraseniaConfirmar) {
                inputContraseniaConfirmar.setCustomValidity('');
            }
        }
        
        // Mostrar el modal
        const modalElement = document.getElementById('modalEditarEmpresa');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            console.error('❌ No se encontró el elemento del modal');
            showMessage('Error al abrir el modal de edición', 'error');
        }
        
    } catch (error) {
        console.error('❌ Error al abrir modal de edición:', error);
        showMessage('Error al cargar los datos de la empresa', 'error');
    }
}

async function guardarEdicionEmpresa() {
    console.log('💾 Guardando edición de empresa');
    
    const razonSocialInput = document.getElementById('editRazonSocial');
    const contraseniaInput = document.getElementById('editContrasenia');
    const contraseniaConfirmarInput = document.getElementById('editContraseniaConfirmar');
    
    const razonSocial = razonSocialInput ? razonSocialInput.value.trim() : '';
    const contrasenia = contraseniaInput ? contraseniaInput.value.trim() : '';
    const contraseniaConfirmar = contraseniaConfirmarInput ? contraseniaConfirmarInput.value.trim() : '';
    
    // Validar que al menos un campo tenga valor
    if (!razonSocial && !contrasenia) {
        showMessage('Debe modificar al menos un campo', 'warning');
        return;
    }
    
    // Validar longitud de razón social si se proporcionó
    if (razonSocial && razonSocial.length > 255) {
        showMessage('La razón social no puede exceder los 255 caracteres', 'error');
        return;
    }
    
    // Validar contraseña SOLO si se proporcionó
    if (contrasenia) {
        if (contrasenia.length < 6) {
            showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        // Validar que las contraseñas coincidan solo si ambos campos existen
        if (contraseniaConfirmarInput && contrasenia !== contraseniaConfirmar) {
            showMessage('Las contraseñas no coinciden', 'error');
            return;
        }
    }
    
    try {
        // Obtener el perfil de empresa del localStorage
        const perfilEmpresa = JSON.parse(localStorage.getItem('perfil_empresa') || '{}');
        const idEmpresa = perfilEmpresa.idEmpresa;
        
        if (!idEmpresa) {
            showMessage('Error: No se encontró el ID de la empresa', 'error');
            return;
        }
        
        // Preparar el DTO solo con los campos que tienen valor
        const empresaEdicionDTO = {};
        
        if (razonSocial) {
            empresaEdicionDTO.razonSocial = razonSocial;
        }
        
        if (contrasenia) {
            empresaEdicionDTO.contrasenia = contrasenia;
        }
        
        console.log('📤 Enviando actualización:', empresaEdicionDTO);
        console.log('📤 DTO en JSON:', JSON.stringify(empresaEdicionDTO));
        
        // Construir la URL del endpoint
        const url = 'http://localhost:8080/privado/empresas';
        console.log('🔗 URL de actualización:', url);
        
        // Realizar la petición PUT usando fetchWithAuth
        const response = await fetchWithAuth(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(empresaEdicionDTO)
        });
        
        console.log('📥 Respuesta del servidor:', response.status);
        
        // Manejar respuestas de error
        if (!response.ok) {
            if (response.status === 401) {
                showMessage('Sesión expirada. Redirigiendo al login...', 'error');
                setTimeout(() => {
                    cerrarSesion();
                }, 2000);
                return;
            }
            
            if (response.status === 400) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Error 400 del servidor:', errorData);
                const mensajeError = errorData.message || 'Datos inválidos. Verifique los campos.';
                throw new Error(mensajeError);
            }
            
            if (response.status === 500) {
                // Intentar obtener más detalles del error 500
                const errorData = await response.json().catch(() => null);
                console.error('❌ Error 500 del servidor:', errorData);
                const mensajeError = errorData?.message || errorData?.error || 'Error en el servidor. Intente nuevamente más tarde.';
                throw new Error(mensajeError);
            }
            
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Error del servidor:', errorData);
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
        
        // Procesar respuesta exitosa
        const empresaActualizada = await response.json();
        console.log('✅ Respuesta completa del servidor:', empresaActualizada);
        console.log('✅ Razón social recibida:', empresaActualizada.razonSocial);
        
        // Actualizar localStorage con los nuevos datos
        localStorage.setItem('perfil_empresa', JSON.stringify(empresaActualizada));
        console.log('💾 LocalStorage actualizado con:', empresaActualizada);
        
        // Cerrar el modal
        const modalElement = document.getElementById('modalEditarEmpresa');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }
        
        // Mostrar mensaje de éxito
        showMessage('✅ Datos de la empresa actualizados correctamente', 'success');
        
        // Recargar el perfil para reflejar los cambios en la interfaz
        setTimeout(async () => {
            await cargarPerfilEmpresa();
            // Si el dashboard está visible, regenerarlo
            const dashboardContent = document.getElementById('dashboard-content');
            if (dashboardContent && dashboardContent.innerHTML.trim() !== '') {
                generarDashboard(empresaActualizada);
            }
        }, 500);
        
    } catch (error) {
        console.error('❌ Error al actualizar empresa:', error);
        showMessage(error.message || 'Error al actualizar los datos de la empresa', 'error');
    }
}

// ============= FIN FUNCIONES EDITAR EMPRESA =============

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
                background: #2E2517 !important;
                border: 2px solid rgba(46, 37, 23, 0.8) !important;
                border-radius: 12px;
                color: #FFFFFF;
                box-shadow: 0 8px 24px rgba(46, 37, 23, 0.4) !important;
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
            
            /* ===================================
               TARJETA MAPA INTERACTIVO - BORGOÑA #5F021C
               =================================== */
            .servicio-card-mapa,
            .servicio-card-mapa-uva {
                background: #5F021C !important;
                border: 2px solid rgba(95, 2, 28, 0.8) !important;
                box-shadow: none !important;
            }
            .servicio-card-mapa .card-body,
            .servicio-card-mapa-uva .card-body {
                background: transparent !important;
                color: #FFFFFF !important;
            }
            
            /* ===================================
               TARJETA OFERTAS DISPONIBLES - BORGOÑA #5F021C
               =================================== */
            .servicio-card-ofertas {
                background: linear-gradient(145deg, #5F021C 0%, #8B0329 25%, #A0173A 50%, #8B0329 75%, #4A0115 100%) !important;
                border: 2px solid rgba(95, 2, 28, 0.8) !important;
                box-shadow: none !important;
            }
            .servicio-card-ofertas .card-body {
                background: transparent !important;
                color: #FFFFFF !important;
            }
            .servicio-card-ofertas h2,
            .servicio-card-ofertas p {
                color: #FFFFFF !important;
            }
            
            /* ===================================
               PROFILE HEADER MODERNO
               =================================== */
            .profile-header-modern {
                position: relative;
                background: #2E2517 !important;
                border: 2px solid rgba(46, 37, 23, 0.8) !important;
                border-radius: 16px;
                padding: 0;
                margin-bottom: 2rem;
                overflow: hidden;
                box-shadow: 0 8px 24px rgba(46, 37, 23, 0.4) !important;
            }
            
            .profile-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 120px;
                background: linear-gradient(135deg, rgba(46, 37, 23, 0.3) 0%, rgba(46, 37, 23, 0.2) 100%);
                opacity: 1;
            }
            
            .profile-content {
                position: relative;
                padding: 2rem;
                display: flex;
                gap: 2rem;
                align-items: flex-start;
            }
            
            /* Avatar empresarial */
            .company-avatar {
                position: relative;
                flex-shrink: 0;
            }
            
            .avatar-circle {
                width: 100px;
                height: 100px;
                border-radius: 20px;
                background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 8px 24px rgba(74, 144, 226, 0.4);
                border: 4px solid rgba(255, 255, 255, 0.1);
            }
            
            .avatar-circle i {
                font-size: 48px;
                color: white;
            }
            
            .avatar-badge {
                position: absolute;
                bottom: -5px;
                right: -5px;
                width: 32px;
                height: 32px;
                background: #27AE60;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 3px solid #1a2332;
                box-shadow: 0 2px 8px rgba(39, 174, 96, 0.4);
            }
            
            .avatar-badge i {
                font-size: 14px;
                color: white;
            }
            
            /* Información de la empresa */
            .company-info {
                flex: 1;
                min-width: 0;
            }
            
            .company-header {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1.5rem;
                flex-wrap: wrap;
            }
            
            .company-name {
                font-size: 1.75rem;
                font-weight: 700;
                color: #ffffff;
                margin: 0;
                letter-spacing: -0.5px;
            }
            
            .company-status-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                background: rgba(39, 174, 96, 0.15);
                border: 1px solid rgba(39, 174, 96, 0.3);
                border-radius: 20px;
                color: #27AE60;
                font-size: 0.85rem;
                font-weight: 600;
            }
            
            .company-status-badge i {
                font-size: 0.7rem;
            }
            
            .company-status-badge.active i {
                animation: pulse 2s ease-in-out infinite;
            }
            
            .company-edit-badge {
                background: rgba(39, 174, 96, 0.15);
                border: 1px solid rgba(39, 174, 96, 0.3);
                color: #27AE60;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .company-edit-badge:hover {
                background: rgba(39, 174, 96, 0.25);
                border-color: rgba(39, 174, 96, 0.5);
                transform: translateY(-2px);
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            /* Meta información */
            .company-meta {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1.5rem;
            }
            
            .meta-item {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
                padding: 1rem;
                background: transparent;
                border: none;
                border-radius: 12px;
                transition: all 0.3s ease;
            }
            
            .meta-item:hover {
                background: transparent;
                border: none;
                transform: translateY(-2px);
            }
            
            .meta-item i {
                font-size: 20px;
                color: #4A90E2;
                margin-top: 2px;
                flex-shrink: 0;
            }
            
            .meta-content {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
                min-width: 0;
            }
            
            .meta-label {
                font-size: 0.75rem;
                font-weight: 600;
                color: #8A92A6;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .meta-value {
                font-size: 0.95rem;
                font-weight: 600;
                color: #ffffff;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                text-shadow: none;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .profile-content {
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                
                .company-header {
                    justify-content: center;
                }
                
                .company-meta {
                    grid-template-columns: 1fr;
                }
            }
            
            /* Stats cards estilos deprecados - ahora en stats-cards.css */
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
            
            /* Animación para marcadores destacados */
            .marcador-pulsando {
                animation: pulsar 1.5s ease-in-out 3;
            }
            
            @keyframes pulsar {
                0%, 100% { 
                    transform: scale(1); 
                    opacity: 1;
                }
                50% { 
                    transform: scale(1.3); 
                    opacity: 0.8;
                }
            }
            
            /* Estilos para marcador temporal */
            .custom-marker-temp {
                animation: aparecer 0.5s ease-out;
            }
            
            @keyframes aparecer {
                0% { 
                    transform: scale(0) translateY(-20px); 
                    opacity: 0;
                }
                100% { 
                    transform: scale(1) translateY(0); 
                    opacity: 1;
                }
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
            
            /* ===================================
               ESTILOS MODAL DE POSTULACIÓN
               =================================== */
            
            /* Modal */
            #modalPostulacion .modal-content {
                background: #428F61 !important;
                color: #ffffff;
                border: 2px solid rgba(66, 143, 97, 0.8) !important;
                box-shadow: 0 8px 32px rgba(66, 143, 97, 0.4) !important;
            }
            
            #modalPostulacion .modal-header,
            #modalPostulacion .modal-footer {
                background: rgba(66, 143, 97, 0.2) !important;
                border-color: rgba(255, 255, 255, 0.2) !important;
            }
            
            /* Formulario */
            #form-postulacion .form-control,
            #form-postulacion .form-select {
                background: #2a2a2a;
                border: 1px solid #444;
                color: #ffffff;
            }
            
            #form-postulacion .form-control:focus,
            #form-postulacion .form-select:focus {
                background: #2a2a2a;
                border-color: #4A90E2;
                color: #ffffff;
                box-shadow: 0 0 0 0.2rem rgba(74, 144, 226, 0.25);
            }
            
            #form-postulacion .form-control::placeholder {
                color: #888;
            }
            
            #form-postulacion .form-control[readonly] {
                background: #1a1a1a;
                border-color: #555;
                cursor: not-allowed;
            }
            
            #form-postulacion .form-label {
                color: #ccc;
                font-weight: 500;
            }
            
            /* Validación */
            #form-postulacion .form-control.is-invalid,
            #form-postulacion .form-select.is-invalid {
                border-color: #dc3545;
                padding-right: calc(1.5em + 0.75rem);
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
                background-repeat: no-repeat;
                background-position: right calc(0.375em + 0.1875rem) center;
                background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
            }
            
            #form-postulacion .form-control.is-valid,
            #form-postulacion .form-select.is-valid {
                border-color: #28a745;
                padding-right: calc(1.5em + 0.75rem);
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%2328a745' d='M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e");
                background-repeat: no-repeat;
                background-position: right calc(0.375em + 0.1875rem) center;
                background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
            }
            
            .invalid-feedback {
                display: none;
                color: #dc3545;
                font-size: 0.875rem;
                margin-top: 0.25rem;
            }
            
            .invalid-feedback.d-block {
                display: block !important;
            }
            
            /* Mapa */
            #mapa-postulacion {
                background: #2a2a2a;
            }
            
            #mapa-postulacion .leaflet-control-attribution {
                background: rgba(42, 42, 42, 0.9);
                color: #ccc;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                #mapa-postulacion {
                    height: 300px !important;
                    margin-top: 1rem;
                }
            }
        </style>
        
        <div class="dashboard-container">
            <!-- Header del perfil con todos los datos de la empresa -->
            <div class="profile-header-modern">
                <div class="profile-backdrop"></div>
                <div class="profile-content">
                    <div class="company-avatar">
                        <div class="avatar-circle">
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="avatar-badge">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                    
                    <div class="company-info">
                        <div class="company-header">
                            <h2 class="company-name">${perfil.razonSocial}</h2>
                            <div class="d-flex align-items-center gap-2">
                                <span class="company-status-badge active">
                                    <i class="fas fa-circle"></i>
                                    Activa
                                </span>
                                <button type="button" class="company-status-badge company-edit-badge" onclick="abrirModalEditarEmpresa()">
                                    <i class="fas fa-edit"></i>
                                    Editar
                                </button>
                            </div>
                        </div>
                        
                        <div class="company-meta">
                            <div class="meta-item">
                                <i class="fas fa-id-card"></i>
                                <div class="meta-content">
                                    <span class="meta-label">ID Empresa</span>
                                    <span class="meta-value">${perfil.idEmpresa}</span>
                                </div>
                            </div>
                            
                            <div class="meta-item">
                                <i class="fas fa-file-invoice"></i>
                                <div class="meta-content">
                                    <span class="meta-label">CUIT</span>
                                    <span class="meta-value">${perfil.cuit}</span>
                                </div>
                            </div>
                            
                            <div class="meta-item">
                                <i class="fas fa-calendar-check"></i>
                                <div class="meta-content">
                                    <span class="meta-label">Miembro desde</span>
                                    <span class="meta-value">${new Date(perfil.fechaAlta).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                </div>
                            </div>
                            
                            <div class="meta-item">
                                <i class="fas fa-user-tie"></i>
                                <div class="meta-content">
                                    <span class="meta-label">Tipo de Cuenta</span>
                                    <span class="meta-value">Perfil Empresarial</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats cards -->
            <div class="row mb-4 g-3 stats-cards-container">
                <div class="col-md-3 col-sm-6">
                    <div class="stats-card-moderna stats-fincas">
                        <div class="stats-icono">
                            <i class="fas fa-warehouse"></i>
                        </div>
                        <div class="stats-contenido">
                            <div class="stats-numero" data-contador="fincas">0</div>
                            <div class="stats-label">Fincas Registradas</div>
                            <div class="stats-trend">
                                <i class="fas fa-arrow-up"></i>
                                <span>Activas</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="stats-card-moderna stats-ofertas">
                        <div class="stats-icono">
                            <i class="fas fa-briefcase"></i>
                        </div>
                        <div class="stats-contenido">
                            <div class="stats-numero" data-contador="ofertas">0</div>
                            <div class="stats-label">Ofertas Activas</div>
                            <div class="stats-trend">
                                <i class="fas fa-check-circle"></i>
                                <span>Vigentes</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="stats-card-moderna stats-trabajadores">
                        <div class="stats-icono">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stats-contenido">
                            <div class="stats-numero" data-contador="trabajadores">0</div>
                            <div class="stats-label">Trabajadores</div>
                            <div class="stats-trend">
                                <i class="fas fa-user-check"></i>
                                <span>Contratados</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="stats-card-moderna stats-solicitudes">
                        <div class="stats-icono">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <div class="stats-contenido">
                            <div class="stats-numero" data-contador="solicitudes">0</div>
                            <div class="stats-label">Solicitudes</div>
                            <div class="stats-trend">
                                <i class="fas fa-clock"></i>
                                <span>Pendientes</span>
                            </div>
                        </div>
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
                        <!-- Header mejorado de ofertas -->
                        <div class="ofertas-header mb-4">
                            <div class="header-info">
                                <i class="fas fa-briefcase"></i>
                                <div class="header-text">
                                    <h5>Ofertas de Trabajo Disponibles</h5>
                                    <span class="contador-badge" id="ofertas-contador-badge">Cargando...</span>
                                </div>
                            </div>
                            
                            <!-- Controles de filtrado -->
                            <div class="ofertas-filter-controls">
                                <div class="btn-group-ofertas" role="group" aria-label="Filtros de ofertas">
                                    <button type="button" 
                                            class="btn-filter btn-filter-todas" 
                                            id="filtro-todas"
                                            onclick="aplicarFiltroOfertas(null)"
                                            data-filter="todas">
                                        <i class="fas fa-list"></i>
                                        <span>Todas</span>
                                    </button>
                                    <button type="button" 
                                            class="btn-filter btn-filter-vigentes" 
                                            id="filtro-vigentes"
                                            onclick="aplicarFiltroOfertas(true)"
                                            data-filter="vigentes">
                                        <i class="fas fa-check-circle"></i>
                                        <span>Vigentes</span>
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
                                <button class="btn btn-outline-info" onclick="cargarOfertasEmpleo(true)">
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

        <!-- Modal de Postulaciones -->
        <div class="modal fade" id="modalPostulaciones" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-scrollable">
                <div class="modal-content bg-dark text-white">
                    <div class="modal-header border-secondary">
                        <h5 class="modal-title">
                            <i class="fas fa-users me-2 text-info"></i>
                            Postulaciones - <span id="modal-oferta-titulo">Oferta</span>
                        </h5>
                        <span class="badge bg-info ms-3" id="modal-total-postulaciones">
                            0 candidatos
                        </span>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    
                    <div class="modal-body">
                        <!-- Loading State -->
                        <div id="postulaciones-loading" class="text-center py-5">
                            <div class="spinner-border text-info mb-3" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                            <h6 class="text-white">Cargando postulaciones...</h6>
                            <p class="text-muted">Obteniendo candidatos</p>
                        </div>
                        
                        <!-- Empty State -->
                        <div id="postulaciones-empty" class="d-none text-center py-5">
                            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                            <h6 class="text-white">No hay postulaciones aún</h6>
                            <p class="text-muted">Las postulaciones de los candidatos aparecerán aquí</p>
                        </div>
                        
                        <!-- Error State -->
                        <div id="postulaciones-error" class="d-none alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <span id="error-mensaje">Error cargando postulaciones</span>
                        </div>
                        
                        <!-- Data Table -->
                        <div id="postulaciones-table-container" class="d-none">
                            <div class="table-responsive">
                                <table class="table table-hover table-dark">
                                    <thead>
                                        <tr>
                                            <th class="text-center">#</th>
                                            <th>DNI</th>
                                            <th>Nombre Completo</th>
                                            <th>Teléfono</th>
                                            <th>Ubicación</th>
                                            <th>Fecha Postulación</th>
                                            <th class="text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="postulaciones-tbody">
                                        <!-- Filas dinámicas -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer border-secondary">
                        <small class="text-muted me-auto">
                            <i class="fas fa-info-circle me-1"></i>
                            Postulaciones recibidas para esta oferta laboral
                        </small>
                        <button class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cerrar
                        </button>
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
                cargarOfertasEmpleo(true); // Cargar solo ofertas vigentes por defecto
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
                            <small class="text-muted d-block mb-2 text-center">
                                <i class="fas fa-info-circle me-1"></i>Haga clic en el mapa para establecer la ubicación
                            </small>
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

        // Guardar en caché global para uso posterior (especialmente para ofertas laborales)
        window.establecimientosCache = establecimientos;
        console.log('💾 Establecimientos guardados en caché global');

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
 * Genera el HTML para mostrar los establecimientos en formato lista
 * @param {Array} establecimientos - Array de establecimientos
 * @returns {string} HTML generado
 */
function generarHtmlEstablecimientos(establecimientos) {
    const establecimientosHtml = establecimientos.map((est, index) => `
        <div class="establecimiento-item-horizontal" data-id="${est.idEstablecimiento}">
            <div class="establecimiento-badge-numero">#${index + 1}</div>
            
            <div class="establecimiento-info-principal">
                <div class="establecimiento-nombre">
                    <i class="fas fa-warehouse" style="font-size: 0.9rem; color: #27AE60;"></i>
                    <h6>${est.nombreEstablecimiento.toUpperCase()}</h6>
                </div>
                <div class="establecimiento-detalles-inline">
                    <span class="detalle-item">
                        <i class="fas fa-map-marker-alt" style="color: #3498DB;"></i>
                        ${est.nombreDistrito}
                    </span>
                    <span class="detalle-item">
                        <i class="fas fa-leaf" style="color: #27AE60;"></i>
                        ${est.especies.length} ${est.especies.length === 1 ? 'especie' : 'especies'}
                    </span>
                    <span class="detalle-item">
                        <i class="fas fa-check-circle" style="color: #27AE60;"></i>
                        Activo
                    </span>
                </div>
            </div>
            
            <div class="establecimiento-acciones">
                <button class="btn-accion-compacto btn-crear-oferta" onclick="crearOfertaLaboral(${est.idEstablecimiento})" title="Crear oferta">
                    <i class="fas fa-briefcase"></i>
                    <span>Nueva Oferta</span>
                </button>
                <button class="btn-accion-compacto btn-editar" onclick="abrirModalEditarEstablecimiento(${est.idEstablecimiento})" title="Editar">
                    <i class="fas fa-edit"></i>
                    <span>Editar</span>
                </button>
                <button class="btn-accion-compacto btn-dar-baja" onclick="darBajaEstablecimiento(${est.idEstablecimiento})" title="Dar de baja">
                    <i class="fas fa-times-circle"></i>
                    <span>Dar de Baja</span>
                </button>
            </div>
        </div>
    `).join('');

    return `
        <style>
            .establecimientos-container {
                padding: 1.5rem;
                max-width: 1400px;
                margin: 0 auto;
            }
            
            .establecimientos-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid #444;
            }
            
            .header-info {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .header-info i {
                font-size: 1.5rem;
                color: #4A90E2;
            }
            
            .header-text h5 {
                margin: 0;
                color: #fff;
                font-weight: 600;
            }
            
            .contador-badge {
                display: inline-block;
                background: linear-gradient(135deg, #4A90E2, #357ABD);
                color: white;
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: 600;
                margin-top: 0.25rem;
            }
            
            .btn-agregar-establecimiento {
                background: linear-gradient(135deg, #27AE60, #2ECC71);
                border: none;
                color: white;
                padding: 0.6rem 1.2rem;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.9rem;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
            }
            
            .btn-agregar-establecimiento:hover {
                background: linear-gradient(135deg, #229954, #27AE60);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(39, 174, 96, 0.4);
            }
            
            .btn-agregar-establecimiento i {
                font-size: 0.85rem;
            }
            
            /* LISTA VERTICAL - Una encima de otra */
            .establecimientos-lista {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            /* TARJETA HORIZONTAL - De izquierda a derecha */
            .establecimiento-item-horizontal {
                background: linear-gradient(145deg, #2A2A2A, #252525);
                border: 1px solid #3a3a3a;
                border-radius: 10px;
                padding: 1.25rem;
                display: flex;
                align-items: center;
                gap: 1.5rem;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }
            
            .establecimiento-item-horizontal:hover {
                border-color: #4A90E2;
                transform: translateX(8px);
                box-shadow: 0 4px 16px rgba(74, 144, 226, 0.3);
            }
            
            /* Badge numérico a la izquierda */
            .establecimiento-badge-numero {
                background: linear-gradient(135deg, #4A90E2, #357ABD);
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 1rem;
                flex-shrink: 0;
                box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
            }
            
            /* Información principal (centro) */
            .establecimiento-info-principal {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                min-width: 0;
            }
            
            .establecimiento-nombre {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .establecimiento-nombre i {
                flex-shrink: 0;
            }
            
            .establecimiento-nombre h6 {
                margin: 0;
                color: #fff;
                font-weight: 600;
                font-size: 1.1rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            /* Detalles en línea */
            .establecimiento-detalles-inline {
                display: flex;
                align-items: center;
                gap: 2rem;
                flex-wrap: wrap;
            }
            
            .detalle-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: #CCCCCC;
                font-size: 0.9rem;
            }
            
            .detalle-item i {
                font-size: 0.8rem;
                flex-shrink: 0;
            }
            
            /* Acciones a la derecha */
            .establecimiento-acciones {
                display: flex;
                gap: 0.75rem;
                flex-shrink: 0;
            }
            
            .btn-accion-compacto {
                background: #333;
                border: 1px solid #444;
                color: #CCCCCC;
                padding: 0.7rem 1.5rem;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.6rem;
                font-size: 0.9rem;
                font-weight: 500;
                transition: all 0.2s ease;
                cursor: pointer;
                white-space: nowrap;
                min-width: 140px;
                height: 42px;
            }
            
            .btn-accion-compacto i {
                font-size: 0.9rem;
                flex-shrink: 0;
            }
            
            .btn-accion-compacto span {
                flex: 0 0 auto;
            }
            
            .btn-accion-compacto:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            .btn-ver-mapa:hover {
                background: linear-gradient(135deg, #3498DB, #2980B9);
                border-color: #3498DB;
                color: white;
            }
            
            .btn-crear-oferta:hover {
                background: linear-gradient(135deg, #27AE60, #229954);
                border-color: #27AE60;
                color: white;
            }
            
            .btn-editar {
                background: linear-gradient(135deg, rgba(243, 156, 18, 0.1), rgba(230, 126, 34, 0.1));
                border: 1px solid rgba(243, 156, 18, 0.3);
                color: #F39C12;
            }
            
            .btn-editar:hover {
                background: linear-gradient(135deg, #F39C12, #E67E22);
                border-color: #F39C12;
                color: white;
            }
            
            .btn-dar-baja {
                background: linear-gradient(135deg, rgba(231, 76, 60, 0.1), rgba(192, 57, 43, 0.1));
                border: 1px solid rgba(231, 76, 60, 0.3);
                color: #E74C3C;
            }
            
            .btn-dar-baja:hover {
                background: linear-gradient(135deg, #E74C3C, #C0392B);
                border-color: #E74C3C;
                color: white;
            }
            
            /* Responsive */
            @media (max-width: 992px) {
                .establecimiento-item-horizontal {
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                
                .establecimiento-acciones {
                    width: 100%;
                    justify-content: flex-end;
                }
            }
            
            @media (max-width: 768px) {
                .establecimientos-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 1rem;
                }
                
                .btn-agregar-establecimiento {
                    width: 100%;
                }
                
                .establecimiento-item-horizontal {
                    padding: 1rem;
                }
                
                .establecimiento-detalles-inline {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
                
                .establecimiento-acciones {
                    width: 100%;
                }
                
                .btn-accion-compacto {
                    flex: 1;
                    justify-content: center;
                }
            }
        </style>
        
        <div class="establecimientos-container">
            <div class="establecimientos-header">
                <div class="header-info">
                    <i class="fas fa-clipboard-list"></i>
                    <div class="header-text">
                        <h5>Mis Establecimientos</h5>
                        <span class="contador-badge">${establecimientos.length} ${establecimientos.length === 1 ? 'establecimiento' : 'establecimientos'}</span>
                    </div>
                </div>
                <button class="btn btn-success btn-agregar-establecimiento" onclick="abrirWizardFinca()">
                    <i class="fas fa-plus-circle me-2"></i>
                    <span>Agregar Establecimiento</span>
                </button>
            </div>
            <div class="establecimientos-lista">
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
    const statsNumero = document.querySelector('[data-contador="fincas"]');
    if (statsNumero) {
        // Agregar clase de animación
        statsNumero.classList.add('counting');
        
        // Actualizar el número
        statsNumero.textContent = cantidad.toString();
        
        // Remover clase después de la animación
        setTimeout(() => {
            statsNumero.classList.remove('counting');
        }, 500);
        
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
 * Ver establecimiento en el mapa - Abre Google Maps
 * @param {number} latitud - Latitud del establecimiento
 * @param {number} longitud - Longitud del establecimiento
 */
function verEnMapa(latitud, longitud) {
    console.log(`🗺️ Ver en mapa: ${latitud}, ${longitud}`);
    window.open(`https://www.google.com/maps?q=${latitud},${longitud}`, '_blank');
}

/**
 * Centrar el mapa de establecimientos en coordenadas específicas (ELIMINADA - era parte de verEnMapa compleja)
 * @deprecated
 */
function centrarMapaEnCoordenadas(latitud, longitud) {
    return new Promise((resolve, reject) => {
        console.log('🎯 Centrando mapa en:', latitud, longitud);
        
        // Verificar que el mapa esté inicializado
        if (!mapEstablecimientos) {
            console.log('🔄 Inicializando mapa de establecimientos...');
            inicializarMapaEstablecimientos()
                .then(() => {
                    setTimeout(() => {
                        centrarMapaEnCoordenadas(latitud, longitud).then(resolve).catch(reject);
                    }, 500);
                })
                .catch(error => {
                    console.error('❌ Error inicializando mapa:', error);
                    showMessage('Error al inicializar el mapa', 'error');
                    reject(error);
                });
            return;
        }
        
        try {
            // Centrar el mapa en las coordenadas con zoom y animación mejorada
            mapEstablecimientos.setView([latitud, longitud], 16, {
                animate: true,
                duration: 1.5,
                easeLinearity: 0.25
            });
            
            // Esperar a que termine la animación
            setTimeout(() => {
                // Buscar si existe un marcador en esas coordenadas y abrirlo
                let marcadorEncontrado = false;
                let mejorMarcador = null;
                let menorDistancia = Infinity;
                
                marcadoresEstablecimientos.forEach(marcador => {
                    const markerLatLng = marcador.getLatLng();
                    const distanciaLat = Math.abs(markerLatLng.lat - latitud);
                    const distanciaLng = Math.abs(markerLatLng.lng - longitud);
                    const distanciaTotal = distanciaLat + distanciaLng;
                    
                    // Tolerancia aumentada a 0.001 grados (aprox 110 metros)
                    if (distanciaLat < 0.001 && distanciaLng < 0.001) {
                        if (distanciaTotal < menorDistancia) {
                            menorDistancia = distanciaTotal;
                            mejorMarcador = marcador;
                            marcadorEncontrado = true;
                        }
                    }
                });
                
                if (marcadorEncontrado && mejorMarcador) {
                    console.log('✅ Marcador encontrado y popup abierto');
                    
                    // Abrir popup
                    mejorMarcador.openPopup();
                    
                    // Agregar animación de pulso al marcador
                    const iconElement = mejorMarcador._icon;
                    if (iconElement) {
                        iconElement.classList.add('marcador-pulsando');
                        
                        // Remover clase después de la animación (4.5s = 3 ciclos de 1.5s)
                        setTimeout(() => {
                            iconElement.classList.remove('marcador-pulsando');
                        }, 4500);
                    }
                    
                    resolve(true);
                } else {
                    console.log('ℹ️ No se encontró marcador cercano, creando marcador temporal');
                    
                    // Crear un marcador temporal si no existe
                    const marcadorTemporal = L.marker([latitud, longitud], {
                        icon: L.divIcon({
                            className: 'custom-marker-temp',
                            html: '<i class="fas fa-map-marker-alt" style="color: #dc3545; font-size: 2rem;"></i>',
                            iconSize: [30, 42],
                            iconAnchor: [15, 42]
                        })
                    }).addTo(mapEstablecimientos);
                    
                    marcadorTemporal.bindPopup(`
                        <div class="p-2">
                            <strong>📍 Ubicación del establecimiento</strong><br>
                            <small>Lat: ${latitud.toFixed(6)}</small><br>
                            <small>Lng: ${longitud.toFixed(6)}</small><br>
                            <small class="text-muted mt-1 d-block">Marcador temporal</small>
                        </div>
                    `).openPopup();
                    
                    // Agregar animación al marcador temporal
                    const iconElement = marcadorTemporal._icon;
                    if (iconElement) {
                        iconElement.classList.add('marcador-pulsando');
                    }
                    
                    resolve(false);
                }
            }, 1600); // Esperar un poco más que la duración de la animación
            
        } catch (error) {
            console.error('❌ Error centrando mapa:', error);
            reject(error);
        }
    });
}

// Exponer función verEnMapa globalmente
window.verEnMapa = verEnMapa;

/**
 * Dar de baja un establecimiento
 * @param {number} idEstablecimiento - ID del establecimiento
 */
async function darBajaEstablecimiento(idEstablecimiento) {
    console.log('🚫 Dando de baja establecimiento:', idEstablecimiento);
    
    // Confirmar la acción
    const confirmar = confirm('¿Está seguro que desea dar de baja este establecimiento?\n\nEsta acción establecerá una fecha de baja y el establecimiento quedará inactivo.');
    
    if (!confirmar) {
        console.log('❌ Operación cancelada por el usuario');
        return;
    }
    
    try {
        showMessage('Procesando baja del establecimiento...', 'info');
        
        // Construir la URL del endpoint
        const url = `http://localhost:8080/privado/establecimientos/${idEstablecimiento}/estado`;
        console.log('🔗 URL:', url);
        
        // Realizar la petición PUT usando fetchWithAuth
        const response = await fetchWithAuth(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📥 Respuesta del servidor:', response.status);
        
        // Manejar respuestas de error
        if (!response.ok) {
            if (response.status === 401) {
                showMessage('Sesión expirada. Redirigiendo al login...', 'error');
                setTimeout(() => {
                    cerrarSesion();
                }, 2000);
                return;
            }
            
            if (response.status === 403) {
                showMessage('No tiene permisos para dar de baja este establecimiento', 'error');
                return;
            }
            
            if (response.status === 404) {
                showMessage('Establecimiento no encontrado', 'error');
                return;
            }
            
            if (response.status === 400) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Error 400 del servidor:', errorData);
                const mensajeError = errorData.message || 'No se pudo procesar la solicitud';
                showMessage(mensajeError, 'error');
                return;
            }
            
            if (response.status >= 500) {
                const errorData = await response.json().catch(() => null);
                console.error('❌ Error 500 del servidor:', errorData);
                showMessage('Error del servidor. Intente nuevamente más tarde.', 'error');
                return;
            }
            
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Error del servidor:', errorData);
            showMessage(errorData.message || `Error ${response.status}`, 'error');
            return;
        }
        
        // Procesar respuesta exitosa
        const establecimientoActualizado = await response.json();
        console.log('✅ Establecimiento dado de baja exitosamente:', establecimientoActualizado);
        
        // Mostrar mensaje de éxito
        showMessage('Establecimiento dado de baja correctamente', 'success');
        
        // Recargar la lista de establecimientos
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error al dar de baja establecimiento:', error);
        showMessage(error.message || 'Error al dar de baja el establecimiento', 'error');
    }
}

/**
 * Abre el modal para editar un establecimiento
 * @param {number} idEstablecimiento - ID del establecimiento a editar
 */
async function abrirModalEditarEstablecimiento(idEstablecimiento) {
    console.log('✏️ Abriendo modal de edición para establecimiento:', idEstablecimiento);
    
    try {
        // Mostrar carga
        showMessage('Cargando datos del establecimiento...', 'info');
        
        // Cargar todos los establecimientos
        const establecimientos = await cargarEstablecimientos();
        
        if (!establecimientos) {
            showMessage('Error al cargar establecimientos', 'error');
            return;
        }
        
        // Buscar el establecimiento específico
        const establecimiento = establecimientos.find(est => est.idEstablecimiento === idEstablecimiento);
        
        if (!establecimiento) {
            showMessage('Establecimiento no encontrado', 'error');
            return;
        }
        
        console.log('📥 Establecimiento encontrado:', establecimiento);
        
        // Cargar distritos y especies en paralelo
        const [distritos, especies] = await Promise.all([
            obtenerTodosLosDistritos(),
            obtenerTodasLasEspecies()
        ]);
        
        console.log('📊 Distritos cargados:', distritos ? distritos.length : 0);
        console.log('📊 Especies cargadas:', especies ? especies.length : 0);
        
        // Llenar campos del formulario
        document.getElementById('editEstabIdEstablecimiento').value = establecimiento.idEstablecimiento;
        document.getElementById('editEstabNombre').value = establecimiento.nombreEstablecimiento || '';
        document.getElementById('editEstabCalle').value = establecimiento.calle || '';
        document.getElementById('editEstabNumeracion').value = establecimiento.numeracion || '';
        document.getElementById('editEstabCodigoPostal').value = establecimiento.codigoPostal || '';
        document.getElementById('editEstabLatitud').value = establecimiento.latitud || '';
        document.getElementById('editEstabLongitud').value = establecimiento.longitud || '';
        
        // Poblar select de distritos
        const selectDistrito = document.getElementById('editEstabDistrito');
        selectDistrito.innerHTML = '<option value="">Seleccione un distrito</option>';
        if (distritos && distritos.length > 0) {
            distritos.forEach(distrito => {
                const option = document.createElement('option');
                option.value = distrito.idDistrito;
                option.textContent = distrito.nombreDistrito;
                // Pre-seleccionar usando idDistrito o nombreDistrito
                if (distrito.idDistrito === establecimiento.idDistrito || 
                    distrito.nombreDistrito === establecimiento.nombreDistrito) {
                    option.selected = true;
                }
                selectDistrito.appendChild(option);
            });
        }
        
        // Pre-cargar especies seleccionadas para el dropdown
        const especiesIdsInput = document.getElementById('editEstabEspeciesIds');
        const displayDiv = document.getElementById('editEstabEspeciesDisplay');
        const btnText = document.getElementById('editEstabEspeciesBtnText');
        
        if (establecimiento.especies && Array.isArray(establecimiento.especies) && establecimiento.especies.length > 0) {
            // Obtener IDs de las especies del establecimiento
            const especiesIds = establecimiento.especies.map(e => e.idEspecie);
            
            // Actualizar hidden input
            if (especiesIdsInput) {
                especiesIdsInput.value = especiesIds.join(',');
                console.log('📝 Especies pre-cargadas:', especiesIdsInput.value);
            }
            
            // Actualizar display con badges
            if (displayDiv) {
                displayDiv.innerHTML = establecimiento.especies.map(especie => `
                    <span class="badge bg-success me-2 mb-2">
                        <i class="fas fa-seedling me-1"></i>${especie.nombreEspecie}
                        <i class="fas fa-times ms-1" style="cursor: pointer;" 
                           onclick="quitarEspecieSeleccionada(${especie.idEspecie})"></i>
                    </span>
                `).join('');
            }
            
            // Actualizar texto del botón
            if (btnText) {
                btnText.textContent = `Seleccionar Especies (${especiesIds.length}/5)`;
            }
            
            console.log(`✅ ${especiesIds.length} especie(s) pre-cargada(s):`, establecimiento.especies.map(e => e.nombreEspecie).join(', '));
        } else {
            // No hay especies, limpiar campos
            if (especiesIdsInput) especiesIdsInput.value = '';
            if (displayDiv) displayDiv.innerHTML = '<small class="text-info">No hay especies seleccionadas</small>';
            if (btnText) btnText.textContent = 'Seleccionar Especies (0/5)';
            console.log('ℹ️ No hay especies pre-seleccionadas');
        }
        
        console.log('✅ Formulario cargado con datos del establecimiento');
        
        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('editarEstablecimientoModal'));
        modal.show();
        
        console.log('✅ Modal de edición abierto correctamente');
        
    } catch (error) {
        console.error('❌ Error al abrir modal de edición:', error);
        showMessage('Error al cargar los datos del establecimiento', 'error');
    }
}

/**
 * Carga todos los distritos del backend sin modificar DOM
 * @returns {Promise<Array>} Array de distritos
 */
async function obtenerTodosLosDistritos() {
    try {
        // Primero obtener todos los departamentos
        const responseDep = await fetchWithConfig(buildURL(BACKEND_CONFIG.ENDPOINTS.DEPARTAMENTOS));
        if (!responseDep.ok) {
            throw new Error('Error al cargar departamentos');
        }
        const departamentos = await responseDep.json();
        
        // Cargar distritos de todos los departamentos en paralelo
        const promesasDistritos = departamentos.map(dep => 
            fetchWithConfig(buildURL(BACKEND_CONFIG.ENDPOINTS.DISTRITOS, `/${dep.idDepartamento}`))
                .then(res => res.ok ? res.json() : [])
                .catch(() => [])
        );
        
        const resultados = await Promise.all(promesasDistritos);
        const todosLosDistritos = resultados.flat();
        
        console.log('📊 Total distritos cargados:', todosLosDistritos.length);
        return todosLosDistritos;
        
    } catch (error) {
        console.error('❌ Error al obtener distritos:', error);
        return [];
    }
}

/**
 * Carga todas las especies del backend sin modificar DOM
 * @returns {Promise<Array>} Array de especies
 */
async function obtenerTodasLasEspecies() {
    try {
        console.log('🔐 Obteniendo especies con autenticación...');
        const response = await fetchWithAuth('http://localhost:8080/privado/especies');
        if (!response.ok) {
            console.error('❌ Error HTTP al cargar especies:', response.status, response.statusText);
            throw new Error(`Error al cargar especies: ${response.status}`);
        }
        const especies = await response.json();
        console.log('✅ Especies cargadas correctamente:', especies.length);
        return especies;
    } catch (error) {
        console.error('❌ Error al obtener especies:', error);
        showMessage('Error al cargar especies del servidor', 'error');
        return [];
    }
}

/**
 * Función auxiliar para usar ubicación actual en el modal de edición
 */
function usarUbicacionActualParaEdicion() {
    if (!navigator.geolocation) {
        showMessage('Tu navegador no soporta geolocalización', 'error');
        return;
    }
    
    showMessage('Obteniendo tu ubicación...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            document.getElementById('editEstabLatitud').value = position.coords.latitude;
            document.getElementById('editEstabLongitud').value = position.coords.longitude;
            showMessage('Ubicación obtenida correctamente', 'success');
        },
        (error) => {
            console.error('❌ Error al obtener ubicación:', error);
            showMessage('No se pudo obtener tu ubicación. Verifica los permisos del navegador.', 'error');
        }
    );
}

/**
 * Valida el formulario de edición de establecimiento
 * @returns {Object|null} - Retorna el DTO si es válido, null si hay errores
 */
function validarFormularioEstablecimiento() {
    const nombre = document.getElementById('editEstabNombre').value.trim();
    const calle = document.getElementById('editEstabCalle').value.trim();
    const numeracion = document.getElementById('editEstabNumeracion').value.trim();
    const codigoPostal = document.getElementById('editEstabCodigoPostal').value.trim();
    const latitud = parseFloat(document.getElementById('editEstabLatitud').value);
    const longitud = parseFloat(document.getElementById('editEstabLongitud').value);
    const idDistrito = parseInt(document.getElementById('editEstabDistrito').value);
    
    // Leer especies desde el hidden input (nuevo sistema visual)
    const especiesIdsInput = document.getElementById('editEstabEspeciesIds');
    const especiesIdsStr = especiesIdsInput ? especiesIdsInput.value.trim() : '';
    const idsEspecies = especiesIdsStr 
        ? especiesIdsStr.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        : [];
    
    // Validaciones
    if (!nombre || nombre.length > 25) {
        showMessage('El nombre del establecimiento es obligatorio y no puede exceder 25 caracteres', 'error');
        return null;
    }
    
    if (!calle || calle.length > 25) {
        showMessage('La calle es obligatoria y no puede exceder 25 caracteres', 'error');
        return null;
    }
    
    if (!numeracion || numeracion.length > 5) {
        showMessage('La numeración es obligatoria y no puede exceder 5 caracteres', 'error');
        return null;
    }
    
    if (!codigoPostal || !/^\d{4}$/.test(codigoPostal)) {
        showMessage('El código postal debe ser exactamente 4 dígitos', 'error');
        return null;
    }
    
    if (isNaN(latitud) || latitud < -90 || latitud > 90) {
        showMessage('La latitud debe estar entre -90 y 90', 'error');
        return null;
    }
    
    if (isNaN(longitud) || longitud < -180 || longitud > 180) {
        showMessage('La longitud debe estar entre -180 y 180', 'error');
        return null;
    }
    
    if (!idDistrito) {
        showMessage('Debe seleccionar un distrito', 'error');
        return null;
    }
    
    if (idsEspecies.length === 0) {
        showMessage('Debe seleccionar al menos una especie', 'error');
        return null;
    }
    
    // Construir DTO
    return {
        nombreEstablecimiento: nombre,
        calle: calle,
        numeracion: numeracion,
        codigoPostal: codigoPostal,
        latitud: latitud,
        longitud: longitud,
        idDistrito: idDistrito,
        idsEspecies: idsEspecies
    };
}

/**
 * Guarda los cambios del establecimiento editado
 */
async function guardarEdicionEstablecimiento() {
    console.log('💾 Guardando edición de establecimiento...');
    
    try {
        // Obtener ID del establecimiento
        const idEstablecimiento = parseInt(document.getElementById('editEstabIdEstablecimiento').value);
        
        if (!idEstablecimiento) {
            showMessage('Error: No se pudo identificar el establecimiento', 'error');
            return;
        }
        
        // Validar formulario
        const dto = validarFormularioEstablecimiento();
        if (!dto) {
            return; // Los errores ya se mostraron en la validación
        }
        
        console.log('📤 DTO a enviar:', dto);
        
        // Mostrar mensaje de procesamiento
        showMessage('Guardando cambios...', 'info');
        
        // Enviar solicitud PUT al backend
        const response = await fetchWithAuth(`http://localhost:8080/privado/establecimientos/${idEstablecimiento}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dto)
        });
        
        console.log('📥 Respuesta del servidor:', response.status);
        
        // Manejar errores
        if (!response.ok) {
            if (response.status === 400) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Error 400 - Validación:', errorData);
                const mensajeError = errorData.message || 'Error de validación. Verifique los datos ingresados.';
                showMessage(mensajeError, 'error');
                return;
            }
            
            if (response.status === 401) {
                showMessage('Sesión expirada. Redirigiendo al login...', 'error');
                setTimeout(() => cerrarSesion(), 2000);
                return;
            }
            
            if (response.status === 403) {
                showMessage('No tiene permisos para editar este establecimiento', 'error');
                return;
            }
            
            if (response.status === 404) {
                showMessage('Establecimiento no encontrado', 'error');
                return;
            }
            
            if (response.status >= 500) {
                const errorData = await response.json().catch(() => null);
                console.error('❌ Error 500 del servidor:', errorData);
                showMessage('Error del servidor. Intente nuevamente más tarde.', 'error');
                return;
            }
            
            throw new Error(`Error ${response.status}`);
        }
        
        // Procesar respuesta exitosa
        const establecimientoActualizado = await response.json();
        console.log('✅ Establecimiento actualizado:', establecimientoActualizado);
        
        // Cerrar modal
        const modalElement = document.getElementById('editarEstablecimientoModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
        
        // Mostrar mensaje de éxito
        showMessage('Establecimiento actualizado correctamente', 'success');
        
        // Recargar establecimientos
        setTimeout(async () => {
            const establecimientos = await cargarEstablecimientos();
            if (establecimientos) {
                renderizarEstablecimientos(establecimientos);
                console.log('✅ Lista de establecimientos actualizada');
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error al guardar establecimiento:', error);
        showMessage(error.message || 'Error al guardar los cambios', 'error');
    }
}

/**
 * Toggle dropdown de especies (inline, sin modal secundario)
 */
function toggleDropdownEspecies(event) {
    console.log('🎯 Toggle dropdown especies called');
    event.preventDefault();
    event.stopPropagation();
    
    const dropdown = document.getElementById('editEstabEspeciesDropdown');
    const chevron = document.getElementById('editEstabEspeciesChevron');
    
    if (!dropdown) {
        console.error('❌ Dropdown no encontrado');
        return;
    }
    
    if (!chevron) {
        console.error('❌ Chevron no encontrado');
    }
    
    console.log('📊 Estado actual dropdown:', dropdown.style.display);
    
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        // Abrir dropdown
        console.log('🔓 Abriendo dropdown...');
        dropdown.style.display = 'block';
        if (chevron) {
            chevron.classList.remove('fa-chevron-down');
            chevron.classList.add('fa-chevron-up');
        }
        
        // Cargar especies
        console.log('📞 Llamando a cargarEspeciesParaDropdown...');
        cargarEspeciesParaDropdown();
    } else {
        // Cerrar dropdown
        console.log('🔒 Cerrando dropdown...');
        dropdown.style.display = 'none';
        if (chevron) {
            chevron.classList.remove('fa-chevron-up');
            chevron.classList.add('fa-chevron-down');
        }
    }
}

/**
 * Cargar especies en el dropdown inline
 */
async function cargarEspeciesParaDropdown() {
    const grid = document.getElementById('editEstabEspeciesGrid');
    
    if (!grid) {
        console.error('❌ Grid de especies no encontrado');
        return;
    }
    
    try {
        console.log('🔄 Iniciando carga de especies para dropdown...');
        
        // Mostrar loading
        grid.innerHTML = `
            <div class="text-center p-3">
                <div class="spinner-border spinner-border-sm text-success" role="status"></div>
                <small class="d-block mt-2 text-muted">Cargando especies...</small>
            </div>
        `;
        
        // Obtener especies del backend
        console.log('📡 Llamando a obtenerTodasLasEspecies()...');
        const especies = await obtenerTodasLasEspecies();
        console.log('📦 Especies recibidas:', especies);
        
        if (!especies || especies.length === 0) {
            console.warn('⚠️ No hay especies disponibles');
            grid.innerHTML = '<p class="text-center text-muted p-3">No hay especies disponibles</p>';
            return;
        }
        
        // Obtener especies actualmente seleccionadas
        const especiesIdsInput = document.getElementById('editEstabEspeciesIds');
        const especiesSeleccionadas = especiesIdsInput.value 
            ? especiesIdsInput.value.split(',').map(id => parseInt(id.trim()))
            : [];
        
        console.log('✅ Renderizando', especies.length, 'especies. Seleccionadas:', especiesSeleccionadas);
        
        // Renderizar grid de checkboxes
        grid.innerHTML = especies.map(especie => {
            const isChecked = especiesSeleccionadas.includes(especie.idEspecie);
            return `
                <label class="especie-checkbox-card ${isChecked ? 'checked' : ''}" 
                       data-especie-id="${especie.idEspecie}">
                    <input type="checkbox" 
                           value="${especie.idEspecie}" 
                           ${isChecked ? 'checked' : ''}
                           onchange="toggleEspecieSeleccion(${especie.idEspecie}, '${especie.nombreEspecie.replace(/'/g, "\\'")}')">
                    <div class="check-mark">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="especie-icon-wrapper">
                        <i class="fas fa-seedling"></i>
                    </div>
                    <span class="especie-name-text">${especie.nombreEspecie}</span>
                </label>
            `;
        }).join('');
        
        console.log('✅ Especies cargadas en dropdown:', especies.length);
        
    } catch (error) {
        console.error('❌ Error al cargar especies:', error);
        console.error('Error completo:', error.stack);
        grid.innerHTML = `<p class="text-center text-danger p-3">Error al cargar especies<br><small>${error.message}</small></p>`;
    }
}

/**
 * Toggle selección de una especie (checkbox)
 */
function toggleEspecieSeleccion(idEspecie, nombreEspecie) {
    const especiesIdsInput = document.getElementById('editEstabEspeciesIds');
    const card = document.querySelector(`.especie-checkbox-card[data-especie-id="${idEspecie}"]`);
    const checkbox = card.querySelector('input[type="checkbox"]');
    
    // Obtener especies actualmente seleccionadas
    let especiesSeleccionadas = especiesIdsInput.value 
        ? especiesIdsInput.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        : [];
    
    if (checkbox.checked) {
        // Validar límite de 5 especies
        if (especiesSeleccionadas.length >= 5) {
            checkbox.checked = false;
            showMessage('⚠️ Máximo 5 especies permitidas', 'warning');
            return;
        }
        
        // Agregar especie
        if (!especiesSeleccionadas.includes(idEspecie)) {
            especiesSeleccionadas.push(idEspecie);
            card.classList.add('checked');
        }
    } else {
        // Quitar especie
        especiesSeleccionadas = especiesSeleccionadas.filter(id => id !== idEspecie);
        card.classList.remove('checked');
    }
    
    // Actualizar hidden input
    especiesIdsInput.value = especiesSeleccionadas.join(',');
    
    // Actualizar UI
    actualizarDisplayEspecies(especiesSeleccionadas);
    actualizarEstadoLimiteEspecies(especiesSeleccionadas.length);
    
    console.log('🌱 Especies seleccionadas:', especiesSeleccionadas);
}

/**
 * Actualizar display visual de especies seleccionadas
 */
async function actualizarDisplayEspecies(especiesIds) {
    const displayDiv = document.getElementById('editEstabEspeciesDisplay');
    const btnText = document.getElementById('editEstabEspeciesBtnText');
    
    if (especiesIds.length === 0) {
        displayDiv.innerHTML = '<small class="text-info">No hay especies seleccionadas</small>';
        btnText.textContent = 'Seleccionar Especies (0/5)';
        return;
    }
    
    // Obtener todas las especies para encontrar nombres
    const todasLasEspecies = await obtenerTodasLasEspecies();
    const especiesSeleccionadas = todasLasEspecies.filter(e => especiesIds.includes(e.idEspecie));
    
    // Crear badges
    displayDiv.innerHTML = especiesSeleccionadas.map(especie => `
        <span class="badge bg-success me-2 mb-2">
            <i class="fas fa-seedling me-1"></i>${especie.nombreEspecie}
            <i class="fas fa-times ms-1" style="cursor: pointer;" 
               onclick="quitarEspecieSeleccionada(${especie.idEspecie})"></i>
        </span>
    `).join('');
    
    // Actualizar texto del botón
    btnText.textContent = `Seleccionar Especies (${especiesIds.length}/5)`;
}

/**
 * Quitar una especie desde el badge
 */
function quitarEspecieSeleccionada(idEspecie) {
    const checkbox = document.querySelector(`.especie-checkbox-card[data-especie-id="${idEspecie}"] input[type="checkbox"]`);
    if (checkbox) {
        checkbox.checked = false;
        toggleEspecieSeleccion(idEspecie, '');
    }
}

/**
 * Actualizar estado de cards cuando se alcanza el límite
 */
function actualizarEstadoLimiteEspecies(cantidadSeleccionada) {
    const cards = document.querySelectorAll('.especie-checkbox-card');
    
    cards.forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        
        if (cantidadSeleccionada >= 5 && !checkbox.checked) {
            card.classList.add('disabled');
        } else {
            card.classList.remove('disabled');
        }
    });
}

/**
 * Crear oferta laboral con API integrada
 * @param {number} idEstablecimiento - ID del establecimiento
 */
async function crearOfertaLaboral(idEstablecimiento) {
    console.log('🏢 Creando oferta laboral para establecimiento:', idEstablecimiento);
    console.log('═'.repeat(60));
    
    try {
        showMessage('Cargando datos del formulario...', 'info');
        
        // Validar que tenemos el ID del establecimiento
        if (!idEstablecimiento) {
            console.error('❌ No se proporcionó ID de establecimiento');
            showMessage('Error: No se pudo identificar el establecimiento', 'error');
            return;
        }
        
        console.log('📥 Cargando puestos de trabajo y especies...');
        
        // Cargar datos necesarios - ahora las especies son del establecimiento específico
        const [puestos, especies] = await Promise.all([
            cargarPuestosTrabajo(),
            cargarEspeciesParaOfertas(idEstablecimiento)
        ]);
        
        console.log('📊 Resultados de carga:');
        console.log(`  - Puestos de trabajo: ${puestos ? puestos.length : 0}`);
        console.log(`  - Especies del establecimiento: ${especies ? especies.length : 0}`);
        
        // Validar que al menos tenemos puestos de trabajo
        if (!puestos || puestos.length === 0) {
            console.error('❌ No se pudieron cargar los puestos de trabajo');
            showMessage('Error: No hay puestos de trabajo disponibles. Contacte al administrador.', 'error');
            return;
        }
        
        // Guardar especies en variable global para poblarDropdowns
        window.especiesDisponibles = especies || [];
        console.log('💾 Especies guardadas en window.especiesDisponibles');
        
        console.log('✅ Datos cargados correctamente, mostrando modal...');
        
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
                                    <input type="text" 
                                           class="form-control form-control-lg bg-dark text-light border-secondary" 
                                           id="fechaCierre" 
                                           placeholder="dd/mm/aaaa"
                                           pattern="\d{2}/\d{2}/\d{4}"
                                           required>
                                    <small class="text-muted">Formato: día/mes/año (ej: 15/12/2025)</small>
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
        
        // Configurar input de fecha con formato dd/mm/aaaa
        const inputFecha = document.getElementById('fechaCierre');
        
        // Agregar máscara de entrada para formato dd/mm/aaaa
        inputFecha.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // Solo números
            
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2);
            }
            if (value.length >= 5) {
                value = value.substring(0, 5) + '/' + value.substring(5, 9);
            }
            
            e.target.value = value;
        });
        
        // Validación en blur
        inputFecha.addEventListener('blur', function(e) {
            const valor = e.target.value;
            const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
            const match = valor.match(regex);
            
            if (match) {
                const dia = parseInt(match[1]);
                const mes = parseInt(match[2]);
                const año = parseInt(match[3]);
                
                // Validar que la fecha sea válida
                const fecha = new Date(año, mes - 1, dia);
                if (fecha.getDate() !== dia || fecha.getMonth() !== mes - 1 || fecha.getFullYear() !== año) {
                    e.target.setCustomValidity('Fecha inválida');
                } else if (fecha <= new Date()) {
                    e.target.setCustomValidity('La fecha debe ser posterior a hoy');
                } else {
                    e.target.setCustomValidity('');
                }
            } else if (valor) {
                e.target.setCustomValidity('Formato incorrecto. Use dd/mm/aaaa');
            }
        });
        
        inputFecha.addEventListener('input', function(e) {
            e.target.setCustomValidity('');
        });
        
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
        
        // Cargar solo puestos - las especies ya están en window.especiesDisponibles
        const puestos = await cargarPuestosTrabajo();
        const especies = window.especiesDisponibles || [];
        
        console.log('📋 Datos de puestos recibidos:', puestos);
        console.log('📋 Datos de especies disponibles:', especies);
        
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
        if (selectEspecies) {
            console.log('🌿 Poblando dropdown de especies...');
            console.log(`📊 Especies disponibles: ${especies ? especies.length : 0}`);
            
            // Limpiar opciones existentes (excepto la primera)
            while (selectEspecies.children.length > 1) {
                selectEspecies.removeChild(selectEspecies.lastChild);
            }
            
            // Habilitar el select por defecto (se deshabilitará si no hay especies)
            selectEspecies.disabled = false;
            
            if (Array.isArray(especies) && especies.length > 0) {
                console.log('✅ Agregando especies al dropdown...');
                especies.forEach((especie, index) => {
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
                    console.log(`  ${index + 1}. Especie agregada: ID=${option.value}, Nombre="${nombreEspecie}"`);
                });
                console.log(`✅ Total: ${especies.length} especies agregadas al dropdown`);
                console.log('📋 Estado del dropdown: Habilitado con especies del establecimiento');
            } else {
                // No hay especies para este establecimiento
                console.warn('⚠️ No hay especies disponibles para este establecimiento');
                
                // Actualizar la primera opción para mostrar mensaje informativo
                const primeraOpcion = selectEspecies.children[0];
                if (primeraOpcion) {
                    primeraOpcion.textContent = "Este establecimiento no tiene especies registradas";
                }
                
                // Deshabilitar el dropdown
                selectEspecies.disabled = true;
                selectEspecies.style.opacity = '0.6';
                selectEspecies.style.cursor = 'not-allowed';
                
                console.log('📋 Estado del dropdown: Deshabilitado (sin especies)');
                showMessage('Este establecimiento no tiene especies registradas. La especie es opcional.', 'info');
            }
        } else {
            console.error('❌ No se encontró el select de especies en el DOM');
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
        
        // Obtener y convertir fecha de formato dd/mm/aaaa a yyyy-mm-dd
        const fechaInput = document.getElementById('fechaCierre').value;
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = fechaInput.match(regex);
        
        if (!match) {
            throw new Error('Formato de fecha inválido. Use dd/mm/aaaa');
        }
        
        const dia = match[1];
        const mes = match[2];
        const año = match[3];
        const fechaISO = `${año}-${mes}-${dia}`; // Convertir a yyyy-mm-dd
        
        // Recopilar datos del formulario según el formato de la API
        const formData = {
            fechaCierre: fechaISO,
            vacantes: parseInt(document.getElementById('vacantes').value),
            idPuestoTrabajo: parseInt(document.getElementById('idPuestoTrabajo').value),
            idEspecie: document.getElementById('idEspecie').value ? parseInt(document.getElementById('idEspecie').value) : null,
            idEstablecimiento: parseInt(idEstablecimiento)
        };
        
        console.log('📋 Fecha ingresada:', fechaInput);
        console.log('📋 Fecha convertida a ISO:', fechaISO);
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
        if (modal) {
            modal.hide();
        }
        
        // Esperar a que el modal se cierre completamente
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Limpiar modal del DOM
        const modalElement = document.getElementById('modalCrearOferta');
        if (modalElement) {
            modalElement.remove();
        }
        
        // Recargar ofertas automáticamente para mostrar la nueva oferta
        console.log('🔄 [ACTUALIZACIÓN AUTOMÁTICA] Iniciando recarga de ofertas...');
        try {
            // Verificar que la función existe
            if (typeof cargarOfertasEmpleo === 'function') {
                console.log('✅ Función cargarOfertasEmpleo encontrada, ejecutando...');
                await cargarOfertasEmpleo(true); // Cargar solo ofertas vigentes
                console.log('✅ [ACTUALIZACIÓN AUTOMÁTICA] Ofertas recargadas exitosamente');
                
                // Scroll suave hacia la sección de ofertas
                const ofertasSection = document.querySelector('#ofertas-content') || 
                                      document.querySelector('.ofertas-container');
                if (ofertasSection) {
                    ofertasSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                
                showMessage('✅ Nueva oferta visible en la lista', 'success');
            } else {
                console.error('❌ Función cargarOfertasEmpleo no encontrada');
            }
        } catch (error) {
            console.error('❌ [ACTUALIZACIÓN AUTOMÁTICA] Error al recargar ofertas:', error);
            showMessage('⚠️ Oferta creada. Recargue la página para verla.', 'warning');
        }
        
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
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content modal-ubicacion-detalle">
                        <div class="modal-header modal-ubicacion-header">
                            <div class="header-ubicacion-info">
                                <div class="header-ubicacion-icon">
                                    <i class="fas fa-building"></i>
                                </div>
                                <div class="header-ubicacion-text">
                                    <h5 class="modal-title">${establecimiento.nombreEstablecimiento.toUpperCase()}</h5>
                                    ${establecimiento.especies && establecimiento.especies.length > 0 ? `
                                        <span class="especies-contador-badge">
                                            <i class="fas fa-seedling me-1"></i>
                                            ${establecimiento.especies.length} ${establecimiento.especies.length === 1 ? 'especie' : 'especies'}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body modal-ubicacion-body">
                            <div class="row g-4">
                                <div class="col-md-6">
                                    <div class="info-section">
                                        <h6 class="section-title">
                                            <i class="fas fa-info-circle me-2"></i>Información General
                                        </h6>
                                        <div class="info-item">
                                            <span class="info-label">ID Establecimiento</span>
                                            <span class="info-value">#${establecimiento.idEstablecimiento}</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">Nombre</span>
                                            <span class="info-value">${establecimiento.nombreEstablecimiento.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="info-section info-section-destacada">
                                        <h6 class="section-title">
                                            <i class="fas fa-map-marked-alt me-2"></i>Ubicación
                                        </h6>
                                        <div class="info-item">
                                            <span class="info-label">
                                                <i class="fas fa-road"></i> Dirección
                                            </span>
                                            <span class="info-value">${establecimiento.calle} ${establecimiento.numeracion}</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">
                                                <i class="fas fa-mailbox"></i> Código Postal
                                            </span>
                                            <span class="info-value">${establecimiento.codigoPostal}</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">
                                                <i class="fas fa-map-pin"></i> Distrito
                                            </span>
                                            <span class="info-value">${establecimiento.nombreDistrito}</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">
                                                <i class="fas fa-globe-americas"></i> Departamento
                                            </span>
                                            <span class="info-value">${establecimiento.nombreDepartamento}</span>
                                        </div>
                                        ${establecimiento.latitud && establecimiento.longitud ? `
                                        <div class="info-item info-item-coordenadas">
                                            <span class="info-label">
                                                <i class="fas fa-crosshairs"></i> Coordenadas GPS
                                            </span>
                                            <span class="info-value coordenadas-badge">
                                                <i class="fas fa-compass me-1"></i>
                                                ${establecimiento.latitud.toFixed(6)}, ${establecimiento.longitud.toFixed(6)}
                                            </span>
                                        </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                            ${establecimiento.especies && establecimiento.especies.length > 0 ? `
                            <div class="row mt-4">
                                <div class="col-12">
                                    <div class="especies-section">
                                        <h6 class="section-title mb-3">
                                            <i class="fas fa-leaf me-2"></i>Especies Cultivadas
                                            <span class="especies-total-badge">${establecimiento.especies.length}</span>
                                        </h6>
                                        <div class="especies-grid">
                                            ${establecimiento.especies.map((especie, index) => `
                                                <div class="especie-card">
                                                    <div class="especie-numero">${index + 1}</div>
                                                    <div class="especie-icono">
                                                        <i class="fas fa-seedling"></i>
                                                    </div>
                                                    <div class="especie-nombre">${especie.nombre || especie}</div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer modal-ubicacion-footer">
                            <button type="button" class="btn-ubicacion-modal btn-cerrar" data-bs-dismiss="modal">
                                <i class="fas fa-times"></i>
                                <span>Cerrar</span>
                            </button>
                            <button type="button" class="btn-ubicacion-modal btn-editar" onclick="editarEstablecimiento(${establecimiento.idEstablecimiento})">
                                <i class="fas fa-edit"></i>
                                <span>Editar</span>
                            </button>
                            <button type="button" class="btn-ubicacion-modal btn-mapa" onclick="verEnMapa(${establecimiento.latitud}, ${establecimiento.longitud})" data-bs-dismiss="modal">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>Ver en Mapa</span>
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
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content danger-modal">
                    <div class="modal-header danger-modal-header">
                        <h5 class="modal-title text-white text-shadow" style="margin-left: 3rem;">
                            Confirmar Eliminación
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body text-white p-4">
                        <div class="text-center mb-4">
                            <i class="fas fa-exclamation-triangle text-warning" style="font-size: 3rem; animation: warningBlink 1.5s infinite;"></i>
                        </div>
                        <p class="lead text-center mb-3">¿Está seguro que desea eliminar este establecimiento?</p>
                        <div class="alert alert-warning glassmorphism border-warning">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-seedling text-warning me-3" style="font-size: 1.5rem;"></i>
                                <div>
                                    <strong class="d-block">${nombreEstablecimiento}</strong>
                                    <small class="text-muted">ID: ${idEstablecimiento}</small>
                                </div>
                            </div>
                        </div>
                        <div class="alert alert-danger glassmorphism border-danger">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-skull-crossbones text-danger me-3"></i>
                                <strong>Esta acción es IRREVERSIBLE</strong>
                            </div>
                            <small class="d-block mt-2">Se eliminarán todos los datos asociados al establecimiento.</small>
                        </div>
                    </div>
                    <div class="modal-footer cards-modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-danger btn-loading-danger" onclick="confirmarEliminacionEstablecimiento(${idEstablecimiento}, '${nombreEstablecimiento.replace(/'/g, "\\'")}')">
                            <i class="fas fa-trash me-2"></i>Confirmar Eliminación
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
    
    // Obtener botón de eliminación
    const btnEliminar = document.querySelector(`[onclick*="confirmarEliminacionEstablecimiento(${idEstablecimiento}"]`);
    
    try {
        // Mostrar estado de carga en el botón
        if (btnEliminar) {
            addButtonLoadingState(btnEliminar, 'Eliminando...');
        }

        // Cerrar modal de confirmación
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmarEliminacionModal'));
        if (modal) {
            modal.hide();
        }

        // Mostrar toast de progreso
        showToast('Eliminando establecimiento...', 'info');

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
        showToast(`Establecimiento "${nombreEstablecimiento}" eliminado exitosamente`, 'success');

        // Recargar lista de establecimientos
        setTimeout(async () => {
            await inicializarEstablecimientos();
        }, 1000);

    } catch (error) {
        console.error('❌ Error eliminando establecimiento:', error);
        showToast('Error al eliminar el establecimiento. Inténtelo nuevamente.', 'error');
    } finally {
        // Remover estado de carga del botón
        if (btnEliminar) {
            removeButtonLoadingState(btnEliminar);
        }
    }
}

// ===========================
// UTILIDADES PARA ESTADOS VISUALES
// ===========================

/**
 * Agregar estado de carga a un botón
 */
function addButtonLoadingState(button, loadingText = 'Procesando...') {
    if (!button) return;
    
    // Guardar estado original
    button.dataset.originalText = button.innerHTML;
    button.dataset.originalDisabled = button.disabled;
    
    // Aplicar estado de carga
    button.disabled = true;
    button.classList.add('btn-loading');
    
    // Cambiar texto si se proporciona
    if (loadingText) {
        button.innerHTML = `<span style="opacity: 0;">${loadingText}</span>`;
    }
}

/**
 * Remover estado de carga de un botón
 */
function removeButtonLoadingState(button) {
    if (!button) return;
    
    // Restaurar estado original
    button.disabled = button.dataset.originalDisabled === 'true';
    button.classList.remove('btn-loading');
    
    if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
    }
    
    // Limpiar datos temporales
    delete button.dataset.originalText;
    delete button.dataset.originalDisabled;
}

/**
 * Mostrar toast de feedback
 */
function showToast(message, type = 'success', duration = 3000) {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    
    const toastId = `toast-${Date.now()}`;
    const toastClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle';
    
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white ${toastClass} border-0" role="alert" data-bs-autohide="true" data-bs-delay="${duration}">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${icon} me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Limpiar después de mostrar
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

/**
 * Crear contenedor de toasts si no existe
 */
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1070';
    document.body.appendChild(container);
    return container;
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
                            ${(finca.nombreEstablecimiento || finca.nombre).toUpperCase()}
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
    const statsNumero = document.querySelector('[data-contador="fincas"]');
    if (statsNumero && statsNumero.textContent === '0') {
        statsNumero.classList.add('counting');
        statsNumero.textContent = '1';
        setTimeout(() => statsNumero.classList.remove('counting'), 500);
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
            
            // Actualizar el mapa de establecimientos si existe
            if (mapEstablecimientos) {
                console.log('🗺️ Actualizando mapa de establecimientos...');
                try {
                    await agregarMarcadoresEstablecimientos(window.establecimientosCache || []);
                    console.log('✅ Mapa de establecimientos actualizado');
                    
                    // Si el establecimiento tiene coordenadas, centrarlo en el mapa
                    if (establecimiento.latitud && establecimiento.longitud) {
                        setTimeout(() => {
                            centrarMapaEnCoordenadas(establecimiento.latitud, establecimiento.longitud);
                        }, 500);
                    }
                } catch (mapError) {
                    console.error('❌ Error actualizando mapa:', mapError);
                }
            } else {
                console.log('ℹ️ Mapa de establecimientos no inicializado aún');
            }
            
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


	// Inicializar mapa principal de establecimientos
	function inicializarMapaPrincipal() {
		console.log('🗺️ === INICIALIZANDO MAPA PRINCIPAL ===');
		
		const mainMapContainer = document.getElementById('main-map');
		if (!mainMapContainer) {
			console.warn('⚠️ Container del mapa principal no encontrado');
			return;
		}

		console.log('🗺️ Inicializando mapa principal de establecimientos...');
		console.log('📦 Container encontrado:', mainMapContainer);

		// Crear instancia del mapa principal
		mapaPrincipal.instancia = L.map('main-map').setView(
			mapaPrincipal.configuracion.centro, 
			mapaPrincipal.configuracion.zoom
		);

		console.log('✅ Instancia del mapa creada');

		// Capa estándar OSM
		mapaPrincipal.capas.clasica = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: mapaPrincipal.configuracion.maxZoom,
			attribution: '© OpenStreetMap contributors'
		});

		// Capa satelital Esri World Imagery (gratuita)
		mapaPrincipal.capas.satelital = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
			maxZoom: mapaPrincipal.configuracion.maxZoom,
			attribution: 'Tiles © Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
		});

		// Control de capas
		var baseMaps = {
			"Mapa estándar": mapaPrincipal.capas.clasica,
			"Vista satelital": mapaPrincipal.capas.satelital
		};
		mapaPrincipal.capas.clasica.addTo(mapaPrincipal.instancia);
		L.control.layers(baseMaps).addTo(mapaPrincipal.instancia);

		console.log('🗺️ Capas agregadas al mapa');

		// Agregar control de geolocalización
		console.log('📍 Agregando control de geolocalización...');
		agregarControlGeolocalizacion();

		// Cargar establecimientos desde el backend
		cargarEstablecimientosEnMapa(mapaPrincipal.instancia);

		console.log('✅ Mapa principal inicializado correctamente');
		
		// Agregar funcionalidad al botón de ubicación visible
		const btnMiUbicacion = document.getElementById('btn-mi-ubicacion');
		if (btnMiUbicacion) {
			btnMiUbicacion.addEventListener('click', function() {
				console.log('🖱️ Clic en botón "Mi Ubicación" visible');
				btnMiUbicacion.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Obteniendo...';
				btnMiUbicacion.disabled = true;
				
				obtenerUbicacionUsuario();
				
				// Restaurar botón después de un tiempo
				setTimeout(() => {
					if (!mapaPrincipal.ubicacionUsuario.activa) {
						btnMiUbicacion.innerHTML = '<i class="fas fa-location-arrow"></i> Mi Ubicación';
						btnMiUbicacion.disabled = false;
					}
				}, 15000);
			});
			
			console.log('✅ Botón "Mi Ubicación" configurado');
		}
		
		return mapaPrincipal.instancia;
	}

	// ===========================
	// SISTEMA DE GEOLOCALIZACIÓN
	// ===========================

	/**
	 * Función para obtener la ubicación actual del usuario
	 */
	function obtenerUbicacionUsuario() {
		console.log('🌍 Solicitando ubicación del usuario...');

		if (!navigator.geolocation) {
			console.error('❌ Geolocalización no soportada por este navegador');
			alert('Tu navegador no soporta geolocalización');
			return;
		}

		// Cambiar estado del botón a "cargando"
		const controlBtn = document.querySelector('.leaflet-control-geolocate');
		if (controlBtn) {
			controlBtn.classList.add('loading');
			controlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
		}

		// Solicitar ubicación con configuración optimizada
		navigator.geolocation.getCurrentPosition(
			function(position) {
				console.log('✅ UBICACIÓN OBTENIDA:', position.coords);
				manejarUbicacionExitosa(position);
			},
			function(error) {
				console.error('❌ ERROR DE GEOLOCALIZACIÓN:', error);
				manejarErrorUbicacion(error);
			},
			{
				enableHighAccuracy: true,
				timeout: 15000,
				maximumAge: 30000
			}
		);
	}

	/**
	 * Maneja la respuesta exitosa de geolocalización
	 */
	function manejarUbicacionExitosa(position) {
		console.log('✅ === UBICACIÓN OBTENIDA EXITOSAMENTE ===');
		console.log('📊 Datos completos:', position);

		const lat = position.coords.latitude;
		const lng = position.coords.longitude;
		const accuracy = position.coords.accuracy;

		console.log('📍 Latitud:', lat);
		console.log('📍 Longitud:', lng);
		console.log('📍 Precisión:', accuracy, 'metros');

		// Guardar coordenadas en el estado global
		mapaPrincipal.ubicacionUsuario.coordenadas = { lat, lng, accuracy };
		mapaPrincipal.ubicacionUsuario.activa = true;

		console.log('💾 Coordenadas guardadas en mapaPrincipal');

		// Mostrar marcador en el mapa
		console.log('🎯 Llamando a mostrarMarcadorUbicacion...');
		mostrarMarcadorUbicacion(lat, lng, accuracy);

		// Cambiar estado del botón a "activo"
		const controlBtn = document.querySelector('.leaflet-control-geolocate');
		if (controlBtn) {
			controlBtn.classList.remove('loading');
			controlBtn.classList.add('active');
			controlBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
			controlBtn.style.backgroundColor = '#dc3545';
			controlBtn.style.color = 'white';
		}

		console.log('✅ === GEOLOCALIZACIÓN COMPLETADA ===');
		
		// Actualizar botón visible
		const btnMiUbicacion = document.getElementById('btn-mi-ubicacion');
		if (btnMiUbicacion) {
			btnMiUbicacion.innerHTML = '<i class="fas fa-check-circle"></i> Ubicación Encontrada';
			btnMiUbicacion.disabled = false;
			btnMiUbicacion.classList.remove('btn-danger');
			btnMiUbicacion.classList.add('btn-success');
		}
		
		// Mostrar información de ubicación
		const ubicacionInfo = document.getElementById('ubicacion-info');
		const ubicacionDetalles = document.getElementById('ubicacion-detalles');
		if (ubicacionInfo && ubicacionDetalles) {
			ubicacionDetalles.innerHTML = `
				<strong>📍 Tu ubicación:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)} 
				<strong>🎯 Precisión:</strong> ±${Math.round(accuracy)} metros
			`;
			ubicacionInfo.classList.remove('d-none');
			ubicacionInfo.classList.remove('alert-info');
			ubicacionInfo.classList.add('alert-success');
		}
		
		// Mostrar notificación al usuario
		console.log('🎉 Mostrando notificación de éxito...');
		if (typeof bootstrap !== 'undefined') {
			// Si Bootstrap está disponible, usar toast
			const toastHtml = `
				<div class="toast-container position-fixed top-0 end-0 p-3">
					<div class="toast show" role="alert">
						<div class="toast-header bg-success text-white">
							<strong class="me-auto">📍 Ubicación encontrada</strong>
						</div>
						<div class="toast-body">
							Tu marcador rojo está visible en el mapa
						</div>
					</div>
				</div>
			`;
		} else {
			// Fallback con alert
			setTimeout(() => {
				alert(`✅ ¡Ubicación encontrada!\n\nTu marcador rojo está visible en el mapa.\nPrecisión: ±${Math.round(accuracy)} metros`);
			}, 1000);
		}
	}

	/**
	 * Maneja errores de geolocalización
	 */
	function manejarErrorUbicacion(error) {
		console.error('❌ Error de geolocalización:', error);

		let mensaje = 'No se pudo obtener tu ubicación';
		
		switch(error.code) {
			case error.PERMISSION_DENIED:
				mensaje = 'Permisos de ubicación denegados. Por favor, permite el acceso a tu ubicación en la configuración del navegador.';
				break;
			case error.POSITION_UNAVAILABLE:
				mensaje = 'Información de ubicación no disponible. Verifica tu conexión GPS/WiFi.';
				break;
			case error.TIMEOUT:
				mensaje = 'Tiempo de espera agotado. Intenta nuevamente.';
				break;
		}

		alert(mensaje);

		// Resetear estado del botón
		const controlBtn = document.querySelector('.leaflet-control-geolocate');
		if (controlBtn) {
			controlBtn.classList.remove('loading', 'active');
		}
	}

	/**
	 * Muestra el marcador de ubicación del usuario en el mapa
	 */
	function mostrarMarcadorUbicacion(lat, lng, accuracy) {
		console.log('📍 === MOSTRANDO MARCADOR DE UBICACIÓN ===');
		console.log('📍 Coordenadas:', lat, lng);
		console.log('📍 Precisión:', accuracy, 'm');
		
		if (!mapaPrincipal.instancia) {
			console.error('❌ No hay instancia del mapa principal');
			alert('Error: El mapa no está inicializado');
			return;
		}

		// Limpiar marcador anterior si existe
		if (mapaPrincipal.ubicacionUsuario.marcador) {
			console.log('🧹 Limpiando marcador anterior');
			mapaPrincipal.instancia.removeLayer(mapaPrincipal.ubicacionUsuario.marcador);
		}
		if (mapaPrincipal.ubicacionUsuario.circuloPrecision) {
			console.log('🧹 Limpiando círculo de precisión anterior');
			mapaPrincipal.instancia.removeLayer(mapaPrincipal.ubicacionUsuario.circuloPrecision);
		}

		// Crear marcador rojo super visible y simple
		console.log('🎨 Creando marcador rojo...');
		
		const marcadorRojo = L.marker([lat, lng], {
			icon: L.icon({
				iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTIiIGZpbGw9IiNEQzM1NDUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMyIvPgo8Y2lyY2xlIGN4PSIxNSIgY3k9IjE1IiByPSI2IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
				iconSize: [30, 30],
				iconAnchor: [15, 15],
				popupAnchor: [0, -15]
			}),
			zIndexOffset: 10000
		});

		// Agregar al mapa
		mapaPrincipal.ubicacionUsuario.marcador = marcadorRojo.addTo(mapaPrincipal.instancia);
		console.log('✅ Marcador agregado al mapa');

		// Popup con información
		mapaPrincipal.ubicacionUsuario.marcador.bindPopup(`
			<div style="text-align: center; min-width: 200px;">
				<h5 style="color: #dc3545; margin: 0;">🎯 Tu Ubicación</h5>
				<hr style="margin: 10px 0;">
				<p style="margin: 5px 0;"><strong>Latitud:</strong> ${lat.toFixed(6)}</p>
				<p style="margin: 5px 0;"><strong>Longitud:</strong> ${lng.toFixed(6)}</p>
				<p style="margin: 5px 0;"><strong>Precisión:</strong> ±${Math.round(accuracy)}m</p>
			</div>
		`).openPopup();

		// Círculo de precisión
		if (accuracy < 2000) {
			mapaPrincipal.ubicacionUsuario.circuloPrecision = L.circle([lat, lng], {
				radius: accuracy,
				color: '#dc3545',
				fillColor: '#dc3545',
				fillOpacity: 0.15,
				weight: 2,
				interactive: false
			}).addTo(mapaPrincipal.instancia);
			console.log('🎯 Círculo de precisión agregado:', Math.round(accuracy), 'm');
		}

		// Centrar mapa en la ubicación
		mapaPrincipal.instancia.flyTo([lat, lng], 16, {
			animate: true,
			duration: 2
		});

		console.log('✅ === MARCADOR ROJO MOSTRADO EXITOSAMENTE ===');
	}

	/**
	 * Activa el seguimiento de ubicación en tiempo real
	 */
	function activarSeguimientoUbicacion() {
		if (!navigator.geolocation) return;

		mapaPrincipal.ubicacionUsuario.watchId = navigator.geolocation.watchPosition(
			(position) => {
				const lat = position.coords.latitude;
				const lng = position.coords.longitude;
				const accuracy = position.coords.accuracy;

				// Actualizar coordenadas
				mapaPrincipal.ubicacionUsuario.coordenadas = { lat, lng, accuracy };
				
				// Actualizar marcador
				if (mapaPrincipal.ubicacionUsuario.marcador) {
					mapaPrincipal.ubicacionUsuario.marcador.setLatLng([lat, lng]);
				}

				// Actualizar círculo de precisión
				if (mapaPrincipal.ubicacionUsuario.circuloPrecision) {
					mapaPrincipal.ubicacionUsuario.circuloPrecision.setLatLng([lat, lng]);
					mapaPrincipal.ubicacionUsuario.circuloPrecision.setRadius(accuracy);
				}

				console.log('🔄 Ubicación actualizada:', lat, lng);
			},
			(error) => console.warn('⚠️ Error en seguimiento:', error),
			{
				enableHighAccuracy: true,
				timeout: 5000,
				maximumAge: 30000
			}
		);
	}

	/**
	 * Desactiva el seguimiento de ubicación
	 */
	function desactivarSeguimientoUbicacion() {
		if (mapaPrincipal.ubicacionUsuario.watchId) {
			navigator.geolocation.clearWatch(mapaPrincipal.ubicacionUsuario.watchId);
			mapaPrincipal.ubicacionUsuario.watchId = null;
		}
	}

	/**
	 * Centra el mapa en la ubicación actual del usuario
	 */
	function centrarEnMiUbicacion() {
		if (mapaPrincipal.ubicacionUsuario.coordenadas && mapaPrincipal.instancia) {
			const { lat, lng } = mapaPrincipal.ubicacionUsuario.coordenadas;
			mapaPrincipal.instancia.flyTo([lat, lng], 16, {
				animate: true,
				duration: 1.5
			});

			// Abrir popup del marcador
			if (mapaPrincipal.ubicacionUsuario.marcador) {
				mapaPrincipal.ubicacionUsuario.marcador.openPopup();
			}
		} else {
			obtenerUbicacionUsuario();
		}
	}

	/**
	 * Agrega el control de geolocalización al mapa
	 */
	function agregarControlGeolocalizacion() {
		console.log('📍 === AGREGANDO CONTROL DE GEOLOCALIZACIÓN ===');
		
		if (!mapaPrincipal.instancia) {
			console.error('❌ No hay instancia del mapa para agregar control');
			return;
		}

		console.log('🎮 Creando control personalizado...');

		// Crear control personalizado
		const ControlGeolocalizacion = L.Control.extend({
			options: {
				position: 'topleft'
			},

			onAdd: function (map) {
				console.log('🔧 Construyendo elemento DOM del control...');
				
				const container = L.DomUtil.create('div', 'leaflet-control-geolocate leaflet-bar leaflet-control');
				
				container.innerHTML = '<i class="fas fa-location-arrow"></i>';
				container.title = 'Mi ubicación';
				
				console.log('✅ Elemento DOM creado:', container);
				
				// Prevenir propagación de eventos de clic al mapa
				L.DomEvent.disableClickPropagation(container);
				
				// Agregar evento de clic
				L.DomEvent.on(container, 'click', function(e) {
					console.log('🖱️ Clic en botón de geolocalización');
					L.DomEvent.stopPropagation(e);
					
					if (mapaPrincipal.ubicacionUsuario.activa) {
						console.log('🎯 Usuario ya localizado, centrando en ubicación...');
						// Si ya está activo, centrar en ubicación
						centrarEnMiUbicacion();
					} else {
						console.log('📍 Obteniendo nueva ubicación...');
						// Si no está activo, obtener ubicación
						obtenerUbicacionUsuario();
					}
				});

				return container;
			}
		});

		// Agregar control al mapa
		console.log('➕ Agregando control al mapa...');
		new ControlGeolocalizacion().addTo(mapaPrincipal.instancia);
		console.log('✅ Control de geolocalización agregado exitosamente');
	}

	// Función para cargar establecimientos desde las ofertas públicas
	async function cargarEstablecimientosEnMapa(mapa) {
		try {
			console.log('📍 Cargando establecimientos desde ofertas públicas...');
			
			// Cargar ofertas públicas si no están ya cargadas
			if (!estadoOfertasPublicas.ofertas || estadoOfertasPublicas.ofertas.length === 0) {
				await cargarOfertasPublicas();
			}

			if (estadoOfertasPublicas.ofertas && estadoOfertasPublicas.ofertas.length > 0) {
				console.log(`✅ Procesando ${estadoOfertasPublicas.ofertas.length} ofertas para extraer establecimientos`);
				
				// Crear un mapa de establecimientos únicos usando el nombre como clave
				const establecimientosUnicos = new Map();
				
				estadoOfertasPublicas.ofertas.forEach(function(oferta) {
					console.log('🔍 Procesando oferta:', oferta); // Debug log
					
					// Verificar que la oferta tenga coordenadas válidas y nombre de establecimiento
					if (oferta.latitud && oferta.longitud && oferta.nombreEstablecimiento) {
						const lat = parseFloat(oferta.latitud);
						const lng = parseFloat(oferta.longitud);
						const nombreEstablecimiento = oferta.nombreEstablecimiento.trim().toLowerCase();
						
						if (!isNaN(lat) && !isNaN(lng)) {
							// Si el establecimiento no existe o esta oferta tiene más información, actualizar
							if (!establecimientosUnicos.has(nombreEstablecimiento)) {
								establecimientosUnicos.set(nombreEstablecimiento, {
									nombre: oferta.nombreEstablecimiento,
									latitud: lat,
									longitud: lng,
									especie_principal: oferta.nombreEspecie || 'No especificado',
									ofertas: []
								});
							}
							
							// Agregar esta oferta a la lista de ofertas del establecimiento
							establecimientosUnicos.get(nombreEstablecimiento).ofertas.push({
								id: oferta.idOfertaEmpleo,
								puesto: oferta.nombrePuestoTrabajo,
								especie: oferta.nombreEspecie,
								vacantes: oferta.vacantes,
								fecha_cierre: oferta.fechaCierre
							});
						} else {
							console.warn(`⚠️ Coordenadas inválidas para oferta ${oferta.idOfertaEmpleo}: lat=${oferta.latitud}, lng=${oferta.longitud}`);
						}
					} else {
						console.warn(`⚠️ Oferta sin datos de establecimiento: ${oferta.idOfertaEmpleo}`);
					}
				});
				
				console.log(`✅ Se encontraron ${establecimientosUnicos.size} establecimientos únicos`);
				
				// Agregar marcadores para cada establecimiento único
				establecimientosUnicos.forEach(function(establecimiento, key) {
					// Crear contenido del popup con información del establecimiento y sus ofertas
					const ofertasHtml = establecimiento.ofertas.map(oferta => {
						// Formatear fecha de cierre
						let fechaCierreFormateada = 'No especificada';
						if (oferta.fecha_cierre) {
							try {
								const fecha = new Date(oferta.fecha_cierre);
								fechaCierreFormateada = fecha.toLocaleDateString('es-ES', {
									year: 'numeric',
									month: 'short',
									day: 'numeric'
								});
							} catch (e) {
								fechaCierreFormateada = oferta.fecha_cierre;
							}
						}
						
						return `<div class="mb-2 p-2 bg-light rounded">
							<strong>${oferta.puesto}</strong><br>
							<small><i class="fas fa-seedling"></i> ${oferta.especie || 'No especificado'}</small><br>
							<small><i class="fas fa-users"></i> ${oferta.vacantes} vacante(s)</small><br>
							<small><i class="fas fa-calendar"></i> Cierre: ${fechaCierreFormateada}</small>
						</div>`;
					}).join('');
					
					const popupContent = `
						<div class="establecimiento-popup">
							<h6><strong>${establecimiento.nombre.toUpperCase()}</strong></h6>
							<p><strong>Especie principal:</strong> ${establecimiento.especie_principal}</p>
							<p><strong>Ofertas laborales activas:</strong></p>
							<div class="ofertas-container">
								${ofertasHtml}
							</div>
							<small class="text-muted">Total: ${establecimiento.ofertas.length} oferta(s) disponible(s)</small>
						</div>
					`;
					
					// Crear marcador con popup
					const marcador = L.marker([establecimiento.latitud, establecimiento.longitud])
						.addTo(mapa)
						.bindPopup(popupContent, {
							maxWidth: 350,
							className: 'establecimiento-popup-container'
						});
					
					// Almacenar información del establecimiento en el marcador
					marcador._establecimientoData = establecimiento;
					
					// Si es el mapa principal, almacenar en la variable global
					if (mapa === mapaPrincipal.instancia) {
						mapaPrincipal.marcadores.push({
							marcador: marcador,
							establecimiento: establecimiento
						});
					}
				});
				
				console.log('✅ Marcadores de establecimientos agregados al mapa');
				
				// Ajustar la vista del mapa para mostrar todos los marcadores
				if (establecimientosUnicos.size > 0) {
					const coordenadas = Array.from(establecimientosUnicos.values()).map(est => [est.latitud, est.longitud]);
					const group = new L.featureGroup(coordenadas.map(coord => L.marker(coord)));
					mapa.fitBounds(group.getBounds().pad(0.1));
				}
				
			} else {
				console.warn('⚠️ No se encontraron ofertas públicas');
				// Mostrar mensaje en el mapa
				mostrarMensajeEnMapa(mapa, 'No hay establecimientos con ofertas laborales activas');
			}
		} catch (error) {
			console.error('❌ Error al cargar establecimientos:', error);
			// Mostrar mensaje de error en el mapa
			mostrarMensajeEnMapa(mapa, 'Error al cargar establecimientos');
		}
	}

	// Función para mostrar mensaje informativo en el mapa
	function mostrarMensajeEnMapa(mapa, mensaje) {
		const center = mapa.getCenter();
		L.popup()
			.setLatLng(center)
			.setContent(`<div class="alert alert-info">${mensaje}</div>`)
			.openOn(mapa);
	}

	// Llamar a la función cuando el DOM esté listo
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', inicializarMapaPrincipal);
	} else {
		// DOM ya está listo
		setTimeout(inicializarMapaPrincipal, 100);
	}

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
			return { exito: false, mensaje: 'CUIT o contraseña incorrectos' };
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
        // Solo log de debug, no warning (puede ser contexto público)
        console.log('� Token no encontrado en localStorage (contexto público)');
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
		const modalInstance = bootstrap.Modal.getInstance(dashboardOffcanvas);
		if (modalInstance) {
			console.log('🔄 Cerrando panel del dashboard...');
			modalInstance.hide();
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
		
		// Ocultar el botón de login (el <li> completo)
		if (btnLogin && btnLogin.parentElement) {
			btnLogin.parentElement.style.display = 'none';
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
		// Mostrar el botón de login (el <li> completo)
		if (btnLogin && btnLogin.parentElement) {
			btnLogin.parentElement.style.display = 'block';
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
    // Usar puerto 5501 para el proxy/servidor combinado
    const PROXY_PORT = 5501;
    
    try {
        // Verificar directamente el endpoint de API (más confiable que HEAD)
        const apiResponse = await fetch(`http://localhost:${PROXY_PORT}/api/geocoding?q=test`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        
        // El servidor responde con 400 si falta el parámetro, pero está funcionando
        if (apiResponse.ok || apiResponse.status === 400) {
            console.log(`✅ Servidor proxy encontrado en puerto ${PROXY_PORT}`);
            console.log(`✅ API de geocodificación disponible`);
            return `http://localhost:${PROXY_PORT}`;
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
				3. Acceda a: <code>http://localhost:5501</code>
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
    
    // Extraer nombres de especies de forma robusta
    let especies = 'No especificadas';
    if (establecimiento.especies && establecimiento.especies.length > 0) {
        // Verificar si son objetos o strings
        if (typeof establecimiento.especies[0] === 'object' && establecimiento.especies[0] !== null) {
            // Son objetos: extraer el nombre de cada especie
            especies = establecimiento.especies
                .map(esp => esp.nombreEspecie || esp.nombre || 'Especie desconocida')
                .filter(nombre => nombre && nombre !== 'Especie desconocida')
                .join(', ');
            
            // Si después del filtrado no quedó nada, mostrar mensaje
            if (!especies || especies.trim() === '') {
                especies = 'No especificadas';
            }
        } else if (typeof establecimiento.especies[0] === 'string') {
            // Ya son strings: unirlos directamente
            especies = establecimiento.especies.join(', ');
        }
    }

    return `
        <div class="popup-establecimiento" style="font-family: Arial, sans-serif; font-size: 14px; max-width: 300px;">
            <h6 style="margin: 0 0 8px 0; font-weight: bold; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 4px;">
                <i class="fas fa-map-marker-alt" style="color: #e74c3c; margin-right: 5px;"></i>
                ${establecimiento.nombreEstablecimiento.toUpperCase()}
            </h6>
            
            <div style="margin-bottom: 8px;">
                <strong style="color: #34495e;">📍 Dirección:</strong><br>
                <span style="color: #7f8c8d;">${direccion}</span><br>
                <span style="color: #7f8c8d;">${establecimiento.nombreDistrito}, ${establecimiento.nombreDepartamento}</span><br>
                <small style="color: #95a5a6;">CP: ${establecimiento.codigoPostal}</small>
            </div>

            <div style="margin-bottom: 8px;">
                <strong style="color: #34495e;">🌱 Especies:</strong><br>
                <span style="color: #27ae60; font-style: ${especies !== 'No especificadas' ? 'normal' : 'italic'};">
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
let filtroActualOfertas = null; // null = todas, true = vigentes

// ===========================
// ESTADO DE ORDENAMIENTO Y GEOLOCALIZACIÓN
// ===========================

/**
 * Estado global del ordenamiento de ofertas
 * @type {Object}
 */
window.estadoOrdenamiento = {
    tipo: 'fecha',           // null | 'fecha' | 'cercania' - Por defecto ordenar por fecha
    direccion: 'desc',       // 'asc' | 'desc' - Descendente para mostrar más recientes primero
    ubicacionUsuario: null   // {lat, lng} | null
};

/**
 * Cache de distancias calculadas para optimizar performance
 * @type {Map<number, number>}
 */
let cacheDistancias = new Map();

/**
 * Detectar si estamos en modo desarrollo
 * @returns {boolean}
 */
function esDesarrollo() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

// ===========================
// FUNCIONES DE GEOLOCALIZACIÓN
// ===========================

/**
 * Obtiene la ubicación del usuario usando Geolocation API
 * @returns {Promise<{lat: number, lng: number}>}
 * @throws {Error} Si falla la geolocalización
 */
function obtenerUbicacionUsuario() {
    return new Promise((resolve, reject) => {
        // Verificar soporte de geolocalización
        if (!navigator.geolocation) {
            const error = new Error('GEOLOCATION_NOT_SUPPORTED');
            error.code = 0;
            reject(error);
            return;
        }

        // Verificar si es HTTPS (excepto localhost)
        if (window.location.protocol !== 'https:' && !esDesarrollo()) {
            const error = new Error('HTTPS_REQUIRED');
            error.code = 0;
            reject(error);
            return;
        }

        if (esDesarrollo()) {
            console.log('📍 Solicitando ubicación del usuario...');
        }

        const opciones = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutos de cache
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const ubicacion = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                if (esDesarrollo()) {
                    console.log('✅ Ubicación obtenida:', ubicacion);
                }
                
                resolve(ubicacion);
            },
            (error) => {
                if (esDesarrollo()) {
                    console.error('❌ Error obteniendo ubicación:', error);
                }
                reject(error);
            },
            opciones
        );
    });
}

/**
 * Maneja errores de geolocalización con mensajes claros
 * @param {GeolocationPositionError|Error} error
 * @returns {Object} Información del error formateada
 */
function manejarErrorGeolocalizacion(error) {
    const errores = {
        1: { // PERMISSION_DENIED
            titulo: 'Permiso de ubicación denegado',
            mensaje: 'Para ordenar por cercanía, necesitamos acceso a tu ubicación.',
            accion: 'Por favor, permite el acceso a la ubicación en tu navegador y vuelve a intentar.',
            icono: 'fa-location-slash'
        },
        2: { // POSITION_UNAVAILABLE
            titulo: 'Ubicación no disponible',
            mensaje: 'No pudimos determinar tu ubicación en este momento.',
            accion: 'Verifica tu conexión a internet y que el GPS esté activado, luego reintenta.',
            icono: 'fa-wifi-slash'
        },
        3: { // TIMEOUT
            titulo: 'Tiempo de espera agotado',
            mensaje: 'La solicitud de ubicación tardó demasiado tiempo.',
            accion: 'Por favor, intenta nuevamente.',
            icono: 'fa-clock'
        },
        'GEOLOCATION_NOT_SUPPORTED': {
            titulo: 'Geolocalización no soportada',
            mensaje: 'Tu navegador no soporta geolocalización.',
            accion: 'Actualiza tu navegador o usa uno más moderno.',
            icono: 'fa-browser'
        },
        'HTTPS_REQUIRED': {
            titulo: 'Conexión segura requerida',
            mensaje: 'La geolocalización requiere una conexión HTTPS.',
            accion: 'Accede al sitio usando https://',
            icono: 'fa-lock'
        }
    };

    const codigo = error.code !== undefined ? error.code : error.message;
    return errores[codigo] || {
        titulo: 'Error de ubicación',
        mensaje: 'Ocurrió un error al obtener tu ubicación.',
        accion: 'Por favor, intenta nuevamente.',
        icono: 'fa-exclamation-triangle'
    };
}

// ===========================
// FUNCIONES DE CÁLCULO DE DISTANCIAS
// ===========================

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula Haversine
 * @param {number} lat1 - Latitud del punto 1 en grados decimales (-90 a 90)
 * @param {number} lon1 - Longitud del punto 1 en grados decimales (-180 a 180)
 * @param {number} lat2 - Latitud del punto 2 en grados decimales (-90 a 90)
 * @param {number} lon2 - Longitud del punto 2 en grados decimales (-180 a 180)
 * @returns {number|null} Distancia en kilómetros o null si parámetros inválidos
 * @example
 * // Distancia entre Buenos Aires y Mendoza
 * const distancia = calcularDistanciaHaversine(-34.6037, -58.3816, -32.8908, -68.8272);
 * console.log(distancia); // ~1037.5 km
 */
function calcularDistanciaHaversine(lat1, lon1, lat2, lon2) {
    // Validar parámetros
    if (typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
        typeof lat2 !== 'number' || typeof lon2 !== 'number') {
        console.warn('⚠️ calcularDistanciaHaversine: Parámetros inválidos');
        return null;
    }

    // Validar rangos
    if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 ||
        lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
        console.warn('⚠️ calcularDistanciaHaversine: Coordenadas fuera de rango');
        return null;
    }

    // Radio de la Tierra en kilómetros
    const R = 6371;

    // Convertir grados a radianes
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    // Fórmula Haversine
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;

    return distancia;
}

/**
 * Formatea una distancia en kilómetros a formato legible
 * @param {number} km - Distancia en kilómetros
 * @returns {string} Distancia formateada (ej: "2.5 km" o "450 m")
 * @example
 * formatearDistancia(0.450); // "450 m"
 * formatearDistancia(2.567); // "2.6 km"
 */
function formatearDistancia(km) {
    if (km === null || km === undefined || isNaN(km)) {
        return 'N/A';
    }

    if (km < 1) {
        // Mostrar en metros
        const metros = Math.round(km * 1000);
        return `${metros} m`;
    } else {
        // Mostrar en kilómetros con 1 decimal
        return `${km.toFixed(1)} km`;
    }
}

/**
 * Enriquece las ofertas con coordenadas desde establecimientos
 * @param {Array} ofertas - Array de ofertas a enriquecer
 * @returns {Array} Ofertas enriquecidas con latitud y longitud
 */
function enriquecerOfertasConCoordenadas(ofertas) {
    if (!Array.isArray(ofertas)) {
        console.warn('⚠️ enriquecerOfertasConCoordenadas: ofertas no es un array');
        return [];
    }

    if (!window.establecimientosCache || !Array.isArray(window.establecimientosCache)) {
        console.warn('⚠️ enriquecerOfertasConCoordenadas: No hay cache de establecimientos');
        return ofertas;
    }

    const ofertasEnriquecidas = ofertas.map(oferta => {
        // Si ya tiene coordenadas, retornar sin modificar
        if (oferta.latitud && oferta.longitud) {
            return oferta;
        }

        // Buscar establecimiento en cache
        const establecimiento = window.establecimientosCache.find(
            est => est.idEstablecimiento === oferta.idEstablecimiento
        );

        if (establecimiento && establecimiento.latitud && establecimiento.longitud) {
            // Validar que las coordenadas sean números válidos
            const lat = parseFloat(establecimiento.latitud);
            const lng = parseFloat(establecimiento.longitud);

            if (!isNaN(lat) && !isNaN(lng) && 
                lat >= -90 && lat <= 90 && 
                lng >= -180 && lng <= 180) {
                
                return {
                    ...oferta,
                    latitud: lat,
                    longitud: lng
                };
            }
        }

        return oferta;
    });

    const conCoordenadas = ofertasEnriquecidas.filter(o => o.latitud && o.longitud).length;
    
    if (esDesarrollo()) {
        console.log(`📍 Ofertas enriquecidas: ${conCoordenadas}/${ofertas.length} con coordenadas`);
    }

    return ofertasEnriquecidas;
}

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

        // Construir URL base
        let endpoint = buildURL(OFERTAS_CONFIG.ENDPOINT);

        // Agregar parámetro vigente si no es null (null = todas las ofertas)
        if (vigente !== null) {
            endpoint += `?vigente=${vigente}`;
        }

        const tipoFiltro = vigente === null ? 'TODAS' : vigente === true ? 'VIGENTES' : 'CERRADAS';
        console.log(`🔄 Cargando ofertas: ${tipoFiltro}`);
        console.log(`   Endpoint completo: ${endpoint}`);
        console.log(`   Parámetro vigente: ${vigente}`);

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

        console.log(`✅ ${ofertas.length} ofertas ${tipoFiltro} cargadas desde backend`);

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
    
    // El backend ya retorna las ofertas filtradas correctamente según el parámetro vigente
    // No es necesario filtrar nuevamente en el frontend
    const ofertasFiltradas = ofertas;
    console.log(`📋 Mostrando ${ofertas.length} ofertas recibidas del backend`);
    
    if (!ofertasFiltradas || ofertasFiltradas.length === 0) {
        const tipoFiltro = obtenerDescripcionFiltroActual();
        
        // Actualizar badge del header
        actualizarBadgeOfertas(0, 0);
        
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
    
    // Actualizar badge del header
    actualizarBadgeOfertas(ofertasFiltradas.length, ofertasFiltradas.length);
    
    let html = `
        <div class="row" id="ofertas-grid">
    `;

    // Generar cards de todas las ofertas recibidas
    ofertasFiltradas.forEach(oferta => {
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
            <div class="col-12 mb-3" data-vigente="${oferta.vigente}">
                <div class="oferta-card-moderna ${esVigente ? 'vigente' : 'cerrada'}">
                    <!-- Estado e Información Secundaria -->
                    <div class="oferta-section-badges">
                        <div class="oferta-estado-badge ${esVigente ? 'vigente' : 'cerrada'}">
                            <i class="${estadoBadge.icon}"></i>
                            <span>${estadoBadge.label}</span>
                        </div>
                        ${oferta.nombreEspecie ? `
                            <div class="oferta-especie-tag">
                                <i class="fas fa-seedling"></i>
                                <span>${escapeHtml(oferta.nombreEspecie)}</span>
                            </div>
                        ` : ''}
                        ${oferta.distancia !== undefined && oferta.distancia !== null ? `
                            <div class="oferta-distancia-badge">
                                <i class="fas fa-location-arrow"></i>
                                <span>${formatearDistancia(oferta.distancia)}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Información Principal del Puesto -->
                    <div class="oferta-section-main">
                        <h5 class="oferta-titulo" title="${escapeHtml(oferta.nombrePuesto)}">
                            <i class="fas fa-briefcase me-2"></i>${escapeHtml(oferta.nombrePuesto)}
                        </h5>
                        <div class="oferta-establecimiento">
                            <i class="fas fa-building me-1"></i>
                            <span>${escapeHtml(oferta.nombreEstablecimiento).toUpperCase()}</span>
                        </div>
                    </div>
                    
                    <!-- Detalles de la Oferta -->
                    <div class="oferta-section-info">
                        <div class="oferta-info-item-horizontal">
                            <i class="fas fa-users text-primary"></i>
                            <div class="info-content-horizontal">
                                <span class="info-label-horizontal">Vacantes</span>
                                <span class="info-value-horizontal">${oferta.vacantes}</span>
                            </div>
                        </div>
                        <div class="oferta-info-item-horizontal">
                            <i class="fas fa-calendar-times text-danger"></i>
                            <div class="info-content-horizontal">
                                <span class="info-label-horizontal">Fecha Cierre</span>
                                <span class="info-value-horizontal">${fechaCierre}</span>
                            </div>
                        </div>
                        <div class="oferta-info-item-horizontal">
                            <i class="fas fa-calendar-plus text-success"></i>
                            <div class="info-content-horizontal">
                                <span class="info-label-horizontal">Publicada</span>
                                <span class="info-value-horizontal">${fechaAlta}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Sección Acciones (Derecha) -->
                    <div class="oferta-section-actions">
                        <button class="btn-oferta btn-oferta-postulaciones" 
                                onclick="abrirModalPostulaciones(${oferta.idOfertaEmpleo})" 
                                title="Ver postulaciones recibidas"
                                data-oferta-id="${oferta.idOfertaEmpleo}">
                            <span>Postulaciones</span>
                            <span class="badge badge-postulaciones" 
                                  id="badge-oferta-${oferta.idOfertaEmpleo}"
                                  style="display: none;">
                                0
                            </span>
                        </button>
                        <button class="btn-oferta btn-oferta-editar" onclick="editarOferta(${oferta.idOfertaEmpleo})" title="Editar oferta">
                            <span>Editar</span>
                        </button>
                        <button class="btn-oferta btn-oferta-eliminar" onclick="eliminarOferta(${oferta.idOfertaEmpleo})" title="Eliminar oferta">
                            <span>Eliminar</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    contentDiv.innerHTML = html;
    
    // Cargar contadores de postulaciones después de renderizar las ofertas
    setTimeout(() => {
        cargarContadoresPostulaciones();
    }, 500);
}

/**
 * Dar de baja una oferta de empleo
 * @param {number} idOferta - ID de la oferta
 */
async function eliminarOferta(idOferta) {
    console.log('🚫 Dando de baja oferta:', idOferta);
    
    // Confirmar la acción
    const confirmar = confirm('¿Está seguro que desea dar de baja esta oferta de empleo?\n\nLa oferta quedará inactiva y no será visible para los postulantes.');
    
    if (!confirmar) {
        console.log('❌ Operación cancelada por el usuario');
        return;
    }
    
    try {
        showMessage('Procesando baja de la oferta...', 'info');
        
        // Construir la URL del endpoint
        const url = `http://localhost:8080/privado/ofertas-empleo/${idOferta}/baja`;
        console.log('🔗 URL:', url);
        
        // Realizar la petición PUT usando fetchWithAuth
        const response = await fetchWithAuth(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📥 Respuesta del servidor:', response.status);
        
        // Manejar respuestas de error
        if (!response.ok) {
            if (response.status === 401) {
                showMessage('Sesión expirada. Redirigiendo al login...', 'error');
                setTimeout(() => {
                    cerrarSesion();
                }, 2000);
                return;
            }
            
            if (response.status === 403) {
                showMessage('No tiene permisos para dar de baja esta oferta', 'error');
                return;
            }
            
            if (response.status === 404) {
                showMessage('Oferta no encontrada', 'error');
                return;
            }
            
            if (response.status === 400) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Error 400 del servidor:', errorData);
                const mensajeError = errorData.message || 'No se pudo procesar la solicitud';
                showMessage(mensajeError, 'error');
                return;
            }
            
            if (response.status >= 500) {
                const errorData = await response.json().catch(() => null);
                console.error('❌ Error 500 del servidor:', errorData);
                showMessage('Error del servidor. Intente nuevamente más tarde.', 'error');
                return;
            }
            
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Error del servidor:', errorData);
            showMessage(errorData.message || `Error ${response.status}`, 'error');
            return;
        }
        
        // El endpoint retorna 204 No Content, no hay body que parsear
        console.log('✅ Oferta dada de baja exitosamente');
        
        // Mostrar mensaje de éxito
        showMessage('Oferta dada de baja correctamente', 'success');
        
        // Recargar las ofertas del dashboard y ofertas públicas
        setTimeout(async () => {
            // Recargar ofertas del dashboard (solo vigentes - sin las dadas de baja)
            await cargarOfertasEmpleo(true);
            
            // Recargar ofertas públicas (todas, incluyendo las dadas de baja con estilo diferente)
            await cargarOfertasPublicas();
            
            console.log('✅ Ofertas actualizadas correctamente');
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error al dar de baja oferta:', error);
        showMessage(error.message || 'Error al dar de baja la oferta', 'error');
    }
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
// FUNCIONES DE ORDENAMIENTO DE OFERTAS
// ===========================

/**
 * Aplica ordenamiento a las ofertas
 * @param {string} tipo - 'fecha' | 'cercania' | null
 */
async function aplicarOrdenamiento(tipo) {
    if (esDesarrollo()) {
        console.group(`🔄 APLICAR ORDENAMIENTO: ${tipo || 'ninguno'}`);
    }

    try {
        // Si es cercanía, necesitamos ubicación
        if (tipo === 'cercania') {
            if (!window.estadoOrdenamiento.ubicacionUsuario) {
                // Solicitar ubicación
                showMessage('Obteniendo tu ubicación...', 'info');
                
                try {
                    const ubicacion = await obtenerUbicacionUsuario();
                    window.estadoOrdenamiento.ubicacionUsuario = ubicacion;
                    
                    // Habilitar botón de cercanía
                    const btnCercania = document.getElementById('btn-ordenar-cercania');
                    if (btnCercania) {
                        btnCercania.disabled = false;
                        btnCercania.classList.add('ubicacion-obtenida');
                    }
                    
                    showMessage('✅ Ubicación obtenida correctamente', 'success');
                } catch (error) {
                    const errorInfo = manejarErrorGeolocalizacion(error);
                    showMessage(`${errorInfo.titulo}: ${errorInfo.accion}`, 'error');
                    
                    if (esDesarrollo()) {
                        console.error('❌ Error obteniendo ubicación:', error);
                        console.groupEnd();
                    }
                    return;
                }
            }
        }

        // Actualizar estado
        const estadoAnterior = window.estadoOrdenamiento.tipo;
        
        // Si es el mismo tipo, alternar dirección
        if (estadoAnterior === tipo && tipo === 'fecha') {
            window.estadoOrdenamiento.direccion = 
                window.estadoOrdenamiento.direccion === 'desc' ? 'asc' : 'desc';
        } else {
            window.estadoOrdenamiento.tipo = tipo;
            window.estadoOrdenamiento.direccion = tipo === 'fecha' ? 'desc' : 'asc';
        }

        // Aplicar ordenamiento
        await aplicarFiltrosYOrdenamiento();

        // Actualizar UI de botones
        actualizarBotonesOrdenamiento();

        // Mostrar mensaje de confirmación
        if (tipo === 'fecha') {
            const dir = window.estadoOrdenamiento.direccion === 'desc' ? 'recientes' : 'antiguas';
            showMessage(`Ordenado por fecha: más ${dir} primero`, 'info');
        } else if (tipo === 'cercania') {
            showMessage('Ordenado por cercanía: más cercanas primero', 'info');
        } else {
            showMessage('Orden original restaurado', 'info');
        }

    } catch (error) {
        console.error('❌ Error aplicando ordenamiento:', error);
        showMessage('Error al ordenar ofertas', 'error');
    } finally {
        if (esDesarrollo()) {
            console.groupEnd();
        }
    }
}

/**
 * Aplica filtros y ordenamiento de forma coordinada
 */
async function aplicarFiltrosYOrdenamiento() {
    if (esDesarrollo()) {
        console.time('⏱️ Tiempo total filtrado + ordenamiento');
    }

    // Detectar contexto: ¿estamos en vista pública o dashboard privado?
    const esVistaPublica = document.getElementById('ofertas-publicas-container') !== null;
    const esDashboardPrivado = document.getElementById('ofertas-content') !== null;

    if (esVistaPublica) {
        // Vista pública - usar lógica para ofertas públicas
        await aplicarFiltrosYOrdenamientoPublico();
        if (esDesarrollo()) {
            console.timeEnd('⏱️ Tiempo total filtrado + ordenamiento');
        }
        return;
    }

    if (!esDashboardPrivado) {
        console.warn('⚠️ No se detectó ningún contexto válido para ordenamiento');
        return;
    }

    // Dashboard privado - lógica original
    // 1. Obtener ofertas base desde cache
    let ofertas = [...ofertasCache];

    if (esDesarrollo()) {
        console.log(`📦 Ofertas base: ${ofertas.length}`);
    }

    // 2. Aplicar filtro de estado (vigente/cerrada)
    if (estadoFiltroOfertas.actual !== null) {
        ofertas = ofertas.filter(oferta => {
            const fechaCierreDate = parsearFechaSegura(oferta.fechaCierre);
            const esVigente = oferta.vigente && fechaCierreDate && fechaCierreDate > new Date();
            
            if (estadoFiltroOfertas.actual === true) {
                return esVigente;
            } else if (estadoFiltroOfertas.actual === false) {
                return !esVigente;
            }
            return true;
        });

        if (esDesarrollo()) {
            console.log(`🔍 Después de filtro de estado: ${ofertas.length}`);
        }
    }

    // 3. Aplicar filtro de puesto si existe
    const filtroPuesto = document.getElementById('filtro-puesto-publico');
    if (filtroPuesto && filtroPuesto.value) {
        ofertas = ofertas.filter(o => o.nombrePuesto === filtroPuesto.value);
        if (esDesarrollo()) {
            console.log(`🔍 Después de filtro de puesto: ${ofertas.length}`);
        }
    }

    // 4. Aplicar ordenamiento
    const tipo = window.estadoOrdenamiento.tipo;
    
    if (tipo === 'fecha') {
        // Ordenar por fecha de alta
        ofertas.sort((a, b) => {
            const fechaA = parsearFechaSegura(a.fechaAlta);
            const fechaB = parsearFechaSegura(b.fechaAlta);
            
            if (!fechaA || !fechaB) return 0;
            
            const diff = fechaB.getTime() - fechaA.getTime();
            return window.estadoOrdenamiento.direccion === 'desc' ? diff : -diff;
        });

        if (esDesarrollo()) {
            console.log(`📅 Ordenado por fecha (${window.estadoOrdenamiento.direccion})`);
        }

    } else if (tipo === 'cercania') {
        // Enriquecer con coordenadas
        ofertas = enriquecerOfertasConCoordenadas(ofertas);

        // Calcular distancias
        const ubicacion = window.estadoOrdenamiento.ubicacionUsuario;
        let ofertasConDistancia = [];
        let ofertasSinDistancia = [];

        ofertas.forEach(oferta => {
            if (oferta.latitud && oferta.longitud) {
                // Usar cache si existe
                let distancia = cacheDistancias.get(oferta.idOfertaEmpleo);
                
                if (distancia === undefined) {
                    distancia = calcularDistanciaHaversine(
                        ubicacion.lat,
                        ubicacion.lng,
                        oferta.latitud,
                        oferta.longitud
                    );
                    
                    if (distancia !== null) {
                        cacheDistancias.set(oferta.idOfertaEmpleo, distancia);
                    }
                }

                if (distancia !== null) {
                    ofertasConDistancia.push({ ...oferta, distancia });
                } else {
                    ofertasSinDistancia.push(oferta);
                }
            } else {
                ofertasSinDistancia.push(oferta);
            }
        });

        // Ordenar por distancia
        ofertasConDistancia.sort((a, b) => a.distancia - b.distancia);

        // Concatenar: primero con distancia, luego sin distancia
        ofertas = [...ofertasConDistancia, ...ofertasSinDistancia];

        if (esDesarrollo()) {
            console.log(`📍 Ordenado por cercanía: ${ofertasConDistancia.length} con distancia, ${ofertasSinDistancia.length} sin coordenadas`);
            
            if (ofertasConDistancia.length > 0) {
                console.table(ofertasConDistancia.slice(0, 10).map(o => ({
                    Puesto: o.nombrePuesto,
                    Establecimiento: o.nombreEstablecimiento,
                    Distancia: formatearDistancia(o.distancia)
                })));
            }
        }

        // Advertir si no hay ofertas con coordenadas
        if (ofertasConDistancia.length === 0) {
            showMessage('⚠️ Ninguna oferta tiene ubicación disponible', 'warning');
        }
    }

    // 5. Renderizar ofertas filtradas y ordenadas
    renderizarOfertas(ofertas);

    // Actualizar indicador de ordenamiento
    actualizarIndicadorOrdenamiento();

    if (esDesarrollo()) {
        console.timeEnd('⏱️ Tiempo total filtrado + ordenamiento');
    }
}

/**
 * Aplica filtros y ordenamiento para la vista pública
 */
async function aplicarFiltrosYOrdenamientoPublico() {
    if (esDesarrollo()) {
        console.log('🌐 Aplicando filtros y ordenamiento en vista PÚBLICA');
    }

    // 1. Obtener ofertas desde estadoOfertasPublicas o recargar
    let ofertas = estadoOfertasPublicas.ofertas || [];

    if (ofertas.length === 0) {
        // Si no hay ofertas cargadas, intentar cargar
        if (esDesarrollo()) {
            console.log('📦 No hay ofertas en cache, recargando...');
        }
        await cargarOfertasPublicas({});
        ofertas = estadoOfertasPublicas.ofertas || [];
    }

    if (esDesarrollo()) {
        console.log(`📦 Ofertas base (pública): ${ofertas.length}`);
    }

    // 2. Aplicar filtro de estado si existe
    const selectorEstado = document.getElementById('filtro-estado-oferta');
    if (selectorEstado && selectorEstado.value) {
        const valorEstado = selectorEstado.value;
        
        ofertas = ofertas.filter(oferta => {
            const fechaCierreDate = parsearFechaSegura(oferta.fechaCierre);
            const esVigente = fechaCierreDate && fechaCierreDate > new Date();
            
            if (valorEstado === 'vigente') {
                return esVigente;
            } else if (valorEstado === 'vencida') {
                return !esVigente;
            }
            return true; // 'todas'
        });

        if (esDesarrollo()) {
            console.log(`🔍 Después de filtro de estado: ${ofertas.length}`);
        }
    }

    // 3. Aplicar filtro de puesto si existe
    const filtroPuesto = document.getElementById('filtro-puesto-publico');
    if (filtroPuesto && filtroPuesto.value) {
        ofertas = ofertas.filter(o => o.nombrePuestoTrabajo === filtroPuesto.value);
        if (esDesarrollo()) {
            console.log(`🔍 Después de filtro de puesto: ${ofertas.length}`);
        }
    }

    // 4. Aplicar ordenamiento
    const tipo = window.estadoOrdenamiento.tipo;
    
    if (tipo === 'fecha') {
        // Ordenar por fecha de alta
        ofertas.sort((a, b) => {
            const fechaA = parsearFechaSegura(a.fechaAlta);
            const fechaB = parsearFechaSegura(b.fechaAlta);
            
            if (!fechaA || !fechaB) return 0;
            
            const diff = fechaB.getTime() - fechaA.getTime();
            return window.estadoOrdenamiento.direccion === 'desc' ? diff : -diff;
        });

        if (esDesarrollo()) {
            console.log(`📅 Ordenado por fecha (${window.estadoOrdenamiento.direccion})`);
        }

    } else if (tipo === 'cercania') {
        const ubicacion = window.estadoOrdenamiento.ubicacionUsuario;
        let ofertasConDistancia = [];
        let ofertasSinDistancia = [];

        ofertas.forEach(oferta => {
            if (oferta.latitud && oferta.longitud) {
                let distancia = cacheDistancias.get(oferta.idOfertaEmpleo);
                
                if (distancia === undefined) {
                    distancia = calcularDistanciaHaversine(
                        ubicacion.lat,
                        ubicacion.lng,
                        parseFloat(oferta.latitud),
                        parseFloat(oferta.longitud)
                    );
                    
                    if (distancia !== null) {
                        cacheDistancias.set(oferta.idOfertaEmpleo, distancia);
                    }
                }

                if (distancia !== null) {
                    ofertasConDistancia.push({ ...oferta, distancia });
                } else {
                    ofertasSinDistancia.push(oferta);
                }
            } else {
                ofertasSinDistancia.push(oferta);
            }
        });

        ofertasConDistancia.sort((a, b) => a.distancia - b.distancia);
        ofertas = [...ofertasConDistancia, ...ofertasSinDistancia];

        if (esDesarrollo()) {
            console.log(`📍 Ordenado por cercanía: ${ofertasConDistancia.length} con distancia`);
        }

        if (ofertasConDistancia.length === 0) {
            showMessage('⚠️ Ninguna oferta tiene ubicación disponible', 'warning');
        }
    }

    // 5. Renderizar usando la función de vista pública
    renderizarOfertasPublicas(ofertas);

    // Actualizar contador de ofertas
    actualizarContadorOfertasPublicas(ofertas.length);

    // Actualizar indicador
    actualizarIndicadorOrdenamiento();

    if (esDesarrollo()) {
        console.log('✅ Filtros y ordenamiento aplicados en vista pública');
    }
}

/**
 * Actualiza el estado visual de los botones de ordenamiento
 */
function actualizarBotonesOrdenamiento() {
    const btnFecha = document.getElementById('btn-ordenar-fecha');
    const btnCercania = document.getElementById('btn-ordenar-cercania');

    if (!btnFecha || !btnCercania) return;

    // Remover estados activos
    btnFecha.classList.remove('btn-ordenar-activo');
    btnCercania.classList.remove('btn-ordenar-activo');

    // Aplicar estado activo según corresponda
    const tipo = window.estadoOrdenamiento.tipo;
    
    if (tipo === 'fecha') {
        btnFecha.classList.add('btn-ordenar-activo');
        
        // Actualizar icono de dirección
        const icono = btnFecha.querySelector('.fa-sort, .fa-sort-up, .fa-sort-down');
        if (icono) {
            icono.classList.remove('fa-sort', 'fa-sort-up', 'fa-sort-down');
            icono.classList.add(
                window.estadoOrdenamiento.direccion === 'desc' ? 'fa-sort-down' : 'fa-sort-up'
            );
        }
    } else if (tipo === 'cercania') {
        btnCercania.classList.add('btn-ordenar-activo');
    } else {
        // Restaurar icono de fecha a neutral
        const icono = btnFecha.querySelector('.fa-sort, .fa-sort-up, .fa-sort-down');
        if (icono) {
            icono.classList.remove('fa-sort-up', 'fa-sort-down');
            icono.classList.add('fa-sort');
        }
    }
}

/**
 * Actualiza el texto indicador de ordenamiento activo
 */
function actualizarIndicadorOrdenamiento() {
    const indicador = document.getElementById('ordenamiento-info');
    if (!indicador) return;

    const tipo = window.estadoOrdenamiento.tipo;

    if (!tipo) {
        indicador.classList.add('ordenamiento-info-hidden');
        indicador.textContent = '';
    } else {
        indicador.classList.remove('ordenamiento-info-hidden');
        
        if (tipo === 'fecha') {
            const dir = window.estadoOrdenamiento.direccion === 'desc' ? 'más recientes' : 'más antiguas';
            indicador.innerHTML = `<i class="fas fa-info-circle me-1"></i>Ordenado por fecha: ${dir} primero`;
        } else if (tipo === 'cercania') {
            indicador.innerHTML = `<i class="fas fa-info-circle me-1"></i>Ordenado por cercanía: más cercanas primero`;
        }
    }
}

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
        vigentes: document.getElementById('filtro-vigentes')
    };

    // Verificar que los botones existan
    if (!botones.todas || !botones.vigentes) {
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
    }
}

/**
 * Inicializa los controles de filtro con el estado por defecto
 */
function inicializarFiltrosOfertas() {
    // Establecer "Vigentes" como filtro por defecto
    estadoFiltroOfertas.actual = true;
    actualizarEstadoBotonesFiltro(true, false);
    
    // Aplicar el filtro de vigentes al iniciar
    console.log('🔄 Inicializando filtro de ofertas vigentes por defecto');
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

/**
 * Actualiza el badge contador del header de ofertas
 * @param {number} mostradas - Cantidad de ofertas mostradas (filtradas)
 * @param {number} total - Total de ofertas en el sistema
 */
function actualizarBadgeOfertas(mostradas, total) {
    const badge = document.getElementById('ofertas-contador-badge');
    if (!badge) return;
    
    const estadisticas = calcularEstadisticasOfertasReales(ofertasCache);
    const filtro = estadoFiltroOfertas.actual;
    
    let texto = '';
    if (filtro === null) {
        // Mostrando todas
        texto = `${total} ${total === 1 ? 'oferta' : 'ofertas'} • ${estadisticas.vigentes} vigente${estadisticas.vigentes !== 1 ? 's' : ''}`;
    } else if (filtro === true) {
        // Mostrando vigentes
        texto = `${mostradas} vigente${mostradas !== 1 ? 's' : ''} de ${total} total${total !== 1 ? 'es' : ''}`;
    } else {
        // Mostrando cerradas
        texto = `${mostradas} cerrada${mostradas !== 1 ? 's' : ''} de ${total} total${total !== 1 ? 'es' : ''}`;
    }
    
    badge.textContent = texto;
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
        console.log('🔍 Estructura de primera oferta:', ofertas.length > 0 ? ofertas[0] : 'No hay ofertas');
        
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

// ===========================
// SISTEMA DE MAPA PRINCIPAL
// ===========================

/**
 * Estado global del mapa principal de establecimientos
 */
const mapaPrincipal = {
    instancia: null,
    marcadores: [],
    marcadorDestacado: null,
    capas: {
        clasica: null,
        satelital: null
    },
    configuracion: {
        centro: [-32.89, -68.83], // Mendoza, Argentina
        zoom: 8,
        maxZoom: 18
    },
    ubicacionUsuario: {
        activa: false,
        marcador: null,
        coordenadas: null,
        watchId: null,
        circuloPrecision: null
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
                    ${oferta.nombreEstablecimiento.toUpperCase()}
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
                        Postularse
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
/**
 * Actualiza el contador de ofertas según la vista
 */
function actualizarContadorOfertas() {
    const contador = document.getElementById('contador-ofertas-publicas');
    
    if (!contador) return;
    
    const total = estadoOfertasPublicas.ofertas.length;
    const filtradas = estadoOfertasPublicas.ofertasFiltradas.length;
    
    let texto = '';
    if (total === filtradas) {
        texto = `${total} ofertas`;
    } else {
        texto = `${filtradas} de ${total} ofertas`;
    }
    
    contador.textContent = texto;
    
    // Actualizar color del contador según disponibilidad
    contador.className = 'badge bg-success fs-6';
    
    if (filtradas === 0) {
        contador.classList.remove('bg-success');
        contador.classList.add('bg-secondary');
    } else if (filtradas < total) {
        contador.classList.remove('bg-success');
        contador.classList.add('bg-warning');
    } else {
        contador.classList.remove('bg-secondary', 'bg-warning');
        contador.classList.add('bg-success');
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
            <div class="col-12 mb-3">
                <div class="card shadow-sm border-0 oferta-publica-card oferta-publica-card-horizontal" data-oferta-id="${oferta.idOfertaEmpleo}" data-lat="${oferta.latitud}" data-lng="${oferta.longitud}">
                    <div class="oferta-card-content">
                        <!-- Sección Icono/Estado -->
                        <div class="oferta-icon-section">
                            <div class="oferta-icon-wrapper ${headerColor}">
                                <i class="fas fa-briefcase"></i>
                            </div>
                            <div class="oferta-badge-container">
                                ${oferta.distancia !== undefined && oferta.distancia !== null ? `
                                    <div class="oferta-distancia-badge-horizontal">
                                        <i class="fas fa-location-arrow"></i>
                                        <span>${formatearDistancia(oferta.distancia)}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Sección Información Principal -->
                        <div class="oferta-info-section">
                            <div class="oferta-header-horizontal">
                                <h5 class="oferta-titulo">
                                    ${oferta.nombrePuestoTrabajo || 'Puesto no especificado'}
                                </h5>
                                <span class="oferta-especie">
                                    <i class="fas fa-seedling me-1"></i>
                                    ${oferta.nombreEspecie || 'Especie no especificada'}
                                </span>
                            </div>
                            
                            <div class="oferta-empresa-horizontal">
                                <h6 class="fw-bold text-primary mb-1">
                                    <i class="fas fa-building me-1"></i>
                                    ${oferta.nombreEmpresa || 'Empresa no especificada'}
                                </h6>
                                <p class="text-muted small mb-0">
                                    <i class="fas fa-map-pin me-1"></i>
                                    ${(oferta.nombreEstablecimiento || 'Establecimiento no especificado').toUpperCase()}
                                </p>
                            </div>
                            
                            <div class="oferta-detalles-horizontal">
                                <div class="oferta-detalle-item">
                                    <small class="text-muted">
                                        <i class="fas fa-users me-1"></i>
                                        Vacantes
                                    </small>
                                    <div class="fw-bold ${oferta.vacantes >= 3 ? 'text-success' : 'text-warning'}">
                                        ${oferta.vacantes || 1} ${oferta.vacantes === 1 ? 'puesto' : 'puestos'}
                                    </div>
                                </div>
                                <div class="oferta-detalle-item">
                                    <small class="text-muted">
                                        <i class="fas fa-calendar-times me-1"></i>
                                        Fecha de cierre
                                    </small>
                                    <div class="fw-bold ${urgenciaClase}">
                                        ${fechaCierre}
                                        ${diasRestantes > 0 ? `<small class="ms-1">(${diasRestantes} días)</small>` : '<small class="ms-1">(Vencida)</small>'}
                                    </div>
                                </div>
                                <div class="oferta-detalle-item">
                                    <button class="btn btn-link p-0 text-info fw-bold" onclick="verEnMapa('${oferta.idOfertaEmpleo}')" title="Ver ubicación en mapa">
                                        <i class="fas fa-location-dot me-1"></i>Ver en mapa
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Sección Acciones -->
                        <div class="oferta-actions-section">
                            <button class="btn btn-primary btn-postularse" onclick="contactarEmpresa('${oferta.idOfertaEmpleo}')">
                                <i class="fas fa-paper-plane me-2"></i>
                                Postularse
                            </button>
                        </div>
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
 * Actualiza el indicador visual de ordenamiento activo
 * @param {string} tipo - Tipo de ordenamiento ('fecha', 'distancia', null)
 */
function actualizarIndicadorOrdenamiento(tipo) {
    const indicador = document.getElementById('ordenamiento-info');
    if (!indicador) return;
    
    if (!tipo) {
        indicador.classList.add('ordenamiento-info-hidden');
        indicador.innerHTML = '';
        return;
    }
    
    indicador.classList.remove('ordenamiento-info-hidden');
    
    if (tipo === 'fecha') {
        indicador.innerHTML = `
            <i class="fas fa-calendar-alt me-1"></i>
            <strong>Ordenado por fecha de cierre</strong> - Las ofertas más recientes aparecen primero
        `;
    } else if (tipo === 'distancia') {
        indicador.innerHTML = `
            <i class="fas fa-location-arrow me-1 text-success"></i>
            <strong>Ordenado por distancia</strong> - Las ofertas más cercanas a tu ubicación aparecen primero
        `;
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
}

/**
 * Inicializa el sistema de ofertas públicas
 */
async function inicializarOfertasPublicas() {
    console.log('🚀 Inicializando sistema de ofertas públicas');
    
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

    // ===== NUEVO: Selector de estado (vigente/vencida) =====
    const selectorEstado = document.getElementById('filtro-estado-oferta');
    if (selectorEstado) {
        selectorEstado.addEventListener('change', function(e) {
            const valor = e.target.value;
            
            if (esDesarrollo()) {
                console.log(`🔄 Filtro de estado cambiado (vista pública): "${valor}"`);
            }
            
            // En vista pública, simplemente reaplicar filtros y ordenamiento
            aplicarFiltrosYOrdenamiento();
        });
        
        if (esDesarrollo()) {
            console.log('✅ Event listener de filtro de estado configurado');
        }
    }

    // ===== NUEVO: Botón ordenar por fecha =====
    const btnOrdenarFecha = document.getElementById('btn-ordenar-fecha');
    if (btnOrdenarFecha) {
        btnOrdenarFecha.addEventListener('click', async function() {
            try {
                // Obtener filtro actual de puesto
                const selectorPuesto = document.getElementById('filtro-puesto-publico');
                const puestoActual = selectorPuesto ? selectorPuesto.value : '';
                
                // Cargar ofertas ordenadas por fecha (por defecto)
                await cargarOfertasPublicas({ 
                    orden: 'fecha',
                    puesto: puestoActual
                });
                
                // Actualizar estado de los botones
                btnOrdenarFecha.classList.add('active');
                document.getElementById('btn-ordenar-cercania')?.classList.remove('active');
                
                // Restaurar texto del botón cercanía
                const btnCercania = document.getElementById('btn-ordenar-cercania');
                if (btnCercania) {
                    btnCercania.innerHTML = `
                        <i class="fas fa-map-marker-alt me-1"></i>
                        Ordenar por cercanía
                    `;
                }
                
                // Actualizar indicador
                actualizarIndicadorOrdenamiento('fecha');
                
                console.log('📅 Ofertas ordenadas por fecha');
                
            } catch (error) {
                console.error('❌ Error al ordenar por fecha:', error);
            }
        });
        
        if (esDesarrollo()) {
            console.log('✅ Event listener de ordenar por fecha configurado');
        }
    }

    // ===== NUEVO: Botón ordenar por cercanía =====
    const btnOrdenarCercania = document.getElementById('btn-ordenar-cercania');
    if (btnOrdenarCercania) {
        btnOrdenarCercania.addEventListener('click', async function() {
            try {
                // Mostrar indicador de carga
                btnOrdenarCercania.disabled = true;
                btnOrdenarCercania.innerHTML = `
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Obteniendo ubicación...
                `;
                
                // Solicitar ubicación del usuario
                const coords = await getUbicacionUsuario();
                
                console.log('📍 Ubicación obtenida:', coords);
                
                // Obtener filtro actual de puesto
                const selectorPuesto = document.getElementById('filtro-puesto-publico');
                const puestoActual = selectorPuesto ? selectorPuesto.value : '';
                
                // Cargar ofertas ordenadas por distancia
                await cargarOfertasPublicas({ 
                    orden: 'distancia',
                    puesto: puestoActual
                });
                
                // Actualizar estado de los botones
                btnOrdenarCercania.classList.add('active');
                document.getElementById('btn-ordenar-fecha')?.classList.remove('active');
                
                btnOrdenarCercania.innerHTML = `
                    <i class="fas fa-map-marker-alt me-1"></i>
                    Ordenado por cercanía
                    <i class="fas fa-check ms-1"></i>
                `;
                
                // Actualizar indicador
                actualizarIndicadorOrdenamiento('distancia');
                
            } catch (error) {
                console.error('❌ Error al ordenar por cercanía:', error);
                
                // Mostrar mensaje de error amigable
                alert('No se pudo obtener tu ubicación. Por favor, permite el acceso a tu ubicación para usar esta función.');
                
                // Restaurar botón
                btnOrdenarCercania.innerHTML = `
                    <i class="fas fa-map-marker-alt me-1"></i>
                    Ordenar por cercanía
                `;
            } finally {
                btnOrdenarCercania.disabled = false;
            }
        });
        
        if (esDesarrollo()) {
            console.log('✅ Event listener de ordenar por cercanía configurado');
        }
    }

    // ===== NUEVO: Botón limpiar filtros =====
    const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');
    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', function() {
            if (esDesarrollo()) {
                console.log('🧹 Limpiando filtros y ordenamiento...');
            }

            // Resetear filtro de estado a 'vigente'
            const selectorEstado = document.getElementById('filtro-estado-oferta');
            if (selectorEstado) {
                selectorEstado.value = 'vigente';
            }

            // Resetear filtro de puesto
            const selectorPuesto = document.getElementById('filtro-puesto-publico');
            if (selectorPuesto) {
                selectorPuesto.value = '';
            }

            // Resetear botones de ordenamiento
            document.getElementById('btn-ordenar-fecha')?.classList.remove('active');
            document.getElementById('btn-ordenar-cercania')?.classList.remove('active');

            // Restaurar texto de botón cercanía
            const btnCercania = document.getElementById('btn-ordenar-cercania');
            if (btnCercania) {
                btnCercania.innerHTML = `
                    <i class="fas fa-map-marker-alt me-1"></i>
                    Ordenar por cercanía
                `;
            }

            // Ocultar indicador de ordenamiento
            actualizarIndicadorOrdenamiento(null);

            // Resetear ordenamiento
            window.estadoOrdenamiento = {
                tipo: null,
                direccion: 'desc',
                ubicacionUsuario: window.estadoOrdenamiento.ubicacionUsuario // Mantener ubicación
            };

            // Limpiar cache de distancias
            cacheDistancias.clear();

            // Actualizar botones
            actualizarBotonesOrdenamiento();

            // Cargar ofertas sin ordenamiento específico (por defecto: fecha)
            cargarOfertasPublicas({ 
                puesto: '',
                orden: 'fecha'
            });

            showMessage('Filtros y ordenamiento restablecidos', 'info');
        });
        
        if (esDesarrollo()) {
            console.log('✅ Event listener de limpiar filtros configurado');
        }
    }
    
    // Botones de ordenamiento originales
    document.querySelectorAll('.btn-orden-publico').forEach(btn => {
        btn.addEventListener('click', () => {
            onCambioOrdenPublico(btn.dataset.orden);
        });
    });
}

// ===========================
// MODAL DE POSTULACIÓN
// ===========================

// Variables globales para el modal de postulación
let mapaPostulacion = null;
let marcadorPostulacion = null;

/**
 * Función para abrir modal de postulación
 * @param {string} ofertaId - ID de la oferta
 */
function contactarEmpresa(ofertaId) {
    abrirModalPostulacion(ofertaId);
}

/**
 * Abrir modal de postulación y configurarlo
 * @param {number} idOferta - ID de la oferta
 */
function abrirModalPostulacion(idOferta) {
    console.log('🎯 Abriendo modal de postulación para oferta:', idOferta);
    
    // Guardar ID de oferta en variable global
    window.ofertaActual = idOferta;
    
    // Resetear formulario
    const form = document.getElementById('form-postulacion');
    if (form) {
        form.reset();
        // Limpiar clases de validación
        form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid');
        });
    }
    
    // Obtener instancia del modal
    const modalElement = document.getElementById('modalPostulacion');
    const modal = new bootstrap.Modal(modalElement);
    
    // Configurar evento shown para inicializar después de que el modal esté visible
    modalElement.addEventListener('shown.bs.modal', function() {
        inicializarModalPostulacion(idOferta);
    }, { once: true });
    
    // Configurar evento hidden para limpiar recursos
    modalElement.addEventListener('hidden.bs.modal', function() {
        cerrarModalPostulacion();
    }, { once: true });
    
    modal.show();
}

/**
 * Inicializar modal de postulación (mapa, departamentos, validación)
 * @param {number} idOferta - ID de la oferta
 */
async function inicializarModalPostulacion(idOferta) {
    console.log('🔄 Inicializando modal de postulación...');
    
    try {
        // 1. Cargar departamentos
        await cargarDepartamentosPostulacion();
        
        // 2. Inicializar mapa
        inicializarMapaPostulacion();
        
        // 3. Configurar validación en tiempo real
        configurarValidacionEnTiempoReal();
        
        // 4. Configurar evento onChange de departamento (solo una vez)
        configurarCambioDepartamento();
        
        // 5. Configurar búsqueda por DNI
        configurarBusquedaPorDNI();
        
        // 6. Focus en primer campo
        setTimeout(() => {
            const primerCampo = document.getElementById('dni-postulacion');
            if (primerCampo) primerCampo.focus();
        }, 300);
        
        console.log('✅ Modal de postulación inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando modal de postulación:', error);
        showMessage('Error al inicializar el formulario. Intente nuevamente.', 'error');
    }
}

/**
 * Cargar departamentos desde API pública
 */
async function cargarDepartamentosPostulacion() {
    try {
        console.log('🔄 Cargando departamentos...');
        
        const response = await fetch('http://localhost:8080/publico/departamentos', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const departamentos = await response.json();
        console.log(`✅ ${departamentos.length} departamentos cargados`);
        
        const selectDepartamento = document.getElementById('departamento-postulacion');
        selectDepartamento.innerHTML = '<option value="">Seleccione un departamento</option>';
        
        departamentos.forEach(dep => {
            const option = document.createElement('option');
            option.value = dep.idDepartamento;
            option.textContent = dep.nombreDepartamento;
            selectDepartamento.appendChild(option);
        });
        
        return departamentos;
        
    } catch (error) {
        console.error('❌ Error cargando departamentos:', error);
        showMessage('Error al cargar departamentos. Por favor, recargue la página.', 'error');
        
        const selectDepartamento = document.getElementById('departamento-postulacion');
        selectDepartamento.innerHTML = '<option value="">Error al cargar departamentos</option>';
        
        throw error;
    }
}

/**
 * Cargar distritos según departamento seleccionado
 * @param {number} idDepartamento - ID del departamento
 */
async function cargarDistritosPostulacion(idDepartamento) {
    if (!idDepartamento) {
        console.warn('⚠️ ID de departamento no proporcionado');
        return;
    }
    
    try {
        console.log(`🔄 Cargando distritos para departamento ${idDepartamento}...`);
        
        const selectDistrito = document.getElementById('distrito-postulacion');
        selectDistrito.innerHTML = '<option value="">Cargando...</option>';
        selectDistrito.disabled = true;
        
        const response = await fetch(`http://localhost:8080/publico/distritos/${idDepartamento}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const distritos = await response.json();
        console.log(`✅ ${distritos.length} distritos cargados`);
        
        selectDistrito.innerHTML = '<option value="">Seleccione un distrito</option>';
        
        if (distritos.length === 0) {
            selectDistrito.innerHTML = '<option value="">Sin distritos disponibles</option>';
            return;
        }
        
        distritos.forEach(dist => {
            const option = document.createElement('option');
            option.value = dist.idDistrito;
            option.textContent = dist.nombreDistrito;
            selectDistrito.appendChild(option);
        });
        
        selectDistrito.disabled = false;
        
    } catch (error) {
        console.error('❌ Error cargando distritos:', error);
        const selectDistrito = document.getElementById('distrito-postulacion');
        selectDistrito.innerHTML = '<option value="">Error al cargar distritos</option>';
        showMessage('Error al cargar distritos. Intente nuevamente.', 'error');
    }
}

// Flag global para prevenir limpieza durante autocompletado
window.bloqueandoAutocompletado = false;
// Referencia al listener para poder removerlo
window.departamentoChangeListener = null;

/**
 * Configurar cambio de departamento
 */
function configurarCambioDepartamento() {
    const selectDepartamento = document.getElementById('departamento-postulacion');
    
    if (!selectDepartamento) {
        console.warn('⚠️ Select de departamento no encontrado');
        return;
    }
    
    // Solo configurar una vez
    if (selectDepartamento.dataset.listenerConfigured) {
        return;
    }
    
    selectDepartamento.dataset.listenerConfigured = 'true';
    
    // Definir el listener como función nombrada para poder removerlo
    window.departamentoChangeListener = function(e) {
        // BLOQUEAR si está en proceso de autocompletado
        if (window.bloqueandoAutocompletado) {
            console.log('🛡️ BLOQUEADO: Autocompletado en proceso, ignorando change');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }
        
        // CRÍTICO: Verificar múltiples condiciones para prevenir limpieza accidental
        const isAutofilled = selectDepartamento.dataset.autofilled === 'true';
        const distritoAutofilled = document.getElementById('distrito-postulacion').dataset.autofilled === 'true';
        
        // Si AMBOS están autocompletados, NO limpiar
        if (isAutofilled && distritoAutofilled) {
            console.log('🛡️ PROTECCIÓN: Ambos campos autocompletados, ignorando change');
            delete selectDepartamento.dataset.autofilled;
            delete document.getElementById('distrito-postulacion').dataset.autofilled;
            return;
        }
        
        const idDepartamento = e.target.value;
        const selectDistrito = document.getElementById('distrito-postulacion');
        
        console.log('👤 Usuario cambió departamento manualmente');
        
        // Limpiar distrito cuando el usuario cambia manualmente
        selectDistrito.innerHTML = '<option value="">Seleccione primero un departamento</option>';
        selectDistrito.disabled = true;
        selectDistrito.classList.remove('is-valid', 'is-invalid');
        delete selectDistrito.dataset.autofilled;
        
        // Cargar distritos si hay departamento seleccionado
        if (idDepartamento) {
            cargarDistritosPostulacion(idDepartamento);
        }
    };
    
    selectDepartamento.addEventListener('change', window.departamentoChangeListener);
    
    console.log('✅ Listener de cambio de departamento configurado');
}

/**
 * Configurar búsqueda automática por DNI
 */
function configurarBusquedaPorDNI() {
    const inputDNI = document.getElementById('dni-postulacion');
    
    if (!inputDNI) {
        console.warn('⚠️ Campo DNI no encontrado');
        return;
    }
    
    // Solo configurar el listener una vez
    if (inputDNI.dataset.listenerConfigured) {
        console.log('✅ Búsqueda por DNI ya estaba configurada');
        return;
    }
    
    inputDNI.dataset.listenerConfigured = 'true';
    
    // Debounce para evitar múltiples llamadas
    let timeoutId = null;
    
    inputDNI.addEventListener('input', function(e) {
        const dni = e.target.value.trim();
        
        // Limpiar timeout previo
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        
        // Validar que tenga 7 u 8 dígitos
        if (dni.length >= 7 && dni.length <= 8 && /^\d+$/.test(dni)) {
            // Esperar 500ms después de que el usuario deje de escribir
            timeoutId = setTimeout(() => {
                buscarPersonaPorDNI(dni);
            }, 500);
        }
    });
    
    console.log('✅ Búsqueda por DNI configurada');
}

/**
 * Buscar persona por DNI en el backend
 * @param {string} dni - DNI a buscar
 */
async function buscarPersonaPorDNI(dni) {
    try {
        console.log(`🔍 Buscando persona con DNI: ${dni}...`);
        
        const response = await fetch(`http://localhost:8080/publico/personas/buscar/${dni}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (response.status === 404) {
            console.log('ℹ️ Persona no encontrada, usuario nuevo');
            limpiarCamposPostulacion(dni);
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const persona = await response.json();
        console.log('✅ Persona encontrada:', persona);
        
        // Autocompletar campos con datos de la persona
        autocompletarDatosPersona(persona);
        
        showMessage('Datos cargados correctamente. Puede editarlos si es necesario.', 'success');
        
    } catch (error) {
        console.error('❌ Error buscando persona por DNI:', error);
        // No mostrar mensaje de error al usuario para no interrumpir el flujo
    }
}

/**
 * Autocompletar campos del formulario con datos de la persona
 * @param {Object} persona - Datos de la persona
 */
async function autocompletarDatosPersona(persona) {
    try {
        console.log('📋 Datos recibidos de la persona:', persona);
        console.log('📮 Código Postal recibido:', persona.codigoPostal);
        
        // Campos de texto simples
        const camposTexto = {
            'nombre-postulacion': persona.nombre,
            'apellido-postulacion': persona.apellido,
            'calle-postulacion': persona.calle,
            'numeracion-postulacion': persona.numeracion,
            'codigoPostal-postulacion': persona.codigoPostal,
            'telefono-postulacion': persona.telefono
        };
        
        // Rellenar campos de texto
        for (const [idCampo, valor] of Object.entries(camposTexto)) {
            const campo = document.getElementById(idCampo);
            console.log(`🔍 Campo: ${idCampo}, Valor: ${valor}, Elemento encontrado:`, campo !== null);
            if (campo && valor) {
                campo.value = valor;
                console.log(`✅ Campo ${idCampo} rellenado con: ${valor}`);
                // Marcar como válido si tiene valor
                campo.classList.remove('is-invalid');
                campo.classList.add('is-valid');
            } else if (campo && !valor) {
                console.warn(`⚠️ Campo ${idCampo} encontrado pero sin valor`);
            } else if (!campo) {
                console.error(`❌ Campo ${idCampo} NO encontrado en el DOM`);
            }
        }
        
        // ACTIVAR BLOQUEO para prevenir que el listener limpie el distrito
        window.bloqueandoAutocompletado = true;
        
        // REMOVER el listener del departamento temporalmente
        const selectDepartamento = document.getElementById('departamento-postulacion');
        if (selectDepartamento && window.departamentoChangeListener) {
            selectDepartamento.removeEventListener('change', window.departamentoChangeListener);
            console.log('🔒 LISTENER REMOVIDO temporalmente');
        }
        
        console.log('🔒 BLOQUEO ACTIVADO');
        
        // Seleccionar departamento
        console.log('🏛️ Intentando seleccionar departamento:', persona.nombreDepartamento);
        if (persona.nombreDepartamento) {
            const selectDepartamento = document.getElementById('departamento-postulacion');
            
            if (!selectDepartamento) {
                console.error('❌ Select de departamento no encontrado');
                window.autocompletandoDatos = false;
                return;
            }
            
            console.log(`📋 Opciones disponibles en departamento:`, Array.from(selectDepartamento.options).map(opt => ({
                value: opt.value,
                text: opt.text
            })));
            
            let departamentoEncontrado = false;
            
            // Buscar la opción que coincida con el nombre
            for (let i = 0; i < selectDepartamento.options.length; i++) {
                const opcionTexto = selectDepartamento.options[i].text.toUpperCase().trim();
                const nombreBuscado = persona.nombreDepartamento.toUpperCase().trim();
                
                console.log(`🔍 Comparando: "${opcionTexto}" vs "${nombreBuscado}"`);
                
                if (opcionTexto === nombreBuscado) {
                    // Cambiar valor sin disparar evento change
                    const valorAnterior = selectDepartamento.value;
                    selectDepartamento.value = selectDepartamento.options[i].value;
                    
                    // Marcar como autocompletado para prevenir limpieza
                    selectDepartamento.dataset.autofilled = 'true';
                    
                    // Si el valor no cambió (ya estaba seleccionado), no se dispara change
                    // Marcar visualmente como válido
                    selectDepartamento.classList.remove('is-invalid');
                    selectDepartamento.classList.add('is-valid');
                    departamentoEncontrado = true;
                    
                    console.log(`✅ Departamento seleccionado: ${selectDepartamento.options[i].text} (valor: ${selectDepartamento.value})`);
                    console.log('🏷️ Departamento marcado como autofilled');
                    
                    // Cargar distritos del departamento SOLO si no están ya cargados
                    const idDepartamento = selectDepartamento.value;
                    const selectDistrito = document.getElementById('distrito-postulacion');
                    const distritosYaCargados = selectDistrito.options.length > 1; // Más de la opción por defecto
                    
                    console.log(`🔄 Distritos ya cargados: ${distritosYaCargados} (${selectDistrito.options.length} opciones)`);
                    
                    if (idDepartamento && !distritosYaCargados) {
                        console.log(`🔄 Cargando distritos para departamento ID: ${idDepartamento}`);
                        await cargarDistritosPostulacion(idDepartamento);
                    } else if (distritosYaCargados) {
                        console.log(`✅ Distritos ya están cargados, omitiendo recarga`);
                    }
                    
                    // Seleccionar distrito (después de cargar o si ya están cargados)
                    if (persona.nombreDistrito) {
                        // Timeout para dar tiempo a que carguen los distritos (si fue necesario)
                        setTimeout(() => {
                                const selectDistrito = document.getElementById('distrito-postulacion');
                                console.log('🏘️ Intentando seleccionar distrito:', persona.nombreDistrito);
                                
                                let distritoEncontrado = false;
                                for (let j = 0; j < selectDistrito.options.length; j++) {
                                    const distritoTexto = selectDistrito.options[j].text.toUpperCase().trim();
                                    const distritoNombre = persona.nombreDistrito.toUpperCase().trim();
                                    
                                    if (distritoTexto === distritoNombre) {
                                        // Cambiar valor sin disparar evento change
                                        selectDistrito.value = selectDistrito.options[j].value;
                                        
                                        // VERIFICAR que el valor se asignó correctamente
                                        if (selectDistrito.value === selectDistrito.options[j].value) {
                                            console.log(`✅ Valor de distrito asignado correctamente: ${selectDistrito.value}`);
                                        } else {
                                            console.error(`❌ ERROR: No se pudo asignar el valor del distrito`);
                                            console.error(`Intenté asignar: ${selectDistrito.options[j].value}, pero el valor actual es: ${selectDistrito.value}`);
                                        }
                                        
                                        // Marcar como autocompletado para prevenir limpieza
                                        selectDistrito.dataset.autofilled = 'true';
                                        
                                        selectDistrito.classList.remove('is-invalid');
                                        selectDistrito.classList.add('is-valid');
                                        selectDistrito.disabled = false; // Asegurar que no esté deshabilitado
                                        
                                        distritoEncontrado = true;
                                        console.log(`✅ Distrito seleccionado: ${selectDistrito.options[j].text} (valor: ${selectDistrito.value})`);
                                        console.log('🏷️ Distrito marcado como autofilled');
                                        break;
                                    }
                                }
                                
                                if (!distritoEncontrado) {
                                    console.warn(`⚠️ No se encontró el distrito "${persona.nombreDistrito}" en las opciones`);
                                } else {
                                    // AGREGAR OBSERVER AGRESIVO para detectar CUALQUIER cambio
                                    let valorOriginalDistrito = selectDistrito.value;
                                    let valorOriginalDepartamento = selectDepartamento.value;
                                    
                                    console.log('🛡️ PROTECCIÓN ACTIVADA - Valores guardados:');
                                    console.log('  - Departamento:', valorOriginalDepartamento);
                                    console.log('  - Distrito:', valorOriginalDistrito);
                                    
                                    // Observer para DISTRITO
                                    const observerDistrito = new MutationObserver(function(mutations) {
                                        if (selectDistrito.value !== valorOriginalDistrito) {
                                            console.error('🚨 ALERTA ROJA: Valor del distrito CAMBIÓ');
                                            console.error('  - Valor anterior:', valorOriginalDistrito);
                                            console.error('  - Valor nuevo:', selectDistrito.value);
                                            console.error('  - Stack trace:', new Error().stack);
                                        }
                                    });
                                    
                                    observerDistrito.observe(selectDistrito, {
                                        attributes: true,
                                        childList: true,
                                        subtree: true,
                                        characterData: true
                                    });
                                    
                                    // Observer para DEPARTAMENTO
                                    const observerDepartamento = new MutationObserver(function(mutations) {
                                        if (selectDepartamento.value !== valorOriginalDepartamento) {
                                            console.error('🚨 ALERTA ROJA: Valor del departamento CAMBIÓ');
                                            console.error('  - Valor anterior:', valorOriginalDepartamento);
                                            console.error('  - Valor nuevo:', selectDepartamento.value);
                                            console.error('  - Stack trace:', new Error().stack);
                                        }
                                    });
                                    
                                    observerDepartamento.observe(selectDepartamento, {
                                        attributes: true,
                                        childList: true,
                                        subtree: true,
                                        characterData: true
                                    });
                                    
                                    // Polling adicional cada 200ms
                                    let checkCount = 0;
                                    const intervalId = setInterval(() => {
                                        checkCount++;
                                        if (selectDistrito.value !== valorOriginalDistrito) {
                                            console.error(`🚨 POLLING DETECTÓ CAMBIO (check #${checkCount}):`, selectDistrito.value);
                                        }
                                        if (selectDepartamento.value !== valorOriginalDepartamento) {
                                            console.error(`🚨 POLLING DETECTÓ CAMBIO DEPTO (check #${checkCount}):`, selectDepartamento.value);
                                        }
                                        if (checkCount >= 50) { // 10 segundos
                                            clearInterval(intervalId);
                                            observerDistrito.disconnect();
                                            observerDepartamento.disconnect();
                                        }
                                    }, 200);
                                    
                                    // Verificar estado después de 2 segundos
                                    setTimeout(() => {
                                        console.log('🔍 VERIFICACIÓN POST-AUTOCOMPLETADO (2s):');
                                        console.log('  - Valor distrito:', selectDistrito.value);
                                        console.log('  - Índice seleccionado:', selectDistrito.selectedIndex);
                                        console.log('  - Autofilled:', selectDistrito.dataset.autofilled);
                                        console.log('  - Clases:', selectDistrito.className);
                                    }, 2000);
                                }
                            }, 400);
                        }
                    
                    break;
                }
            }
            
            if (!departamentoEncontrado) {
                console.warn(`⚠️ No se encontró el departamento "${persona.nombreDepartamento}" en las opciones del select`);
            }
        } else {
            console.warn('⚠️ persona.nombreDepartamento no tiene valor');
        }
        
        // Colocar marcador en el mapa si hay coordenadas
        if (persona.latitud && persona.longitud) {
            if (mapaPostulacion) {
                colocarMarcadorPostulacion(persona.latitud, persona.longitud);
                mapaPostulacion.setView([persona.latitud, persona.longitud], 15);
            }
        }
        
        console.log('✅ Campos autocompletados correctamente');
        
        // RESTAURAR el listener del departamento después de un delay
        setTimeout(() => {
            const selectDepartamento = document.getElementById('departamento-postulacion');
            if (selectDepartamento && window.departamentoChangeListener) {
                selectDepartamento.addEventListener('change', window.departamentoChangeListener);
                console.log('🔓 LISTENER RESTAURADO');
            }
            window.bloqueandoAutocompletado = false;
            console.log('🔓 BLOQUEO DESACTIVADO');
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error autocompletando datos:', error);
        window.bloqueandoAutocompletado = false;
    }
}

/**
 * Limpiar campos del formulario cuando no se encuentra la persona
 * @param {string} dni - DNI ingresado (se mantiene)
 */
function limpiarCamposPostulacion(dni) {
    // Mantener solo el DNI, limpiar el resto
    const camposALimpiar = [
        'nombre-postulacion',
        'apellido-postulacion',
        'calle-postulacion',
        'numeracion-postulacion',
        'codigoPostal-postulacion',
        'telefono-postulacion'
    ];
    
    camposALimpiar.forEach(idCampo => {
        const campo = document.getElementById(idCampo);
        if (campo) {
            campo.value = '';
            campo.classList.remove('is-valid', 'is-invalid');
        }
    });
    
    // Resetear selects
    const selectDepartamento = document.getElementById('departamento-postulacion');
    const selectDistrito = document.getElementById('distrito-postulacion');
    
    if (selectDepartamento) {
        selectDepartamento.selectedIndex = 0;
        selectDepartamento.classList.remove('is-valid', 'is-invalid');
    }
    
    if (selectDistrito) {
        selectDistrito.innerHTML = '<option value="">Seleccione primero un departamento</option>';
        selectDistrito.disabled = true;
        selectDistrito.classList.remove('is-valid', 'is-invalid');
    }
    
    // Limpiar marcador del mapa
    if (marcadorPostulacion && mapaPostulacion) {
        mapaPostulacion.removeLayer(marcadorPostulacion);
        marcadorPostulacion = null;
    }
    
    console.log('🧹 Campos limpiados para nuevo usuario');
}

/**
 * Inicializar mapa Leaflet en el modal
 */
function inicializarMapaPostulacion() {
    console.log('🗺️ Inicializando mapa de postulación...');
    
    // Destruir instancia previa si existe
    if (mapaPostulacion) {
        mapaPostulacion.remove();
        mapaPostulacion = null;
        marcadorPostulacion = null;
    }
    
    // Coordenadas de Mendoza, Argentina
    const mendozaLat = -32.8895;
    const mendozaLng = -68.8458;
    
    // Inicializar mapa
    mapaPostulacion = L.map('mapa-postulacion').setView([mendozaLat, mendozaLng], 13);
    
    // Agregar tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 10
    }).addTo(mapaPostulacion);
    
    // Event listener para click en el mapa
    mapaPostulacion.on('click', function(e) {
        colocarMarcadorPostulacion(e.latlng.lat, e.latlng.lng);
    });
    
    // Invalidar tamaño después de un breve delay (fix de Leaflet en modales)
    setTimeout(() => {
        if (mapaPostulacion) {
            mapaPostulacion.invalidateSize();
        }
    }, 300);
    
    console.log('✅ Mapa inicializado correctamente');
}

/**
 * Colocar marcador en el mapa
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 */
function colocarMarcadorPostulacion(lat, lng) {
    console.log(`📍 Colocando marcador en: ${lat}, ${lng}`);
    
    // Remover marcador previo si existe
    if (marcadorPostulacion) {
        mapaPostulacion.removeLayer(marcadorPostulacion);
    }
    
    // Crear nuevo marcador draggable
    marcadorPostulacion = L.marker([lat, lng], {
        draggable: true,
        autoPan: true
    }).addTo(mapaPostulacion);
    
    // Popup con coordenadas
    marcadorPostulacion.bindPopup(`
        <div style="text-align: center;">
            <strong>Ubicación Seleccionada</strong><br>
            Lat: ${lat.toFixed(6)}<br>
            Lng: ${lng.toFixed(6)}
        </div>
    `).openPopup();
    
    // Actualizar campos del formulario
    document.getElementById('latitud-postulacion').value = lat.toFixed(6);
    document.getElementById('longitud-postulacion').value = lng.toFixed(6);
    
    // Marcar campos como válidos
    document.getElementById('latitud-postulacion').classList.add('is-valid');
    document.getElementById('longitud-postulacion').classList.add('is-valid');
    document.getElementById('latitud-postulacion').classList.remove('is-invalid');
    document.getElementById('longitud-postulacion').classList.remove('is-invalid');
    
    // Event listener para drag del marcador
    marcadorPostulacion.on('dragend', function(e) {
        const pos = e.target.getLatLng();
        colocarMarcadorPostulacion(pos.lat, pos.lng);
    });
    
    // Centrar mapa en marcador
    mapaPostulacion.panTo([lat, lng]);
}

/**
 * Obtener ubicación actual del usuario usando geolocalización
 */
function obtenerUbicacionActual() {
    if (!navigator.geolocation) {
        showMessage('Geolocalización no soportada en este navegador', 'warning');
        return;
    }
    
    console.log('📍 Solicitando ubicación actual...');
    showMessage('Obteniendo su ubicación...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            console.log(`✅ Ubicación obtenida: ${lat}, ${lng}`);
            colocarMarcadorPostulacion(lat, lng);
            mapaPostulacion.setView([lat, lng], 15);
            showMessage('Ubicación obtenida correctamente', 'success');
        },
        function(error) {
            console.error('❌ Error obteniendo ubicación:', error);
            let mensaje = 'No se pudo obtener su ubicación';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    mensaje = 'Permiso de ubicación denegado';
                    break;
                case error.POSITION_UNAVAILABLE:
                    mensaje = 'Ubicación no disponible';
                    break;
                case error.TIMEOUT:
                    mensaje = 'Tiempo de espera agotado';
                    break;
            }
            
            showMessage(mensaje, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

/**
 * Configurar validación en tiempo real del formulario
 */
function configurarValidacionEnTiempoReal() {
    const form = document.getElementById('form-postulacion');
    const campos = form.querySelectorAll('input:not([readonly]), select');
    
    campos.forEach(campo => {
        // Validar al perder foco
        campo.addEventListener('blur', function() {
            validarCampo(this);
        });
        
        // Validar al escribir (solo para inputs)
        if (campo.tagName === 'INPUT' && !campo.readOnly) {
            campo.addEventListener('input', function() {
                if (this.classList.contains('is-invalid')) {
                    validarCampo(this);
                }
            });
        }
        
        // Validar al cambiar (para selects)
        if (campo.tagName === 'SELECT') {
            campo.addEventListener('change', function() {
                validarCampo(this);
            });
        }
    });
}

/**
 * Validar un campo individual
 * @param {HTMLElement} campo - Campo a validar
 * @returns {boolean} - True si es válido
 */
function validarCampo(campo) {
    const valor = campo.value.trim();
    const nombre = campo.name;
    let esValido = true;
    let mensajeError = '';
    
    // Validación específica por campo
    switch(nombre) {
        case 'dni':
            esValido = /^[0-9]{7,8}$/.test(valor);
            mensajeError = 'DNI debe tener 7 u 8 dígitos';
            break;
            
        case 'apellido':
        case 'nombre':
            esValido = valor.length >= 2 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor);
            mensajeError = `${nombre.charAt(0).toUpperCase() + nombre.slice(1)} debe tener al menos 2 letras`;
            break;
            
        case 'calle':
            esValido = valor.length >= 3;
            mensajeError = 'Calle debe tener al menos 3 caracteres';
            break;
            
        case 'numeracion':
            esValido = /^[0-9]+$/.test(valor) && parseInt(valor) > 0;
            mensajeError = 'Numeración debe ser un número positivo';
            break;
            
        case 'codigoPostal':
            esValido = /^[0-9]{4}$/.test(valor);
            mensajeError = 'Código postal debe tener 4 dígitos';
            break;
            
        case 'departamento':
        case 'distrito':
            // LOG ADICIONAL para debugging
            if (campo.id === 'distrito-postulacion') {
                console.log('🔍 VALIDANDO DISTRITO en validarCampo:');
                console.log('  - Valor actual:', campo.value);
                console.log('  - Texto seleccionado:', campo.selectedIndex >= 0 ? campo.options[campo.selectedIndex].text : 'ninguno');
                console.log('  - Autofilled:', campo.dataset.autofilled);
                console.log('  - Clases:', campo.className);
            }
            esValido = valor !== '';
            mensajeError = `Debe seleccionar un ${nombre}`;
            break;
            
        case 'latitud':
        case 'longitud':
            esValido = valor !== '' && !isNaN(parseFloat(valor));
            mensajeError = 'Debe marcar su ubicación en el mapa';
            break;
            
        case 'telefono':
            esValido = /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(valor);
            mensajeError = 'Formato de teléfono inválido';
            break;
            
        default:
            esValido = campo.checkValidity();
            mensajeError = 'Campo inválido';
    }
    
    // Aplicar clases de validación
    if (esValido) {
        campo.classList.remove('is-invalid');
        campo.classList.add('is-valid');
        const feedback = campo.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.style.display = 'none';
        }
    } else {
        campo.classList.remove('is-valid');
        campo.classList.add('is-invalid');
        
        // Mostrar mensaje de error
        let feedback = campo.nextElementSibling;
        if (!feedback || !feedback.classList.contains('invalid-feedback')) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            campo.parentNode.insertBefore(feedback, campo.nextSibling);
        }
        feedback.textContent = mensajeError;
        feedback.style.display = 'block';
    }
    
    return esValido;
}

/**
 * Validar formulario completo
 * @returns {boolean} - True si todo el formulario es válido
 */
function validarFormularioCompleto() {
    const form = document.getElementById('form-postulacion');
    const campos = form.querySelectorAll('input:not([readonly]), select');
    
    let formularioValido = true;
    let primerCampoInvalido = null;
    
    campos.forEach(campo => {
        const esValido = validarCampo(campo);
        if (!esValido) {
            formularioValido = false;
            if (!primerCampoInvalido) {
                primerCampoInvalido = campo;
            }
        }
    });
    
    // Scroll al primer campo con error
    if (primerCampoInvalido) {
        primerCampoInvalido.scrollIntoView({ behavior: 'smooth', block: 'center' });
        primerCampoInvalido.focus();
    }
    
    return formularioValido;
}

/**
 * Construir objeto de datos para envío
 * @returns {Object} - Datos de postulación en formato PostulacionRegistroDTO
 */
function construirDatosPostulacion() {
    const form = document.getElementById('form-postulacion');
    const formData = new FormData(form);
    
    // Construir objeto según estructura exacta del DTO backend
    const datos = {
        persona: {
            dni: formData.get('dni').trim(),
            apellido: formData.get('apellido').trim(),
            nombre: formData.get('nombre').trim(),
            calle: formData.get('calle').trim(),
            numeracion: formData.get('numeracion').trim(),
            codigoPostal: formData.get('codigoPostal').trim(),
            latitud: parseFloat(formData.get('latitud')),
            longitud: parseFloat(formData.get('longitud')),
            telefono: formData.get('telefono').trim(),
            idDistrito: parseInt(formData.get('distrito'))
        },
        idOfertaEmpleo: parseInt(window.ofertaActual)
    };
    
    console.log('📦 Datos de postulación construidos:', datos);
    return datos;
}

/**
 * Enviar postulación al backend
 */
async function enviarPostulacion() {
    console.log('🚀 Iniciando envío de postulación...');
    
    // GUARDAR valores de departamento y distrito ANTES de cualquier cosa
    const selectDistrito = document.getElementById('distrito-postulacion');
    const selectDepartamento = document.getElementById('departamento-postulacion');
    
    const valorDepartamentoGuardado = selectDepartamento.value;
    const valorDistritoGuardado = selectDistrito.value;
    const deptoAutofilled = selectDepartamento.dataset.autofilled === 'true';
    const distritoAutofilled = selectDistrito.dataset.autofilled === 'true';
    
    console.log('💾 VALORES GUARDADOS:');
    console.log('  - Departamento:', valorDepartamentoGuardado, 'Autofilled:', deptoAutofilled);
    console.log('  - Distrito:', valorDistritoGuardado, 'Autofilled:', distritoAutofilled);
    
    // 1. Validar formulario
    const esValido = validarFormularioCompleto();
    
    // RESTAURAR valores si fueron autocompletados y se borraron
    if (deptoAutofilled && selectDepartamento.value === '' && valorDepartamentoGuardado !== '') {
        console.log('🔄 RESTAURANDO departamento:', valorDepartamentoGuardado);
        selectDepartamento.value = valorDepartamentoGuardado;
        selectDepartamento.classList.remove('is-invalid');
        selectDepartamento.classList.add('is-valid');
    }
    
    if (distritoAutofilled && selectDistrito.value === '' && valorDistritoGuardado !== '') {
        console.log('🔄 RESTAURANDO distrito:', valorDistritoGuardado);
        selectDistrito.value = valorDistritoGuardado;
        selectDistrito.classList.remove('is-invalid');
        selectDistrito.classList.add('is-valid');
    }
    
    // Validar nuevamente si restauramos valores
    if (!esValido && (deptoAutofilled || distritoAutofilled)) {
        console.log('🔄 RE-VALIDANDO después de restaurar...');
        if (!validarFormularioCompleto()) {
            showMessage('Por favor, corrija los errores en el formulario', 'error');
            return;
        }
    } else if (!esValido) {
        showMessage('Por favor, corrija los errores en el formulario', 'error');
        return;
    }
    
    // 2. Construir datos
    const datos = construirDatosPostulacion();
    
    // 3. Mostrar loading
    const btnEnviar = document.getElementById('btn-enviar-postulacion');
    const textoOriginal = btnEnviar.innerHTML;
    btnEnviar.disabled = true;
    btnEnviar.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2"></span>
        Enviando...
    `;
    
    try {
        console.log('📡 Enviando POST a /publico/postulaciones/registro...');
        
        const response = await fetch('http://localhost:8080/publico/postulaciones/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        
        console.log(`📡 Respuesta recibida: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            // Intentar parsear mensaje de error del backend
            let errorMsg = 'Error al enviar la postulación';
            try {
                const errorData = await response.json();
                console.log('📋 Datos de error del backend:', errorData);
                errorMsg = errorData.message || errorData.error || errorMsg;
            } catch (e) {
                // Si no se puede parsear, usar mensaje genérico basado en código HTTP
                console.warn('⚠️ No se pudo parsear respuesta de error del backend');
            }
            
            // Manejo específico según código HTTP
            if (response.status === 400) {
                // Bad Request - Datos inválidos
                throw new Error(`Datos inválidos: ${errorMsg}`);
                
            } else if (response.status === 404) {
                // Not Found - Oferta no existe
                throw new Error('La oferta laboral no existe o fue eliminada');
                
            } else if (response.status === 409) {
                // Conflict - Postulación duplicada (IllegalStateBusinessException)
                console.warn('⚠️ Postulación duplicada detectada');
                throw new Error(errorMsg || 'Ya se encuentra postulado a esta oferta laboral');
                
            } else if (response.status >= 500) {
                // Server Error - Error del servidor
                console.error(`🔴 Error del servidor (${response.status}):`, errorMsg);
                throw new Error('Error en el servidor. Por favor, intente nuevamente más tarde.');
                
            } else {
                // Otros errores HTTP (401, 403, 405, etc.)
                console.error(`⚠️ Error HTTP ${response.status}:`, errorMsg);
                throw new Error(`Error (${response.status}): ${errorMsg}`);
            }
        }
        
        // Parsear respuesta solo si tiene contenido
        let resultado = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                const text = await response.text();
                if (text && text.trim().length > 0) {
                    resultado = JSON.parse(text);
                    console.log('✅ Postulación enviada exitosamente:', resultado);
                } else {
                    console.log('✅ Postulación enviada exitosamente (sin respuesta del servidor)');
                }
            } catch (e) {
                console.warn('⚠️ Respuesta del servidor no es JSON válido, pero postulación fue exitosa');
            }
        } else {
            console.log('✅ Postulación enviada exitosamente (respuesta sin contenido JSON)');
        }
        
        // Mostrar mensaje de éxito
        showMessage('¡Postulación enviada exitosamente! La empresa se pondrá en contacto.', 'success');
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
            const modalElement = document.getElementById('modalPostulacion');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error enviando postulación:', error);
        showMessage(error.message || 'Error al enviar la postulación. Intente nuevamente.', 'error');
        
        // Restaurar botón
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = textoOriginal;
    }
}

/**
 * Cerrar modal y limpiar recursos
 */
function cerrarModalPostulacion() {
    console.log('🔒 Cerrando modal de postulación y limpiando recursos...');
    
    // Limpiar formulario
    const form = document.getElementById('form-postulacion');
    if (form) {
        form.reset();
        form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid');
        });
    }
    
    // Destruir mapa
    if (mapaPostulacion) {
        mapaPostulacion.remove();
        mapaPostulacion = null;
        marcadorPostulacion = null;
    }
    
    // Limpiar variable global
    window.ofertaActual = null;
    
    console.log('✅ Modal cerrado y recursos liberados');
}

/**
 * Variable para rastrear el marcador actualmente destacado
 */
let marcadorDestacadoActual = null;

/**
 * Función para mostrar oferta en el mapa con efectos visuales mejorados
 * @param {string} ofertaId - ID de la oferta
 */
function verEnMapa(ofertaId) {
    console.log('🗺️ Redirigiendo al mapa principal para oferta:', ofertaId);
    
    // Verificar que el DOM esté listo
    if (document.readyState !== 'complete') {
        console.log('⏳ Esperando a que el DOM esté completo...');
        setTimeout(() => verEnMapa(ofertaId), 100);
        return;
    }
    
    // Buscar el establecimiento correspondiente a la oferta
    const oferta = estadoOfertasPublicas.ofertas.find(o => o.idOfertaEmpleo.toString() === ofertaId);
    if (!oferta) {
        console.warn('❌ No se encontró la oferta:', ofertaId);
        return;
    }
    
    // Verificar si tiene ubicación
    if (!oferta.latitud || !oferta.longitud) {
        console.warn('📍 La oferta no tiene ubicación definida');
        alert('Esta oferta no tiene ubicación disponible en el mapa.');
        return;
    }
    
    // Hacer scroll suave hacia el mapa principal
    const mainMap = document.getElementById('main-map');
    if (mainMap) {
        mainMap.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
        });
        
        // Esperar a que termine el scroll y entonces trabajar con el mapa
        setTimeout(() => {
            buscarYDestacarUbicacion(oferta.latitud, oferta.longitud, oferta.nombreEmpresa || 'Ubicación de oferta');
        }, 800);
    } else {
        console.warn('❌ No se encontró el elemento main-map');
    }
}

// Función para buscar y destacar una ubicación específica en el mapa principal
function buscarYDestacarUbicacion(latitud, longitud, nombreEstablecimiento) {
    console.log('🎯 Buscando ubicación:', latitud, longitud, nombreEstablecimiento);
    
    // Verificar que el mapa principal esté inicializado
    if (!mapaPrincipal.instancia) {
        console.log('🔄 Inicializando mapa principal...');
        inicializarMapaPrincipal();
        
        // Esperar a que se inicialice y intentar de nuevo
        setTimeout(() => {
            buscarYDestacarUbicacion(latitud, longitud, nombreEstablecimiento);
        }, 1000);
        return;
    }
    
    // Verificar si hay marcadores cargados en el mapa principal
    if (mapaPrincipal.marcadores.length === 0) {
        console.log('📍 Cargando establecimientos en mapa principal...');
        cargarEstablecimientosEnMapa(mapaPrincipal.instancia);
        
        // Esperar a que se carguen los marcadores
        setTimeout(() => {
            buscarYDestacarUbicacion(latitud, longitud, nombreEstablecimiento);
        }, 1500);
        return;
    }
    
    // Limpiar destacados anteriores
    limpiarDestacados();
    
    // Buscar marcador por coordenadas (con tolerancia para diferencias mínimas)
    const marcadorEncontrado = mapaPrincipal.marcadores.find(item => {
        const latDiff = Math.abs(item.establecimiento.latitud - latitud);
        const lngDiff = Math.abs(item.establecimiento.longitud - longitud);
        return latDiff < 0.0001 && lngDiff < 0.0001; // Tolerancia de ~10 metros
    });
    
    if (marcadorEncontrado) {
        console.log('✅ Marcador encontrado, destacando...');
        destacarMarcador(marcadorEncontrado.marcador);
    } else {
        console.log('📍 Marcador no encontrado, centrando en ubicación...');
        // Si no hay marcador, simplemente centrar el mapa en la ubicación
        mapaPrincipal.instancia.flyTo([latitud, longitud], 15, {
            animate: true,
            duration: 1.5
        });
        
        // Crear un marcador temporal para la ubicación
        const marcadorTemporal = L.marker([latitud, longitud])
            .addTo(mapaPrincipal.instancia)
            .bindPopup(`<strong>${nombreEstablecimiento.toUpperCase()}</strong><br>Ubicación de oferta laboral`)
            .openPopup();
            
        // Agregar efecto de bounce
        setTimeout(() => {
            const iconElement = marcadorTemporal.getElement();
            if (iconElement) {
                iconElement.classList.add('marker-bounce');
            }
        }, 100);
    }
}

// Función para destacar un marcador específico
function destacarMarcador(marcador) {
    // Guardar referencia del marcador destacado
    mapaPrincipal.marcadorDestacado = marcador;
    
    // Centrar mapa en el marcador con animación
    const latlng = marcador.getLatLng();
    mapaPrincipal.instancia.flyTo(latlng, 16, {
        animate: true,
        duration: 1.5
    });
    
    // Abrir popup automáticamente después de la animación
    setTimeout(() => {
        marcador.openPopup();
        
        // Agregar efecto de bounce al marcador
        const iconElement = marcador.getElement();
        if (iconElement) {
            iconElement.classList.add('marker-bounce');
            
            // Remover la clase después de la animación
            setTimeout(() => {
                iconElement.classList.remove('marker-bounce');
            }, 1000);
        }
    }, 1600);
}

// Función para limpiar destacados anteriores
function limpiarDestacados() {
    if (mapaPrincipal.marcadorDestacado) {
        // Cerrar popup del marcador anterior
        mapaPrincipal.marcadorDestacado.closePopup();
        
        // Remover efectos visuales
        const iconElement = mapaPrincipal.marcadorDestacado.getElement();
        if (iconElement) {
            iconElement.classList.remove('marker-bounce', 'marker-highlight');
        }
        
        // Limpiar referencia
        mapaPrincipal.marcadorDestacado = null;
    }
}

/**
 * Ejecuta una secuencia profesional de efectos visuales
 * @param {L.Marker} marcador - Marcador de Leaflet
 * @param {Object} oferta - Datos de la oferta
 */
function ejecutarSecuenciaEfectos(marcador, oferta) {
    // 1. Limpiar estado anterior
    removerDestacadoAnterior();
    
    // 2. Esperar a que termine la animación del mapa
    setTimeout(() => {
        // 3. Aplicar efecto de identificación inicial
        aplicarEfectoIdentificacion(marcador);
        
        // 4. Después del flash, aplicar destacado permanente
        setTimeout(() => {
            aplicarDestacadoMarcador(marcador);
            
            // 5. Abrir popup mejorado
            mostrarPopupMejorado(marcador, oferta);
            
            // 6. Aplicar efectos visuales secuenciales
            setTimeout(() => {
                aplicarEfectosVisuales(marcador);
            }, 200);
            
            // 7. Guardar referencia del marcador actual
            marcadorDestacadoActual = marcador;
            
        }, 2500); // Esperar a que termine el flash
        
    }, 800); // Esperar a que termine flyTo
}

/**
 * Determina el nivel de zoom óptimo basado en el contexto de la oferta
 * @param {Object} oferta - Datos de la oferta
 * @returns {number} Nivel de zoom
 */
function determinarNivelZoomOptimo(oferta) {
    // Zoom más cercano para ubicaciones urbanas, más lejano para rurales
    // Basado en el tipo de especie o área de trabajo
    if (oferta.nombreEspecie && oferta.nombreEspecie.toLowerCase().includes('urbano')) {
        return 18; // Zoom muy cercano para áreas urbanas
    } else if (oferta.nombrePuestoTrabajo && oferta.nombrePuestoTrabajo.toLowerCase().includes('campo')) {
        return 14; // Zoom más lejano para visualizar el área rural
    } else {
        return 16; // Zoom estándar
    }
}

/**
 * Muestra un indicador visual de transición
 */
function mostrarIndicadorTransicion() {
    // Crear overlay temporal si no existe
    let overlay = document.getElementById('mapa-transition-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'mapa-transition-overlay';
        overlay.innerHTML = `
            <div class="d-flex flex-column align-items-center justify-content-center h-100">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <h5 class="text-primary">Ubicando en el mapa...</h5>
                <p class="text-muted">Preparando vista detallada</p>
            </div>
        `;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            backdrop-filter: blur(5px);
        `;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
}

/**
 * Oculta el indicador de transición
 */
function ocultarIndicadorTransicion() {
    const overlay = document.getElementById('mapa-transition-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.style.opacity = '1';
        }, 500);
    }
}

/**
 * Aplica efecto de identificación inicial (flash mejorado)
 * @param {L.Marker} marcador - Marcador de Leaflet
 */
function aplicarEfectoIdentificacion(marcador) {
    if (marcador && marcador._icon) {
        const iconElement = marcador._icon;
        iconElement.classList.add('marcador-flash');
        
        // Crear anillo de expansión
        const anillo = document.createElement('div');
        anillo.className = 'marcador-anillo-expansion';
        anillo.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40px;
            height: 40px;
            border: 3px solid #4A90E2;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: anillo-expansion 2s ease-out;
            pointer-events: none;
            z-index: 1000;
        `;
        
        iconElement.style.position = 'relative';
        iconElement.appendChild(anillo);
        
        // Remover el anillo después de la animación
        setTimeout(() => {
            if (anillo.parentNode) {
                anillo.remove();
            }
        }, 2000);
    }
}

/**
 * Muestra popup mejorado con información completa
 * @param {L.Marker} marcador - Marcador de Leaflet
 * @param {Object} oferta - Datos de la oferta
 */
function mostrarPopupMejorado(marcador, oferta) {
    const popupContent = `
        <div class="popup-oferta-destacada">
            <div class="popup-header">
                <h6 class="mb-2 text-primary fw-bold">
                    <i class="fas fa-briefcase me-2"></i>
                    ${oferta.nombrePuestoTrabajo}
                </h6>
                <div class="badge bg-success mb-2">${oferta.nombreEspecie}</div>
            </div>
            <div class="popup-body">
                <p class="mb-2">
                    <i class="fas fa-building me-2 text-muted"></i>
                    <strong>${oferta.nombreEstablecimiento.toUpperCase()}</strong>
                </p>
                <p class="mb-2">
                    <i class="fas fa-map-marker-alt me-2 text-danger"></i>
                    ${oferta.ubicacion || 'Ubicación registrada'}
                </p>
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <small class="text-muted">
                        <i class="fas fa-calendar me-1"></i>
                        Vigente hasta ${new Date(oferta.fechaCierreOferta).toLocaleDateString()}
                    </small>
                    <button class="btn btn-primary btn-sm" onclick="contactarEmpresa('${oferta.idOfertaEmpleo}')">
                        <i class="fas fa-phone me-1"></i>Postularse
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Configurar popup con estilo mejorado
    marcador.bindPopup(popupContent, {
        maxWidth: 350,
        minWidth: 250,
        className: 'popup-destacado-oferta'
    }).openPopup();
    
    // Aplicar estilos adicionales al popup
    setTimeout(() => {
        const popup = marcador.getPopup();
        if (popup && popup._container) {
            popup._container.classList.add('popup-destacado');
        }
    }, 100);
}

/**
 * Remueve el destacado del marcador anterior con efectos suaves
 */
function removerDestacadoAnterior() {
    if (marcadorDestacadoActual && marcadorDestacadoActual._icon) {
        const iconElement = marcadorDestacadoActual._icon;
        
        // Remover todas las clases de animación
        iconElement.classList.remove('marcador-destacado', 'marcador-rebote', 'marcador-flash');
        iconElement.style.animation = '';
        iconElement.style.filter = '';
        
        // Remover cualquier anillo de expansión existente
        const anillos = iconElement.querySelectorAll('.marcador-anillo-expansion');
        anillos.forEach(anillo => anillo.remove());
        
        // Remover estilo del popup anterior
        const popup = marcadorDestacadoActual.getPopup();
        if (popup && popup._container) {
            popup._container.classList.remove('popup-destacado', 'popup-destacado-oferta');
        }
        
        // Cerrar popup anterior si está abierto
        if (marcadorDestacadoActual.isPopupOpen()) {
            marcadorDestacadoActual.closePopup();
        }
    }
    
    // Remover clase del contenedor del mapa
    const mapaContainer = document.getElementById('mapa-ofertas-publicas');
    if (mapaContainer) {
        mapaContainer.classList.remove('marcador-destacado-activo');
    }
    
    // Limpiar referencia
    marcadorDestacadoActual = null;
}

/**
 * Aplica el destacado visual al marcador seleccionado con efectos mejorados
 * @param {L.Marker} marcador - Marcador de Leaflet
 */
function aplicarDestacadoMarcador(marcador) {
    if (marcador && marcador._icon) {
        const iconElement = marcador._icon;
        
        // Aplicar clase de marcador destacado
        iconElement.classList.add('marcador-destacado');
        
        // Añadir clase al contenedor del mapa para atenuar otros marcadores
        const mapaContainer = document.getElementById('mapa-ofertas-publicas');
        if (mapaContainer) {
            mapaContainer.classList.add('marcador-destacado-activo');
        }
        
        // Asegurar que el marcador esté en el frente
        marcador.setZIndexOffset(1000);
    }
}

/**
 * Aplica efectos visuales secuenciales al marcador con mejor control
 * @param {L.Marker} marcador - Marcador de Leaflet  
 */
function aplicarEfectosVisuales(marcador) {
    if (marcador && marcador._icon) {
        const iconElement = marcador._icon;
        
        // 1. Efecto de flash inicial para llamar la atención (ya aplicado en identificación)
        // Este paso se omite aquí porque ya se aplica en aplicarEfectoIdentificacion
        
        // 2. Aplicar efecto de rebote después de un breve delay
        setTimeout(() => {
            if (iconElement.classList.contains('marcador-destacado')) {
                iconElement.classList.add('marcador-rebote');
                
                // 3. Remover rebote y mantener solo el pulso continuo
                setTimeout(() => {
                    iconElement.classList.remove('marcador-rebote');
                }, 2400); // 0.8s * 3 repeticiones = 2.4s
            }
        }, 500);
    }
}

/**
 * Limpia todos los efectos de marcadores al cambiar de vista
 */
function limpiarEfectosMarcadores() {
    // Limpiar marcador destacado actual
    removerDestacadoAnterior();
    
    // Limpiar efectos de todos los marcadores en el mapa
    if (mapaOfertasPublicas.marcadores) {
        mapaOfertasPublicas.marcadores.forEach(item => {
            if (item.marcador && item.marcador._icon) {
                const iconElement = item.marcador._icon;
                iconElement.classList.remove('marcador-destacado', 'marcador-rebote', 'marcador-flash');
                iconElement.style.animation = '';
                iconElement.style.filter = '';
                
                // Remover anillos de expansión
                const anillos = iconElement.querySelectorAll('.marcador-anillo-expansion');
                anillos.forEach(anillo => anillo.remove());
            }
        });
    }
    
    // Remover clase del contenedor del mapa
    const mapaContainer = document.getElementById('mapa-ofertas-publicas');
    if (mapaContainer) {
        mapaContainer.classList.remove('marcador-destacado-activo');
    }
}

// ===========================
// SISTEMA DE GESTIÓN DE POSTULACIONES
// ===========================

/**
 * Cache global de postulaciones
 */
window.postulacionesCache = {};
window.totalPostulacionesNuevas = 0;

/**
 * Obtener postulaciones de una oferta específica
 * @param {number} idOferta - ID de la oferta de empleo
 * @returns {Promise<Array>} Array de postulaciones
 */
async function fetchPostulacionesPorOferta(idOferta) {
    try {
        console.log(`🔄 Obteniendo postulaciones para oferta ${idOferta}...`);
        
        const url = `http://localhost:8080/privado/postulaciones/oferta/${idOferta}`;
        const response = await fetchWithAuth(url);
        
        if (!response.ok) {
            // Manejo específico de errores HTTP
            if (response.status === 401) {
                throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
            } else if (response.status === 403) {
                throw new Error('No tiene permisos para ver estas postulaciones.');
            } else if (response.status === 404) {
                console.warn(`⚠️ No se encontraron postulaciones para la oferta ${idOferta}`);
                return []; // Retornar array vacío en lugar de error
            } else if (response.status >= 500) {
                throw new Error('Error del servidor. Intente nuevamente más tarde.');
            } else {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        }
        
        const postulaciones = await response.json();
        console.log(`✅ ${postulaciones.length} postulaciones obtenidas para oferta ${idOferta}`);
        
        // Actualizar cache
        actualizarCachePostulaciones(idOferta, postulaciones);
        
        return postulaciones;
        
    } catch (error) {
        console.error(`❌ Error obteniendo postulaciones para oferta ${idOferta}:`, error);
        
        // Si es error de autenticación, redirigir a login
        if (error.message.includes('Sesión expirada')) {
            setTimeout(() => {
                cerrarSesion();
            }, 2000);
        }
        
        throw error;
    }
}

/**
 * Actualizar cache de postulaciones
 */
function actualizarCachePostulaciones(idOferta, postulaciones) {
    if (!window.postulacionesCache) {
        window.postulacionesCache = {};
    }
    
    window.postulacionesCache[idOferta] = {
        data: postulaciones,
        timestamp: Date.now(),
        count: postulaciones.length
    };
}

/**
 * Obtener postulaciones desde cache (si está fresco)
 */
function obtenerPostulacionesDesdeCache(idOferta, maxAge = 60000) {
    if (!window.postulacionesCache || !window.postulacionesCache[idOferta]) {
        return null;
    }
    
    const cached = window.postulacionesCache[idOferta];
    const age = Date.now() - cached.timestamp;
    
    if (age > maxAge) {
        console.log('⚠️ Cache expirado, se necesita refresh');
        return null;
    }
    
    console.log('✅ Usando datos desde cache');
    return cached.data;
}

/**
 * Formatear fecha de postulación a formato amigable
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
function formatearFechaPostulacion(fechaISO) {
    try {
        const fecha = new Date(fechaISO);
        const ahora = new Date();
        const diffMs = ahora - fecha;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) {
            return 'Hace un momento';
        } else if (diffMins < 60) {
            return `Hace ${diffMins} min`;
        } else if (diffHours < 24) {
            return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        } else if (diffDays < 7) {
            return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        } else {
            return fecha.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return 'Fecha no disponible';
    }
}

/**
 * Abrir modal de postulaciones
 */
async function abrirModalPostulaciones(idOferta) {
    console.log(`🎯 Abriendo modal de postulaciones para oferta ${idOferta}`);
    
    // Obtener modal
    const modalElement = document.getElementById('modalPostulaciones');
    if (!modalElement) {
        console.error('❌ Modal de postulaciones no encontrado');
        showMessage('Error: Modal no encontrado', 'error');
        return;
    }
    
    // Obtener datos de la oferta para el título
    const oferta = obtenerDatosOfertaDesdeCache(idOferta);
    
    // Actualizar título del modal
    const tituloElement = document.getElementById('modal-oferta-titulo');
    if (tituloElement) {
        tituloElement.textContent = oferta?.nombrePuesto || `Oferta #${idOferta}`;
    }
    
    // Mostrar modal
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // Mostrar loading state
    mostrarEstadoPostulacionesLoading();
    
    try {
        // Obtener postulaciones
        const postulaciones = await fetchPostulacionesPorOferta(idOferta);
        
        // Renderizar postulaciones
        renderizarPostulaciones(postulaciones);
        
        // Marcar como vistas
        marcarPostulacionesComoVistas(idOferta, postulaciones);
        
        // Actualizar badge de la oferta
        actualizarBadgeOferta(idOferta, postulaciones.length, false);
        
        // Recalcular contador global
        await recalcularContadorGlobal();
        
    } catch (error) {
        mostrarEstadoPostulacionesError(error.message);
    }
}

/**
 * Mostrar estado de loading en modal de postulaciones
 */
function mostrarEstadoPostulacionesLoading() {
    document.getElementById('postulaciones-loading')?.classList.remove('d-none');
    document.getElementById('postulaciones-empty')?.classList.add('d-none');
    document.getElementById('postulaciones-error')?.classList.add('d-none');
    document.getElementById('postulaciones-table-container')?.classList.add('d-none');
}

/**
 * Mostrar estado de error en modal de postulaciones
 */
function mostrarEstadoPostulacionesError(mensaje) {
    document.getElementById('postulaciones-loading')?.classList.add('d-none');
    document.getElementById('postulaciones-empty')?.classList.add('d-none');
    document.getElementById('postulaciones-table-container')?.classList.add('d-none');
    
    const errorDiv = document.getElementById('postulaciones-error');
    const errorMensaje = document.getElementById('error-mensaje');
    
    if (errorDiv && errorMensaje) {
        errorMensaje.textContent = mensaje;
        errorDiv.classList.remove('d-none');
    }
}

/**
 * Renderizar tabla de postulaciones
 */
function renderizarPostulaciones(postulaciones) {
    const tbody = document.getElementById('postulaciones-tbody');
    const totalBadge = document.getElementById('modal-total-postulaciones');
    
    // Ocultar loading
    document.getElementById('postulaciones-loading')?.classList.add('d-none');
    document.getElementById('postulaciones-error')?.classList.add('d-none');
    
    if (!postulaciones || postulaciones.length === 0) {
        // Mostrar estado vacío
        document.getElementById('postulaciones-empty')?.classList.remove('d-none');
        document.getElementById('postulaciones-table-container')?.classList.add('d-none');
        if (totalBadge) totalBadge.textContent = '0 candidatos';
        return;
    }
    
    // Mostrar tabla
    document.getElementById('postulaciones-empty')?.classList.add('d-none');
    document.getElementById('postulaciones-table-container')?.classList.remove('d-none');
    
    if (totalBadge) {
        totalBadge.textContent = `${postulaciones.length} candidato${postulaciones.length > 1 ? 's' : ''}`;
    }
    
    // Generar filas
    if (tbody) {
        tbody.innerHTML = postulaciones.map((postulacion, index) => {
            const persona = postulacion.persona;
            const fechaFormateada = formatearFechaPostulacion(postulacion.fechaPostulacion);
            
            return `
                <tr data-persona-id="${persona.idPersona}">
                    <td class="text-center">${index + 1}</td>
                    <td>
                        <code class="text-light bg-dark px-2 py-1 rounded">${persona.dni}</code>
                    </td>
                    <td>
                        <strong class="text-white">${persona.apellido}, ${persona.nombre}</strong>
                    </td>
                    <td>
                        <a href="tel:${persona.telefono}" class="text-info text-decoration-none">
                            <i class="fas fa-phone me-1"></i>${persona.telefono}
                        </a>
                    </td>
                    <td>
                        <small class="text-muted">
                            <i class="fas fa-map-marker-alt me-1"></i>
                            ${persona.nombreDistrito}, ${persona.nombreDepartamento}
                        </small>
                    </td>
                    <td>
                        <span class="badge bg-secondary" title="${postulacion.fechaPostulacion}">
                            <i class="fas fa-clock me-1"></i>${fechaFormateada}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-info" 
                                onclick="verUbicacionPostulante(${persona.latitud}, ${persona.longitud}, '${persona.apellido}, ${persona.nombre}')"
                                title="Ver ubicación en mapa">
                            <i class="fas fa-map-marked-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

/**
 * Ver ubicación del postulante en el mapa
 */
function verUbicacionPostulante(lat, lng, nombre) {
    console.log(`📍 Ver ubicación de ${nombre}: [${lat}, ${lng}]`);
    
    // Crear un mini modal o alert con el mapa
    showMessage(`Ubicación de ${nombre}: Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`, 'info');
    
    // TODO: Implementar modal con mapa Leaflet si se requiere
}

/**
 * Obtener datos de oferta desde cache/DOM
 */
function obtenerDatosOfertaDesdeCache(idOferta) {
    // Buscar en el DOM la card de la oferta
    const cardElement = document.querySelector(`[data-oferta-id="${idOferta}"]`);
    if (cardElement) {
        const nombrePuesto = cardElement.closest('.oferta-card')?.querySelector('.oferta-title')?.textContent?.trim();
        return { idOfertaEmpleo: idOferta, nombrePuesto };
    }
    return null;
}

/**
 * Marcar postulaciones como vistas
 */
function marcarPostulacionesComoVistas(idOferta, postulaciones) {
    try {
        const key = `postulaciones_vistas`;
        const vistas = JSON.parse(localStorage.getItem(key) || '{}');
        
        vistas[`oferta_${idOferta}`] = {
            lastViewed: new Date().toISOString(),
            viewedPostulaciones: postulaciones.map(p => p.persona.idPersona),
            totalCount: postulaciones.length
        };
        
        localStorage.setItem(key, JSON.stringify(vistas));
        console.log(`✅ Postulaciones de oferta ${idOferta} marcadas como vistas`);
    } catch (error) {
        console.error('Error guardando postulaciones vistas:', error);
    }
}

/**
 * Obtener postulaciones no vistas
 */
function obtenerPostulacionesNoVistas(idOferta) {
    try {
        const key = `postulaciones_vistas`;
        const vistas = JSON.parse(localStorage.getItem(key) || '{}');
        const ofertaKey = `oferta_${idOferta}`;
        
        if (!vistas[ofertaKey]) {
            return null; // Nunca vistas
        }
        
        return vistas[ofertaKey];
    } catch (error) {
        console.error('Error obteniendo postulaciones vistas:', error);
        return null;
    }
}

/**
 * Actualizar badge de una oferta
 */
function actualizarBadgeOferta(idOferta, count, esNueva = false) {
    const badgeElement = document.getElementById(`badge-oferta-${idOferta}`);
    if (badgeElement) {
        badgeElement.textContent = count;
        
        if (count === 0) {
            badgeElement.style.display = 'none';
        } else {
            badgeElement.style.display = 'inline-block';
            
            if (esNueva) {
                badgeElement.classList.add('badge-nuevas');
            } else {
                badgeElement.classList.remove('badge-nuevas');
            }
        }
    }
}

/**
 * Recalcular contador global de postulaciones
 */
async function recalcularContadorGlobal() {
    console.log('🔄 Recalculando contador global de postulaciones...');
    
    try {
        // Obtener todas las ofertas del cache
        const ofertasElements = document.querySelectorAll('[data-oferta-id]');
        const idsOfertas = Array.from(ofertasElements).map(el => el.getAttribute('data-oferta-id'));
        
        let totalPostulaciones = 0;
        let totalNuevas = 0;
        
        // Procesar cada oferta
        for (const idOferta of idsOfertas) {
            try {
                const cached = window.postulacionesCache[idOferta];
                if (cached) {
                    const vistas = obtenerPostulacionesNoVistas(idOferta);
                    const countNuevas = vistas ? Math.max(0, cached.count - vistas.viewedPostulaciones.length) : cached.count;
                    
                    console.log(`📊 Oferta ${idOferta}: ${cached.count} postulaciones (${countNuevas} nuevas)`);
                    
                    totalPostulaciones += cached.count;
                    totalNuevas += countNuevas;
                }
            } catch (error) {
                console.error(`Error procesando oferta ${idOferta}:`, error);
            }
        }
        
        // Actualizar stats card
        actualizarStatsCardSolicitudes(totalNuevas, totalPostulaciones);
        
        // Mostrar/ocultar banner
        if (totalNuevas > 0 && !esBannerDismissed()) {
            mostrarBannerPostulaciones(totalNuevas);
        } else {
            ocultarBannerPostulaciones();
        }
        
        console.log(`✅ Contador global actualizado: ${totalPostulaciones} total, ${totalNuevas} nuevas`);
        
        // Guardar en variable global
        window.totalPostulacionesNuevas = totalNuevas;
        
    } catch (error) {
        console.error('❌ Error recalculando contador global:', error);
    }
}

/**
 * Actualizar stats card de solicitudes
 */
function actualizarStatsCardSolicitudes(countNuevas, countTotal = null) {
    const contadorElement = document.querySelector('[data-contador="solicitudes"]');
    if (contadorElement) {
        // Animar el contador
        animarContador(contadorElement, parseInt(contadorElement.textContent) || 0, countNuevas);
        
        // Agregar clase de pulsación si hay nuevas
        const statsCard = contadorElement.closest('.stats-card-moderna');
        if (statsCard) {
            if (countNuevas > 0) {
                statsCard.classList.add('stats-card-pulse');
            } else {
                statsCard.classList.remove('stats-card-pulse');
            }
        }
    }
}

/**
 * Animar contador con efecto de incremento
 */
function animarContador(element, desde, hasta) {
    const duracion = 1000;
    const paso = (hasta - desde) / (duracion / 16);
    let actual = desde;
    
    const interval = setInterval(() => {
        actual += paso;
        if ((paso > 0 && actual >= hasta) || (paso < 0 && actual <= hasta)) {
            element.textContent = hasta;
            clearInterval(interval);
        } else {
            element.textContent = Math.floor(actual);
        }
    }, 16);
}

/**
 * Mostrar banner de postulaciones nuevas
 */
function mostrarBannerPostulaciones(count) {
    let banner = document.getElementById('banner-postulaciones');
    
    if (!banner) {
        // Crear banner si no existe
        banner = crearBannerPostulaciones();
    }
    
    // Actualizar contador
    const countElement = document.getElementById('banner-count');
    if (countElement) {
        countElement.textContent = count;
    }
    
    // Mostrar banner
    banner.style.display = 'block';
}

/**
 * Crear banner de notificaciones
 */
function crearBannerPostulaciones() {
    const banner = document.createElement('div');
    banner.id = 'banner-postulaciones';
    banner.className = 'alert alert-postulaciones-nuevas alert-dismissible fade show';
    banner.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-bell fa-2x text-warning me-3 bell-animated"></i>
            <div class="flex-grow-1">
                <h6 class="alert-heading mb-1 text-white">
                    ¡Tienes <strong id="banner-count">0</strong> postulaciones nuevas!
                </h6>
                <p class="mb-0 small text-white-50">
                    Revisa las solicitudes de empleo pendientes
                </p>
            </div>
            <button class="btn btn-warning btn-sm me-3" onclick="scrollToOfertas()">
                <i class="fas fa-arrow-down me-1"></i>Ver Ofertas
            </button>
        </div>
        <button type="button" class="btn-close btn-close-white" onclick="dismissBannerPostulaciones()"></button>
    `;
    
    // Insertar después del header de perfil en el dashboard
    const dashboardContent = document.getElementById('dashboard-content');
    if (dashboardContent) {
        dashboardContent.insertBefore(banner, dashboardContent.firstChild);
    }
    
    return banner;
}

/**
 * Ocultar banner de postulaciones
 */
function ocultarBannerPostulaciones() {
    const banner = document.getElementById('banner-postulaciones');
    if (banner) {
        banner.style.display = 'none';
    }
}

/**
 * Dismiss banner de postulaciones
 */
function dismissBannerPostulaciones() {
    ocultarBannerPostulaciones();
    
    // Guardar estado en localStorage
    try {
        const estado = {
            dismissed: true,
            lastDismissed: new Date().toISOString()
        };
        localStorage.setItem('notificaciones_banner', JSON.stringify(estado));
    } catch (error) {
        console.error('Error guardando estado de banner:', error);
    }
}

/**
 * Verificar si el banner fue dismissed
 */
function esBannerDismissed() {
    try {
        const estado = JSON.parse(localStorage.getItem('notificaciones_banner') || '{}');
        
        // Si fue dismissed hace menos de 24 horas, no mostrar
        if (estado.dismissed && estado.lastDismissed) {
            const lastDismissed = new Date(estado.lastDismissed);
            const ahora = new Date();
            const diffHours = (ahora - lastDismissed) / 3600000;
            
            return diffHours < 24;
        }
        
        return false;
    } catch (error) {
        console.error('Error verificando estado de banner:', error);
        return false;
    }
}

/**
 * Scroll to ofertas section
 */
function scrollToOfertas() {
    const ofertasSection = document.getElementById('ofertas-content');
    if (ofertasSection) {
        ofertasSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Dismiss banner después de scroll
        setTimeout(() => {
            dismissBannerPostulaciones();
        }, 500);
    }
}

/**
 * Cargar contadores de postulaciones para todas las ofertas
 */
async function cargarContadoresPostulaciones() {
    console.log('🔄 Cargando contadores de postulaciones...');
    
    try {
        // Obtener todas las ofertas del DOM
        const ofertasElements = document.querySelectorAll('[data-oferta-id]');
        const idsOfertas = Array.from(ofertasElements).map(el => el.getAttribute('data-oferta-id'));
        
        console.log(`📊 ${idsOfertas.length} ofertas encontradas`);
        
        // Cargar postulaciones en paralelo
        const promises = idsOfertas.map(async (idOferta) => {
            try {
                const postulaciones = await fetchPostulacionesPorOferta(idOferta);
                const vistas = obtenerPostulacionesNoVistas(idOferta);
                const esNueva = !vistas || postulaciones.length > vistas.totalCount;
                
                // Actualizar badge
                actualizarBadgeOferta(idOferta, postulaciones.length, esNueva);
                
                return postulaciones.length;
            } catch (error) {
                console.error(`Error cargando postulaciones de oferta ${idOferta}:`, error);
                return 0;
            }
        });
        
        await Promise.all(promises);
        
        // Recalcular contador global
        await recalcularContadorGlobal();
        
        console.log('✅ Contadores de postulaciones cargados');
        
    } catch (error) {
        console.error('❌ Error cargando contadores:', error);
    }
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

/* ===================================
     MÓDULO: BÚSQUEDA Y AUTOCOMPLETADO POR DNI
     Detecta DNI en el formulario, consulta:
         GET http://localhost:8080/publico/personas/buscar/{dni}
     y autocompleta los campos si existe la persona.
     - Debounce en input
     - Timeout y retry en fetch
     - Selectores flexibles (id/name)
     - Crea spinner / mensaje si no están
     =================================== */

(function(){
    const API_BASE = 'http://localhost:8080/publico/personas';
    const TIMEOUT_MS = 6000;
    const DEBOUNCE_MS = 400;
    const RETRY_ATTEMPTS = 2;

    function findDniInput() {
        const candidates = ['#dni-postulacion', '#dni', '#dniInput', 'input[name="dni"]', '.dni-lookup'];
        for (const sel of candidates) {
            const el = document.querySelector(sel);
            if (el) return el;
        }
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="tel"]'));
        for (const i of inputs) {
            const patt = i.getAttribute('pattern') || '';
            if (patt.includes('0-9') || /\d\{7,8\}/.test(patt)) return i;
        }
        return null;
    }

    function createHelperElements(dniEl) {
        let spinner = document.getElementById('dni-search-spinner');
        let msg = document.getElementById('dni-search-msg');
        if (!spinner) {
            spinner = document.createElement('span');
            spinner.id = 'dni-search-spinner';
            spinner.className = 'spinner-border spinner-border-sm ms-2';
            spinner.style.display = 'none';
            spinner.setAttribute('role','status');
            spinner.innerHTML = '<span class="visually-hidden">Cargando...</span>';
            dniEl.insertAdjacentElement('afterend', spinner);
        }
        if (!msg) {
            msg = document.createElement('div');
            msg.id = 'dni-search-msg';
            msg.className = 'form-text mt-1';
            msg.setAttribute('aria-live','polite');
            spinner.insertAdjacentElement('afterend', msg);
        }
        return {spinner, msg};
    }

    function setLoading(isLoading) {
        const s = document.getElementById('dni-search-spinner');
        if (!s) return; s.style.display = isLoading ? 'inline-block' : 'none';
    }
    function showInlineMessage(text) {
        const el = document.getElementById('dni-search-msg'); if (!el) return; el.textContent = text;
    }

    function fetchWithTimeout(resource, options = {}, timeout = TIMEOUT_MS) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        return fetch(resource, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
    }

    async function fetchWithRetry(url, opts = {}, attempts = RETRY_ATTEMPTS) {
        let lastErr;
        for (let i=0;i<=attempts;i++) {
            try { return await fetchWithTimeout(url, opts); } catch(err) { lastErr = err; if (i<attempts) await new Promise(r=>setTimeout(r,300*(i+1))); }
        }
        throw lastErr;
    }

    function findField(fieldNames) {
        for (const nm of fieldNames) {
            if (nm.startsWith('#')) { const el = document.querySelector(nm); if (el) return el; continue; }
            const byName = document.querySelector(`[name="${nm}"]`); if (byName) return byName;
            const ids = [`${nm}-postulacion`, nm, `${nm}Input`];
            for (const id of ids) { const el = document.getElementById(id); if (el) return el; }
        }
        return null;
    }

    function populateForm(data) {
        const map = {
            dni: ['dni','dni-postulacion','#dni','#dniInput'],
            nombre: ['nombre','nombre-postulacion','#nombre'],
            apellido: ['apellido','apellido-postulacion','#apellido'],
            calle: ['calle','calle-postulacion','#calle'],
            numeracion: ['numeracion','numeracion-postulacion','#numeracion'],
            telefono: ['telefono','telefono-postulacion','#telefono'],
            nombreDistrito: ['nombreDistrito','distrito','distrito-postulacion','#distrito'],
            nombreDepartamento: ['nombreDepartamento','departamento','departamento-postulacion','#departamento']
        };
        for (const [key, variants] of Object.entries(map)) {
            const el = findField(variants); if (!el) continue;
            const value = (data[key] === undefined || data[key] === null) ? '' : String(data[key]);
            el.value = value; el.classList.add('field-autofill'); el.disabled = false;
        }
    }

    function clearForm(keepDni=true) {
        const fields = ['nombre','apellido','calle','numeracion','telefono','nombreDistrito','nombreDepartamento'];
        for (const f of fields) { const el = findField([f]); if (!el) continue; el.value = ''; el.classList.remove('field-autofill'); }
        if (!keepDni) { const dni = findField(['dni']); if (dni) dni.value = ''; }
    }

    function validateDniFormat(dni) { return /^[0-9]{7,8}$/.test((dni||'').trim()); }

    async function buscarYAutocompletar(dni) {
        const url = `${API_BASE}/buscar/${encodeURIComponent(dni)}`;
        setLoading(true); showInlineMessage('Buscando...');
        try {
            const res = await fetchWithRetry(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
            if (res.status === 200) { const json = await res.json(); populateForm({ dni: json.dni, nombre: json.nombre, apellido: json.apellido, calle: json.calle, numeracion: json.numeracion, telefono: json.telefono, nombreDistrito: json.nombreDistrito, nombreDepartamento: json.nombreDepartamento }); showInlineMessage('Usuario encontrado.'); }
            else if (res.status === 404) { clearForm(true); showInlineMessage('No existe. Complete los datos.'); }
            else { showInlineMessage('Errores del servidor'); console.error('Unexpected response', res); }
        } catch(err) { if (err.name==='AbortError') showInlineMessage('Tiempo de espera agotado'); else showInlineMessage('Error de red'); console.error(err); }
        finally { setLoading(false); }
    }

    function debounce(fn, wait=DEBOUNCE_MS) { let t; return function(...args){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), wait); }; }

    function initDniModule() {
        // DESACTIVADO - Conflicto con autocompletarDatosPersona()
        console.log('⚠️ Módulo DNI alternativo DESACTIVADO para evitar conflictos');
        return;
        
        const dniEl = findDniInput(); if (!dniEl) { console.log('DNI lookup: campo no encontrado'); return; }
        createHelperElements(dniEl);
        const doSearch = debounce((e)=>{ const v = (e.target.value||'').trim(); if (!v) return; if (!validateDniFormat(v)) { showInlineMessage('DNI inválido (7-8 dígitos)'); return; } buscarYAutocompletar(v); }, DEBOUNCE_MS);
        dniEl.addEventListener('input', doSearch);
        dniEl.addEventListener('blur', (e)=>{ const v=(e.target.value||'').trim(); if (validateDniFormat(v)) buscarYAutocompletar(v); });
        dniEl.addEventListener('keydown', (e)=>{ if (e.key==='Enter'){ e.preventDefault(); const v=dniEl.value.trim(); if (validateDniFormat(v)) buscarYAutocompletar(v); else showInlineMessage('DNI inválido'); } });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDniModule); else initDniModule();

})();