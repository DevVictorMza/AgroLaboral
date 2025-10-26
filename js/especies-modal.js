// ================================
// ESPECIES MODAL - SISTEMA PROFESIONAL RESPONSIVE
// ================================

// Variables globales para especies
let especiesDisponibles = [];
let especiesSeleccionadas = [];
const maxEspecies = 5;

// Función para cargar especies desde el backend
async function cargarEspecies() {
    try {
        console.log('🌱 Cargando especies...');
        
        // Mostrar loading
        const grid = document.getElementById('especiesGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="text-center p-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando especies...</span>
                    </div>
                    <p class="mt-2 text-muted">Cargando especies...</p>
                </div>
            `;
        }
        
        try {
            const response = await fetch('http://localhost:8080/publico/especies');
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const especies = await response.json();
            console.log('✅ Especies cargadas desde servidor:', especies);
            
            especiesDisponibles = especies;
            renderizarEspeciesGrid();
            
        } catch (serverError) {
            console.warn('⚠️ Error del servidor, usando datos de respaldo:', serverError);
            usarDatosRespaldo();
        }
        
    } catch (error) {
        console.error('❌ Error crítico al cargar especies:', error);
        mostrarErrorEspecies();
    }
}

// Función para usar datos de respaldo cuando el servidor falla
function usarDatosRespaldo() {
    console.log('🔄 Cargando especies de respaldo...');
    
    // Datos de respaldo exactos del backend
    especiesDisponibles = [
        {
            "idEspecie": 1,
            "nombreEspecie": "VID"
        },
        {
            "idEspecie": 2,
            "nombreEspecie": "OLIVO"
        },
        {
            "idEspecie": 3,
            "nombreEspecie": "CIRUELO"
        },
        {
            "idEspecie": 4,
            "nombreEspecie": "NOGAL"
        },
        {
            "idEspecie": 5,
            "nombreEspecie": "DURAZNERO"
        },
        {
            "idEspecie": 6,
            "nombreEspecie": "MEMBRILLO"
        },
        {
            "idEspecie": 7,
            "nombreEspecie": "ALMENDRO"
        },
        {
            "idEspecie": 8,
            "nombreEspecie": "PERAL"
        },
        {
            "idEspecie": 9,
            "nombreEspecie": "MANZANO"
        },
        {
            "idEspecie": 10,
            "nombreEspecie": "DAMASCO"
        }
    ];
    
    console.log('✅ Especies de respaldo cargadas:', especiesDisponibles.length, 'especies');
    renderizarEspeciesGrid();
}

// Renderizar el grid de especies
function renderizarEspeciesGrid() {
    const grid = document.getElementById('especiesGrid');
    if (!grid) return;
    
    if (especiesDisponibles.length === 0) {
        grid.innerHTML = '<div class="text-center p-3"><p class="text-muted">No hay especies disponibles</p></div>';
        return;
    }
    
    grid.innerHTML = especiesDisponibles.map(especie => `
        <div class="especie-card ${especiesSeleccionadas.includes(especie.idEspecie) ? 'selected' : ''}" 
             data-especie-id="${especie.idEspecie}"
             onclick="toggleEspecie(${especie.idEspecie}, '${especie.nombreEspecie.replace(/'/g, "\\'")}')">
            <input type="checkbox" 
                   ${especiesSeleccionadas.includes(especie.idEspecie) ? 'checked' : ''}
                   readonly>
            <i class="fas fa-seedling especie-icon"></i>
            <span class="especie-name">${especie.nombreEspecie}</span>
            <i class="fas fa-check especie-check"></i>
        </div>
    `).join('');
    
    actualizarContadorEspecies();
    actualizarEstadoTarjetas();
}

// Toggle selección de especie
function toggleEspecie(idEspecie, nombreEspecie) {
    const index = especiesSeleccionadas.indexOf(idEspecie);
    
    if (index > -1) {
        // Deseleccionar
        especiesSeleccionadas.splice(index, 1);
    } else {
        // Seleccionar (si no se ha alcanzado el límite)
        if (especiesSeleccionadas.length < maxEspecies) {
            especiesSeleccionadas.push(idEspecie);
        } else {
            mostrarToast('⚠️ Máximo 5 especies permitidas', 'warning');
            return;
        }
    }
    
    renderizarEspeciesGrid();
    console.log('🌱 Especies seleccionadas:', especiesSeleccionadas);
}

// Actualizar contador de especies
function actualizarContadorEspecies() {
    const counter = document.getElementById('especiesModalCounter');
    if (counter) {
        counter.textContent = `Seleccione hasta 5 especies (${especiesSeleccionadas.length}/5 seleccionadas)`;
        
        // Cambiar color según cantidad
        counter.className = especiesSeleccionadas.length >= maxEspecies ? 'text-warning' : 'text-info';
    }
}

// Actualizar estado de tarjetas (deshabilitar si se alcanza el límite)
function actualizarEstadoTarjetas() {
    const tarjetas = document.querySelectorAll('.especie-card');
    const limiteAlcanzado = especiesSeleccionadas.length >= maxEspecies;
    
    tarjetas.forEach(tarjeta => {
        const isSelected = tarjeta.classList.contains('selected');
        if (limiteAlcanzado && !isSelected) {
            tarjeta.classList.add('disabled');
        } else {
            tarjeta.classList.remove('disabled');
        }
    });
}

// Mostrar error de carga de especies
function mostrarErrorEspecies() {
    const grid = document.getElementById('especiesGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 2.5rem;"></i>
                <h5 class="text-warning mb-3">Error de conexión</h5>
                <p class="text-muted mb-4">No se pudo conectar con el servidor de especies</p>
                <div class="d-flex gap-2 justify-content-center">
                    <button class="btn btn-outline-warning" onclick="cargarEspecies()">
                        <i class="fas fa-redo me-1"></i>Reintentar
                    </button>
                    <button class="btn btn-warning" onclick="usarDatosRespaldo()">
                        <i class="fas fa-database me-1"></i>Usar datos locales
                    </button>
                </div>
                <small class="text-muted d-block mt-3">
                    Los datos locales incluyen las especies más comunes
                </small>
            </div>
        `;
    }
}

