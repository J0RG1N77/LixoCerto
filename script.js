(function() {
    'use strict';

    const SELECTORS = {
        header: '#header',
        mobileMenuBtn: '#mobileMenuBtn',
        navLinks: '#navLinks',
        bin: '#binAnimation',
        binLid: '#binLid',
        sensorLight: '#sensorLight',
        wasteItems: '.waste-item',
        wasteDemo: '#wasteDemo',
        demoHint: '.demo-hint',
        contactForm: '#contactForm',
        submitBtn: '#submitBtn',
        toast: '#toast',
        pricingCards: '.pricing-card',
        pricingAmounts: '.pricing-card .amount',
        faqItems: '.faq-item'
    };

    const STATE = {
        isMenuOpen: false,
        correctMatches: {
            'plástico': 'blue',
            'orgânico': 'green',
            'papel': 'yellow',
            'metal': 'red'
        },
        currentDragItem: null
    };

    function $(selector, context = document) {
        return context.querySelector(selector);
    }

    function $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    }

    function init() {
        initLucide();
        initHeader();
        initMobileMenu();
        initBinAnimation();
        initDragDrop();
        initContactForm();
        initSmoothScroll();
        initIntersectionObserver();
    }

    function initLucide() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function initHeader() {
        const header = $(SELECTORS.header);
        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            lastScroll = currentScroll;
        }, { passive: true });
    }

    function initMobileMenu() {
        const btn = $(SELECTORS.mobileMenuBtn);
        const links = $(SELECTORS.navLinks);

        if (!btn || !links) return;

        btn.addEventListener('click', () => {
            STATE.isMenuOpen = !STATE.isMenuOpen;
            links.classList.toggle('open', STATE.isMenuOpen);
            btn.setAttribute('aria-expanded', STATE.isMenuOpen);
            btn.querySelector('.icon').setAttribute('data-lucide', STATE.isMenuOpen ? 'x' : 'menu');
            initLucide();
        });

        $$('.nav-link', links).forEach(link => {
            link.addEventListener('click', () => {
                STATE.isMenuOpen = false;
                links.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
                btn.querySelector('.icon').setAttribute('data-lucide', 'menu');
                initLucide();
            });
        });

        document.addEventListener('click', (e) => {
            if (STATE.isMenuOpen && !links.contains(e.target) && !btn.contains(e.target)) {
                STATE.isMenuOpen = false;
                links.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function initBinAnimation() {
        const bin = $(SELECTORS.bin);
        const lid = $(SELECTORS.binLid);
        const sensorLight = $(SELECTORS.sensorLight);
        const wasteItems = $$(SELECTORS.wasteItems);

        if (!bin || !lid || !sensorLight) return;

        let animationTimeout = null;

        function triggerAnimation(wasteType) {
            clearTimeout(animationTimeout);
            const correctColor = STATE.correctMatches[wasteType];
            const targetStrip = $(`.color-strip.${correctColor}`, bin);

            sensorLight.classList.add('active');
            lid.classList.add('open');
            targetStrip?.classList.add('highlight');

            animationTimeout = setTimeout(() => {
                lid.classList.remove('open');
                sensorLight.classList.remove('active');
                targetStrip?.classList.remove('highlight');
            }, 2000);
        }

        bin.addEventListener('click', () => {
            const types = Object.keys(STATE.correctMatches);
            const randomType = types[Math.floor(Math.random() * types.length)];
            triggerAnimation(randomType);
        });

        wasteItems.forEach(item => {
            item.addEventListener('click', () => {
                triggerAnimation(item.dataset.type);
            });
        });
    }

    function initDragDrop() {
        const wasteItems = $$(SELECTORS.wasteItems);
        const wasteDemo = $(SELECTORS.wasteDemo);
        const demoHint = $(SELECTORS.demoHint);
        const bin = $(SELECTORS.bin);
        const lid = $(SELECTORS.binLid);
        const sensorLight = $(SELECTORS.sensorLight);

        if (!wasteDemo || !bin) return;

        wasteItems.forEach(item => {
            item.setAttribute('draggable', 'true');
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
            item.setAttribute('aria-label', `Arraste ${item.querySelector('span').textContent} para a lixeira`);

            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
            item.addEventListener('keydown', handleKeyDown);
            item.addEventListener('click', () => triggerBinAnimation(item.dataset.type));
        });

        wasteDemo.addEventListener('dragover', handleDragOver);
        wasteDemo.addEventListener('dragleave', handleDragLeave);
        wasteDemo.addEventListener('drop', handleDrop);

        function handleDragStart(e) {
            STATE.currentDragItem = e.target.closest('.waste-item');
            if (!STATE.currentDragItem) return;

            STATE.currentDragItem.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', STATE.currentDragItem.dataset.type);
            demoHint.style.opacity = '0';
        }

        function handleDragEnd(e) {
            const item = e.target.closest('.waste-item');
            item?.classList.remove('dragging');
            STATE.currentDragItem = null;
            wasteDemo.classList.remove('drag-over');
            demoHint.style.opacity = '1';
        }

        function handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            wasteDemo.classList.add('drag-over');
        }

        function handleDragLeave(e) {
            if (!wasteDemo.contains(e.relatedTarget)) {
                wasteDemo.classList.remove('drag-over');
            }
        }

        function handleDrop(e) {
            e.preventDefault();
            wasteDemo.classList.remove('drag-over');

            const wasteType = e.dataTransfer.getData('text/plain');
            if (wasteType) {
                triggerBinAnimation(wasteType);
                showToast(`${getWasteLabel(wasteType)} depositado corretamente!`, 'success');
            }
        }

        function handleKeyDown(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerBinAnimation(e.currentTarget.dataset.type);
            }
        }

        function triggerBinAnimation(wasteType) {
            const correctColor = STATE.correctMatches[wasteType];
            const targetStrip = $(`.color-strip.${correctColor}`, bin);

            sensorLight.classList.add('active');
            lid.classList.add('open');
            targetStrip?.classList.add('highlight');

            setTimeout(() => {
                lid.classList.remove('open');
                sensorLight.classList.remove('active');
                targetStrip?.classList.remove('highlight');
            }, 2000);
        }

        function getWasteLabel(type) {
            const labels = {
                'plástico': 'Garrafa PET',
                'orgânico': 'Casca de Banana',
                'papel': 'Papel',
                'metal': 'Lata de Alumínio'
            };
            return labels[type] || type;
        }
    }

    function initContactForm() {
        const form = $(SELECTORS.contactForm);
        const submitBtn = $(SELECTORS.submitBtn);

        if (!form || !submitBtn) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateForm(form)) return;

            setLoading(submitBtn, true);

            await simulateSubmission();

            setLoading(submitBtn, false);
            showToast('Solicitação enviada! Entraremos em contato em até 2h úteis.', 'success');
            form.reset();
        });

        $$('input, select, textarea', form).forEach(field => {
            field.addEventListener('blur', () => validateField(field));
            field.addEventListener('input', () => clearError(field));
        });
    }

    function validateForm(form) {
        let isValid = true;
        $$('input[required], select[required], textarea[required]', form).forEach(field => {
            if (!validateField(field)) isValid = false;
        });
        return isValid;
    }

    function validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';

        if (field.hasAttribute('required') && !value) {
            isValid = false;
            message = 'Este campo é obrigatório';
        } else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            isValid = false;
            message = 'E-mail inválido';
        } else if (field.type === 'tel' && value && !/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(value.replace(/\s/g, ''))) {
            isValid = false;
            message = 'Telefone inválido. Use (XX) XXXXX-XXXX';
        }

        showFieldError(field, isValid ? '' : message);
        return isValid;
    }

    function showFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        let errorEl = formGroup.querySelector('.field-error');

        if (message) {
            if (!errorEl) {
                errorEl = document.createElement('span');
                errorEl.className = 'field-error';
                errorEl.style.cssText = 'color: var(--color-red); font-size: 12px; margin-top: 6px; display: block;';
                formGroup.appendChild(errorEl);
            }
            errorEl.textContent = message;
            field.style.borderColor = 'var(--color-red)';
        } else {
            errorEl?.remove();
            field.style.borderColor = '';
        }
    }

    function clearError(field) {
        showFieldError(field, '');
    }

    function setLoading(btn, loading) {
        const text = btn.querySelector('.btn-text');
        const loader = btn.querySelector('.btn-loading');

        btn.disabled = loading;
        if (text) text.style.display = loading ? 'none' : 'inline-flex';
        if (loader) loader.style.display = loading ? 'inline-flex' : 'none';
    }

    function simulateSubmission() {
        return new Promise(resolve => setTimeout(resolve, 1500));
    }

    function initSmoothScroll() {
        $$('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const target = $(targetId);
                if (target) {
                    e.preventDefault();
                    const headerHeight = $(SELECTORS.header)?.offsetHeight || 0;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                    target.focus({ preventScroll: true });
                }
            });
        });
    }

    function initIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        $$('.feature-card, .step-card, .benefit-card, .pricing-card, .faq-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    function showToast(message, type = 'success') {
        const toast = $(SELECTORS.toast);
        const messageEl = $('.toast-message', toast);

        if (!toast || !messageEl) return;

        messageEl.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    document.addEventListener('DOMContentLoaded', init);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();