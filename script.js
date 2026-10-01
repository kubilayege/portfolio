const root = document.documentElement
const $ = (sel, el = document) => el.querySelector(sel)

const h = (tag, attrs = {}, ...children) => {
	const el = document.createElement(tag)
	for (const [k, v] of Object.entries(attrs)) {
		if (v == null || v === false) continue
		if (k === 'class') el.className = v
		else if (k === 'text') el.textContent = v
		else if (k.startsWith('on')) el.addEventListener(k.slice(2), v)
		else el.setAttribute(k, v === true ? '' : v)
	}
	el.append(...compact(children))
	return el
}

// Drop the falsy leftovers of `cond && node` so they never render as text.
function compact(nodes) {
	return nodes.flat().filter(c => c != null && c !== false && c !== 0 && c !== '')
}

const studioName = key => STUDIOS[key]?.name ?? ''
const studioShort = key => STUDIOS[key]?.short ?? ''
const bySlug = Object.fromEntries(PROJECTS.map(p => [p.slug, p]))
const games = PROJECTS.filter(p => p.kind === 'game')
const tools = PROJECTS.filter(p => p.kind === 'tool')

/* ---------- Theme ---------- */

const themeToggle = $('#theme-toggle')
const syncThemeLabel = () => {
	const next = root.dataset.theme === 'dark' ? 'light' : 'dark'
	themeToggle.setAttribute('aria-label', `Switch to ${next} theme`)
}
themeToggle.addEventListener('click', () => {
	root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'
	localStorage.setItem('portfolio-theme', root.dataset.theme)
	syncThemeLabel()
})
syncThemeLabel()

/* ---------- Header & nav ---------- */

const header = $('#header')
const onScroll = () => header.classList.toggle('header--scrolled', window.scrollY > 8)
window.addEventListener('scroll', onScroll, { passive: true })
onScroll()

const navLinks = [...document.querySelectorAll('.nav__link')]
const sectionObserver = new IntersectionObserver(entries => {
	entries.forEach(({ isIntersecting, target }) => {
		if (!isIntersecting) return
		navLinks.forEach(l => {
			if (l.hash === `#${target.id}`) l.setAttribute('aria-current', 'true')
			else l.removeAttribute('aria-current')
		})
	})
}, { rootMargin: '-45% 0px -50% 0px' })
navLinks.forEach(l => {
	const section = document.getElementById(l.hash.slice(1))
	if (section) sectionObserver.observe(section)
})

/* ---------- Hero reel ---------- */

const reelTrack = $('#reel-track')
const reelItems = games.filter(p => p.media.poster)
// Two copies so the -50% keyframe loops seamlessly.
;[...reelItems, ...reelItems].forEach(p => {
	reelTrack.append(
		h('a', { class: 'reel__item', href: `#game/${p.slug}`, tabindex: '-1' },
			h('img', { src: p.media.poster, alt: '', loading: 'lazy', decoding: 'async' }))
	)
})

/* ---------- Now (Joygame) ---------- */

$('#now-grid').append(...NOW.map(m =>
	h('article', { class: 'module' },
		h('p', { class: 'module__label', text: m.label }),
		h('h3', { class: 'module__title', text: m.title }),
		h('p', { class: 'module__text', text: m.text }),
		m.tags?.length && h('ul', { class: 'tags' }, m.tags.map(t => h('li', { class: 'tag', text: t })))
	)
))

/* ---------- Cards ---------- */

const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches
if (!canHover) $('#games-hint').textContent = 'Tap a game to watch the capture and read the details.'

const cardMeta = p => {
	const parts = p.kind === 'game'
		? [studioShort(p.studio), p.year, p.genre?.split(' · ')[0]]
		: [p.genre, p.year]
	return parts.filter(Boolean).join(' · ')
}

const startPreview = card => {
	const v = $('video', card)
	if (!v) return
	if (!v.src) v.src = v.dataset.src
	v.play().then(() => card.classList.add('card--playing')).catch(() => {})
}

const stopPreview = card => {
	const v = $('video', card)
	if (!v) return
	v.pause()
	card.classList.remove('card--playing')
}

const renderCard = p => {
	const { media } = p
	const mediaEl = h('div', { class: `card__media${media.fit === 'contain' ? ' card__media--contain' : ''}` },
		h('span', { class: 'card__badge', text: 'Playing' }),
		h('img', { src: media.poster || media.image, alt: '', loading: 'lazy', decoding: 'async' }),
		media.video && canHover && h('video', { 'data-src': media.video, loop: true, playsinline: true, preload: 'none' })
	)
	const preview = $('video', mediaEl)
	if (preview) preview.muted = true
	const card = h('article', { class: 'card', 'data-studio': p.studio },
		mediaEl,
		h('div', { class: 'card__body' },
			h('h3', { class: 'card__title' },
				h('a', { class: 'card__link', href: `#${p.kind}/${p.slug}`, text: p.title })),
			h('p', { class: 'card__meta', text: cardMeta(p) }),
			h('p', { class: 'card__tagline', text: p.tagline })
		)
	)
	if (media.video && canHover) {
		card.addEventListener('pointerenter', () => startPreview(card))
		card.addEventListener('pointerleave', () => stopPreview(card))
	}
	return card
}

