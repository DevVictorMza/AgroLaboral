/**
 * CARRUSEL DE SERVICIOS AGRÍCOLAS - JavaScript
 * ============================================
 * Control interactivo con navegación automática, manual y táctil
 * Diseño responsivo adaptativo
 */

class ServiciosCarouselAgro {
    constructor(config = {}) {
        // Configuración por defecto
        this.config = {
            containerId: 'servicios-carousel',
            trackSelector: '.carousel-track',
            slideSelector: '.servicio-slide',
            prevBtnSelector: '.carousel-btn--prev',
            nextBtnSelector: '.carousel-btn--next',
            indicatorSelector: '.carousel-indicator',
            autoPlay: true,
            autoPlayInterval: 5000,
            pauseOnHover: true,
            touchEnabled: true,
            responsive: {
                desktop: { slidesToShow: 1, breakpoint: 992 },
                tablet: { slidesToShow: 1, breakpoint: 768 },
                mobile: { slidesToShow: 1, breakpoint: 0 }
            },
            ...config
        };

        // Estado del carrusel
        this.state = {
            currentIndex: 0,
            isTransitioning: false,
            autoPlayTimer: null,
            touchStartX: 0,
            touchEndX: 0,
            currentBreakpoint: 'desktop'
        };

        // Referencias DOM
        this.elements = {
            container: null,
            track: null,
            slides: [],
            prevBtn: null,
            nextBtn: null,
            indicators: []
        };

        this.init();
    }

    /**
     * Inicialización del carrusel
     */
    init() {
        try {
            console.log('🚀 Iniciando carrusel de servicios...');
            this.bindElements();
            console.log('📎 Elementos enlazados:', {
                container: !!this.elements.container,
                track: !!this.elements.track,
                slides: this.elements.slides.length,
                prevBtn: !!this.elements.prevBtn,
                nextBtn: !!this.elements.nextBtn,
                indicators: this.elements.indicators.length
            });
            
            this.setupEventListeners();
            this.updateBreakpoint();
            this.updateDisplay();
            
            if (this.config.autoPlay) {
                this.startAutoPlay();
            }

            console.log('✅ Carrusel de Servicios Agrícolas inicializado correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar el carrusel:', error);
        }
    }

    /**
     * Enlace de elementos DOM
     */
    bindElements() {
        console.log('🔍 Buscando elementos del carrusel...');
        
        this.elements.container = document.getElementById(this.config.containerId);
        if (!this.elements.container) {
            throw new Error(`Contenedor ${this.config.containerId} no encontrado`);
        }
        console.log('📦 Contenedor encontrado:', this.elements.container);

        this.elements.track = this.elements.container.querySelector(this.config.trackSelector);
        this.elements.slides = Array.from(this.elements.container.querySelectorAll(this.config.slideSelector));
        this.elements.prevBtn = this.elements.container.querySelector(this.config.prevBtnSelector);
        this.elements.nextBtn = this.elements.container.querySelector(this.config.nextBtnSelector);
        this.elements.indicators = Array.from(this.elements.container.querySelectorAll(this.config.indicatorSelector));

        console.log('🎯 Elementos encontrados:', {
            track: this.config.trackSelector + ' -> ' + !!this.elements.track,
            slides: this.config.slideSelector + ' -> ' + this.elements.slides.length,
            prevBtn: this.config.prevBtnSelector + ' -> ' + !!this.elements.prevBtn,
            nextBtn: this.config.nextBtnSelector + ' -> ' + !!this.elements.nextBtn,
            indicators: this.config.indicatorSelector + ' -> ' + this.elements.indicators.length
        });

        if (!this.elements.track || this.elements.slides.length === 0) {
            throw new Error('Elementos del carrusel no encontrados');
        }
    }

