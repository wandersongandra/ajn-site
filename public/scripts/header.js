(() => {
	const header = document.querySelector('#site-header');
	const menuToggle = header?.querySelector('[data-menu-toggle]');
	const nav = header?.querySelector('#primary-navigation');
	const submenuGroups = Array.from(header?.querySelectorAll('.has-submenu') ?? []);
	const compactNav = window.matchMedia('(max-width: 1100px)');

	function setSubmenu(group, open) {
		group.classList.toggle('is-expanded', open);
		const button = group.querySelector('[data-submenu-toggle]');
		if (button) {
			button.setAttribute('aria-expanded', String(open));
			button.setAttribute('aria-label', (open ? 'Recolher' : 'Expandir') + ' opções de Serviços');
		}
	}

	function closeSubmenus(except) {
		for (const group of submenuGroups) {
			if (group !== except) setSubmenu(group, false);
		}
	}

	function setMenu(open) {
		menuToggle?.setAttribute('aria-expanded', String(open));
		menuToggle?.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
		nav?.classList.toggle('is-open', open);
		const accessibleText = menuToggle?.querySelector('.sr-only');
		if (accessibleText) accessibleText.textContent = open ? 'Fechar menu' : 'Abrir menu';
		if (!open) closeSubmenus();
	}

	menuToggle?.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
	for (const group of submenuGroups) {
		const subToggle = group.querySelector('[data-submenu-toggle]');
		subToggle?.addEventListener('click', () => {
			const next = !compactNav.matches && group.matches(':hover')
				? true
				: subToggle.getAttribute('aria-expanded') !== 'true';
			closeSubmenus(group);
			setSubmenu(group, next);
		});
		group.addEventListener('pointerenter', (event) => {
			if (event.pointerType === 'mouse' && !compactNav.matches) setSubmenu(group, true);
		});
		group.addEventListener('pointerleave', (event) => {
			if (event.pointerType === 'mouse' && !compactNav.matches) setSubmenu(group, false);
		});
	}

	nav?.addEventListener('click', (event) => {
		const target = event.target;
		if (target instanceof Element && target.closest('a[href]') && compactNav.matches) setMenu(false);
	});
	document.addEventListener('pointerdown', (event) => {
		const target = event.target;
		if (target instanceof Node && header && !header.contains(target)) {
			closeSubmenus();
			if (compactNav.matches) setMenu(false);
		}
	});
	document.addEventListener('keydown', (event) => {
		if (event.key !== 'Escape') return;
		const anySubmenuOpen = submenuGroups.some((group) => group.classList.contains('is-expanded'));
		const menuOpen = menuToggle?.getAttribute('aria-expanded') === 'true';
		if (anySubmenuOpen) {
			const activeGroup = submenuGroups.find((group) => group.classList.contains('is-expanded'));
			closeSubmenus();
			activeGroup?.querySelector('[data-submenu-toggle]')?.focus();
		} else if (menuOpen) {
			setMenu(false);
			menuToggle?.focus();
		}
	});
	compactNav.addEventListener('change', () => {
		setMenu(false);
		closeSubmenus();
	});
})();
