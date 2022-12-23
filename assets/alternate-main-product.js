// Accordion
class Toggle {
	constructor(element) {
		this.details = element
		this.summary = this.details.querySelector('[data-summary]')

		this.animation = this.createAnimation()
		this.animation.cancel()
	}

	createAnimation() {
		const content = this.details.querySelector('[data-details-collapse]')
		const contentProperties = window.getComputedStyle(content)
		const contentHeight = contentProperties.getPropertyValue('height')
		const contentPadding = contentProperties.getPropertyValue('padding')

		const keyframes = [
		{
		    height: 0,
		    padding: 0,
		    opacity: 0
		},
		{
		    height: contentHeight,
		    padding: contentPadding,
		    opacity: 1
		}]

		const options = {
			duration: 400,
			easing: 'ease-in'
		}

		content.style.overflow = 'hidden'

		return content.animate(keyframes, options)
	}

	expand()  {
		this.details.open = true
		this.animation.play()
	}

	collapse() {
		this.animation.playbackRate = -1
		this.animation.play()
		this.animation.finished.then(() => {
			this.details.open = false
			this.animation.playbackRate = 1
			this.animation.pause()
		})
	}

	initAction() {
		if (this.details.open) {
			this.collapse()
		}

		else {
			this.expand()
		}
	}
}

class Accordion {
	constructor(element) {
		this.toggles = Array.from(element.querySelectorAll('[data-details]'), (item) =>
			new Toggle(item)
		)
		this.toggles.forEach(element => {
			this.initEvents(element)
		})
	}

	refresh() {
		const toggleOpened = this.toggles.find(element => element.details.open == true)
		if (toggleOpened) {
			toggleOpened.collapse()
		}
	}

	initEvents(toggle) {
		const details = toggle.details
		const summary = toggle.summary

		summary.addEventListener('click', () => {
			if (details.open == false) {
				this.refresh()
			}
		})
		summary.addEventListener('click', (event) => {
			event.preventDefault()
			toggle.initAction()
		})
	}
}

// Shopify integration
Shopify.theme.sections.register('alternate-main-product', {

    onLoad: function() {
        this.accordion = new Accordion(this.container.querySelector('[data-accordion]'))
    },

    onBlockSelect: function(event) {
        this.accordion.refresh()

        const selectedBlock = event.target.querySelector('[data-details]')
        const accordionItem = this.accordion.toggles.find(element => element.details == selectedBlock)

        accordionItem.expand()
    },
})