    /**
     * Configuración de event listeners
     */
    setupEventListeners() {
        // Navegación con botones
        if (this.elements.prevBtn) {
            this.elements.prevBtn.addEventListener('click', () => this.goToPrevious());
        }

        if (this.elements.nextBtn) {
            this.elements.nextBtn.addEventListener('click', () => this.goToNext());
        }

        // Indicadores
        this.elements.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });

        // Touch/swipe en móviles
        if (this.config.touchEnabled) {
            this.setupTouchEvents();
        }

        // Pausar autoplay al hover
        if (this.config.pauseOnHover && this.config.autoPlay) {
            this.elements.container.addEventListener('mouseenter', () => this.pauseAutoPlay());
            this.elements.container.addEventListener('mouseleave', () => this.startAutoPlay());
        }

        // Responsive breakpoints
        window.addEventListener('resize', this.debounce(() => {
            this.updateBreakpoint();
            this.updateDisplay();
        }, 150));

        // Teclado para accesibilidad
        this.elements.container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.goToPrevious();
            if (e.key === 'ArrowRight') this.goToNext();
        });

        // Intersección para autoplay solo cuando es visible
        if ('IntersectionObserver' in window) {
            this.setupIntersectionObserver();
        }
    }

    /**
     * Eventos táctiles para dispositivos móviles
     */
    setupTouchEvents() {
        let startX, startY, isDragging = false;

        this.elements.track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
            this.pauseAutoPlay();
        });

        this.elements.track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            
            // Prevenir scroll vertical si el gesto es horizontal
            const diffX = Math.abs(currentX - startX);
            const diffY = Math.abs(currentY - startY);
            
            if (diffX > diffY) {
                e.preventDefault();
            }
        });

        this.elements.track.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;
            const minSwipeDistance = 50;
            
            if (Math.abs(diffX) > minSwipeDistance) {
                if (diffX > 0) {
                    this.goToNext();
                } else {
                    this.goToPrevious();
                }
            }
            
            isDragging = false;
            
            if (this.config.autoPlay) {
                setTimeout(() => this.startAutoPlay(), 2000);
            }
        });
    }

    /**
     * Observer para detectar cuando el carrusel está visible
     */
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.config.autoPlay) {
                    this.startAutoPlay();
                } else {
                    this.pauseAutoPlay();
                }
            });
        }, { threshold: 0.3 });

        observer.observe(this.elements.container);
    }

    /**
     * Actualizar breakpoint responsivo
     */
    updateBreakpoint() {
        const width = window.innerWidth;
        const responsive = this.config.responsive;

        if (width >= responsive.desktop.breakpoint) {
            this.state.currentBreakpoint = 'desktop';
        } else if (width >= responsive.tablet.breakpoint) {
            this.state.currentBreakpoint = 'tablet';
        } else {
            this.state.currentBreakpoint = 'mobile';
        }
    }

    /**
     * Obtener número de slides a mostrar según breakpoint
     */
    getSlidesToShow() {
        return this.config.responsive[this.state.currentBreakpoint].slidesToShow;
    }

    /**
     * Obtener número máximo de slides
     */
    getMaxSlideIndex() {
        // Para nuestro carrusel simple: índice máximo es total de slides - 1
        return this.elements.slides.length - 1;
    }

    /**
     * Navegar al slide anterior
     */
    goToPrevious() {
        console.log('⬅️ goToPrevious() llamado');
        if (this.state.isTransitioning) {
            console.log('⚠️ Transición en curso, ignorando');
            return;
        }
        
        const newIndex = this.state.currentIndex <= 0 
            ? this.getMaxSlideIndex() 
            : this.state.currentIndex - 1;
        
        console.log(`📍 Navegando del slide ${this.state.currentIndex} al ${newIndex}`);
        this.goToSlide(newIndex);
    }

    /**
     * Navegar al siguiente slide
     */
    goToNext() {
        console.log('➡️ goToNext() llamado');
        if (this.state.isTransitioning) {
            console.log('⚠️ Transición en curso, ignorando');
            return;
        }
        
        const maxIndex = this.getMaxSlideIndex();
        const newIndex = this.state.currentIndex >= maxIndex 
            ? 0 
            : this.state.currentIndex + 1;
        
        console.log(`📍 Navegando del slide ${this.state.currentIndex} al ${newIndex} (max: ${maxIndex})`);
        this.goToSlide(newIndex);
    }

    /**
     * Navegar a un slide específico
     */
    goToSlide(index) {
        console.log(`🎯 goToSlide(${index}) llamado`);
        if (this.state.isTransitioning) {
            console.log('⚠️ Transición en curso, ignorando goToSlide');
            return;
        }
        
        const maxIndex = this.getMaxSlideIndex();
        const clampedIndex = Math.max(0, Math.min(index, maxIndex));
        
        console.log(`🔢 Índice limitado: ${clampedIndex} (actual: ${this.state.currentIndex}, max: ${maxIndex})`);
        
        if (clampedIndex === this.state.currentIndex) {
            console.log('⭕ Ya está en el slide solicitado');
            return;
        }

        this.state.currentIndex = clampedIndex;
        console.log(`✅ Actualizando al slide ${this.state.currentIndex}`);
        this.updateDisplay();
    }

    /**
     * Actualizar visualización del carrusel
     */
    updateDisplay() {
        if (!this.elements.track || this.elements.slides.length === 0) return;

        this.state.isTransitioning = true;

        // Calcular transformación - ahora cada slide ocupa 100% del ancho
        const slideWidth = 100; // Cada slide ocupa todo el ancho
        const translateX = -this.state.currentIndex * slideWidth;

        console.log(`🔄 Navegando al slide ${this.state.currentIndex}, translateX: ${translateX}%`);

        // Aplicar transformación
        this.elements.track.style.transform = `translateX(${translateX}%)`;

        // Actualizar indicadores
        this.updateIndicators();

        // Actualizar botones
        this.updateNavigationButtons();

        // Añadir clase de transición temporal
        this.elements.track.classList.add('transitioning');

        // Resetear estado de transición
        setTimeout(() => {
            this.state.isTransitioning = false;
            this.elements.track.classList.remove('transitioning');
        }, 500);

        // Emitir evento personalizado
        this.emitChangeEvent();
    }

    /**
     * Actualizar indicadores activos
     */
    updateIndicators() {
        this.elements.indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.state.currentIndex);
        });
    }

    /**
     * Actualizar estado de botones de navegación
     */
    updateNavigationButtons() {
        // Para el carrusel de servicios, siempre permitir navegación cíclica
        // Los botones nunca se deshabilitan
        if (this.elements.prevBtn) {
            this.elements.prevBtn.disabled = false;
        }
        
        if (this.elements.nextBtn) {
            this.elements.nextBtn.disabled = false;
        }
    }

    /**
     * Iniciar autoplay
     */
    startAutoPlay() {
        if (!this.config.autoPlay) return;
        
        this.pauseAutoPlay();
        this.state.autoPlayTimer = setInterval(() => {
            this.goToNext();
        }, this.config.autoPlayInterval);
    }

    /**
     * Pausar autoplay
     */
    pauseAutoPlay() {
        if (this.state.autoPlayTimer) {
            clearInterval(this.state.autoPlayTimer);
            this.state.autoPlayTimer = null;
        }
    }

    /**
     * Emitir evento de cambio
     */
    emitChangeEvent() {
        const event = new CustomEvent('carouselChange', {
            detail: {
                currentIndex: this.state.currentIndex,
                slidesToShow: this.getSlidesToShow(),
                totalSlides: this.elements.slides.length,
                breakpoint: this.state.currentBreakpoint
            }
        });
        this.elements.container.dispatchEvent(event);
    }

    /**
     * Utilitario: Debounce para optimizar eventos
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Destruir carrusel y limpiar eventos
     */
    destroy() {
        this.pauseAutoPlay();
        
        // Remover event listeners
        window.removeEventListener('resize', this.updateBreakpoint);
        
        // Resetear estilos
        if (this.elements.track) {
            this.elements.track.style.transform = '';
        }

        console.log('🗑️ Carrusel de Servicios Agrícolas destruido');
    }

    /**
     * API pública para controlar el carrusel externamente
     */
    getAPI() {
        return {
            goToSlide: (index) => this.goToSlide(index),
            goToNext: () => this.goToNext(),
            goToPrevious: () => this.goToPrevious(),
            startAutoPlay: () => this.startAutoPlay(),
            pauseAutoPlay: () => this.pauseAutoPlay(),
            getCurrentIndex: () => this.state.currentIndex,
            getTotalSlides: () => this.elements.slides.length,
            getCurrentBreakpoint: () => this.state.currentBreakpoint,
            destroy: () => this.destroy()
        };
    }
}

