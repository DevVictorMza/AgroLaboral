// FUNCIONES DE FEEDBACK VISUAL

// Mostrar tooltip informativo
function showTooltip(element, message, position = 'top') {
	// Remover tooltips existentes
	const existingTooltips = document.querySelectorAll('.feedback-tooltip');
	existingTooltips.forEach(tip => tip.remove());
	
	const tooltip = document.createElement('div');
	tooltip.className = 'feedback-tooltip show';
	tooltip.textContent = message;
	
	document.body.appendChild(tooltip);
	
	const rect = element.getBoundingClientRect();
	
	switch(position) {
		case 'top':
			tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
			tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
			break;
		case 'bottom':
			tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
			tooltip.style.top = rect.bottom + 10 + 'px';
			break;
		case 'right':
			tooltip.style.left = rect.right + 10 + 'px';
			tooltip.style.top = rect.top + (rect.height / 2) - (tooltip.offsetHeight / 2) + 'px';
			break;
	}
	
	setTimeout(() => {
		tooltip.classList.add('fade-out');
		setTimeout(() => tooltip.remove(), 300);
	}, 3000);
}

// Agregar estado de carga a botón
function addLoadingState(button, message = 'Procesando...') {
	const originalText = button.textContent;
	const originalDisabled = button.disabled;
	
	button.disabled = true;
	button.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>${message}`;
	button.classList.add('loading');
	
	return function removeLoading() {
		button.disabled = originalDisabled;
		button.textContent = originalText;
		button.classList.remove('loading');
	};
}

// Animar elemento al mostrarse
function animateOnShow(element, animationClass = 'slideInRight') {
	element.classList.add('animate__animated', `animate__${animationClass}`);
	setTimeout(() => {
		element.classList.remove('animate__animated', `animate__${animationClass}`);
	}, 600);
}

// Actualizar progreso del wizard
function updateWizardProgress(currentStep) {
	const progressBar = document.querySelector('.progress-bar');
	const steps = document.querySelectorAll('.wizard-step');
	
	if (progressBar) {
		const progress = (currentStep / 5) * 100;
		progressBar.style.width = progress + '%';
		progressBar.classList.add('animate-progress');
		setTimeout(() => progressBar.classList.remove('animate-progress'), 500);
	}
	
	steps.forEach((step, index) => {
		const stepNumber = index + 1;
		if (stepNumber < currentStep) {
			step.classList.add('completed');
			step.classList.remove('active');
		} else if (stepNumber === currentStep) {
			step.classList.add('active');
			step.classList.remove('completed');
		} else {
			step.classList.remove('active', 'completed');
		}
	});
}

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
	
	setTimeout(() => {
		if (isValid) {
			input.classList.add('is-valid');
			feedbackDiv.className = 'field-feedback valid-feedback';
			feedbackDiv.innerHTML = `<i class="fas fa-check-circle me-1"></i>${message}`;
		} else {
			input.classList.add('is-invalid', 'shake');
			feedbackDiv.className = 'field-feedback invalid-feedback';
			feedbackDiv.innerHTML = `<i class="fas fa-exclamation-circle me-1"></i>${message}`;
		}
		
		// Remover animación de shake después de completarse
		setTimeout(() => input.classList.remove('shake'), 500);
	}, 100);
}

// Mostrar notificación toast
function showToast(message, type = 'info') {
	// Remover toasts existentes
	const existingToasts = document.querySelectorAll('.feedback-toast');
	existingToasts.forEach(toast => toast.remove());
	
	const toast = document.createElement('div');
	toast.className = `feedback-toast toast-${type}`;
	
	const icon = type === 'success' ? 'check-circle' : 
				 type === 'error' ? 'exclamation-circle' : 
				 type === 'warning' ? 'exclamation-triangle' : 'info-circle';
	
	toast.innerHTML = `
		<div class="toast-content">
			<i class="fas fa-${icon} me-2"></i>
			${message}
		</div>
	`;
	
	document.body.appendChild(toast);
	
	// Animar entrada
	setTimeout(() => toast.classList.add('show'), 10);
	
	// Auto-remover después de 4 segundos
	setTimeout(() => {
		toast.classList.remove('show');
		setTimeout(() => toast.remove(), 300);
	}, 4000);
}

// Transición suave entre pasos
function smoothStepTransition(fromStep, toStep) {
	// Animar salida del paso actual
	fromStep.style.opacity = '0';
	fromStep.style.transform = 'translateX(-50px)';
	
	setTimeout(() => {
		fromStep.classList.add('d-none');
		fromStep.style.opacity = '';
		fromStep.style.transform = '';
		
		// Mostrar nuevo paso con animación
		toStep.classList.remove('d-none');
		toStep.style.opacity = '0';
		toStep.style.transform = 'translateX(50px)';
		
		setTimeout(() => {
			toStep.style.opacity = '1';
			toStep.style.transform = 'translateX(0)';
			animateOnShow(toStep);
		}, 50);
	}, 300);
}

// FUNCIÓN PARA ACTUALIZAR EL RESUMEN
function actualizarResumen() {
	// Datos de empresa
	const cuitValue = document.getElementById('cuit').value.trim();
	const razonSocialValue = document.getElementById('razonSocial').value.trim();
	
	// Datos personales
	const dniValue = document.getElementById('dni').value.trim();
	const nombreValue = document.getElementById('nombre').value.trim();
	const apellidoValue = document.getElementById('apellido').value.trim();
	const emailValue = document.getElementById('email').value.trim();
	const telefonoValue = document.getElementById('telefono').value.trim();
	
	// Información adicional
	const domicilioValue = document.getElementById('domicilio').value.trim();
	const localidadValue = document.getElementById('localidad').value.trim();
	const departamentoValue = document.getElementById('departamento').value.trim();
	const provinciaValue = document.getElementById('provincia').value.trim();
	
	// Administrador establecimiento
	const nombreAdminEst = document.getElementById('nombreAdminEst').value.trim();
	const apellidoAdminEst = document.getElementById('apellidoAdminEst').value.trim();
	const dniAdminEst = document.getElementById('dniAdminEst').value.trim();
	const emailAdminEst = document.getElementById('emailAdminEst').value.trim();
	const telAdminEst = document.getElementById('telefonoAdminEst').value.trim();
	
	// Actualizar resumen en el HTML
	const resumenEmpresa = document.getElementById('resumen-empresa');
	const resumenPersonal = document.getElementById('resumen-personal');
	const resumenAdicional = document.getElementById('resumen-adicional');
	const resumenAdmin = document.getElementById('resumen-admin');
	
	if (resumenEmpresa) {
		resumenEmpresa.innerHTML = `
			<li class='list-group-item'><b>CUIT:</b> ${cuitValue}</li>
			<li class='list-group-item'><b>Razón Social:</b> ${razonSocialValue}</li>
		`;
	}
	
	if (resumenPersonal) {
		resumenPersonal.innerHTML = `
			<li class='list-group-item'><b>DNI:</b> ${dniValue}</li>
			<li class='list-group-item'><b>Nombre:</b> ${nombreValue}</li>
			<li class='list-group-item'><b>Apellido:</b> ${apellidoValue}</li>
			<li class='list-group-item'><b>Email:</b> ${emailValue}</li>
			<li class='list-group-item'><b>Teléfono:</b> ${telefonoValue}</li>
		`;
	}
	
	if (resumenAdicional) {
		resumenAdicional.innerHTML = `
			<li class='list-group-item'><b>Domicilio:</b> ${domicilioValue}</li>
			<li class='list-group-item'><b>Localidad:</b> ${localidadValue}</li>
			<li class='list-group-item'><b>Departamento:</b> ${departamentoValue}</li>
			<li class='list-group-item'><b>Provincia:</b> ${provinciaValue}</li>
		`;
	}
	
	if (resumenAdmin) {
		resumenAdmin.innerHTML = `
			<li class='list-group-item'><b>Nombre:</b> ${nombreAdminEst}</li>
			<li class='list-group-item'><b>Apellido:</b> ${apellidoAdminEst}</li>
			<li class='list-group-item'><b>DNI:</b> ${dniAdminEst}</li>
			<li class='list-group-item'><b>Email:</b> ${emailAdminEst}</li>
			<li class='list-group-item'><b>Teléfono:</b> ${telAdminEst}</li>
		`;
	}
}

// INICIALIZACIÓN DE LA APLICACIÓN
document.addEventListener('DOMContentLoaded', function() {
	// Elementos del wizard
	const wizard = document.getElementById('wizard');
	const paso1 = document.getElementById('paso1');
	const paso2 = document.getElementById('paso2');
	const paso3 = document.getElementById('paso3');
	const paso4 = document.getElementById('paso4');
	const paso5 = document.getElementById('paso5');
	
	// Botones de navegación
	const btnSiguiente1 = document.getElementById('btn-siguiente-paso1');
	const btnAnterior2 = document.getElementById('btn-anterior-paso2');
	const btnSiguiente2 = document.getElementById('btn-siguiente-paso2');
	const btnAnterior3 = document.getElementById('btn-anterior-paso3');
	const btnSiguiente3 = document.getElementById('btn-siguiente-paso3');
	const btnAnterior4 = document.getElementById('btn-anterior-paso4');
	const btnSiguiente4 = document.getElementById('btn-siguiente-paso4');
	const btnAnterior5 = document.getElementById('btn-anterior-paso5');
	const btnFinalizar = document.getElementById('btn-finalizar');
	
	// PASO 1: Datos de empresa
	if (btnSiguiente1) {
		btnSiguiente1.addEventListener('click', function() {
			const removeLoading = addLoadingState(this, 'Validando empresa...');
			
			setTimeout(() => {
				const cuitInput = document.getElementById('cuit');
				const razonInput = document.getElementById('razonSocial');
				const cuitValue = cuitInput.value.trim();
				const razonValue = razonInput.value.trim();
				let hasErrors = false;
				
				// Validar CUIT
				let cuitError = '';
				if (!cuitValue) {
					cuitError = 'El campo CUIT es obligatorio.';
					hasErrors = true;
				} else if (!/^\d{11}$/.test(cuitValue)) {
					cuitError = 'El CUIT debe tener exactamente 11 números.';
					hasErrors = true;
				}
				showFieldFeedback(cuitInput, !cuitError, cuitError || '¡CUIT válido!');
				
				// Validar Razón Social
				let razonError = '';
				if (!razonValue) {
					razonError = 'El campo Razón Social es obligatorio.';
					hasErrors = true;
				}
				showFieldFeedback(razonInput, !razonError, razonError || '¡Razón social válida!');
				
				removeLoading();
				
				if (!hasErrors) {
					showToast('¡Datos de empresa validados correctamente!', 'success');
					updateWizardProgress(2);
					smoothStepTransition(paso1, paso2);
				} else {
					showToast('Por favor, corrige los errores antes de continuar', 'error');
					if (cuitError) cuitInput.focus();
					else if (razonError) razonInput.focus();
				}
			}, 800);
		});
	}
	
	// Navegación anterior paso 2
	if (btnAnterior2) {
		btnAnterior2.addEventListener('click', function() {
			showTooltip(this, 'Regresando al paso anterior');
			updateWizardProgress(1);
			smoothStepTransition(paso2, paso1);
		});
	}
	
	// PASO 2: Datos personales
	if (btnSiguiente2) {
		btnSiguiente2.addEventListener('click', function() {
			const removeLoading = addLoadingState(this, 'Validando datos...');
			
			setTimeout(() => {
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
				
				// Validaciones con feedback visual
				let dniError = '';
				if (!dniValue) {
					dniError = 'El campo DNI es obligatorio.';
					hasErrors = true;
				} else if (!/^\d{7,8}$/.test(dniValue)) {
					dniError = 'El DNI debe tener entre 7 y 8 números.';
					hasErrors = true;
				}
				showFieldFeedback(dniInput, !dniError, dniError || '¡DNI válido!');
				
				let nombreError = '';
				if (!nombreValue) {
					nombreError = 'El campo Nombre es obligatorio.';
					hasErrors = true;
				} else if (!/^[A-ZÁÉÍÓÚÑ ]+$/.test(nombreValue)) {
					nombreError = 'El nombre solo debe contener letras y espacios.';
					hasErrors = true;
				}
				showFieldFeedback(nombreInput, !nombreError, nombreError || '¡Nombre válido!');
				
				let apellidoError = '';
				if (!apellidoValue) {
					apellidoError = 'El campo Apellido es obligatorio.';
					hasErrors = true;
				} else if (!/^[A-ZÁÉÍÓÚÑ ]+$/.test(apellidoValue)) {
					apellidoError = 'El apellido solo debe contener letras y espacios.';
					hasErrors = true;
				}
				showFieldFeedback(apellidoInput, !apellidoError, apellidoError || '¡Apellido válido!');
				
				let emailError = '';
				if (!emailValue) {
					emailError = 'El campo Email es obligatorio.';
					hasErrors = true;
				} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
					emailError = 'El formato del email no es válido.';
					hasErrors = true;
				}
				showFieldFeedback(emailInput, !emailError, emailError || '¡Email válido!');
				
				let telefonoError = '';
				if (!telefonoValue) {
					telefonoError = 'El campo Teléfono es obligatorio.';
					hasErrors = true;
				} else if (!/^\d{10}$/.test(telefonoValue)) {
					telefonoError = 'El teléfono debe tener exactamente 10 números.';
					hasErrors = true;
				}
				showFieldFeedback(telefonoInput, !telefonoError, telefonoError || '¡Teléfono válido!');
				
				let passwordError = '';
				if (passwordInput && !passwordValue) {
					passwordError = 'La contraseña es obligatoria.';
					hasErrors = true;
				} else if (passwordInput && passwordValue.length < 8) {
					passwordError = 'La contraseña debe tener al menos 8 caracteres.';
					hasErrors = true;
				}
				if (passwordInput) showFieldFeedback(passwordInput, !passwordError, passwordError || '¡Contraseña válida!');
				
				let password2Error = '';
				if (password2Input && passwordValue !== password2Value) {
					password2Error = 'Las contraseñas no coinciden.';
					hasErrors = true;
				}
				if (password2Input) showFieldFeedback(password2Input, !password2Error, password2Error || '¡Contraseñas coinciden!');
				
				removeLoading();
				
				if (!hasErrors) {
					showToast('¡Datos personales validados correctamente!', 'success');
					updateWizardProgress(3);
					smoothStepTransition(paso2, paso3);
				} else {
					showToast('Por favor, corrige los errores antes de continuar', 'error');
					// Foco en primer campo con error
					if (dniError) dniInput.focus();
					else if (nombreError) nombreInput.focus();
					else if (apellidoError) apellidoInput.focus();
					else if (emailError) emailInput.focus();
					else if (telefonoError) telefonoInput.focus();
					else if (passwordError && passwordInput) passwordInput.focus();
					else if (password2Error && password2Input) password2Input.focus();
				}
			}, 1000);
		});
	}
	
	// Navegación anterior paso 3
	if (btnAnterior3) {
		btnAnterior3.addEventListener('click', function() {
			showTooltip(this, 'Regresando al paso anterior');
			updateWizardProgress(2);
			smoothStepTransition(paso3, paso2);
		});
	}
	
	// PASO 3: Información adicional
	if (btnSiguiente3) {
		btnSiguiente3.addEventListener('click', function() {
			const removeLoading = addLoadingState(this, 'Validando información...');
			
			setTimeout(() => {
				const domicilioInput = document.getElementById('domicilio');
				const localidadInput = document.getElementById('localidad');
				const departamentoInput = document.getElementById('departamento');
				const provinciaInput = document.getElementById('provincia');
				
				const domicilioValue = domicilioInput.value.trim();
				const localidadValue = localidadInput.value.trim();
				const departamentoValue = departamentoInput.value.trim();
				const provinciaValue = provinciaInput.value.trim();
				
				let hasErrors = false;
				
				// Validaciones con feedback visual
				let domicilioError = '';
				if (!domicilioValue) {
					domicilioError = 'El campo Domicilio es obligatorio.';
					hasErrors = true;
				}
				showFieldFeedback(domicilioInput, !domicilioError, domicilioError || '¡Domicilio válido!');
				
				let localidadError = '';
				if (!localidadValue) {
					localidadError = 'El campo Localidad es obligatorio.';
					hasErrors = true;
				}
				showFieldFeedback(localidadInput, !localidadError, localidadError || '¡Localidad válida!');
				
				let departamentoError = '';
				if (!departamentoValue) {
					departamentoError = 'El campo Departamento es obligatorio.';
					hasErrors = true;
				}
				showFieldFeedback(departamentoInput, !departamentoError, departamentoError || '¡Departamento válido!');
				
				let provinciaError = '';
				if (!provinciaValue) {
					provinciaError = 'El campo Provincia es obligatorio.';
					hasErrors = true;
				}
				showFieldFeedback(provinciaInput, !provinciaError, provinciaError || '¡Provincia válida!');
				
				removeLoading();
				
				if (!hasErrors) {
					showToast('¡Información adicional completada!', 'success');
					updateWizardProgress(4);
					smoothStepTransition(paso3, paso4);
				} else {
					showToast('Por favor, completa todos los campos obligatorios', 'error');
					if (domicilioError) domicilioInput.focus();
					else if (localidadError) localidadInput.focus();
					else if (departamentoError) departamentoInput.focus();
					else if (provinciaError) provinciaInput.focus();
				}
			}, 600);
		});
	}
	
	// Navegación anterior paso 4
	if (btnAnterior4) {
		btnAnterior4.addEventListener('click', function() {
			showTooltip(this, 'Regresando al paso anterior');
			updateWizardProgress(3);
			smoothStepTransition(paso4, paso3);
		});
	}
	
	// PASO 4: Administrador del establecimiento
	if (btnSiguiente4) {
		btnSiguiente4.addEventListener('click', function() {
			const removeLoading = addLoadingState(this, 'Validando administrador...');
			
			setTimeout(() => {
				const nombreAdminInput = document.getElementById('nombreAdminEst');
				const apellidoAdminInput = document.getElementById('apellidoAdminEst');
				const dniAdminInput = document.getElementById('dniAdminEst');
				const emailAdminInput = document.getElementById('emailAdminEst');
				const telefonoAdminInput = document.getElementById('telefonoAdminEst');
				
				const nombreAdminValue = nombreAdminInput.value.trim();
				const apellidoAdminValue = apellidoAdminInput.value.trim();
				const dniAdminValue = dniAdminInput.value.trim();
				const emailAdminValue = emailAdminInput.value.trim();
				const telefonoAdminValue = telefonoAdminInput.value.trim();
				
				let hasErrors = false;
				
				// Validaciones con feedback visual
				let nombreAdminError = '';
				if (!nombreAdminValue) {
					nombreAdminError = 'El nombre del administrador es obligatorio.';
					hasErrors = true;
				} else if (!/^[A-ZÁÉÍÓÚÑ ]+$/.test(nombreAdminValue)) {
					nombreAdminError = 'El nombre solo debe contener letras y espacios.';
					hasErrors = true;
				}
				showFieldFeedback(nombreAdminInput, !nombreAdminError, nombreAdminError || '¡Nombre válido!');
				
				let apellidoAdminError = '';
				if (!apellidoAdminValue) {
					apellidoAdminError = 'El apellido del administrador es obligatorio.';
					hasErrors = true;
				} else if (!/^[A-ZÁÉÍÓÚÑ ]+$/.test(apellidoAdminValue)) {
					apellidoAdminError = 'El apellido solo debe contener letras y espacios.';
					hasErrors = true;
				}
				showFieldFeedback(apellidoAdminInput, !apellidoAdminError, apellidoAdminError || '¡Apellido válido!');
				
				let dniAdminError = '';
				if (!dniAdminValue) {
					dniAdminError = 'El DNI del administrador es obligatorio.';
					hasErrors = true;
				} else if (!/^\d{7,8}$/.test(dniAdminValue)) {
					dniAdminError = 'El DNI debe tener entre 7 y 8 números.';
					hasErrors = true;
				}
				showFieldFeedback(dniAdminInput, !dniAdminError, dniAdminError || '¡DNI válido!');
				
				let emailAdminError = '';
				if (!emailAdminValue) {
					emailAdminError = 'El email del administrador es obligatorio.';
					hasErrors = true;
				} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAdminValue)) {
					emailAdminError = 'El formato del email no es válido.';
					hasErrors = true;
				}
				showFieldFeedback(emailAdminInput, !emailAdminError, emailAdminError || '¡Email válido!');
				
				let telefonoAdminError = '';
				if (!telefonoAdminValue) {
					telefonoAdminError = 'El teléfono del administrador es obligatorio.';
					hasErrors = true;
				} else if (!/^\d{10}$/.test(telefonoAdminValue)) {
					telefonoAdminError = 'El teléfono debe tener exactamente 10 números.';
					hasErrors = true;
				}
				showFieldFeedback(telefonoAdminInput, !telefonoAdminError, telefonoAdminError || '¡Teléfono válido!');
				
				removeLoading();
				
				if (!hasErrors) {
					showToast('¡Datos del administrador validados!', 'success');
					updateWizardProgress(5);
					actualizarResumen(); // Función existente
					smoothStepTransition(paso4, paso5);
				} else {
					showToast('Por favor, corrige los errores antes de continuar', 'error');
					if (nombreAdminError) nombreAdminInput.focus();
					else if (apellidoAdminError) apellidoAdminInput.focus();
					else if (dniAdminError) dniAdminInput.focus();
					else if (emailAdminError) emailAdminInput.focus();
					else if (telefonoAdminError) telefonoAdminInput.focus();
				}
			}, 800);
		});
	}
	
	// Navegación anterior paso 5
	if (btnAnterior5) {
		btnAnterior5.addEventListener('click', function() {
			showTooltip(this, 'Regresando al paso anterior');
			updateWizardProgress(4);
			smoothStepTransition(paso5, paso4);
		});
	}
	
	// PASO 5: Finalizar registro
	if (btnFinalizar) {
		btnFinalizar.addEventListener('click', function() {
			const removeLoading = addLoadingState(this, 'Registrando empresa...');
			
			// Simular envío al servidor
			setTimeout(() => {
				showToast('¡Registro completado exitosamente!', 'success');
				
				setTimeout(() => {
					// Cerrar modal y resetear formulario
					const modal = bootstrap.Modal.getInstance(document.getElementById('modalRegistroEmpleador'));
					if (modal) modal.hide();
					
					// Resetear wizard
					updateWizardProgress(1);
					document.querySelectorAll('.wizard-step').forEach(step => {
						step.classList.remove('active', 'completed');
					});
					document.querySelector('.wizard-step:first-child').classList.add('active');
					
					// Mostrar primer paso
					smoothStepTransition(paso5, paso1);
					
					removeLoading();
					
					showToast('¡Bienvenido a Agro Laboral Mendoza!', 'success');
				}, 1500);
			}, 2000);
		});
	}
});

// VALIDACIONES AUTOMÁTICAS DE CAMPOS
document.addEventListener('DOMContentLoaded', function() {
	// CUIT: solo números y máximo 11
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
	
	// Razón Social: forzar mayúsculas
	const razonInput = document.getElementById('razonSocial');
	if (razonInput) {
		razonInput.addEventListener('input', function() {
			this.value = this.value.toUpperCase();
		});
	}
	
	// DNI: solo números, 7-8 dígitos
	const dniInput = document.getElementById('dni');
	if (dniInput) {
		dniInput.addEventListener('input', function() {
			this.value = this.value.replace(/\D/g, '').slice(0, 8);
		});
	}
	
	// Teléfono: solo números, 10 dígitos
	const telefonoInputs = document.querySelectorAll('#telefono, #telefonoAdminEst');
	telefonoInputs.forEach(tel => {
		if (tel) {
			tel.addEventListener('input', function() {
				this.value = this.value.replace(/\D/g, '').slice(0, 10);
			});
		}
	});
	
	// Nombre y Apellido: solo letras y espacios, mayúsculas
	const textInputs = document.querySelectorAll('#nombre, #apellido, #nombreAdminEst, #apellidoAdminEst');
	textInputs.forEach(input => {
		if (input) {
			input.addEventListener('input', function() {
				this.value = this.value.replace(/[^A-ZÁÉÍÓÚÑ ]/gi, '').toUpperCase();
			});
		}
	});
});

// EFECTO SCROLL PARA NAVBAR TRANSPARENTE
document.addEventListener('DOMContentLoaded', function() {
	const navbar = document.getElementById('transparent-navbar');
	const bannerContainer = document.querySelector('.banner-container');
	
	window.addEventListener('scroll', function() {
		const videoSectionHeight = bannerContainer ? bannerContainer.offsetHeight : 500;
		
		if (window.scrollY > videoSectionHeight - 100) {
			navbar.classList.add('scrolled');
		} else {
			navbar.classList.remove('scrolled');
		}
	});
});