// Configurar eventos del modal de especies
function configurarModalEspecies() {
    console.log('🔧 Configurando modal de especies...');
    
    // Buscar el selector cada vez que se llama esta función
    const selector = document.getElementById('especiesSelector');
    if (selector) {
        console.log('✅ Botón especiesSelector encontrado, configurando evento...');
        
        // Remover eventos previos para evitar duplicados
        selector.removeEventListener('click', abrirModalEspecies);
        selector.addEventListener('click', abrirModalEspecies);
        
        console.log('✅ Evento click configurado en especiesSelector');
    } else {
        console.log('❌ Botón especiesSelector no encontrado en el DOM');
    }
    
    // Configurar botón de confirmación
    const confirmarBtn = document.getElementById('confirmarEspecies');
    if (confirmarBtn) {
        confirmarBtn.removeEventListener('click', confirmarSeleccionEspecies);
        confirmarBtn.addEventListener('click', confirmarSeleccionEspecies);
        console.log('✅ Botón confirmar especies configurado');
    }
}

// Función separada para abrir el modal
function abrirModalEspecies() {
    console.log('🌱 Abriendo modal de especies...');
    
    const modalElement = document.getElementById('especiesModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        // Cargar especies si no se han cargado aún
        if (especiesDisponibles.length === 0) {
            console.log('🔄 Cargando especies por primera vez...');
            cargarEspecies();
        } else {
            console.log('✅ Especies ya cargadas, renderizando grid...');
            renderizarEspeciesGrid();
        }
    } else {
        console.error('❌ Modal especiesModal no encontrado');
    }
}

// Función separada para confirmar selección
function confirmarSeleccionEspecies() {
    console.log('✅ Confirmando selección de especies...');
    actualizarTextoSelector();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('especiesModal'));
    if (modal) {
        modal.hide();
    }
    
    // Validar campo de especies
    validarCampoEspecies();
    
    // Mostrar toast de confirmación
    if (especiesSeleccionadas.length > 0) {
        mostrarToast(`✅ ${especiesSeleccionadas.length} especies seleccionadas`, 'success');
    }
}

