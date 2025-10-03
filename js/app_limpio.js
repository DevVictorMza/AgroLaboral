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
			cuitInput.addEventListener('input', function() {
				this.value = this.value.replace(/\D/g, '').slice(0, 11);
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
	// [El código continuaría con los pasos 3, 4, 5 pero lo resumo por espacio]
	
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
		// Función simplificada - en producción conectaría con API
		const especiesList = document.getElementById('especies-list');
		if (especiesList) {
			especiesList.innerHTML = `
				<li class="px-3 py-1">
					<div class="form-check">
						<input class="form-check-input" type="checkbox" value="1" id="chk-especie-1">
						<label class="form-check-label" for="chk-especie-1">Vid</label>
					</div>
				</li>
				<li class="px-3 py-1">
					<div class="form-check">
						<input class="form-check-input" type="checkbox" value="2" id="chk-especie-2">
						<label class="form-check-label" for="chk-especie-2">Olivo</label>
					</div>
				</li>
				<li class="px-3 py-1">
					<div class="form-check">
						<input class="form-check-input" type="checkbox" value="3" id="chk-especie-3">
						<label class="form-check-label" for="chk-especie-3">Cerezo</label>
					</div>
				</li>
			`;
		}
	}

	// Cargar departamentos
	function cargarDepartamentos() {
		const select = document.getElementById('departamento');
		if (select) {
			select.innerHTML = `
				<option value="">Seleccionar departamento</option>
				<option value="1">Capital</option>
				<option value="2">Godoy Cruz</option>
				<option value="3">Maipú</option>
				<option value="4">Las Heras</option>
			`;
		}
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
			}, 100);
		});
	}
});