/**
 * Función de inicialización automática cuando el DOM está listo
 */
function initializeServiciosCarousel() {
    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCarousel);
    } else {
        initCarousel();
    }

    function initCarousel() {
        try {
            // Verificar si el elemento existe
            const carouselElement = document.getElementById('servicios-carousel');
            if (!carouselElement) {
                console.warn('⚠️ Elemento #servicios-carousel no encontrado. El carrusel no se inicializará.');
                return;
            }

            // Crear instancia del carrusel
            const carousel = new ServiciosCarouselAgro({
                autoPlay: false, // Deshabilitado según requerimiento
                autoPlayInterval: 5000,
                pauseOnHover: true,
                touchEnabled: true
            });

            // Exponer API globalmente para uso externo
            window.serviciosCarouselAPI = carousel.getAPI();
            
            // Función de prueba para debuggear desde consola
            window.testCarousel = function() {
                console.log('🧪 Función de prueba del carrusel');
                console.log('📊 Estado actual:', {
                    slideActual: window.serviciosCarouselAPI.getCurrentIndex(),
                    totalSlides: window.serviciosCarouselAPI.getTotalSlides(),
                    breakpoint: window.serviciosCarouselAPI.getCurrentBreakpoint()
                });
                
                console.log('🎮 Comandos disponibles:');
                console.log('- window.serviciosCarouselAPI.goToNext() // Siguiente slide');
                console.log('- window.serviciosCarouselAPI.goToPrevious() // Slide anterior');
                console.log('- window.serviciosCarouselAPI.goToSlide(0) // Ir al slide 0');
                console.log('- window.serviciosCarouselAPI.goToSlide(1) // Ir al slide 1');
                console.log('- window.serviciosCarouselAPI.goToSlide(2) // Ir al slide 2');
            };
            
            // Llamar función de prueba automáticamente
            setTimeout(() => {
                console.log('🔧 Carrusel listo. Llama window.testCarousel() para debug');
                window.testCarousel();
            }, 1000);

            // Event listener para cambios del carrusel
            carouselElement.addEventListener('carouselChange', (e) => {
                console.log('📊 Carrusel cambió:', e.detail);
            });

        } catch (error) {
            console.error('❌ Error al inicializar el carrusel de servicios:', error);
        }
    }
}

// Auto-inicialización
initializeServiciosCarousel();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiciosCarouselAgro;
}