// Actualizar texto del selector con especies seleccionadas
function actualizarTextoSelector() {
    const selectorText = document.getElementById('especiesSelectorText');
    if (!selectorText) return;
    
    if (especiesSeleccionadas.length === 0) {
        selectorText.textContent = 'Seleccione las especies que cultiva...';
        selectorText.className = 'text-muted';
    } else {
        const nombresSeleccionados = especiesSeleccionadas.map(id => {
            const especie = especiesDisponibles.find(e => e.idEspecie === id);
            return especie ? especie.nombreEspecie : '';
        }).filter(nombre => nombre);
        
        if (nombresSeleccionados.length === 1) {
            selectorText.textContent = nombresSeleccionados[0];
        } else if (nombresSeleccionados.length <= 2) {
            selectorText.textContent = nombresSeleccionados.join(', ');
        } else {
            selectorText.textContent = `${nombresSeleccionados.slice(0, 2).join(', ')} y ${nombresSeleccionados.length - 2} más`;
        }
        selectorText.className = 'text-white';
    }
}

// Validar campo de especies
function validarCampoEspecies() {
    const selector = document.getElementById('especiesSelector');
    const feedback = selector?.parentElement?.querySelector('.field-feedback');
    
    if (!selector || !feedback) return true;
    
    if (especiesSeleccionadas.length === 0) {
        selector.classList.add('is-invalid');
        feedback.innerHTML = '<div class="text-danger"><i class="fas fa-exclamation-circle me-1"></i>Debe seleccionar al menos una especie</div>';
        return false;
    } else {
        selector.classList.remove('is-invalid');
        selector.classList.add('is-valid');
        feedback.innerHTML = '<div class="text-success"><i class="fas fa-check-circle me-1"></i>Especies seleccionadas correctamente</div>';
        return true;
    }
}

// Obtener especies seleccionadas para el formulario
function obtenerEspeciesSeleccionadas() {
    return especiesSeleccionadas;
}

// Limpiar selección de especies
function limpiarEspeciesSeleccionadas() {
    especiesSeleccionadas = [];
    actualizarTextoSelector();
    renderizarEspeciesGrid();
    
    const selector = document.getElementById('especiesSelector');
    if (selector) {
        selector.classList.remove('is-valid', 'is-invalid');
    }
    
    const feedback = selector?.parentElement?.querySelector('.field-feedback');
    if (feedback) {
        feedback.innerHTML = '';
    }
}

// Restaurar especies seleccionadas (para edición)
function restaurarEspeciesSeleccionadas(especies) {
    if (Array.isArray(especies)) {
        especiesSeleccionadas = [...especies];
        actualizarTextoSelector();
        renderizarEspeciesGrid();
        validarCampoEspecies();
    }
}

// Función para mostrar toast (debe existir en el contexto principal)
function mostrarToast(mensaje, tipo = 'info') {
    // Crear toast dinámico
    const toastContainer = document.getElementById('toast-container') || (() => {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1100';
        document.body.appendChild(container);
        return container;
    })();
    
    const toastId = 'toast-' + Date.now();
    const bgClass = {
        'success': 'bg-success',
        'warning': 'bg-warning',
        'error': 'bg-danger',
        'info': 'bg-info'
    }[tipo] || 'bg-info';
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-white ${bgClass} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${mensaje}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
    
    // Limpiar después de ocultar
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Configurar especies al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌱 DOM cargado, intentando configurar modal de especies...');
    
    // Intentar configurar inmediatamente
    configurarModalEspecies();
    
    // También intentar después de un delay
    setTimeout(() => {
        console.log('🔄 Reintentando configurar modal de especies...');
        configurarModalEspecies();
    }, 500);
    
    // Y después de más tiempo por si el wizard se carga dinámicamente
    setTimeout(() => {
        console.log('🔄 Último intento de configurar modal de especies...');
        configurarModalEspecies();
    }, 1000);
});

// Exponer funciones globalmente para compatibilidad
window.cargarEspecies = cargarEspecies;
window.toggleEspecie = toggleEspecie;
window.obtenerEspeciesSeleccionadas = obtenerEspeciesSeleccionadas;
window.limpiarEspeciesSeleccionadas = limpiarEspeciesSeleccionadas;
window.restaurarEspeciesSeleccionadas = restaurarEspeciesSeleccionadas;
window.validarCampoEspecies = validarCampoEspecies;
window.configurarModalEspecies = configurarModalEspecies;
window.abrirModalEspecies = abrirModalEspecies;