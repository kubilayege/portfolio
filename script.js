const body = document.body

const addThemeClass = (bodyClass) => {
	body.classList.add(bodyClass)
}

const storedBodyTheme = localStorage.getItem('portfolio-theme')
if (storedBodyTheme) {
	addThemeClass(storedBodyTheme)
} else {
	const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
	addThemeClass(systemPrefersDark ? 'dark' : 'light')
}

const scrollUp = () => {
	const btnScrollTop = document.querySelector('.scroll-top')

	if (
		body.scrollTop > 500 ||
		document.documentElement.scrollTop > 500
	) {
		btnScrollTop.style.display = 'block'
	} else {
		btnScrollTop.style.display = 'none'
	}
}

document.addEventListener('scroll', scrollUp, { passive: true })

document.querySelectorAll('img').forEach(img => {
	if (!('loading' in HTMLImageElement.prototype)) return
	img.loading = 'lazy'
})

document.querySelectorAll('video').forEach(v => {
	v.preload = 'metadata'
	v.setAttribute('playsinline', '')
	v.setAttribute('webkit-playsinline', '')
})

if ('IntersectionObserver' in window) {
	const observer = new IntersectionObserver((entries) => {
		entries.forEach(({ isIntersecting, target }) => {
			if (!isIntersecting) {
				target.pause()
				target.controls = false
			}
		})
	}, { root: null, threshold: 0.01 })
	
	document.querySelectorAll('video').forEach(v => observer.observe(v))
}

const header = document.querySelector('.header')
const toggleHeaderBg = () => {
	const y = window.scrollY || document.documentElement.scrollTop
	header.classList.toggle('header--scrolled', y > 10)
}
window.addEventListener('scroll', toggleHeaderBg, { passive: true })

toggleHeaderBg()

const progressBar = document.getElementById('scroll-progress')
const updateProgress = () => {
	const scrollTop = window.scrollY || document.documentElement.scrollTop
	const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
	const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
	progressBar.style.width = progress + '%'
}
window.addEventListener('scroll', updateProgress, { passive: true })
updateProgress()

const nav = document.querySelector('.nav')
const navIndicator = document.querySelector('.nav__indicator')
const navLinks = Array.from(document.querySelectorAll('.nav__list .link--nav'))

const setIndicatorToLink = (link) => {
	const rect = link.getBoundingClientRect()
	const navRect = nav.getBoundingClientRect()
	navIndicator.style.width = rect.width + 'px'
	navIndicator.style.left = (rect.left - navRect.left) + 'px'
}

navLinks.forEach(l => l.addEventListener('mouseenter', () => setIndicatorToLink(l)))
nav.addEventListener('mouseleave', () => {
	updateActiveSection()
})

const sections = [
	{ id: 'about', link: navLinks.find(l => l.getAttribute('href') === '#about') },
	{ id: 'projects', link: navLinks.find(l => l.getAttribute('href') === '#projects') },
	{ id: 'contact', link: navLinks.find(l => l.getAttribute('href') === '#contact') }
].filter(s => s.link)

const sectionEntries = sections.map(s => ({ ...s, el: document.getElementById(s.id) })).filter(e => e.el)

let manualIndicatorUntil = 0
const nowTs = () => Date.now()
const isManualActive = () => nowTs() < manualIndicatorUntil
const setManualIndicator = (link) => {
	setIndicatorToLink(link)
	manualIndicatorUntil = nowTs() + 1500
}

const updateActiveSection = () => {
	if (isManualActive()) return
	const scrollYVal = window.scrollY || document.documentElement.scrollTop
	const headerH = header.offsetHeight || 0
	const viewportMid = scrollYVal + headerH + (window.innerHeight - headerH) / 2
	let active = null
	let bestDistance = Infinity
	sectionEntries.forEach(e => {
		const top = e.el.offsetTop
		const bottom = top + e.el.offsetHeight
		let distance = 0
		if (viewportMid < top) distance = top - viewportMid
		else if (viewportMid > bottom) distance = viewportMid - bottom
		else distance = 0
		if (distance <= bestDistance) {
			bestDistance = distance
			active = e
		}
	})
	if (active) setIndicatorToLink(active.link)
}

window.addEventListener('scroll', updateActiveSection, { passive: true })
window.addEventListener('resize', updateActiveSection)
updateActiveSection()

window.addEventListener('hashchange', () => {
	const h = location.hash
	if (!h) return
	const l = navLinks.find(l => l.getAttribute('href') === h)
	if (l) setManualIndicator(l)
})

navLinks.forEach(l => l.addEventListener('click', () => setManualIndicator(l)))

function playVideo(video) {  
    const playPromise = video.play()
	video.controls = true
	if (playPromise && typeof playPromise.then === 'function') {
		playPromise.catch(() => {})
	}
}

function pauseVideo(video) {  
    video.pause()
	video.controls = false
}

document.addEventListener('scroll', scrollUp, { passive: true })

document.querySelectorAll('video').forEach(v => {
	v.preload = 'metadata'
	v.setAttribute('playsinline', '')
	v.setAttribute('webkit-playsinline', '')
})

const lightbox = document.getElementById('lightbox')
const lightboxMedia = document.getElementById('lightbox-media')
const lightboxCaption = document.getElementById('lightbox-caption')
const lightboxClose = document.querySelector('.lightbox__close')

const openLightbox = (node, captionText) => {
	while (lightboxMedia.firstChild) lightboxMedia.removeChild(lightboxMedia.firstChild)
	const clone = node.cloneNode(true)
	clone.removeAttribute('onmouseover')
	clone.removeAttribute('onmouseout')
	clone.classList.add('lightbox__media')
	if (clone.tagName.toLowerCase() === 'video') {
		clone.muted = false
		clone.controls = true
		clone.loop = true
		clone.preload = 'auto'
		clone.play().catch(() => {})
	}
	lightboxMedia.appendChild(clone)
	lightboxCaption.textContent = captionText || ''
	lightbox.classList.add('lightbox--open')
	lightbox.setAttribute('aria-hidden', 'false')
	body.style.overflow = 'hidden'
}

const closeLightbox = () => {
	const media = lightboxMedia.querySelector('video')
	if (media) media.pause()
	lightbox.classList.remove('lightbox--open')
	lightbox.setAttribute('aria-hidden', 'true')
	body.style.overflow = ''
}

lightboxClose.addEventListener('click', closeLightbox)
lightbox.addEventListener('click', (e) => {
	if (e.target === lightbox) closeLightbox()
})

document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape' && lightbox.classList.contains('lightbox--open')) closeLightbox()
})

Array.from(document.querySelectorAll('.project')).forEach(project => {
	const title = project.querySelector('h3')?.textContent?.trim() || ''
	project.querySelectorAll('video, img').forEach(media => {
		media.style.cursor = 'zoom-in'
		media.addEventListener('click', (e) => {
			e.preventDefault()
			openLightbox(media, title)
		})
	})
})
