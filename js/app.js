// ===========================
// CONFIGURACIÓN DEL BACKEND
// ===========================

const BACKEND_CONFIG = {
    BASE_URL: 'http://localhost:8080',
    ENDPOINTS: {
        VALIDATE_CUIT: '/publico/empresas/existe/',
        REGISTER_COMPANY: 'publico/empresas/registro'
    },
    TIMEOUTS: {
        VALIDATION: 5000,
        REGISTRATION: 10000
    },
    DEVELOPMENT_MODE: true
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


	// Inicializar mapa principal
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
		if (window.scrollY > videoSectionHeight - 100) {
			navbar.classList.add('scrolled');
		} else {
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
							
							// Redirigir al dashboard
							setTimeout(function() {
								window.location.href = 'dashboard.html';
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

// Función específica para probar el endpoint personas/persona/{dni}
window.probarEndpointPersonas = async function(dni = '35876866') {
	console.log('🧪 === PROBANDO ENDPOINT PERSONAS/PERSONA ===');
	console.log('🧪 DNI de prueba:', dni);
	
	try {
		const url = `http://localhost:9090/personas/persona/${dni}`;
		console.log('🧪 URL:', url);
		
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			mode: 'cors'
		});
		
		console.log('🧪 Status:', response.status);
		console.log('🧪 StatusText:', response.statusText);
		console.log('🧪 Headers:', Object.fromEntries(response.headers.entries()));
		
		if (response.ok) {
			const data = await response.json();
			console.log('✅ ¡Endpoint funciona! Datos recibidos:', data);
			console.log('✅ Estructura del objeto:');
			Object.entries(data).forEach(([key, value]) => {
				console.log(`✅   ${key}: "${value}" (${typeof value})`);
			});
			return data;
		} else if (response.status === 404) {
			console.log('⚠️ DNI no encontrado (404) - Esto es normal si el DNI no existe');
			return null;
		} else {
			console.log('❌ Error del servidor:', response.status, response.statusText);
			const errorText = await response.text();
			console.log('❌ Detalles del error:', errorText);
			return null;
		}
	} catch (error) {
		console.error('❌ Error de conexión:', error);
		console.error('❌ Verifica que el backend esté ejecutándose en localhost:9090');
		return null;
	}
};

// ==========================================
// FUNCIONALIDAD DE LOGIN Y AUTENTICACIÓN
// ==========================================

// Configuración de autenticación
const AUTH_CONFIG = {
	endpoints: {
		login: 'http://localhost:9090/aut/login',
		verify: 'http://localhost:9090/aut/verify', // Para verificar token
		// Agregar otros endpoints según tu backend
	},
	storage: {
		tokenKey: 'agro_lab_token',
		userKey: 'agro_lab_user'
	}
};

// Función para validar formato DNI
function validarDNI(dni) {
	if (!dni || dni.trim() === '') {
		return { valido: false, mensaje: 'El DNI es obligatorio' };
	}
	
	const dniLimpio = dni.trim();
	if (!/^\d{7,8}$/.test(dniLimpio)) {
		return { valido: false, mensaje: 'El DNI debe tener 7 u 8 dígitos numéricos' };
	}
	
	return { valido: true, dni: dniLimpio };
}

// Función para validar contraseña
function validarContrasenaLogin(contrasenia) {
	if (!contrasenia || contrasenia.trim() === '') {
		return { valido: false, mensaje: 'La contraseña es obligatoria' };
	}
	
	if (contrasenia.length !== 6) {
		return { valido: false, mensaje: 'La contraseña debe tener exactamente 6 caracteres' };
	}
	
	return { valido: true, contrasenia: contrasenia };
}

// Función para enviar credenciales al backend
async function autenticarUsuario(dni, contrasenia) {
	try {
		console.log('🔐 Iniciando autenticación para DNI:', dni);
		
		const credenciales = {
			dni: dni,
			contrasenia: contrasenia
		};
		
		console.log('📤 Enviando credenciales al backend:', JSON.stringify(credenciales, null, 2));
		
		const response = await fetch(AUTH_CONFIG.endpoints.login, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(credenciales)
		});
		
		console.log('📥 Respuesta del backend:', response.status, response.statusText);
		
		if (response.ok) {
			const data = await response.json();
			console.log('✅ Login exitoso, datos recibidos:', data);
			return { exito: true, datos: data };
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

// Función para cerrar sesión
function cerrarSesion() {
	localStorage.removeItem(AUTH_CONFIG.storage.tokenKey);
	localStorage.removeItem(AUTH_CONFIG.storage.userKey);
	console.log('✅ Sesión cerrada');
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
		const nombreUsuario = usuario ? usuario.nombre || usuario.dni : 'Usuario';
		
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
						<li><a class="dropdown-item" href="#" id="btn-logout"><i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión</a></li>
					</ul>
				</li>
			`;
			
			// Agregar event listener para logout
			document.getElementById('btn-logout').addEventListener('click', function(e) {
				e.preventDefault();
				cerrarSesion();
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
					// Redirigir al dashboard
					window.location.href = 'dashboard.html';
					// O usar: window.location.replace('dashboard.html'); para no permitir "volver atrás"
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
		// Hacer una petición a un endpoint protegido para verificar el token
		const response = await fetchConAuth(AUTH_CONFIG.endpoints.verify, {
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
		actualizarInterfazLogin(true);
	}
	
	// Aplicar validaciones en tiempo real a los campos
	const dniInput = document.getElementById('dni-login');
	const passwordInput = document.getElementById('password-login');
	
	if (dniInput) {
		dniInput.addEventListener('input', function() {
			// Permitir solo números
			this.value = this.value.replace(/[^0-9]/g, '');
			// Limitar a 8 dígitos
			if (this.value.length > 8) {
				this.value = this.value.slice(0, 8);
			}
		});
	}
	
	if (passwordInput) {
		passwordInput.addEventListener('input', function() {
			// Limitar a 6 caracteres
			if (this.value.length > 6) {
				this.value = this.value.slice(0, 6);
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
		console.warn('⚠️ Campo CUIT no encontrado en el DOM');
	}
	
	// Verificar conectividad con el backend
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