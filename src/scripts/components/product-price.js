export class ProductPrice {
  constructor(element) {
    this.priceElelement = element;

    this.initEvents();
  }

  updatePrice(event) {
    const newPrice = event.detail.price;
    if (newPrice === this.priceElelement.innerHTML) return;
    this.priceElelement.innerHTML = newPrice;
  }

  initEvents() {
    document.addEventListener('price:changed', this.updatePrice.bind(this));
  }

  destroyEvents() {
    document.removeEventListener('price:changed', this.updatePrice.bind(this));
  }
}
