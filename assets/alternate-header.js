//Cart
class Cart {
	constructor(element) {
		this.cart = element
		this.initEvents()
	}

	updateCart(event) {
		const header = event.detail.header
		const parser = new DOMParser();
		const updatedCart = parser.parseFromString(header, "text/html").querySelector('[data-cart-counter]').innerHTML;
		this.cart.innerHTML = updatedCart
	}

	initEvents() {
		document.addEventListener('cart:added', this.updateCart.bind(this))
	}

	destroyEvents() {
		document.removeEventListener('cart:added', this.updateCart.bind(this))
	}
}

// Shopify integration
Shopify.theme.sections.register('alternate-header', {
    onLoad: function() {
    	this.cart = new Cart(this.container.querySelector('[data-cart-counter]'))
    },

    onUnload: function() {
    	this.cart.destroyEvents()
  },

})
