// Validación: adminEstPassword y adminEstPassword2 en tiempo real, feedback visual
const adminEstPassword = document.getElementById('adminEstPassword');
const adminEstPassword2 = document.getElementById('adminEstPassword2');
if (adminEstPassword) {
	adminEstPassword.addEventListener('input', function() {
		let errorDiv = document.getElementById('adminEstPassword-error');
		if (!errorDiv) {
			errorDiv = document.createElement('div');
			errorDiv.id = 'adminEstPassword-error';
			errorDiv.className = 'text-danger mt-1';
			this.parentNode.appendChild(errorDiv);
		}
		if (!this.value) {
			errorDiv.textContent = 'La contraseña es obligatoria.';
			this.classList.add('is-invalid');
			this.classList.remove('is-valid');
		} else if (/\s/.test(this.value)) {
			errorDiv.textContent = 'La contraseña no debe contener espacios.';
			this.classList.add('is-invalid');
			this.classList.remove('is-valid');
		} else if (this.value.length < 4) {
			errorDiv.textContent = 'La contraseña debe tener al menos 4 caracteres.';
			this.classList.add('is-invalid');
			this.classList.remove('is-valid');
		} else {
			errorDiv.textContent = '';
			this.classList.remove('is-invalid');
			this.classList.add('is-valid');
		}
	});
}
if (adminEstPassword2 && adminEstPassword) {
	adminEstPassword2.addEventListener('input', function() {
		let errorDiv = document.getElementById('adminEstPassword2-error');
		if (!errorDiv) {
			errorDiv = document.createElement('div');
			errorDiv.id = 'adminEstPassword2-error';
			errorDiv.className = 'text-danger mt-1';
			this.parentNode.appendChild(errorDiv);
		}
		if (!this.value) {
			errorDiv.textContent = 'Repita la contraseña.';
			this.classList.add('is-invalid');
			this.classList.remove('is-valid');
		} else if (this.value !== adminEstPassword.value) {
			errorDiv.textContent = 'Su contraseña no coincide, por favor verifique de vuelta!';
			this.classList.add('is-invalid');
			this.classList.remove('is-valid');
		} else {
			errorDiv.textContent = 'Su contraseña coincide!';
			errorDiv.classList.remove('text-danger');
			errorDiv.classList.add('text-success');
			this.classList.remove('is-invalid');
			this.classList.add('is-valid');
		}
	});
}
// Validación: adminEstTelefono solo números, obligatorio, máximo 15 dígitos, feedback visual
const adminEstTelefono = document.getElementById('adminEstTelefono');
if (adminEstTelefono) {
	adminEstTelefono.addEventListener('input', function() {
		// Solo permitir números y máximo 15 caracteres
		this.value = this.value.replace(/\D/g, '').slice(0, 15);
		let errorDiv = document.getElementById('adminEstTelefono-error');
		if (!errorDiv) {
			errorDiv = document.createElement('div');
			errorDiv.id = 'adminEstTelefono-error';
			errorDiv.className = 'text-danger mt-1';
			this.parentNode.appendChild(errorDiv);
		}
		if (!this.value) {
			errorDiv.textContent = 'El teléfono es obligatorio.';
			this.classList.add('is-invalid');
			this.classList.remove('is-valid');
		} else if (!/^\d{1,15}$/.test(this.value)) {
			errorDiv.textContent = 'El teléfono debe tener hasta 15 dígitos.';
			this.classList.add('is-invalid');
			this.classList.remove('is-valid');
		} else {
			errorDiv.textContent = '';
			this.classList.remove('is-invalid');
			this.classList.add('is-valid');
		}
	});
	adminEstTelefono.addEventListener('blur', function() {
		let errorDiv = document.getElementById('adminEstTelefono-error');
		if (!errorDiv) {
			errorDiv = document.createElement('div');
			errorDiv.id = 'adminEstTelefono-error';
			errorDiv.className = 'text-danger mt-1';
			this.parentNode.appendChild(errorDiv);
		}
		if (!this.value) {
			errorDiv.textContent = 'El teléfono es obligatorio.';
			this.classList.add('is-invalid');
			this.classList.remove('is-valid');
		} else if (!/^\d{1,15}$/.test(this.value)) {
			errorDiv.textContent = 'El teléfono debe tener hasta 15 dígitos.';
			this.classList.add('is-invalid');
			this.classList.remove('is-valid');
		} else {
			errorDiv.textContent = '';
			this.classList.remove('is-invalid');
			this.classList.add('is-valid');
		}
	});
}
// Mostrar mensaje de éxito al confirmar registro
document.addEventListener('DOMContentLoaded', function() {
	// Validación: adminEstEmail formato email, obligatorio, sin espacios
	const adminEstEmail = document.getElementById('adminEstEmail');
	if (adminEstEmail) {
		adminEstEmail.addEventListener('input', function() {
			let value = this.value.replace(/\s/g, ''); // Eliminar espacios
			this.value = value;
			// Validar formato email
			const emailRegex = /^([a-zA-Z0-9_\.-]+)@([a-zA-Z0-9\.-]+)\.([a-zA-Z]{2,})$/;
			if (!emailRegex.test(value)) {
				this.classList.add('is-invalid');
				this.classList.remove('is-valid');
			} else {
				this.classList.remove('is-invalid');
				this.classList.add('is-valid');
			}
		});
		adminEstEmail.addEventListener('blur', function() {
			let value = this.value.replace(/\s/g, '');
			this.value = value;
			const emailRegex = /^([a-zA-Z0-9_\.-]+)@([a-zA-Z0-9\.-]+)\.([a-zA-Z]{2,})$/;
			if (!value || !emailRegex.test(value)) {
				this.classList.add('is-invalid');
				if (!document.getElementById('adminEstEmail-error')) {
					const error = document.createElement('div');
					error.id = 'adminEstEmail-error';
					error.className = 'text-danger mt-1';
					error.textContent = 'Ingrese un email válido y obligatorio.';
					this.parentNode.appendChild(error);
				}
			} else {
				this.classList.remove('is-invalid');
				const error = document.getElementById('adminEstEmail-error');
				if (error) error.remove();
			}
		});
	}
	// Validación: adminEstDni solo números, obligatorio, 7-8 dígitos, sin espacios ni caracteres especiales
	const adminEstDni = document.getElementById('adminEstDni');
	if (adminEstDni) {
		adminEstDni.addEventListener('input', function() {
			let value = this.value.replace(/[^0-9]/g, ''); // Solo números
			if (value.length > 8) value = value.slice(0, 8); // Limitar a 8 dígitos
			this.value = value;
			// Validar longitud
			if (value.length < 7 || value.length > 8) {
				this.classList.add('is-invalid');
				this.classList.remove('is-valid');
			} else {
				this.classList.remove('is-invalid');
				this.classList.add('is-valid');
			}
		});
		adminEstDni.addEventListener('blur', function() {
			let value = this.value.replace(/[^0-9]/g, '');
			if (value.length < 7 || value.length > 8) {
				this.classList.add('is-invalid');
				if (!document.getElementById('adminEstDni-error')) {
					const error = document.createElement('div');
					error.id = 'adminEstDni-error';
					error.className = 'text-danger mt-1';
					error.textContent = 'El DNI debe tener entre 7 y 8 números.';
					this.parentNode.appendChild(error);
				}
			} else {
				this.classList.remove('is-invalid');
				const error = document.getElementById('adminEstDni-error');
				if (error) error.remove();
			}
		});
	}
	// Validación: adminEstApellido solo letras mayúsculas, sin números, caracteres especiales, espacios ni en blanco
	const adminEstApellido = document.getElementById('adminEstApellido');
	if (adminEstApellido) {
		adminEstApellido.addEventListener('input', function() {
			let value = this.value.toUpperCase();
			value = value.replace(/[^A-Z]/g, ''); // Solo letras mayúsculas
			this.value = value;
			// Validar que no esté vacío
			if (value === '') {
				this.classList.add('is-invalid');
				this.classList.remove('is-valid');
			} else {
				this.classList.remove('is-invalid');
				this.classList.add('is-valid');
			}
		});
		adminEstApellido.addEventListener('blur', function() {
			if (!this.value.trim()) {
				this.classList.add('is-invalid');
				if (!document.getElementById('adminEstApellido-error')) {
					const error = document.createElement('div');
					error.id = 'adminEstApellido-error';
					error.className = 'text-danger mt-1';
					error.textContent = 'El apellido es obligatorio.';
					this.parentNode.appendChild(error);
				}
			} else {
				this.classList.remove('is-invalid');
				const error = document.getElementById('adminEstApellido-error');
				if (error) error.remove();
			}
		});
	}
	// Validación: adminEstNombre solo letras mayúsculas, sin números, caracteres especiales, espacios ni en blanco
	const adminEstNombre = document.getElementById('adminEstNombre');
	if (adminEstNombre) {
		adminEstNombre.addEventListener('input', function() {
			let value = this.value.toUpperCase();
			value = value.replace(/[^A-Z]/g, ''); // Solo letras mayúsculas
			this.value = value;
			// Validar que no esté vacío
			if (value === '') {
				this.classList.add('is-invalid');
				this.classList.remove('is-valid');
			} else {
				this.classList.remove('is-invalid');
				this.classList.add('is-valid');
			}
		});
		adminEstNombre.addEventListener('blur', function() {
			if (!this.value.trim()) {
				this.classList.add('is-invalid');
				if (!document.getElementById('adminEstNombre-error')) {
					const error = document.createElement('div');
					error.id = 'adminEstNombre-error';
					error.className = 'text-danger mt-1';
					error.textContent = 'El nombre es obligatorio.';
					this.parentNode.appendChild(error);
				}
			} else {
				this.classList.remove('is-invalid');
				const error = document.getElementById('adminEstNombre-error');
				if (error) error.remove();
			}
		});
	}
	// Actualizar lista de confirmación cada vez que se muestre el modal y el paso 5 esté visible
	const modalRegistro = document.getElementById('modalRegistroEmpleador');
	if (modalRegistro) {
		modalRegistro.addEventListener('shown.bs.modal', function() {
			const paso5 = document.getElementById('form-registro-empleador-paso5');
			if (paso5 && !paso5.classList.contains('d-none')) {
				llenarConfirmacion();
			}
		});
	}
	const formPaso5 = document.getElementById('form-registro-empleador-paso5');
	if (formPaso5) {
		formPaso5.addEventListener('submit', function(e) {
			e.preventDefault();
			const mensaje = document.getElementById('mensaje-exito');
			if (mensaje) {
				mensaje.classList.remove('d-none');
				mensaje.scrollIntoView({behavior: 'smooth'});
			}
		});
	}
});
	// Bloquear/desbloquear campos si se marca el checkbox 'sinAdminEstablecimiento'
	const sinAdmin = document.getElementById('sinAdminEstablecimiento');
	if (sinAdmin) {
		const camposPaso4 = [
			document.getElementById('adminEstNombre'),
			document.getElementById('adminEstApellido'),
			document.getElementById('adminEstDni'),
			document.getElementById('adminEstEmail'),
			document.getElementById('adminEstTelefono'),
			document.getElementById('adminEstPassword'),
			document.getElementById('adminEstPassword2')
		];
		sinAdmin.addEventListener('change', function() {
			if (this.checked) {
				camposPaso4.forEach(campo => {
					campo.disabled = true;
					campo.value = '';
					campo.classList.remove('is-invalid', 'is-valid');
				});
			} else {
				camposPaso4.forEach(campo => {
					campo.disabled = false;
				});
			}
		});
	}
	// --- Paso 4: Validación Administrador de Establecimiento (opcional) ---
	const paso4 = document.getElementById('form-registro-empleador-paso4');
	const btnAnterior4 = document.getElementById('btn-anterior-paso4');
	const btnSiguiente4 = document.getElementById('btn-siguiente-paso4');
	if (btnAnterior4) {
		btnAnterior4.addEventListener('click', function() {
			paso4.classList.add('d-none');
			paso3.classList.remove('d-none');
		});
	}
	if (btnSiguiente4) {
		btnSiguiente4.addEventListener('click', function() {
			// Ocultar todos los pasos y mostrar solo el paso 5
			const pasos = [
				document.getElementById('form-registro-empleador-paso1'),
				document.getElementById('form-registro-empleador-paso2'),
				document.getElementById('form-registro-empleador-paso3'),
				document.getElementById('form-registro-empleador-paso4'),
				document.getElementById('form-registro-empleador-paso5')
			];
			pasos.forEach((p, idx) => {
				if (p) p.classList.add('d-none');
			});
			const paso5 = document.getElementById('form-registro-empleador-paso5');
			if (paso5) paso5.classList.remove('d-none');
			// Actualizar barra de progreso y labels de pasos
			const wizardLabels = document.querySelectorAll('.wizard-step-label');
			wizardLabels.forEach((el, idx) => {
				if (idx === 4) {
					el.classList.add('active');
				} else {
					el.classList.remove('active');
				}
			});
			const progressBar = document.querySelector('.wizard-progress-bar-inner');
			if (progressBar) progressBar.style.width = '100%';
			const sinAdmin = document.getElementById('sinAdminEstablecimiento');
			if (sinAdmin && sinAdmin.checked) {
				paso4.classList.add('d-none');
				paso5.classList.remove('d-none');
				llenarConfirmacion();
				return;
			}
			// Obtener valores
			const nombre = document.getElementById('adminEstNombre');
			const apellido = document.getElementById('adminEstApellido');
			const dni = document.getElementById('adminEstDni');
			const email = document.getElementById('adminEstEmail');
			const telefono = document.getElementById('adminEstTelefono');
			const password = document.getElementById('adminEstPassword');
			const password2 = document.getElementById('adminEstPassword2');
			const campos = [nombre, apellido, dni, email, telefono, password, password2];
			const values = campos.map(c => c.value.trim());
			// Si todos los campos están vacíos, permitir avanzar
			if (values.every(v => v === '')) {
				paso4.classList.add('d-none');
				paso5.classList.remove('d-none');
				llenarConfirmacion();
				return;
			}
			// Validaciones
			let errores = false;
			// Nombre
			let nombreError = document.getElementById('adminEstNombre-error');
			if (!nombreError) {
				nombreError = document.createElement('div');
				nombreError.id = 'adminEstNombre-error';
				nombreError.className = 'text-danger mt-1';
				nombre.parentNode.appendChild(nombreError);
			}
			if (!values[0]) {
				nombreError.textContent = 'El nombre es obligatorio.';
				nombre.classList.add('is-invalid');
				errores = true;
			} else if (!/^[A-ZÁÉÍÓÚÑ ]+$/.test(values[0])) {
				nombreError.textContent = 'Solo letras mayúsculas y espacios.';
				nombre.classList.add('is-invalid');
				errores = true;
			} else {
				nombreError.textContent = '';
				nombre.classList.remove('is-invalid');
			}
			// Apellido
			let apellidoError = document.getElementById('adminEstApellido-error');
			if (!apellidoError) {
				apellidoError = document.createElement('div');
				apellidoError.id = 'adminEstApellido-error';
				apellidoError.className = 'text-danger mt-1';
				apellido.parentNode.appendChild(apellidoError);
			}
			if (!values[1]) {
				apellidoError.textContent = 'El apellido es obligatorio.';
				apellido.classList.add('is-invalid');
				errores = true;
			} else if (!/^[A-ZÁÉÍÓÚÑ ]+$/.test(values[1])) {
				apellidoError.textContent = 'Solo letras mayúsculas y espacios.';
				apellido.classList.add('is-invalid');
				errores = true;
			} else {
				apellidoError.textContent = '';
				apellido.classList.remove('is-invalid');
			}
			// DNI
			let dniError = document.getElementById('adminEstDni-error');
			if (!dniError) {
				dniError = document.createElement('div');
				dniError.id = 'adminEstDni-error';
				dniError.className = 'text-danger mt-1';
				dni.parentNode.appendChild(dniError);
			}
			if (!values[2]) {
				dniError.textContent = 'El DNI es obligatorio.';
				dni.classList.add('is-invalid');
				errores = true;
			} else if (!/^\d{7,8}$/.test(values[2])) {
				dniError.textContent = 'El DNI debe tener entre 7 y 8 números.';
				dni.classList.add('is-invalid');
				errores = true;
			} else {
				dniError.textContent = '';
				dni.classList.remove('is-invalid');
			}
			// Email
			let emailError = document.getElementById('adminEstEmail-error');
			if (!emailError) {
				emailError = document.createElement('div');
				emailError.id = 'adminEstEmail-error';
				emailError.className = 'text-danger mt-1';
				email.parentNode.appendChild(emailError);
			}
			if (!values[3]) {
				emailError.textContent = 'El email es obligatorio.';
				email.classList.add('is-invalid');
				errores = true;
			} else if (!/^([a-zA-Z0-9_\.-]+)@([a-zA-Z0-9\.-]+)\.([a-zA-Z]{2,})$/.test(values[3])) {
				emailError.textContent = 'Ingrese un email válido.';
				email.classList.add('is-invalid');
				errores = true;
			} else {
				emailError.textContent = '';
				email.classList.remove('is-invalid');
			}
			// Teléfono
			let telError = document.getElementById('adminEstTelefono-error');
			if (!telError) {
				telError = document.createElement('div');
				telError.id = 'adminEstTelefono-error';
				telError.className = 'text-danger mt-1';
				telefono.parentNode.appendChild(telError);
			}
			if (!values[4]) {
				telError.textContent = 'El teléfono es obligatorio.';
				telefono.classList.add('is-invalid');
				errores = true;
			} else if (!/^\d{1,15}$/.test(values[4])) {
				if (!/^\d+$/.test(values[4])) {
					telError.textContent = 'El teléfono solo debe contener números.';
				} else {
					telError.textContent = 'El teléfono debe tener hasta 15 dígitos.';
				}
				telefono.classList.add('is-invalid');
				errores = true;
			} else {
				telError.textContent = '';
				telefono.classList.remove('is-invalid');
			}
			// Contraseña
			let passError = document.getElementById('adminEstPassword-error');
			if (!passError) {
				passError = document.createElement('div');
				passError.id = 'adminEstPassword-error';
				passError.className = 'text-danger mt-1';
				password.parentNode.appendChild(passError);
			}
			if (!values[5]) {
				passError.textContent = 'La contraseña es obligatoria.';
				password.classList.add('is-invalid');
				errores = true;
			} else if (/\s/.test(values[5])) {
				passError.textContent = 'La contraseña no debe contener espacios.';
				password.classList.add('is-invalid');
				errores = true;
			} else if (values[5].length < 4) {
				passError.textContent = 'La contraseña debe tener al menos 4 caracteres.';
				password.classList.add('is-invalid');
				errores = true;
			} else {
				passError.textContent = '';
				password.classList.remove('is-invalid');
			}
			// Repetir Contraseña
			let pass2Error = document.getElementById('adminEstPassword2-error');
			if (!pass2Error) {
				pass2Error = document.createElement('div');
				pass2Error.id = 'adminEstPassword2-error';
				pass2Error.className = 'text-danger mt-1';
				password2.parentNode.appendChild(pass2Error);
			}
			if (!values[6]) {
				pass2Error.textContent = 'Repita la contraseña.';
				password2.classList.add('is-invalid');
				errores = true;
			} else if (values[5] !== values[6]) {
				pass2Error.textContent = 'Las contraseñas no coinciden.';
				password2.classList.add('is-invalid');
				errores = true;
			} else {
				pass2Error.textContent = '';
				password2.classList.remove('is-invalid');
			}
			if (errores) return;
			paso4.classList.add('d-none');
			paso5.classList.remove('d-none');
			llenarConfirmacion();
		});
	}
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
			let debounceTimeout;
			cuitInput.addEventListener('input', function() {
				this.value = this.value.replace(/\D/g, '').slice(0, 11);
				clearTimeout(debounceTimeout);
				const cuitValue = this.value.trim();
				let errorDiv = document.getElementById('cuit-error');
				if (!errorDiv) {
					errorDiv = document.createElement('div');
					errorDiv.id = 'cuit-error';
					errorDiv.className = 'text-danger mt-1';
					this.parentNode.appendChild(errorDiv);
				}
				if (!cuitValue) {
					errorDiv.textContent = 'El campo CUIT es obligatorio.';
					this.classList.add('is-invalid');
					this.classList.remove('is-valid');
					return;
				} else if (!(/^\d{11}$/.test(cuitValue))) {
					errorDiv.textContent = 'El CUIT debe tener exactamente 11 números.';
					this.classList.add('is-invalid');
					this.classList.remove('is-valid');
					return;
				}
				// Validación en backend con debounce
				errorDiv.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Validando CUIT...';
				debounceTimeout = setTimeout(() => {
					fetch(`http://localhost:9090/empresas/validar-cuit?cuit=${encodeURIComponent(cuitValue)}`)
						.then(response => response.json())
						.then(data => {
							if (data && data.disponible) {
								errorDiv.innerHTML = '<span style="color:green;">&#10004;</span> CUIT disponible';
								cuitInput.classList.remove('is-invalid');
								cuitInput.classList.add('is-valid');
							} else {
								errorDiv.innerHTML = '<span style="color:red;">&#10008;</span> El CUIT ya está registrado.';
								cuitInput.classList.remove('is-valid');
								cuitInput.classList.add('is-invalid');
							}
						})
						.catch(() => {
							errorDiv.innerHTML = '<span style="color:red;">&#10008;</span> Error al validar CUIT en el servidor.';
							cuitInput.classList.remove('is-valid');
							cuitInput.classList.add('is-invalid');
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
			// --- Validación Nombre Establecimiento ---
			const nombreEstInput = document.getElementById('nombreEstablecimiento');
			const nombreEstValue = nombreEstInput.value.trim();
			let nombreEstErrorMsg = '';
			if (!nombreEstValue) {
				nombreEstErrorMsg = 'El campo Nombre de Establecimiento es obligatorio.';
			} else if (!/^[A-Z0-9 ]+$/.test(nombreEstValue)) {
				nombreEstErrorMsg = 'Solo se permiten letras mayúsculas, números y espacios.';
			}
			let nombreEstErrorDiv = document.getElementById('nombreEstablecimiento-error');
			if (!nombreEstErrorDiv) {
				nombreEstErrorDiv = document.createElement('div');
				nombreEstErrorDiv.id = 'nombreEstablecimiento-error';
				nombreEstErrorDiv.className = 'text-danger mt-1';
				nombreEstInput.parentNode.appendChild(nombreEstErrorDiv);
			}
			if (nombreEstErrorMsg) {
				nombreEstErrorDiv.textContent = nombreEstErrorMsg;
				nombreEstInput.classList.add('is-invalid');
				nombreEstInput.focus();
				return;
			} else {
				nombreEstErrorDiv.textContent = '';
				nombreEstInput.classList.remove('is-invalid');
			}

			// --- Validación RENSPA ---
			const renspaInput = document.getElementById('renspa');
			const renspaValue = renspaInput.value.trim();
			let renspaErrorMsg = '';
			if (!renspaValue) {
				renspaErrorMsg = 'El campo Número de RENSPA es obligatorio.';
			} else if (!/^\d{17}$/.test(renspaValue)) {
				renspaErrorMsg = 'El RENSPA debe tener exactamente 17 números.';
			}
			let renspaErrorDiv = document.getElementById('renspa-error');
			if (!renspaErrorDiv) {
				renspaErrorDiv = document.createElement('div');
				renspaErrorDiv.id = 'renspa-error';
				renspaErrorDiv.className = 'text-danger mt-1';
				renspaInput.parentNode.appendChild(renspaErrorDiv);
			}
			if (renspaErrorMsg) {
				renspaErrorDiv.textContent = renspaErrorMsg;
				renspaInput.classList.add('is-invalid');
				renspaInput.focus();
				return;
			} else {
				renspaErrorDiv.textContent = '';
				renspaInput.classList.remove('is-invalid');
			}

			// --- Validación Especies ---
			const especiesInput = document.getElementById('especies');
			const especiesErrorId = 'especies-error';
			let especiesErrorDiv = document.getElementById(especiesErrorId);
			if (!especiesErrorDiv) {
				especiesErrorDiv = document.createElement('div');
				especiesErrorDiv.id = especiesErrorId;
				especiesErrorDiv.className = 'text-danger mt-1';
				especiesInput.parentNode.appendChild(especiesErrorDiv);
			}
			let especiesSeleccionadas = [];
			if (especiesInput.value) {
				especiesSeleccionadas = especiesInput.value.split(',').filter(v => v.trim() !== '');
			}
			let especiesErrorMsg = '';
			if (especiesSeleccionadas.length === 0) {
				especiesErrorMsg = 'Debe seleccionar al menos una especie.';
			} else if (especiesSeleccionadas.length > 5) {
				especiesErrorMsg = 'Solo puede seleccionar hasta 5 especies.';
			}
			if (especiesSeleccionadas.some(v => !/^[0-9]+$/.test(v))) {
				especiesErrorMsg = 'Selección inválida de especies.';
			}
			if (especiesErrorMsg) {
				especiesErrorDiv.textContent = especiesErrorMsg;
				especiesInput.classList.add('is-invalid');
				especiesInput.focus();
				return;
			} else {
				especiesErrorDiv.textContent = '';
				especiesInput.classList.remove('is-invalid');
			}

			// --- Validación Departamento ---
			const departamentoInput = document.getElementById('departamento');
			let departamentoErrorDiv = document.getElementById('departamento-error');
			if (!departamentoErrorDiv) {
				departamentoErrorDiv = document.createElement('div');
				departamentoErrorDiv.id = 'departamento-error';
				departamentoErrorDiv.className = 'text-danger mt-1';
				departamentoInput.parentNode.appendChild(departamentoErrorDiv);
			}
			let departamentoErrorMsg = '';
			if (!departamentoInput.value) {
				departamentoErrorMsg = 'Debe seleccionar un departamento.';
			}
			if (departamentoErrorMsg) {
				departamentoErrorDiv.textContent = departamentoErrorMsg;
				departamentoInput.classList.add('is-invalid');
				departamentoInput.focus();
				return;
			} else {
				departamentoErrorDiv.textContent = '';
				departamentoInput.classList.remove('is-invalid');
			}

			// --- Validación CALLE ---
			const calleInput = document.getElementById('calle');
			function validarCalle() {
				const value = calleInput.value.trim();
				const regex = /^[A-Z0-9 ]+$/;
				let valid = true;
				let msg = '';
				if (value === '') {
					valid = false;
					msg = 'El campo Calle es obligatorio.';
				} else if (!regex.test(value)) {
					valid = false;
					msg = 'Solo letras mayúsculas y números, sin caracteres especiales.';
				}
				calleInput.classList.remove('is-invalid', 'is-valid');
				let error = document.getElementById('calle-error');
				if (!valid) {
					calleInput.classList.add('is-invalid');
					if (!error) {
						error = document.createElement('div');
						error.id = 'calle-error';
						error.className = 'invalid-feedback';
						calleInput.parentNode.appendChild(error);
					}
					error.textContent = msg;
				} else {
					calleInput.classList.add('is-valid');
					if (error) error.remove();
				}
				return valid;
			}
			if (!validarCalle()) {
				calleInput.focus();
				return;
			}

			// --- Validación NUMERACION ---
			const numeracionInput = document.getElementById('numeracion');
			function validarNumeracion() {
				const value = numeracionInput.value;
				const regex = /^\d+$/;
				let valid = true;
				let msg = '';
				if (value === '') {
					valid = false;
					msg = 'El campo Numeración es obligatorio.';
				} else if (!regex.test(value)) {
					valid = false;
					msg = 'Solo se permiten números, sin espacios ni caracteres especiales.';
				}
				numeracionInput.classList.remove('is-invalid', 'is-valid');
				let error = document.getElementById('numeracion-error');
				if (!valid) {
					numeracionInput.classList.add('is-invalid');
					if (!error) {
						error = document.createElement('div');
						error.id = 'numeracion-error';
						error.className = 'invalid-feedback';
						numeracionInput.parentNode.appendChild(error);
					}
					error.textContent = msg;
				} else {
					numeracionInput.classList.add('is-valid');
					if (error) error.remove();
				}
				return valid;
			}
			if (!validarNumeracion()) {
				numeracionInput.focus();
				return;
			}

			paso3.classList.add('d-none');
			paso4.classList.remove('d-none');
		});
		// Forzar mayúsculas y solo números/letras en input Nombre Establecimiento
		const nombreEstInput = document.getElementById('nombreEstablecimiento');
		if (nombreEstInput) {
			nombreEstInput.addEventListener('input', function() {
				this.value = this.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
			});
		}
		// Solo permitir mayúsculas y números en CALLE
		const calleInput2 = document.getElementById('calle');
		if (calleInput2) {
			calleInput2.addEventListener('input', function() {
				this.value = this.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
			});
		}
		// Solo permitir números en NUMERACION
		const numeracionInput2 = document.getElementById('numeracion');
		if (numeracionInput2) {
			numeracionInput2.addEventListener('input', function() {
				this.value = this.value.replace(/\D/g, '');
			});
		}
		// Solo permitir números y máximo 17 caracteres en RENSPA
		const renspaInput = document.getElementById('renspa');
		if (renspaInput) {
			renspaInput.addEventListener('input', function() {
				this.value = this.value.replace(/\D/g, '').slice(0, 17);
			});
		}
	}
	if (btnAnterior5) {
		btnAnterior5.addEventListener('click', function() {
			paso5.classList.add('d-none');
			paso3.classList.remove('d-none');
		});
	}

	// Refuerzo: cada vez que el paso 5 se haga visible, actualizar la lista
	const paso5ObserverTarget = document.getElementById('form-registro-empleador-paso5');
	if (paso5ObserverTarget) {
		const observer = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (!paso5ObserverTarget.classList.contains('d-none')) {
					llenarConfirmacion();
				}
			});
		});
		observer.observe(paso5ObserverTarget, { attributes: true, attributeFilter: ['class'] });
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
	const mensajeError = document.getElementById('mensaje-error-confirmacion');
	let camposFaltantes = [];
	// --- Empresa ---
	lista.innerHTML += `<li class='list-group-item active bg-secondary text-white'>Datos de Empresa</li>`;
	const cuit = document.getElementById('cuit').value;
	const razon = document.getElementById('razonSocial').value;
	if (!cuit) camposFaltantes.push('CUIT');
	if (!razon) camposFaltantes.push('Razón Social');
	lista.innerHTML += `<li class='list-group-item'><b>CUIT:</b> ${cuit}</li>`;
	lista.innerHTML += `<li class='list-group-item'><b>Razón Social:</b> ${razon}</li>`;
	// --- Administrador Empresa ---
	lista.innerHTML += `<li class='list-group-item active bg-secondary text-white mt-2'>Administrador</li>`;
	const dniEmp = document.getElementById('dni').value;
	const nombreEmp = document.getElementById('nombre').value;
	const apellidoEmp = document.getElementById('apellido').value;
	const emailEmp = document.getElementById('email').value;
	const telEmp = document.getElementById('telefono').value;
	if (!dniEmp) camposFaltantes.push('DNI (Administrador Empresa)');
	if (!nombreEmp) camposFaltantes.push('Nombre (Administrador Empresa)');
	if (!apellidoEmp) camposFaltantes.push('Apellido (Administrador Empresa)');
	if (!emailEmp) camposFaltantes.push('Email (Administrador Empresa)');
	if (!telEmp) camposFaltantes.push('Teléfono (Administrador Empresa)');
	lista.innerHTML += `<li class='list-group-item'><b>DNI:</b> ${dniEmp}</li>`;
	lista.innerHTML += `<li class='list-group-item'><b>Nombre:</b> ${nombreEmp}</li>`;
	lista.innerHTML += `<li class='list-group-item'><b>Apellido:</b> ${apellidoEmp}</li>`;
	lista.innerHTML += `<li class='list-group-item'><b>Email:</b> ${emailEmp}</li>`;
	lista.innerHTML += `<li class='list-group-item'><b>Teléfono:</b> ${telEmp}</li>`;
	// --- Establecimiento ---
	lista.innerHTML += `<li class='list-group-item active bg-secondary text-white mt-2'>Establecimiento</li>`;
	const nombreEst = document.getElementById('nombreEstablecimiento').value;
	const renspa = document.getElementById('renspa').value;
	if (!nombreEst) camposFaltantes.push('Nombre Establecimiento');
	if (!renspa) camposFaltantes.push('Número de RENSPA');
	lista.innerHTML += `<li class='list-group-item'><b>Nombre:</b> ${nombreEst}</li>`;
	lista.innerHTML += `<li class='list-group-item'><b>Número de RENSPA:</b> ${renspa}</li>`;
	const especies = Array.from(document.getElementById('especies').selectedOptions).map(opt => opt.textContent).join(', ');
	if (!especies) camposFaltantes.push('Especies');
	lista.innerHTML += `<li class='list-group-item'><b>Especies:</b> ${especies}</li>`;
	const departamento = document.getElementById('departamento').selectedOptions[0]?.textContent || '';
	const distrito = document.getElementById('distrito').selectedOptions[0]?.textContent || '';
	if (!departamento) camposFaltantes.push('Departamento');
	if (!distrito) camposFaltantes.push('Distrito');
	lista.innerHTML += `<li class='list-group-item'><b>Departamento:</b> ${departamento}</li>`;
	lista.innerHTML += `<li class='list-group-item'><b>Distrito:</b> ${distrito}</li>`;
	const calle = document.getElementById('calle').value;
	const numeracion = document.getElementById('numeracion').value;
	const codPostal = document.getElementById('codigoPostal').value;
	const lat = document.getElementById('latitud').value;
	const lng = document.getElementById('longitud').value;
	if (!calle) camposFaltantes.push('Calle');
	if (!numeracion) camposFaltantes.push('Numeración');
	if (!codPostal) camposFaltantes.push('Código Postal');
	if (!lat) camposFaltantes.push('Latitud');
	if (!lng) camposFaltantes.push('Longitud');
	lista.innerHTML += `<li class='list-group-item'><b>Calle:</b> ${calle}</li>`;
	lista.innerHTML += `<li class='list-group-item'><b>Numeración:</b> ${numeracion}</li>`;
	lista.innerHTML += `<li class='list-group-item'><b>Código Postal:</b> ${codPostal}</li>`;
	lista.innerHTML += `<li class='list-group-item'><b>Latitud:</b> ${lat}</li>`;
	lista.innerHTML += `<li class='list-group-item'><b>Longitud:</b> ${lng}</li>`;
	// --- Admin. Establecimiento ---
	lista.innerHTML += `<li class='list-group-item active bg-secondary text-white mt-2'>Admin. Establecimiento</li>`;
	const sinAdmin = document.getElementById('sinAdminEstablecimiento');
	if (sinAdmin && sinAdmin.checked) {
		lista.innerHTML += `<li class='list-group-item'>No posee administrador de establecimiento.</li>`;
	} else {
		const nombreAdminEst = document.getElementById('adminEstNombre').value;
		const apellidoAdminEst = document.getElementById('adminEstApellido').value;
		const dniAdminEst = document.getElementById('adminEstDni').value;
		const emailAdminEst = document.getElementById('adminEstEmail').value;
		const telAdminEst = document.getElementById('adminEstTelefono').value;
		if (!nombreAdminEst) camposFaltantes.push('Nombre (Admin Establecimiento)');
		if (!apellidoAdminEst) camposFaltantes.push('Apellido (Admin Establecimiento)');
		if (!dniAdminEst) camposFaltantes.push('DNI (Admin Establecimiento)');
		if (!emailAdminEst) camposFaltantes.push('Email (Admin Establecimiento)');
		if (!telAdminEst) camposFaltantes.push('Teléfono (Admin Establecimiento)');
		lista.innerHTML += `<li class='list-group-item'><b>Nombre:</b> ${nombreAdminEst}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Apellido:</b> ${apellidoAdminEst}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>DNI:</b> ${dniAdminEst}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Email:</b> ${emailAdminEst}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Teléfono:</b> ${telAdminEst}</li>`;
	}
		// Mostrar/ocultar mensaje de error
		if (mensajeError) {
			if (camposFaltantes.length > 0) {
				mensajeError.textContent = 'Faltan datos obligatorios en el resumen: ' + camposFaltantes.join(', ');
				mensajeError.classList.remove('d-none');
			} else {
				mensajeError.classList.add('d-none');
			}
		}
	}
});
