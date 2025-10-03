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

	// Coincidencia visual de contraseñas
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
			// Validación de mínimo 4 caracteres
			if (passwordValue.length < 4 || password2Value.length < 4) {
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
			this.value = this.value.replace(/\s/g, '');
			updatePasswordMatch();
		});
		passwordInput.addEventListener('input', function() {
			updatePasswordMatch();
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
				{input: telefonoInput, value: telefonoValue, regex: /^\d+$/, message: 'El teléfono solo debe contener números.', required: true}
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
			
			// Validar contraseña
			if (passwordInput) {
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
				} else if (passwordValue.length < 4) {
					passwordErrorDiv.textContent = 'La contraseña debe tener al menos 4 caracteres.';
					passwordInput.classList.add('is-invalid');
					hasErrors = true;
				} else {
					passwordErrorDiv.textContent = '';
					passwordInput.classList.remove('is-invalid');
				}
			}
			
			// Validar confirmación de contraseña
			if (password2Input) {
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
			dniInput.addEventListener('input', function() {
				this.value = this.value.replace(/\D/g, '').slice(0, 8);
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
				this.value = this.value.replace(/\D/g, '');
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
			const departamentoSelect = document.getElementById('departamento');
			const distritoSelect = document.getElementById('distrito');
			const latitudInput = document.getElementById('latitud');
			const longitudInput = document.getElementById('longitud');
			
			const departamentoValue = departamentoSelect ? departamentoSelect.value : '';
			const distritoValue = distritoSelect ? distritoSelect.value : '';
			const latitudValue = latitudInput ? latitudInput.value : '';
			const longitudValue = longitudInput ? longitudInput.value : '';
			
			let hasErrors = false;
			
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
		if (!cuit || !razonSocial || !dni || !nombre || !apellido || !email || !telefono || !password) {
			throw new Error('Faltan datos obligatorios en los pasos 1 y 2');
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
				email: email,
				contrasenia: password
			}
		};
		
		// Agregar administrador de establecimiento solo si no está marcado como "sin administrador"
		if (!sinAdminEst && adminEstNombre && adminEstApellido && adminEstDni && adminEstEmail && adminEstTelefono && adminEstPassword) {
			datosRegistro.dtoPersonaEstablecimientoRegistro = {
				dni: adminEstDni,
				apellido: adminEstApellido,
				nombrePersona: adminEstNombre,
				telefono: adminEstTelefono,
				email: adminEstEmail,
				contrasenia: adminEstPassword
			};
		}
		
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