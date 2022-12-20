/*	1. Аккордеон выполнен через тег <details>, поскольку данный тег хорошо стилизуется, имеет нативную
доступность, навигацию с клавиатуры и механизм переключения. 
	2. Так как в требованиях к заданию было выполнить в коде реализацию аккордеона, 
но <details> уже имеет нативную реализацию - в скрипте сделана кастомная реализация через Web Animation API.
	3. Реализция аккордеона выполнена через два класса: 
 		1. "Управляющий" Accordeon - инициирует механизмы выполнения на элементах аккордеона,
 	закрытие открытых элементов, при необходимости.
 		2. Toggle - механизм выполнения, применяемый к элементу аккордеона. Содержит методы для анимации, открытия, закрытия и т.д.
 	4. Это не требовалось по заданию, но хотелось, чтобы на странице работали все интерактивные элементы. После аккордеона написаны скрипты 
для работы счетчика, корзины, формы, выбора цветов.
 */

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

// Base class
class Value {
	constructor(initilalValue = null, min = -Infinity, max = Infinity) {
		this.value = initilalValue
		this.min = min
		this.max = max

		this.eventTarget = new EventTarget()
	}

	dispatchEvent(eventName) {
		this.eventTarget.dispatchEvent(new Event(eventName))
	}

	addEventListener(event, callback) {
		this.eventTarget.addEventListener(event, callback)
	}

	getValue() {
		return this.value
	}

	clamp(value) {
		return Math.min(Math.max(this.min, value), this.max)
	}

	setValue(incomeValue) {
		this.value = incomeValue
		this.dispatchEvent('changedValue')
	}

	setClampedValue(incomeValue) {
		this.value = this.clamp(incomeValue)
		this.dispatchEvent('changedValue')
	}
}

// Counter
class CounterValue extends Value {
	constructor(initilalValue = null, step = 1, min = -Infinity, max = Infinity) {
		super(initilalValue, min, max)

		this.step = step
	}

	increase() {
		this.setClampedValue(this.value + this.step)
	}

	decrease() {
		this.setClampedValue(this.value - this.step)
	}
}

class InputCounter {
	constructor(element, initilalValue = null, step = 1, min = -Infinity, max = Infinity) {
		this.counterValue = new CounterValue(initilalValue, step, min, max)

		this.step = step
		this.min = min
		this.max = max	

		this.element = element
		this.inputElement = this.element.querySelector('[data-input]');
		this.decreaseElement = this.element.querySelector('[data-decrease]');
		this.increaseElement = this.element.querySelector('[data-increase]');

		this.initInput()
		this.initEvents()

	}

	render() {
		const value = this.counterValue.getValue()
		
		this.inputElement.value = value
		this.decreaseElement.disabled = (value == this.min)
		this.increaseElement.disabled = (value == this.max) 
	}

	initInput() {
		this.inputElement.step = this.step
		this.inputElement.max = this.max
		this.inputElement.min = this.min

		this.render()
	}

	initEvents() {
		this.inputElement.addEventListener('change', (event) => {
			this.counterValue.setClampedValue(event.target.value)
		})

		this.increaseElement.addEventListener('click', this.counterValue.increase.bind(this.counterValue))
		this.decreaseElement.addEventListener('click', this.counterValue.decrease.bind(this.counterValue))

		this.counterValue.addEventListener('changedValue', this.render.bind(this))
	}

}

// Cart
class CartCounter {
	constructor(element, initilalValue = null, min = -Infinity, max = Infinity) {
		this.cartValue = new Value(initilalValue, min, max)

		this.element = document.querySelector(element)

		this.render()
		this.initEvents()
	}

	render() {
		this.value = this.cartValue.getValue()
		this.element.innerHTML = this.value
	}

	acceptValue(value) {
		if (value !== 0) {
			this.cartValue.setClampedValue(this.value + value)
		}
	}

	initEvents() {
		this.cartValue.addEventListener('changedValue', this.render.bind(this))
	}
}

// Color pick
class ColorIndicator {
	constructor(initilalValue = null, element) {
		this.colorValue = new Value(initilalValue)

		this.element = element

		this.setCheckedValue()
		this.render()
		this.initEvents()
	}

	setCheckedValue() {
		const checkedInput = this.element.querySelector(':checked')

		this.colorValue.setValue(checkedInput.value)
	}

	render() {
		const value = this.colorValue.getValue()
		const elementColor = this.element.querySelector('[data-color]')

		elementColor.innerHTML = value
	}

	initEvents() {
		this.element.addEventListener('change', (event) => {
			if (event.target.closest('[data-color-input]')) {
				this.setCheckedValue()
			}
		})

		this.colorValue.addEventListener('changedValue', this.render.bind(this))
	}
}

// Form
class Form {
	constructor(element, counter) {
		this.form = element
		this.formButtonAdd = this.form.querySelector('[data-button-add]')
		this.formButtonBuy = this.form.querySelector('[data-button-buy]')
		this.counter = counter

		this.initEvents()
	}

	initFormData() {
		this.formData = new FormData(this.form)

		this.formSizeValue = this.formData.get('size-input')
		this.formColorValue = this.formData.get('color-input')
		this.formQuantityValue = Number(this.formData.get('quantity-input'))
	}

	initEvents() {
		this.form.addEventListener('submit', (event) => {
			event.preventDefault()
		})

		this.formButtonBuy.addEventListener('click', this.initFormData.bind(this))
		this.formButtonAdd.addEventListener('click', () => {
			this.initFormData()
			this.counter.acceptValue(this.formQuantityValue)
		})
	}
}

// Init 
const cartElement = document.querySelector('[data-cart-counter')
if (cartElement !== null) {
	cartCounter = new CartCounter('[data-cart-counter]', 0, 0)
}

const colorGroups = document.querySelectorAll('[data-color-group]')
colorGroups.forEach(element => {
	const colorIndicator = new ColorIndicator(null, element)
})

const dataCounters = document.querySelectorAll('[data-counter]')
dataCounters.forEach(element => {
	const inputCounter = new InputCounter(element, 1, 1, 0, 11)
})

const dataForms = document.querySelectorAll('[data-form]')
dataForms.forEach(element => {
	const form = new Form(element, cartCounter)
})

const accordions = document.querySelectorAll('[data-accordion]')
accordions.forEach(element => {
	const accordion = new Accordion(element)
})