const gamesGrid = $('#games-grid')
const toolsGrid = $('#tools-grid')
const gameCards = games.map(p => [p, renderCard(p)])
gamesGrid.append(...gameCards.map(([, c]) => c))
toolsGrid.append(...tools.map(renderCard))

// Never keep a preview running off-screen.
const offscreen = new IntersectionObserver(entries => {
	entries.forEach(({ isIntersecting, target }) => { if (!isIntersecting) stopPreview(target) })
})
document.querySelectorAll('.card').forEach(c => offscreen.observe(c))

/* ---------- Studio filter ---------- */

let activeStudio = 'all'
const filters = $('#game-filters')
const studioKeys = Object.keys(STUDIOS).filter(k => games.some(g => g.studio === k))

const setFilter = key => {
	activeStudio = key
	filters.querySelectorAll('.filter').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.studio === key)))
	gameCards.forEach(([p, c]) => { c.hidden = key !== 'all' && p.studio !== key })
}

const filterButton = (key, label, count) =>
	h('button', { class: 'filter', type: 'button', 'data-studio': key, 'aria-pressed': 'false', onclick: () => setFilter(key) },
		label, h('span', { class: 'filter__count', text: count }))

filters.append(
	filterButton('all', 'All', games.length),
	...studioKeys.map(k => filterButton(k, studioShort(k), games.filter(g => g.studio === k).length))
)
setFilter('all')

/* ---------- Experience ---------- */

$('#timeline').append(...EXPERIENCE.map(r => {
	const count = r.studio ? games.filter(g => g.studio === r.studio).length : 0
	const jump = r.jump
		? h('a', { class: 'role__jump', href: r.jump, text: 'What I work on now →' })
		: count > 0 && h('a', {
			class: 'role__jump',
			href: '#games',
			text: `See ${count} ${count === 1 ? 'game' : 'games'} →`,
			onclick: () => setFilter(r.studio),
		})
	return h('li', { class: 'role' },
		h('p', { class: 'role__when' }, r.when, h('br'), r.where),
		h('div', {},
			h('div', { class: 'role__head' },
				h('h3', { class: 'role__org', text: r.org || studioName(r.studio) }),
				h('span', { class: 'role__title', text: r.title })),
			h('ul', { class: 'role__points' }, r.points.map(t => h('li', { text: t }))),
			jump
		)
	)
}))

$('#skills').append(...SKILLS.map(s => h('li', { text: s })))
$('.skills').append(h('p', { class: 'note', style: 'margin-top:1rem' }, `Languages: ${LANGUAGES.join(', ')}`))
$('#year').textContent = new Date().getFullYear()

/* ---------- Inspector ---------- */

const inspector = $('#inspector')
const inspectorMedia = $('#inspector-media')
const inspectorBody = $('#inspector-body')
let current = null

const LINK_LABELS = {
	github: 'Source on GitHub',
	play: 'Google Play',
	appstore: 'App Store',
	itch: 'itch.io',
	download: 'Download APK',
	npm: 'npm package',
	releases: 'Download (GitHub Releases)',
}

const component = (title, ...content) =>
	h('details', { class: 'component', open: true },
		h('summary', {}, h('span', { class: 'component__icon', 'aria-hidden': 'true', text: '#' }), title),
		h('div', { class: 'component__content' }, ...content))

const prop = (label, value) => value && h('div', { class: 'prop' }, h('dt', { text: label }), h('dd', { text: value }))

