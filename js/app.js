	// Cargar distritos según el departamento seleccionado
	function cargarDistritosPorDepartamento(idDepartamento) {
		const select = document.getElementById('distrito');
		if (!select || !idDepartamento) {
			select.innerHTML = '<option value="">Seleccionar distrito</option>';
			return;
		}
		select.innerHTML = '<option value="">Cargando distritos...</option>';
		fetch(`http://localhost:9090/distritos/departamento/${idDepartamento}`)
			.then(res => res.json())
			.then(data => {
				select.innerHTML = '<option value="">Seleccionar distrito</option>';
				data.forEach(dist => {
					const value = dist.idDistrito;
					const label = dist.nombreDistrito;
					const opt = document.createElement('option');
					opt.value = value;
					opt.textContent = label;
					select.appendChild(opt);
				});
			})
			.catch(() => {
				select.innerHTML = '<option value="">No se pudieron cargar los distritos</option>';
			});
	}
	// Cargar departamentos desde endpoint y poblar el select
	function cargarDepartamentos() {
		const select = document.getElementById('departamento');
		if (!select) return;
		select.innerHTML = '<option value="">Cargando departamentos...</option>';
		fetch('http://localhost:9090/departamentos')
			.then(res => res.json())
			.then(data => {
				select.innerHTML = '<option value="">Seleccionar departamento</option>';
				data.forEach(dep => {
					const value = dep.idDepartamento;
					const label = dep.nombreDepartamento;
					const opt = document.createElement('option');
					opt.value = value;
					opt.textContent = label;
					select.appendChild(opt);
				});
				// Registrar evento change cada vez que se repuebla el select
				select.onchange = function() {
					cargarDistritosPorDepartamento(this.value);
				};
			})
			.catch(() => {
				select.innerHTML = '<option value="">No se pudieron cargar los departamentos</option>';
			});
	}

