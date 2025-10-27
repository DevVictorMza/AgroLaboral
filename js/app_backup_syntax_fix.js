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
        DEPARTAMENTOS: '/publico/departamentos',
        DISTRITOS: '/publico/distritos',
        ESPECIES: '/privado/especies',
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
        throw new Error('No hay token de autenticación');
    }

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
    };
    
    // Usar directamente la URL que se pasa, no construirla de nuevo
    return fetchWithConfig(url, { ...defaultOptions, ...options });
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

        // Generar contenido del dashboard
        generarDashboard(perfil);

        // Abrir el offcanvas del dashboard automáticamente tras login
        const dashboardOffcanvas = new bootstrap.Offcanvas(document.getElementById('dashboardOffcanvas'));
        dashboardOffcanvas.show();

    } catch (error) {
        console.error('❌ Error cargando perfil:', error);
        mostrarErrorPerfil(error.message);
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
    const dashboardContent = document.getElementById('dashboard-content');
    
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
                text-align: center;
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
        </style>
        
        <div class="dashboard-container">
            <!-- Header del perfil -->
            <div class="profile-header">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h3 class="mb-0">${perfil.razonSocial}</h3>
                        <p class="mb-1 opacity-75">CUIT: ${perfil.cuit}</p>
                        <small class="opacity-75">
                            <i class="fas fa-calendar-alt me-1"></i>
                            Miembro desde: ${new Date(perfil.fechaAlta).toLocaleDateString()}
                        </small>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="avatar-lg">
                            <i class="fas fa-building fa-3x"></i>
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

            <!-- Información de la empresa -->
            <div class="row mt-4">
                <div class="col-12">
                    <div class="dashboard-card p-4">
                        <h5 class="mb-4">
                            <i class="fas fa-building me-2 text-success"></i>
                            Datos de la Empresa
                        </h5>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <div class="text-muted-custom small">ID Empresa</div>
                                <p class="mb-0 fw-bold">${perfil.idEmpresa}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <div class="text-muted-custom small">CUIT</div>
                                <p class="mb-0 fw-bold">${perfil.cuit}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <div class="text-muted-custom small">Razón Social</div>
                                <p class="mb-0 fw-bold">${perfil.razonSocial}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <div class="text-muted-custom small">Fecha de Alta</div>
                                <p class="mb-0 fw-bold">${new Date(perfil.fechaAlta).toLocaleString()}</p>
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
    
    // Deshabilitar botones durante el proceso
    btnConfirmar.disabled = true;
    btnVolver.disabled = true;
    btnConfirmar.innerHTML = '<div class="spinner-border spinner-border-sm me-2" role="status"></div>Registrando establecimiento...';

    try {
        // Logs de debugging para JWT
        logTokenDebugInfo('confirmarRegistro');
        
        // Preparar datos exactamente como espera el DTO del backend
        const datosEnvio = {
            nombreEstablecimiento: wizardData.datos.nombreEstablecimiento,
            calle: wizardData.datos.calle,
            numeracion: wizardData.datos.numeracion,
            codigoPostal: wizardData.datos.codigoPostal,
            latitud: wizardData.datos.latitud,
            longitud: wizardData.datos.longitud,
            idDistrito: wizardData.datos.idDistrito,
            idsEspecies: wizardData.datos.idsEspecies
        };

        // Validar datos antes del envío
        console.log('📋 Validando datos de envío:', datosEnvio);
        
        if (!datosEnvio.nombreEstablecimiento || !datosEnvio.calle || !datosEnvio.numeracion || 
            !datosEnvio.codigoPostal || !datosEnvio.idDistrito || !datosEnvio.idsEspecies?.length) {
            throw new Error('Faltan datos obligatorios para el registro');
        }

        // Ejecutar registro con retry automático de token
        const establecimientoRegistrado = await executeWithTokenRetry(async () => {
            
            const url = buildURL(BACKEND_CONFIG.ENDPOINTS.REGISTER_FINCA);
            console.log('📡 Enviando petición a:', url);
            console.log('📤 Datos a enviar:', JSON.stringify(datosEnvio, null, 2));

            // Realizar petición autenticada al backend
            const response = await fetchWithAuth(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosEnvio)
            });

            console.log('📡 Respuesta del servidor - Status:', response.status);
            console.log('📡 Respuesta del servidor - Headers:', [...response.headers.entries()]);

            // Manejo específico de errores HTTP
            if (!response.ok) {
                let errorMessage = 'Error desconocido del servidor';
                
                try {
                    const errorData = await response.json();
                    console.error('❌ Error del servidor:', errorData);
                    
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
            console.log('✅ Establecimiento registrado exitosamente:', establecimiento);

            // Validar estructura de respuesta
            if (!establecimiento) {
                throw new Error('Respuesta vacía del servidor');
            }
            
            return establecimiento;
            
        }, 'Registro de Establecimiento');

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
        console.log('� Validando datos de envío:', datosEnvio);
        
        if (!datosEnvio.nombreEstablecimiento || !datosEnvio.calle || !datosEnvio.numeracion || 
            !datosEnvio.codigoPostal || !datosEnvio.idDistrito || !datosEnvio.idsEspecies?.length) {
            throw new Error('Faltan datos obligatorios para el registro');
        }

        // Construir URL del endpoint
        const url = buildURL(BACKEND_CONFIG.ENDPOINTS.REGISTER_FINCA);
        console.log('📡 Enviando petición a:', url);
        console.log('📤 Datos a enviar:', JSON.stringify(datosEnvio, null, 2));

        // Realizar petición autenticada al backend
        const response = await fetchWithAuth(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosEnvio)
        });

        console.log('📡 Respuesta del servidor - Status:', response.status);
        console.log('📡 Respuesta del servidor - Headers:', [...response.headers.entries()]);

        // Manejo específico de errores HTTP
        if (!response.ok) {
            let errorMessage = 'Error desconocido del servidor';
            
            try {
                const errorData = await response.json();
                console.error('❌ Error del servidor:', errorData);
                
                switch (response.status) {
                    case 401:
                        console.error('❌ Token expirado o inválido');
                        // Cerrar sesión automáticamente
                        cerrarSesion();
                        throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
                        
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
        const establecimientoRegistrado = await response.json();
        console.log('✅ Establecimiento registrado exitosamente:', establecimientoRegistrado);

        // Validar estructura de respuesta
        if (!establecimientoRegistrado) {
            throw new Error('Respuesta vacía del servidor');
        }

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
    
    // Actualizar la sección de establecimientos en el dashboard
    const emptyFincas = document.getElementById('empty-fincas');
    if (emptyFincas) {
        emptyFincas.innerHTML = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <div class="establecimiento-card p-3 border border-success rounded">
                        <h6 class="text-success mb-2">
                            <i class="fas fa-check-circle me-2"></i>
                            ${establecimiento.nombreEstablecimiento || establecimiento.nombre}
                        </h6>
                        <p class="text-muted small mb-2">
                            <i class="fas fa-map-marker-alt me-1"></i>
                            ${wizardData.datosDisplay?.direccion || 'Dirección no disponible'}
                        </p>
                        <p class="text-muted small mb-2">
                            <i class="fas fa-seedling me-1"></i>
                            ${wizardData.datosDisplay?.especies?.length || 0} especie(s) cultivada(s)
                        </p>
                        <p class="text-muted small mb-0">
                            <i class="fas fa-id-badge me-1"></i>
                            ID: ${establecimiento.idEstablecimiento || establecimiento.id}
                        </p>
                        <span class="badge bg-success mt-2">Registrado recientemente</span>
                    </div>
                </div>
                <div class="col-md-6 mb-3 d-flex align-items-center justify-content-center">
                    <button class="btn btn-outline-primary" onclick="abrirWizardFinca()">
                        <i class="fas fa-plus me-2"></i>Agregar Otro Establecimiento
                    </button>
                </div>
            </div>
        `;
    }

    // Actualizar contador de establecimientos (buscar el primer stats-card)
    const statsNumbers = document.querySelectorAll('.stats-card .stats-number');
    if (statsNumbers.length > 0 && statsNumbers[0].textContent === '0') {
        statsNumbers[0].textContent = '1';
    }

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

		return datosRegistro;	} catch (error) {
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
	return localStorage.getItem(AUTH_CONFIG.storage.tokenKey);
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
			const tokenValidation = validateCurrentToken();
			
			if (!tokenValidation.valid) {
				console.log(`🔐 Token inválido: ${tokenValidation.reason}`);
				
				if (tokenValidation.reason === 'NO_TOKEN') {
					throw new Error('No hay token de autenticación. Debe iniciar sesión.');
				}
				
				// Intentar renovar token
				const refreshResult = await autoRefreshToken();
				if (!refreshResult.success) {
					throw new Error(`No se pudo renovar el token: ${refreshResult.error}`);
				}
			} else if (tokenValidation.nearExpiry && attempt === 1) {
				console.log('🔐 Token próximo a expirar, renovando preventivamente...');
				await autoRefreshToken();
			}
			
			// Ejecutar operación
			const result = await operation();
			console.log(`✅ ${operationName} ejecutada exitosamente`);
			return result;
			
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
			
			// Agregar event listener para continuar registro
			document.getElementById('btn-continuar-registro').addEventListener('click', function(e) {
				e.preventDefault();
				abrirWizardRegistro();
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
	const puertosProbar = [3001, 3000, 8080];
	
	for (const puerto of puertosProbar) {
		try {
			const response = await fetch(`http://localhost:${puerto}/api/geocoding?q=test`, {
				method: 'GET',
				timeout: 2000,
				signal: AbortSignal.timeout(2000)
			});
			
			if (response.ok || response.status === 400) { // 400 es OK, significa que el endpoint existe
				console.log(`✅ Servidor proxy encontrado en puerto ${puerto}`);
				return `http://localhost:${puerto}`;
			}
		} catch (error) {
			console.log(`❌ Puerto ${puerto} no disponible:`, error.message);
		}
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