const renderInspector = p => {
	inspector.classList.toggle('inspector--wide', !!p.media.wide)
	inspectorMedia.replaceChildren()
	if (p.media.video) {
		const hasSound = p.media.audio && navigator.userActivation?.hasBeenActive !== false
		const v = h('video', {
			src: p.media.video,
			poster: p.media.poster,
			controls: true,
			loop: true,
			playsinline: true,
			preload: 'auto',
			'aria-label': `${p.title} gameplay capture`,
		})
		v.muted = !hasSound
		v.volume = 0.4
		inspectorMedia.append(v)
		v.play().catch(() => { v.muted = true; v.play().catch(() => {}) })
	} else {
		const shots = p.media.images || [{ src: p.media.image, caption: 'screenshot' }]
		const zoom = h('a', { class: 'inspector__zoom', target: '_blank', rel: 'noopener' }, h('img'))
		const select = i => {
			const { src, caption } = shots[i]
			zoom.href = src
			zoom.setAttribute('aria-label', `Open ${p.title} ${caption} full size`)
			Object.assign($('img', zoom), { src, alt: `${p.title}: ${caption}` })
			thumbs?.querySelectorAll('button').forEach((b, j) => {
				b.setAttribute('aria-pressed', String(i === j))
				if (i === j) b.scrollIntoView({ block: 'nearest', inline: 'nearest' })
			})
		}
		const thumbs = shots.length > 1 ? h('div', { class: 'gallery', role: 'group', 'aria-label': 'Screenshots' },
			shots.map((s, i) => h('button', { type: 'button', class: 'gallery__thumb', 'aria-label': s.caption, title: s.caption, onclick: () => select(i) },
				h('img', { src: s.src, alt: '', loading: 'lazy' })))) : null
		inspectorMedia.append(...compact([zoom, thumbs]))
		select(0)
	}

	const studio = studioName(p.studio)
	const status = p.delisted ? 'No longer on the stores' : null
	const links = p.links || []

	inspectorBody.replaceChildren(...compact([
		h('div', { class: 'inspector__header' },
			h('p', { class: 'inspector__kind', text: p.kind === 'game' ? 'Game' : /^Prototype/.test(p.genre || '') ? 'Prototype' : 'Tool' }),
			h('h2', { class: 'inspector__title', id: 'inspector-title', text: p.title }),
			h('p', { class: 'inspector__tagline', text: p.tagline })
		),
		component(p.kind === 'game' ? 'Game' : 'Project',
			h('dl', { class: 'props' },
				prop('Studio', studio),
				prop('Year', p.year && String(p.year)),
				prop('Genre', p.genre),
				prop('Platforms', p.platforms?.join(', ')),
				(p.facts || []).map(f => prop(f.label, f.value)),
				prop('Status', status)
			),
			h('p', { text: p.about })
		),
		p.built?.length && component('What I built',
			h('ul', { class: 'bullets' }, p.built.map(b => h('li', { text: b })))),
		p.stack?.length && component('Stack',
			h('ul', { class: 'tags' }, p.stack.map(t => h('li', { class: 'tag', text: t })))),
		links.length > 0 && component('Links',
			h('div', { class: 'links' }, links.map(l =>
				h('a', { href: l.url, target: '_blank', rel: 'noopener noreferrer', text: `${LINK_LABELS[l.type] || 'Link'} ↗` }))))
	]))
	inspectorBody.scrollTop = 0
}

// Prev/next walks the list the project came from, respecting the studio filter.
const siblings = p => p.kind === 'game'
	? games.filter(g => activeStudio === 'all' || g.studio === activeStudio || g === p)
	: tools

const step = dir => {
	if (!current) return
	const list = siblings(current)
	const next = list[(list.indexOf(current) + dir + list.length) % list.length]
	history.replaceState(history.state, '', `#${next.kind}/${next.slug}`)
	show(next)
}

const show = p => {
	current = p
	renderInspector(p)
	if (!inspector.open) {
		inspector.showModal()
		document.body.style.overflow = 'hidden'
	}
}

const hide = () => {
	inspectorMedia.querySelector('video')?.pause()
	inspectorMedia.replaceChildren()
	current = null
	if (inspector.open) inspector.close()
	document.body.style.overflow = ''
}

const projectFromHash = () => {
	const m = location.hash.match(/^#(?:game|tool)\/([\w-]+)$/)
	return m ? bySlug[m[1]] : null
}

const syncFromHash = () => {
	const p = projectFromHash()
	if (p) show(p)
	else if (inspector.open) hide()
}

// Clear the project hash on close without leaving a dead history entry behind.
const closeInspector = () => {
	if (history.state?.inspector) history.back()
	else {
		history.replaceState(null, '', location.pathname + location.search)
		hide()
	}
}

document.addEventListener('click', e => {
	const a = e.target.closest('a[href^="#game/"], a[href^="#tool/"]')
	if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return
	e.preventDefault()
	const p = bySlug[a.hash.split('/')[1]]
	if (!p) return
	if (inspector.open) history.replaceState(history.state, '', a.hash)
	else history.pushState({ inspector: true }, '', a.hash)
	show(p)
})

window.addEventListener('popstate', syncFromHash)
window.addEventListener('hashchange', syncFromHash)

$('#inspector-close').addEventListener('click', closeInspector)
inspector.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => step(Number(b.dataset.step))))
inspector.addEventListener('cancel', e => { e.preventDefault(); closeInspector() })
inspector.addEventListener('click', e => { if (e.target === inspector) closeInspector() })
inspector.addEventListener('keydown', e => {
	if (e.target.closest('video')) return
	if (e.key === 'ArrowRight') step(1)
	if (e.key === 'ArrowLeft') step(-1)
})

syncFromHash()
