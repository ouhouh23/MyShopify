export class Counter {
    constructor(initilalValue = null, step = 1, min = -Infinity, max = Infinity) {
        this.value = initilalValue
        this.step = step
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

    removeEventListener(event, callback) {
        this.eventTarget.removeEventListener(event, callback)
    }

    getValue() {
        return this.value
    }

    clamp(value) {
        return Math.min(Math.max(this.min, value), this.max)
    }

    setClampedValue(incomeValue) {
        this.value = this.clamp(incomeValue)
        this.dispatchEvent('value:changed')
    }

    increase() {
        this.setClampedValue(this.value + this.step)
    }

    decrease() {
        this.setClampedValue(this.value - this.step)
    }
}

export class CounterInput {
    constructor(element, initilalValue = null, step = 1, min = -Infinity, max = Infinity) {
        this.counter = new Counter(initilalValue, step, min, max)

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
        const value = this.counter.getValue()
        
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

    updateMax(event) {
        const maxUpdated = event.detail.quantity
        if (maxUpdated < 0) return;
        this.max = maxUpdated
        this.inputElement.max = this.max
        this.counter.max = maxUpdated
        this.counter.setClampedValue(this.counter.value)
    }

    initEvents() {
        this.inputElement.addEventListener('change', (event) => {
            this.counter.setClampedValue(event.target.value)
        })

        this.increaseElement.addEventListener('click', this.counter.increase.bind(this.counter))
        this.decreaseElement.addEventListener('click', this.counter.decrease.bind(this.counter))

        this.counter.addEventListener('value:changed', this.render.bind(this))
        document.addEventListener('quantity:changed', this.updateMax.bind(this))
    }

    destroyEvents() {
        this.counter.removeEventListener('value:changed', this.render.bind(this))
        document.removeEventListener('quantity:changed', this.updateMax.bind(this))
    }
}