// Inicializar el mapa principal de la página (no el del wizard)
document.addEventListener('DOMContentLoaded', function() {
	// --- Función de ojo para mostrar/ocultar contraseña (siempre activa) ---
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

	// Coincidencia visual de contraseñas (siempre activa)
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
	var map = L.map('map').setView([-32.89, -68.83], 8); // Mendoza
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 18,
		attribution: '© OpenStreetMap contributors'
	}).addTo(map);

	// --- Lógica del wizard de registro de empleador ---
	const paso1 = document.getElementById('form-registro-empleador-paso1');
	const paso2 = document.getElementById('form-registro-empleador-paso2');
	const paso3 = document.getElementById('form-registro-empleador-paso3');
	const paso5 = document.getElementById('form-registro-empleador-paso5');
	const btnSiguiente1 = document.getElementById('btn-siguiente-paso1');
	const btnAnterior2 = document.getElementById('btn-anterior-paso2');
	const btnSiguiente2 = document.getElementById('btn-siguiente-paso2');
	const btnAnterior3 = document.getElementById('btn-anterior-paso3');
	const btnSiguiente3 = document.getElementById('btn-siguiente-paso3');
	const btnAnterior5 = document.getElementById('btn-anterior-paso5');

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
	if (btnAnterior2) {
		btnAnterior2.addEventListener('click', function() {
			paso2.classList.add('d-none');
			paso1.classList.remove('d-none');
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
	let dniErrorMsg = '';
	let nombreErrorMsg = '';
	let apellidoErrorMsg = '';
	let emailErrorMsg = '';
	let telefonoErrorMsg = '';
	let passwordErrorMsg = '';
	let password2ErrorMsg = '';
			// Validación DNI
			if (!dniValue) {
				dniErrorMsg = 'El campo DNI es obligatorio.';
			} else if (!/^\d{7,8}$/.test(dniValue)) {
				dniErrorMsg = 'El DNI debe tener entre 7 y 8 números.';
			}
			// Validación Nombre
			if (!nombreValue) {
				nombreErrorMsg = 'El campo Nombre es obligatorio.';
			} else if (!/^[A-ZÁÉÍÓÚÑ ]+$/.test(nombreValue)) {
				nombreErrorMsg = 'El nombre solo debe contener letras y espacios.';
			}
			// Validación Apellido
			if (!apellidoValue) {
				apellidoErrorMsg = 'El campo Apellido es obligatorio.';
			} else if (!/^[A-ZÁÉÍÓÚÑ ]+$/.test(apellidoValue)) {
				apellidoErrorMsg = 'El apellido solo debe contener letras y espacios.';
			}
			// Error DNI
			let dniErrorDiv = document.getElementById('dni-error');
			if (!dniErrorDiv) {
				dniErrorDiv = document.createElement('div');
				dniErrorDiv.id = 'dni-error';
				dniErrorDiv.className = 'text-danger mt-1';
				dniInput.parentNode.appendChild(dniErrorDiv);
			}
			if (dniErrorMsg) {
				dniErrorDiv.textContent = dniErrorMsg;
				dniInput.classList.add('is-invalid');
				dniInput.focus();
			} else {
				dniErrorDiv.textContent = '';
				dniInput.classList.remove('is-invalid');
			}
			// Error Nombre
			let nombreErrorDiv = document.getElementById('nombre-error');
			if (!nombreErrorDiv) {
				nombreErrorDiv = document.createElement('div');
				nombreErrorDiv.id = 'nombre-error';
				nombreErrorDiv.className = 'text-danger mt-1';
				nombreInput.parentNode.appendChild(nombreErrorDiv);
			}
			if (nombreErrorMsg) {
				nombreErrorDiv.textContent = nombreErrorMsg;
				nombreInput.classList.add('is-invalid');
				if (!dniErrorMsg) nombreInput.focus();
			} else {
				nombreErrorDiv.textContent = '';
				nombreInput.classList.remove('is-invalid');
			}
			// Error Apellido
			let apellidoErrorDiv = document.getElementById('apellido-error');
			if (!apellidoErrorDiv) {
				apellidoErrorDiv = document.createElement('div');
				apellidoErrorDiv.id = 'apellido-error';
				apellidoErrorDiv.className = 'text-danger mt-1';
				apellidoInput.parentNode.appendChild(apellidoErrorDiv);
			}
			if (apellidoErrorMsg) {
				apellidoErrorDiv.textContent = apellidoErrorMsg;
				apellidoInput.classList.add('is-invalid');
				if (!dniErrorMsg && !nombreErrorMsg) apellidoInput.focus();
			} else {
				apellidoErrorDiv.textContent = '';
				apellidoInput.classList.remove('is-invalid');
			}
			// Error Email
			let emailErrorDiv = document.getElementById('email-error');
			if (!emailErrorDiv) {
				emailErrorDiv = document.createElement('div');
				emailErrorDiv.id = 'email-error';
				emailErrorDiv.className = 'text-danger mt-1';
				emailInput.parentNode.appendChild(emailErrorDiv);
			}
			// Validación Email
			if (!emailValue) {
				emailErrorMsg = 'El campo Email es obligatorio.';
			} else if (!/^([a-zA-Z0-9_\.-]+)@([a-zA-Z0-9\.-]+)\.([a-zA-Z]{2,})$/.test(emailValue)) {
				emailErrorMsg = 'Ingrese un email válido.';
			}
			if (emailErrorMsg) {
				emailErrorDiv.textContent = emailErrorMsg;
				emailInput.classList.add('is-invalid');
				if (!dniErrorMsg && !nombreErrorMsg && !apellidoErrorMsg) emailInput.focus();
			} else {
				emailErrorDiv.textContent = '';
				emailInput.classList.remove('is-invalid');
			}
			// Error Teléfono
			let telefonoErrorDiv = document.getElementById('telefono-error');
			if (!telefonoErrorDiv) {
				telefonoErrorDiv = document.createElement('div');
				telefonoErrorDiv.id = 'telefono-error';
				telefonoErrorDiv.className = 'text-danger mt-1';
				telefonoInput.parentNode.appendChild(telefonoErrorDiv);
			}
			// Validación Teléfono
			if (!telefonoValue) {
				telefonoErrorMsg = 'El campo Teléfono es obligatorio.';
			} else if (!/^\d+$/.test(telefonoValue)) {
				telefonoErrorMsg = 'El teléfono solo debe contener números.';
			}
			if (telefonoErrorMsg) {
				telefonoErrorDiv.textContent = telefonoErrorMsg;
				telefonoInput.classList.add('is-invalid');
				if (!dniErrorMsg && !nombreErrorMsg && !apellidoErrorMsg && !emailErrorMsg) telefonoInput.focus();
			} else {
				telefonoErrorDiv.textContent = '';
				telefonoInput.classList.remove('is-invalid');
			}
			// Error Password
			let passwordErrorDiv = document.getElementById('password-error');
			if (!passwordErrorDiv) {
				passwordErrorDiv = document.createElement('div');
				passwordErrorDiv.id = 'password-error';
				passwordErrorDiv.className = 'text-danger mt-1';
				passwordInput.parentNode.appendChild(passwordErrorDiv);
			}
			if (!passwordValue) {
				passwordErrorMsg = 'El campo Contraseña es obligatorio.';
			} else if (/\s/.test(passwordValue)) {
				passwordErrorMsg = 'La contraseña no debe contener espacios.';
			} else if (passwordValue.length < 4) {
				passwordErrorMsg = 'La contraseña debe tener al menos 4 caracteres.';
			}
			if (passwordErrorMsg) {
				passwordErrorDiv.textContent = passwordErrorMsg;
				passwordInput.classList.add('is-invalid');
				if (!dniErrorMsg && !nombreErrorMsg && !apellidoErrorMsg && !emailErrorMsg && !telefonoErrorMsg) passwordInput.focus();
			} else {
				passwordErrorDiv.textContent = '';
				passwordInput.classList.remove('is-invalid');
			}
			// Error Password2 y coincidencia
			let password2ErrorDiv = document.getElementById('password2-error');
			let password2Icon = document.getElementById('password2-icon');
			if (password2Input) {
				if (!password2ErrorDiv) {
					password2ErrorDiv = document.createElement('div');
					password2ErrorDiv.id = 'password2-error';
					password2ErrorDiv.className = 'text-danger mt-1';
					password2Input.parentNode.appendChild(password2ErrorDiv);
				}
				if (!password2Icon) {
					password2Icon = document.createElement('span');
					password2Icon.id = 'password2-icon';
					password2Icon.style.marginLeft = '8px';
					password2Input.parentNode.appendChild(password2Icon);
				}
				if (!password2Value) {
					password2ErrorMsg = 'Repita la contraseña.';
					password2Icon.innerHTML = '';
				} else if (passwordValue !== password2Value) {
					password2ErrorMsg = 'La contraseña no coincide.';
					password2Icon.innerHTML = '<i class="bi bi-x-circle-fill" style="color:#dc3545;font-size:1.2em;vertical-align:middle;"></i>';
				} else {
					password2ErrorMsg = '';
					password2Icon.innerHTML = '<i class="bi bi-check-circle-fill" style="color:#198754;font-size:1.2em;vertical-align:middle;"></i>';
				}
				if (password2ErrorMsg) {
					password2ErrorDiv.textContent = password2ErrorMsg;
					password2Input.classList.add('is-invalid');
					if (!dniErrorMsg && !nombreErrorMsg && !apellidoErrorMsg && !emailErrorMsg && !telefonoErrorMsg && !passwordErrorMsg) password2Input.focus();
				} else {
					password2ErrorDiv.textContent = '';
					password2Input.classList.remove('is-invalid');
				}
			}
			// Si hay algún error, no avanzar
			if (dniErrorMsg || nombreErrorMsg || apellidoErrorMsg || emailErrorMsg || telefonoErrorMsg || passwordErrorMsg || password2ErrorMsg) return;
			paso2.classList.add('d-none');
			paso3.classList.remove('d-none');
			setTimeout(function() {
				initEstablecimientoMap();
				cargarEspecies();
				cargarDepartamentos();
				// Limpiar distritos al entrar al paso 3
				const distritoSelect = document.getElementById('distrito');
				if (distritoSelect) {
					distritoSelect.innerHTML = '<option value="">Seleccionar distrito</option>';
				}
				// No permitir espacios en contraseña
				const passwordInput = document.getElementById('password');
				if (passwordInput) {
					passwordInput.addEventListener('input', function() {
						this.value = this.value.replace(/\s/g, '');
					});
				}
				// No permitir espacios en repetir contraseña
				const password2Input = document.getElementById('password2');
				if (password2Input) {
					password2Input.addEventListener('input', function() {
						this.value = this.value.replace(/\s/g, '');
						const passwordValue = passwordInput.value;
						const password2Value = this.value;
						let password2Icon = document.getElementById('password2-icon');
						if (!password2Icon) {
							password2Icon = document.createElement('span');
							password2Icon.id = 'password2-icon';
							password2Icon.style.marginLeft = '8px';
							this.parentNode.appendChild(password2Icon);
						}
						if (!password2Value) {
							password2Icon.innerHTML = '';
						} else if (passwordValue !== password2Value) {
							password2Icon.innerHTML = '<i class="bi bi-x-circle-fill" style="color:#dc3545;font-size:1.2em;vertical-align:middle;"></i>';
						} else {
							password2Icon.innerHTML = '<i class="bi bi-check-circle-fill" style="color:#198754;font-size:1.2em;vertical-align:middle;"></i>';
						}
					});
				}
				// Función de ojo para mostrar/ocultar contraseña
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
			}, 200); // Espera a que el modal renderice
		});
		// Solo permitir números y máximo 8 caracteres en el input DNI
		const dniInput = document.getElementById('dni');
		if (dniInput) {
			dniInput.addEventListener('input', function() {
				this.value = this.value.replace(/\D/g, '').slice(0, 8);
			});
		}
		// Forzar mayúsculas y solo letras en Nombre
		const nombreInput = document.getElementById('nombre');
		if (nombreInput) {
			nombreInput.addEventListener('input', function() {
				this.value = this.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ ]/g, '');
			});
		}
		// Forzar mayúsculas y solo letras en Apellido
		const apellidoInput = document.getElementById('apellido');
		if (apellidoInput) {
			apellidoInput.addEventListener('input', function() {
				this.value = this.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ ]/g, '');
			});
		}
		// Solo permitir números en Teléfono
		const telefonoInput = document.getElementById('telefono');
		if (telefonoInput) {
			telefonoInput.addEventListener('input', function() {
				this.value = this.value.replace(/\D/g, '');
			});
		}
	}
	// ...existing code...
	if (btnAnterior3) {
		btnAnterior3.addEventListener('click', function() {
			paso3.classList.add('d-none');
			paso2.classList.remove('d-none');
		});
	}
	if (btnSiguiente3) {
		btnSiguiente3.addEventListener('click', function() {
			paso3.classList.add('d-none');
			paso5.classList.remove('d-none');
			llenarConfirmacion();
		});
	}
	if (btnAnterior5) {
		btnAnterior5.addEventListener('click', function() {
			paso5.classList.add('d-none');
			paso3.classList.remove('d-none');
		});
	}

	// Inicialización del mapa de geolocalización para el paso 3 del wizard
	let establecimientoMap = null;
	function initEstablecimientoMap() {
		if (establecimientoMap) {
			establecimientoMap.invalidateSize();
			return;
		}
		establecimientoMap = L.map('establecimiento-map').setView([-32.8908, -68.8272], 10); // Mendoza por defecto
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

	// Cargar especies desde endpoint y poblar dropdown con checkboxes
	function cargarEspecies() {
		const especiesList = document.getElementById('especies-list');
		const especiesInput = document.getElementById('especies');
		const dropdownBtn = document.getElementById('dropdownEspecies');
		if (!especiesList || !especiesInput || !dropdownBtn) return;
		especiesList.innerHTML = '<li class="px-3 py-2 text-muted">Cargando especies...</li>';
		fetch('http://localhost:9090/especies')
			.then(res => res.json())
			.then(data => {
				if (!Array.isArray(data) || data.length === 0) {
					especiesList.innerHTML = '<li class="px-3 py-2 text-danger">No hay especies disponibles</li>';
					return;
				}
				especiesList.innerHTML = '';
				data.forEach(especie => {
					const id = especie.idEspecie;
					const nombre = especie.nombreEspecie;
					const li = document.createElement('li');
					li.className = 'px-3 py-1';
					li.innerHTML = `
						<div class="form-check">
							<input class="form-check-input" type="checkbox" value="${id}" id="chk-especie-${id}">
							<label class="form-check-label" for="chk-especie-${id}">${nombre}</label>
						</div>
					`;
					especiesList.appendChild(li);
				});

				// Manejar selección múltiple
				especiesList.querySelectorAll('input[type=checkbox]').forEach(cb => {
					cb.addEventListener('change', function() {
						const checked = Array.from(especiesList.querySelectorAll('input[type=checkbox]:checked'));
						const values = checked.map(cb => cb.value);
						const labels = checked.map(cb => cb.parentElement.querySelector('label').textContent);
						especiesInput.value = values.join(',');
						dropdownBtn.textContent = labels.length ? labels.join(', ') : 'Seleccionar especies';
					});
				});
			})
			.catch(() => {
				especiesList.innerHTML = '<li class="px-3 py-2 text-danger">No se pudieron cargar las especies</li>';
			});
	}

	// Llenar lista de confirmación
	function llenarConfirmacion() {
		const lista = document.getElementById('confirmacion-lista');
		if (!lista) return;
		lista.innerHTML = '';
		// Paso 1
		lista.innerHTML += `<li class='list-group-item'><b>CUIT:</b> ${document.getElementById('cuit').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Razón Social:</b> ${document.getElementById('razonSocial').value}</li>`;
		// Paso 2
		lista.innerHTML += `<li class='list-group-item'><b>DNI:</b> ${document.getElementById('dni').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Nombre:</b> ${document.getElementById('nombre').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Apellido:</b> ${document.getElementById('apellido').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Email:</b> ${document.getElementById('email').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Teléfono:</b> ${document.getElementById('telefono').value}</li>`;
		// Paso 3
		lista.innerHTML += `<li class='list-group-item'><b>Nombre Establecimiento:</b> ${document.getElementById('nombreEstablecimiento').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Número de RENSPA:</b> ${document.getElementById('renspa').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Especies:</b> ${document.getElementById('especies').selectedOptions[0]?.textContent || ''}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Departamento:</b> ${document.getElementById('departamento').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Distrito:</b> ${document.getElementById('distrito').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Calle:</b> ${document.getElementById('calle').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Numeración:</b> ${document.getElementById('numeracion').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Código Postal:</b> ${document.getElementById('codigoPostal').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Latitud:</b> ${document.getElementById('latitud').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Longitud:</b> ${document.getElementById('longitud').value}</li>`;
	}
});
