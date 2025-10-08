// FUNCIONES DE FEEDBACK VISUAL

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
	addPasswordToggle('adminEstPassword');
	addPasswordToggle('adminEstPassword2');

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

	// Validación de contraseñas del administrador de establecimiento
	const adminPasswordInput = document.getElementById('adminEstPassword');
	const adminPassword2Input = document.getElementById('adminEstPassword2');
	if (adminPassword2Input && adminPasswordInput) {
		// Mensaje de éxito
		let adminSuccessMsg = document.getElementById('adminEst-password-success-msg');
		if (!adminSuccessMsg) {
			adminSuccessMsg = document.createElement('div');
			adminSuccessMsg.id = 'adminEst-password-success-msg';
			adminSuccessMsg.className = 'text-success mt-1';
			adminPassword2Input.parentNode.appendChild(adminSuccessMsg);
		}
		function updateAdminPasswordMatch() {
			const adminPasswordValue = adminPasswordInput.value;
			const adminPassword2Value = adminPassword2Input.value;
			let adminPassword2Icon = document.getElementById('adminEstPassword2-icon');
			if (!adminPassword2Icon) {
				adminPassword2Icon = document.createElement('span');
				adminPassword2Icon.id = 'adminEstPassword2-icon';
				adminPassword2Icon.style.marginLeft = '8px';
				adminPassword2Input.parentNode.appendChild(adminPassword2Icon);
			}
			// Validación de exactamente 6 caracteres
			if (adminPasswordValue.length !== 6 || adminPassword2Value.length !== 6) {
				adminPassword2Icon.innerHTML = '';
				adminSuccessMsg.textContent = '';
				return;
			}
			if (!adminPassword2Value) {
				adminPassword2Icon.innerHTML = '';
				adminSuccessMsg.textContent = '';
			} else if (adminPasswordValue !== adminPassword2Value) {
				adminPassword2Icon.innerHTML = '<i class="bi bi-x-circle-fill" style="color:#dc3545;font-size:1.2em;vertical-align:middle;"></i>';
				adminSuccessMsg.textContent = '';
			} else {
				adminPassword2Icon.innerHTML = '<i class="bi bi-check-circle-fill" style="color:#198754;font-size:1.2em;vertical-align:middle;"></i>';
				adminSuccessMsg.textContent = '¡Sus contraseñas coinciden!';
			}
		}
		adminPassword2Input.addEventListener('input', function() {
			this.value = this.value.replace(/\s/g, '').slice(0, 6);
			updateAdminPasswordMatch();
		});
		adminPasswordInput.addEventListener('input', function() {
			this.value = this.value.replace(/\s/g, '').slice(0, 6);
			updateAdminPasswordMatch();
		});
	}

	// Inicializar mapa principal
	var map = L.map('map').setView([-32.89, -68.83], 8); // Mendoza
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 18,
		attribution: '© OpenStreetMap contributors'
	}).addTo(map);

	// --- Lógica del wizard de registro de empleador ---
	const paso1 = document.getElementById('form-registro-empleador-paso1');
	const paso2 = document.getElementById('form-registro-empleador-paso2');
	const paso3 = document.getElementById('form-registro-empleador-paso3');
	const paso4 = document.getElementById('form-registro-empleador-paso4');
	const paso5 = document.getElementById('form-registro-empleador-paso5');
	const btnSiguiente1 = document.getElementById('btn-siguiente-paso1');
	const btnAnterior2 = document.getElementById('btn-anterior-paso2');
	const btnSiguiente2 = document.getElementById('btn-siguiente-paso2');
	const btnAnterior3 = document.getElementById('btn-anterior-paso3');
	const btnSiguiente3 = document.getElementById('btn-siguiente-paso3');
	const btnAnterior4 = document.getElementById('btn-anterior-paso4');
	const btnSiguiente4 = document.getElementById('btn-siguiente-paso4');
	const btnAnterior5 = document.getElementById('btn-anterior-paso5');

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
			
			// Si hay algún error, no avanzar
			if (errorMsg || razonErrorMsg) return;
			
			paso1.classList.add('d-none');
			paso2.classList.remove('d-none');
			
			// Actualizar barra de progreso
			const progressBar = document.querySelector('.wizard-progress-bar-inner');
			if (progressBar) progressBar.style.width = '40%';
			
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
					fetch(`http://localhost:9090/empresas/validar-cuit?cuit=${encodeURIComponent(cuitValue)}`)
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
	}

	// Paso 2: Administrador de Empresa
	if (btnAnterior2) {
		btnAnterior2.addEventListener('click', function() {
			paso2.classList.add('d-none');
			paso1.classList.remove('d-none');
			
			// Actualizar barra de progreso
			const progressBar = document.querySelector('.wizard-progress-bar-inner');
			if (progressBar) progressBar.style.width = '20%';
			
			// Actualizar labels de pasos
			const wizardLabels = document.querySelectorAll('.wizard-step-label');
			wizardLabels.forEach((el, idx) => {
				if (idx === 1) {
					el.classList.remove('active');
				}
			});
		});
	}

	if (btnSiguiente2) {
		btnSiguiente2.addEventListener('click', function() {
			const dniInput = document.getElementById('dni');
			const nombreInput = document.getElementById('nombre');
			const apellidoInput = document.getElementById('apellido');
			const emailInput = document.getElementById('email');
			const telefonoInput = document.getElementById('telefono');
			const passwordInput = document.getElementById('password');
			const password2Input = document.getElementById('password2');
			
			const dniValue = dniInput.value.trim();
			const nombreValue = nombreInput.value.trim();
			const apellidoValue = apellidoInput.value.trim();
			const emailValue = emailInput.value.trim();
			const telefonoValue = telefonoInput.value.trim();
			const passwordValue = passwordInput ? passwordInput.value : '';
			const password2Value = password2Input ? password2Input.value : '';
			
			let hasErrors = false;
			
			// Validaciones básicas
			const validations = [
				{input: dniInput, value: dniValue, regex: /^\d{7,8}$/, message: 'El DNI debe tener entre 7 y 8 números.', required: true},
				{input: nombreInput, value: nombreValue, regex: /^[A-ZÁÉÍÓÚÑ ]+$/, message: 'El nombre solo debe contener letras y espacios.', required: true},
				{input: apellidoInput, value: apellidoValue, regex: /^[A-ZÁÉÍÓÚÑ ]+$/, message: 'El apellido solo debe contener letras y espacios.', required: true},
				{input: emailInput, value: emailValue, regex: /^([a-zA-Z0-9_\.-]+)@([a-zA-Z0-9\.-]+)\.([a-zA-Z]{2,})$/, message: 'Ingrese un email válido.', required: true},
				{input: telefonoInput, value: telefonoValue, regex: /^\d{1,13}$/, message: 'El teléfono debe contener entre 1 y 13 números.', required: true}
			];
			
			validations.forEach(validation => {
				let errorDiv = document.getElementById(validation.input.id + '-error');
				if (!errorDiv) {
					errorDiv = document.createElement('div');
					errorDiv.id = validation.input.id + '-error';
					errorDiv.className = 'text-danger mt-1';
					validation.input.parentNode.appendChild(errorDiv);
				}
				
				if (!validation.value && validation.required) {
					errorDiv.textContent = 'Este campo es obligatorio.';
					validation.input.classList.add('is-invalid');
					hasErrors = true;
				} else if (validation.value && !validation.regex.test(validation.value)) {
					errorDiv.textContent = validation.message;
					validation.input.classList.add('is-invalid');
					hasErrors = true;
				} else {
					errorDiv.textContent = '';
					validation.input.classList.remove('is-invalid');
				}
			});
			
			// Validar contraseña (SOLO si NO está deshabilitada)
			if (passwordInput && !passwordInput.readOnly) {
				let passwordErrorDiv = document.getElementById('password-error');
				if (!passwordErrorDiv) {
					passwordErrorDiv = document.createElement('div');
					passwordErrorDiv.id = 'password-error';
					passwordErrorDiv.className = 'text-danger mt-1';
					passwordInput.parentNode.appendChild(passwordErrorDiv);
				}
				
				if (!passwordValue) {
					passwordErrorDiv.textContent = 'La contraseña es obligatoria.';
					passwordInput.classList.add('is-invalid');
					hasErrors = true;
				} else if (passwordValue.length !== 6) {
					passwordErrorDiv.textContent = 'La contraseña debe tener 6 caracteres.';
					passwordInput.classList.add('is-invalid');
					hasErrors = true;
				} else {
					passwordErrorDiv.textContent = '';
					passwordInput.classList.remove('is-invalid');
				}
			} else if (passwordInput && passwordInput.readOnly) {
				// Si la contraseña está deshabilitada (usuario existente), limpiar errores
				let passwordErrorDiv = document.getElementById('password-error');
				if (passwordErrorDiv) {
					passwordErrorDiv.textContent = '';
				}
				passwordInput.classList.remove('is-invalid');
			}
			
			// Validar confirmación de contraseña (SOLO si NO está deshabilitada)
			if (password2Input && !password2Input.readOnly) {
				let password2ErrorDiv = document.getElementById('password2-error');
				if (!password2ErrorDiv) {
					password2ErrorDiv = document.createElement('div');
					password2ErrorDiv.id = 'password2-error';
					password2ErrorDiv.className = 'text-danger mt-1';
					password2Input.parentNode.appendChild(password2ErrorDiv);
				}
				
				if (!password2Value) {
					password2ErrorDiv.textContent = 'Repita la contraseña.';
					password2Input.classList.add('is-invalid');
					hasErrors = true;
				} else if (passwordValue !== password2Value) {
					password2ErrorDiv.textContent = 'Las contraseñas no coinciden.';
					password2Input.classList.add('is-invalid');
					hasErrors = true;
				} else {
					password2ErrorDiv.textContent = '';
					password2Input.classList.remove('is-invalid');
				}
			} else if (password2Input && password2Input.readOnly) {
				// Si la confirmación está deshabilitada (usuario existente), limpiar errores
				let password2ErrorDiv = document.getElementById('password2-error');
				if (password2ErrorDiv) {
					password2ErrorDiv.textContent = '';
				}
				password2Input.classList.remove('is-invalid');
			}
			
			if (hasErrors) return;
			
			paso2.classList.add('d-none');
			paso3.classList.remove('d-none');
			
			// Actualizar barra de progreso
			const progressBar = document.querySelector('.wizard-progress-bar-inner');
			if (progressBar) progressBar.style.width = '60%';
			
			// Actualizar labels de pasos
			const wizardLabels = document.querySelectorAll('.wizard-step-label');
			wizardLabels.forEach((el, idx) => {
				if (idx === 2) {
					el.classList.add('active');
				}
			});
			
			setTimeout(function() {
				initEstablecimientoMap();
				cargarEspecies();
				cargarDepartamentos();
			}, 200);
		});
		
		// Formateo de inputs en tiempo real
		const dniInput = document.getElementById('dni');
		if (dniInput) {
			// Event listener para formateo y validación en tiempo real
			dniInput.addEventListener('input', function() {
				// Formatear: solo números, máximo 8 dígitos
				this.value = this.value.replace(/\D/g, '').slice(0, 8);
			});
			
			// Event listener para autocompletado cuando se sale del campo
			dniInput.addEventListener('blur', async function() {
				const dniValue = this.value.trim();
				if (dniValue && dniValue.length >= 7) {
					console.log('🔥 Activando autocompletado desde blur del DNI:', dniValue);
					await ejecutarAutocompletado('dni');
				}
			});
			
			// Event listener adicional para el evento change
			dniInput.addEventListener('change', async function() {
				const dniValue = this.value.trim();
				if (dniValue && dniValue.length >= 7) {
					console.log('🔥 Activando autocompletado desde change del DNI:', dniValue);
					await ejecutarAutocompletado('dni');
				}
			});
		}
		
		const nombreInput = document.getElementById('nombre');
		if (nombreInput) {
			nombreInput.addEventListener('input', function() {
				this.value = this.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ ]/g, '');
			});
		}
		
		const apellidoInput = document.getElementById('apellido');
		if (apellidoInput) {
			apellidoInput.addEventListener('input', function() {
				this.value = this.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ ]/g, '');
			});
		}
		
		const telefonoInput = document.getElementById('telefono');
		if (telefonoInput) {
			telefonoInput.addEventListener('input', function() {
				this.value = this.value.replace(/\D/g, '').slice(0, 13);
			});
		}
		
		const adminEstTelefonoInput = document.getElementById('adminEstTelefono');
		if (adminEstTelefonoInput) {
			adminEstTelefonoInput.addEventListener('input', function() {
				this.value = this.value.replace(/\D/g, '').slice(0, 13);
			});
		}
		
		const renspaInput = document.getElementById('renspa');
		if (renspaInput) {
			renspaInput.addEventListener('input', function() {
				this.value = this.value.replace(/\D/g, '').slice(0, 11);
			});
		}
		
		// Formateo y autocompletado para DNI del administrador de establecimiento
		const adminEstDniInput = document.getElementById('adminEstDni');
		if (adminEstDniInput) {
			// Event listener para formateo en tiempo real
			adminEstDniInput.addEventListener('input', function() {
				// Formatear: solo números, máximo 8 dígitos
				this.value = this.value.replace(/\D/g, '').slice(0, 8);
			});
			
			// Event listener para autocompletado cuando se sale del campo
			adminEstDniInput.addEventListener('blur', async function() {
				const dniValue = this.value.trim();
				if (dniValue && dniValue.length >= 7) {
					console.log('🔥 Activando autocompletado desde blur del adminEstDni:', dniValue);
					await ejecutarAutocompletadoAdmin('adminEstDni');
				}
			});
			
			// Event listener adicional para el evento change
			adminEstDniInput.addEventListener('change', async function() {
				const dniValue = this.value.trim();
				if (dniValue && dniValue.length >= 7) {
					console.log('🔥 Activando autocompletado desde change del adminEstDni:', dniValue);
					await ejecutarAutocompletadoAdmin('adminEstDni');
				}
			});
		}
	}

	// Resto de pasos del wizard...
	
	// Paso 3: Ubicación del Establecimiento
	if (btnAnterior3) {
		btnAnterior3.addEventListener('click', function() {
			paso3.classList.add('d-none');
			paso2.classList.remove('d-none');
			
			// Actualizar barra de progreso
			const progressBar = document.querySelector('.wizard-progress-bar-inner');
			if (progressBar) progressBar.style.width = '40%';
			
			// Actualizar labels de pasos
			const wizardLabels = document.querySelectorAll('.wizard-step-label');
			wizardLabels.forEach((el, idx) => {
				if (idx === 2) {
					el.classList.remove('active');
				}
			});
		});
	}

	if (btnSiguiente3) {
		btnSiguiente3.addEventListener('click', function() {
			const nombreEstablecimientoInput = document.getElementById('nombreEstablecimiento');
			const renspaInput = document.getElementById('renspa');
			const departamentoSelect = document.getElementById('departamento');
			const distritoSelect = document.getElementById('distrito');
			const latitudInput = document.getElementById('latitud');
			const longitudInput = document.getElementById('longitud');
			
			const nombreEstablecimientoValue = nombreEstablecimientoInput ? nombreEstablecimientoInput.value.trim() : '';
			const renspaValue = renspaInput ? renspaInput.value.trim() : '';
			const departamentoValue = departamentoSelect ? departamentoSelect.value : '';
			const distritoValue = distritoSelect ? distritoSelect.value : '';
			const latitudValue = latitudInput ? latitudInput.value : '';
			const longitudValue = longitudInput ? longitudInput.value : '';
			
			let hasErrors = false;
			
			// Validar nombre del establecimiento
			if (!nombreEstablecimientoValue) {
				showFieldFeedback(nombreEstablecimientoInput, false, 'El nombre del establecimiento es obligatorio.');
				hasErrors = true;
			} else {
				showFieldFeedback(nombreEstablecimientoInput, true, '');
			}
			
			// Validar RENSPA
			if (!renspaValue) {
				showFieldFeedback(renspaInput, false, 'El número de RENSPA es obligatorio.');
				hasErrors = true;
			} else if (!/^\d{1,11}$/.test(renspaValue)) {
				showFieldFeedback(renspaInput, false, 'El RENSPA debe contener entre 1 y 11 números.');
				hasErrors = true;
			} else {
				showFieldFeedback(renspaInput, true, '');
			}
			
			// Validar departamento
			if (!departamentoValue) {
				showFieldFeedback(departamentoSelect, false, 'Debe seleccionar un departamento.');
				hasErrors = true;
			} else {
				showFieldFeedback(departamentoSelect, true, '');
			}
			
			// Validar distrito
			if (!distritoValue) {
				showFieldFeedback(distritoSelect, false, 'Debe seleccionar un distrito.');
				hasErrors = true;
			} else {
				showFieldFeedback(distritoSelect, true, '');
			}
			
			// Validar coordenadas
			if (!latitudValue || !longitudValue) {
				const mapContainer = document.getElementById('establecimiento-map');
				showFieldFeedback(mapContainer, false, 'Debe marcar la ubicación en el mapa.');
				hasErrors = true;
			} else {
				const mapContainer = document.getElementById('establecimiento-map');
				showFieldFeedback(mapContainer, true, 'Ubicación seleccionada correctamente.');
			}
			
			if (hasErrors) return;
			
			paso3.classList.add('d-none');
			paso4.classList.remove('d-none');
			
			// Actualizar barra de progreso
			const progressBar = document.querySelector('.wizard-progress-bar-inner');
			if (progressBar) progressBar.style.width = '80%';
			
			// Actualizar labels de pasos
			const wizardLabels = document.querySelectorAll('.wizard-step-label');
			wizardLabels.forEach((el, idx) => {
				if (idx === 3) {
					el.classList.add('active');
				}
			});
		});
	}

	// Paso 4: Especies
	if (btnAnterior4) {
		btnAnterior4.addEventListener('click', function() {
			paso4.classList.add('d-none');
			paso3.classList.remove('d-none');
			
			// Actualizar barra de progreso
			const progressBar = document.querySelector('.wizard-progress-bar-inner');
			if (progressBar) progressBar.style.width = '60%';
			
			// Actualizar labels de pasos
			const wizardLabels = document.querySelectorAll('.wizard-step-label');
			wizardLabels.forEach((el, idx) => {
				if (idx === 3) {
					el.classList.remove('active');
				}
			});
		});
	}

	if (btnSiguiente4) {
		btnSiguiente4.addEventListener('click', function() {
			const especiesList = document.getElementById('especies-list');
			const especiesSeleccionadas = especiesList ? especiesList.querySelectorAll('input[type="checkbox"]:checked') : [];
			
			if (especiesSeleccionadas.length === 0) {
				showFieldFeedback(especiesList, false, 'Debe seleccionar al menos una especie.');
				return;
			} else {
				showFieldFeedback(especiesList, true, `${especiesSeleccionadas.length} especie(s) seleccionada(s).`);
			}
			
			paso4.classList.add('d-none');
			paso5.classList.remove('d-none');
			
			// Actualizar barra de progreso
			const progressBar = document.querySelector('.wizard-progress-bar-inner');
			if (progressBar) progressBar.style.width = '100%';
			
			// Actualizar labels de pasos
			const wizardLabels = document.querySelectorAll('.wizard-step-label');
			wizardLabels.forEach((el, idx) => {
				if (idx === 4) {
					el.classList.add('active');
				}
			});
		});
	}

	// Paso 5: Confirmación
	if (btnAnterior5) {
		btnAnterior5.addEventListener('click', function() {
			paso5.classList.add('d-none');
			paso4.classList.remove('d-none');
			
			// Actualizar barra de progreso
			const progressBar = document.querySelector('.wizard-progress-bar-inner');
			if (progressBar) progressBar.style.width = '80%';
			
			// Actualizar labels de pasos
			const wizardLabels = document.querySelectorAll('.wizard-step-label');
			wizardLabels.forEach((el, idx) => {
				if (idx === 4) {
					el.classList.remove('active');
				}
			});
		});
	}
	
	// Inicialización del mapa de geolocalización para el paso 3 del wizard
	let establecimientoMap = null;
	function initEstablecimientoMap() {
		if (establecimientoMap) {
			establecimientoMap.invalidateSize();
			return;
		}
		establecimientoMap = L.map('establecimiento-map').setView([-32.8908, -68.8272], 10);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '© OpenStreetMap'
		}).addTo(establecimientoMap);
		
		let marker = null;
		establecimientoMap.on('click', function(e) {
			const { lat, lng } = e.latlng;
			document.getElementById('latitud').value = lat.toFixed(6);
			document.getElementById('longitud').value = lng.toFixed(6);
			if (marker) {
				marker.setLatLng(e.latlng);
			} else {
				marker = L.marker(e.latlng).addTo(establecimientoMap);
			}
		});
	}

	// Cargar especies desde endpoint
	function cargarEspecies() {
		const especiesList = document.getElementById('especies-list');
		if (!especiesList) return;
		
		addLoadingState(especiesList, 'Cargando especies...');
		
		fetch('http://localhost:9090/especies')
			.then(response => response.json())
			.then(especies => {
				let html = '';
				especies.forEach(especie => {
					html += `
						<li class="px-3 py-1">
							<div class="form-check">
								<input class="form-check-input" type="checkbox" value="${especie.idEspecie}" id="chk-especie-${especie.idEspecie}">
								<label class="form-check-label" for="chk-especie-${especie.idEspecie}">
									${especie.nombreEspecie}
								</label>
							</div>
						</li>
					`;
				});
				especiesList.innerHTML = html;
				
				// Event listeners para actualizar dropdown y campo oculto
				especiesList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
					checkbox.addEventListener('change', function() {
						actualizarEspeciesSeleccionadas();
					});
				});
			})
			.catch(error => {
				console.error('Error cargando especies:', error);
				especiesList.innerHTML = `
					<li class="px-3 py-1">
						<div class="form-check">
							<input class="form-check-input" type="checkbox" value="1" id="chk-especie-1">
							<label class="form-check-label" for="chk-especie-1">VID</label>
						</div>
					</li>
					<li class="px-3 py-1">
						<div class="form-check">
							<input class="form-check-input" type="checkbox" value="2" id="chk-especie-2">
							<label class="form-check-label" for="chk-especie-2">OLIVO</label>
						</div>
					</li>
					<li class="px-3 py-1">
						<div class="form-check">
							<input class="form-check-input" type="checkbox" value="3" id="chk-especie-3">
							<label class="form-check-label" for="chk-especie-3">CEREZO</label>
						</div>
					</li>
				`;
				
				// Event listeners para datos por defecto
				especiesList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
					checkbox.addEventListener('change', function() {
						actualizarEspeciesSeleccionadas();
					});
				});
			});
	}
	
	// Actualizar especies seleccionadas en el dropdown y campo oculto
	function actualizarEspeciesSeleccionadas() {
		const especiesList = document.getElementById('especies-list');
		const dropdownButton = document.getElementById('dropdownEspecies');
		const hiddenInput = document.getElementById('especies');
		
		if (!especiesList || !dropdownButton || !hiddenInput) return;
		
		const especiesSeleccionadas = especiesList.querySelectorAll('input[type="checkbox"]:checked');
		const especiesTexto = Array.from(especiesSeleccionadas).map(checkbox => {
			const label = especiesList.querySelector(`label[for="${checkbox.id}"]`);
			return label ? label.textContent.trim() : '';
		}).filter(texto => texto !== '');
		
		const especiesIds = Array.from(especiesSeleccionadas).map(checkbox => checkbox.value);
		
		if (especiesTexto.length > 0) {
			dropdownButton.textContent = especiesTexto.length === 1 ? 
				especiesTexto[0] : 
				`${especiesTexto.length} especies seleccionadas`;
			hiddenInput.value = especiesIds.join(',');
		} else {
			dropdownButton.textContent = 'Seleccionar especies';
			hiddenInput.value = '';
		}
	}

	// Cargar departamentos
	function cargarDepartamentos() {
		const select = document.getElementById('departamento');
		if (!select) return;
		
		addLoadingState(select.parentNode, 'Cargando departamentos...');
		
		fetch('http://localhost:9090/departamentos')
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.then(departamentos => {
				let html = '<option value="">Seleccionar departamento</option>';
				departamentos.forEach(dep => {
					html += `<option value="${dep.idDepartamento}">${dep.nombreDepartamento}</option>`;
				});
				select.innerHTML = html;
				
				// Event listener para cargar distritos
				select.addEventListener('change', function() {
					cargarDistritos(this.value);
				});
				
				// Limpiar loading state
				const loadingDiv = select.parentNode.querySelector('.loading-state');
				if (loadingDiv) loadingDiv.remove();
			})
			.catch(error => {
				console.error('Error cargando departamentos:', error);
				select.innerHTML = `
					<option value="">Seleccionar departamento</option>
					<option value="1">Capital</option>
					<option value="2">Godoy Cruz</option>
					<option value="3">Maipú</option>
					<option value="4">Las Heras</option>
				`;
				
				// Event listener para datos por defecto
				select.addEventListener('change', function() {
					cargarDistritos(this.value);
				});
				
				// Limpiar loading state
				const loadingDiv = select.parentNode.querySelector('.loading-state');
				if (loadingDiv) loadingDiv.remove();
			})
			.catch(error => {
				console.error('Error cargando departamentos:', error);
				select.innerHTML = `
					<option value="">Seleccionar departamento</option>
					<option value="1">Capital</option>
					<option value="2">Godoy Cruz</option>
					<option value="3">Maipú</option>
					<option value="4">Las Heras</option>
				`;
				
				// Event listener para datos por defecto
				select.addEventListener('change', function() {
					cargarDistritos(this.value);
				});
				
				// Limpiar loading state
				const loadingDiv = select.parentNode.querySelector('.loading-state');
				if (loadingDiv) loadingDiv.remove();
			});
	}
	
	// Cargar distritos basado en departamento seleccionado
	function cargarDistritos(departamentoId) {
		const select = document.getElementById('distrito');
		if (!select || !departamentoId) {
			if (select) select.innerHTML = '<option value="">Primero seleccione un departamento</option>';
			return;
		}
		
		addLoadingState(select.parentNode, 'Cargando distritos...');
		
		fetch(`http://localhost:9090/distritos/departamento/${departamentoId}`)
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.then(distritos => {
				let html = '<option value="">Seleccionar distrito</option>';
				distritos.forEach(distrito => {
					html += `<option value="${distrito.idDistrito}">${distrito.nombreDistrito}</option>`;
				});
				select.innerHTML = html;
				
				// Limpiar loading state
				const loadingDiv = select.parentNode.querySelector('.loading-state');
				if (loadingDiv) loadingDiv.remove();
			})
			.catch(error => {
				console.error('Error cargando distritos desde backend:', error);
				// Fallback a datos estáticos solo en caso de error
				const distritosData = {
					'1': [{idDistrito: 1, nombreDistrito: 'JUNÍN CENTRO'}, {idDistrito: 2, nombreDistrito: 'JUNÍN NORTE'}],
					'2': [{idDistrito: 3, nombreDistrito: 'LA PAZ CENTRO'}, {idDistrito: 4, nombreDistrito: 'LA PAZ SUR'}],
					'3': [{idDistrito: 5, nombreDistrito: 'RIVADAVIA CENTRO'}, {idDistrito: 6, nombreDistrito: 'RIVADAVIA OESTE'}],
					'4': [{idDistrito: 7, nombreDistrito: 'GUAYMALLÉN NORTE'}, {idDistrito: 8, nombreDistrito: 'GUAYMALLÉN SUR'}]
				};
				
				const distritos = distritosData[departamentoId] || [];
				let html = '<option value="">Seleccionar distrito</option>';
				distritos.forEach(distrito => {
					html += `<option value="${distrito.idDistrito}">${distrito.nombreDistrito}</option>`;
				});
				select.innerHTML = html;
				
				// Limpiar loading state
				const loadingDiv = select.parentNode.querySelector('.loading-state');
				if (loadingDiv) {
					loadingDiv.remove();
					console.log('Loading state de distritos eliminado después del error');
				}
			});
	}
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
		
		// Paso 2: Administrador de empresa
		const dni = document.getElementById('dni')?.value?.trim();
		const nombre = document.getElementById('nombre')?.value?.trim();
		const apellido = document.getElementById('apellido')?.value?.trim();
		const email = document.getElementById('email')?.value?.trim();
		const telefono = document.getElementById('telefono')?.value?.trim();
		const password = document.getElementById('password')?.value;
		
		// Paso 3: Datos de establecimiento
		const nombreEstablecimiento = document.getElementById('nombreEstablecimiento')?.value?.trim();
		const renspa = document.getElementById('renspa')?.value?.trim();
		const calle = document.getElementById('calle')?.value?.trim();
		const numeracion = document.getElementById('numeracion')?.value?.trim();
		const codigoPostal = document.getElementById('codigoPostal')?.value?.trim();
		const distrito = document.getElementById('distrito')?.value;
		const latitud = document.getElementById('latitud')?.value;
		const longitud = document.getElementById('longitud')?.value;
		
		// Paso 4: Especies seleccionadas
		const especiesInput = document.getElementById('especies')?.value;
		const especiesIds = especiesInput ? especiesInput.split(',').filter(id => id.trim()).map(id => parseInt(id)) : [];
		
		// Paso 4: Administrador de establecimiento (opcional)
		const sinAdminEst = document.getElementById('sinAdminEstablecimiento')?.checked;
		const adminEstNombre = document.getElementById('adminEstNombre')?.value?.trim();
		const adminEstApellido = document.getElementById('adminEstApellido')?.value?.trim();
		const adminEstDni = document.getElementById('adminEstDni')?.value?.trim();
		const adminEstEmail = document.getElementById('adminEstEmail')?.value?.trim();
		const adminEstTelefono = document.getElementById('adminEstTelefono')?.value?.trim();
		const adminEstPassword = document.getElementById('adminEstPassword')?.value;
		
		// Validaciones básicas
		// IMPORTANTE: Para usuarios existentes (contraseña deshabilitada), no requerir contraseña
		const passwordField = document.getElementById('password');
		const passwordRequired = passwordField && !passwordField.readOnly;
		
		if (!cuit || !razonSocial || !dni || !nombre || !apellido || !email || !telefono) {
			throw new Error('Faltan datos obligatorios en los pasos 1 y 2');
		}
		
		// Si la contraseña es requerida (usuario nuevo) pero no está presente
		if (passwordRequired && !password) {
			throw new Error('La contraseña es obligatoria para usuarios nuevos');
		}
		
		// Validación específica de longitud de contraseña (solo si hay contraseña)
		if (password && password.length > 6) {
			throw new Error('La contraseña no puede exceder los 6 caracteres');
		}
		
		if (!nombreEstablecimiento || !renspa || !calle || !numeracion || !codigoPostal || !distrito || !latitud || !longitud) {
			throw new Error('Faltan datos obligatorios del establecimiento en el paso 3');
		}
		
		if (especiesIds.length === 0) {
			throw new Error('Debe seleccionar al menos una especie');
		}
		
		// Estructurar JSON según el formato esperado por el backend
		const datosRegistro = {
			dtoEmpresaRegistro: {
				cuit: cuit,
				razonSocial: razonSocial
			},
			dtoEstablecimientoRegistro: {
				numeroRenspa: renspa,
				nombreEstablecimiento: nombreEstablecimiento,
				calle: calle,
				numeracion: numeracion,
				codigoPostal: codigoPostal,
				localizacion: {
					latitud: parseFloat(latitud),
					longitud: parseFloat(longitud)
				},
				idDistrito: parseInt(distrito),
				idEspecies: especiesIds
			},
			dtoPersonaEmpresaRegistro: {
				dni: dni,
				apellido: apellido,
				nombrePersona: nombre,
				telefono: telefono,
				email: email
			}
		};
		
		// Solo agregar contraseña si es un usuario nuevo (contraseña requerida)
		if (passwordRequired && password) {
			datosRegistro.dtoPersonaEmpresaRegistro.contrasenia = password.substring(0, 6);
		}
		
		// Administrador de establecimiento: Solo incluir la clave si hay datos válidos
		// IMPORTANTE: Para usuarios existentes (contraseña deshabilitada), no requerir contraseña
		const adminPasswordField = document.getElementById('adminEstPassword');
		const adminPasswordRequired = adminPasswordField && !adminPasswordField.readOnly;
		
		if (!sinAdminEst && adminEstNombre && adminEstApellido && adminEstDni && adminEstEmail && adminEstTelefono) {
			// Si la contraseña es requerida (usuario nuevo) pero no está presente
			if (adminPasswordRequired && !adminEstPassword) {
				throw new Error('La contraseña del administrador es obligatoria para usuarios nuevos');
			}
			
			// Validación específica de longitud de contraseña del admin (solo si hay contraseña)
			if (adminEstPassword && adminEstPassword.length > 6) {
				throw new Error('La contraseña del administrador no puede exceder los 6 caracteres');
			}
			
			datosRegistro.dtoPersonaEstablecimientoRegistro = {
				dni: adminEstDni,
				apellido: adminEstApellido,
				nombrePersona: adminEstNombre,
				telefono: adminEstTelefono,
				email: adminEstEmail
			};
			
			// Solo agregar contraseña si es un usuario nuevo (contraseña requerida)
			if (adminPasswordRequired && adminEstPassword) {
				datosRegistro.dtoPersonaEstablecimientoRegistro.contrasenia = adminEstPassword.substring(0, 6);
			}
		}
		// NOTA: Si no hay administrador, simplemente no se incluye la clave dtoPersonaEstablecimientoRegistro
		
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
		const response = await fetch('http://localhost:9090/registro', {
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
 * Ejecuta el autocompletado para el formulario de admin
 */
async function ejecutarAutocompletadoAdmin(dniFieldId) {
	console.log('🚀 Ejecutando autocompletado para admin...');
	const persona = await autocompletarPersona(dniFieldId, 'adminEstNombre', 'adminEstApellido', 'adminEstEmail', 'adminEstTelefono');
	
	// Si encontró una persona, deshabilitar contraseñas. Si no, habilitarlas.
	if (persona) {
		deshabilitarContraseniasPersonaExistente('adminEstPassword', 'adminEstPassword2');
	} else {
		habilitarContraseniasPersonaNueva('adminEstPassword', 'adminEstPassword2');
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