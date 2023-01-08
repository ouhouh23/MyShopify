import {getUrlWithVariant, ProductForm} from '@shopify/theme-product-form';
import {formatMoney} from '@shopify/theme-currency';

export class Form {
  constructor(container) {
    this.container = container;
    this.form = this.container.querySelector('[data-form]');

    this.createProductForm();
  }

  createProductForm() {
    const productHandle = this.container.dataset.handle;

    fetch(`/products/${productHandle}.js`)
      .then((response) => {
        return response.json();
      })
      .then((productJSON) => {
        if (productJSON.available) {
          this.productForm = new ProductForm(this.form, productJSON, {
            onOptionChange: this.optionChange.bind(this),
            onFormSubmit: this.submit.bind(this),
          });
        } else {
          this.changeButtons(productJSON);
        }
      });
  }

  destroyProductForm() {
    if (!this.productForm) return;
    this.productForm.destroy();
  }

  optionChange() {
    this.variant = event.dataset.variant;

    this.changeButtons(this.variant);
    if (!this.variant) return;
    this.changeVariantUrl();
    this.dispatchPriceChange();
    this.dispatchQuantityChange();
    this.renderOptionName('[data-colors]');
  }

  changeButtons(object) {
    const buttons = [
      this.form.querySelector('[data-button-add]'),
      this.form.querySelector('[data-button-buy]'),
    ];

    buttons.forEach((element) => {
      if (!object) {
        element.setAttribute('disabled', 'disabled');
        element.innerHTML = unavailable;
      } else if (object && !object.available) {
        element.setAttribute('disabled', 'disabled');
        element.innerHTML = soldOut;
      } else if (object && object.available && element.disabled) {
        element.removeAttribute('aria-live', 'polite');
        element.removeAttribute('disabled');
        element.innerHTML = element.value;
      }
      buttons[0].setAttribute('aria-live', 'polite');
    });
  }

  changeVariantUrl() {
    const url = getUrlWithVariant(window.location.href, this.variant.id);
    window.history.replaceState({path: url}, '', url);
  }

  dispatchPriceChange() {
    const formattedNewPrice = formatMoney(this.variant.price, moneyFormat);

    const event = new CustomEvent('price:changed', {
      detail: {
        price: formattedNewPrice,
      },

      bubbles: true,
    });

    this.form.dispatchEvent(event);
  }

  dispatchQuantityChange() {
    const event = new CustomEvent('quantity:changed', {
      detail: {
        quantity: window.variants_inventory[this.variant.id],
      },

      bubbles: true,
    });

    this.form.dispatchEvent(event);
  }

  renderOptionName(optionGroup) {
    const inputGroup = this.form.querySelector(optionGroup);
    if (!inputGroup) return;

    const checkedInput = inputGroup.querySelector(':checked');
    const colorName = this.form.querySelector('[data-color-name]');

    colorName.innerHTML = checkedInput.value;
  }

  submit(event) {
    event.preventDefault();
    fetch(`${event.target.action}.js`, {
      method: event.target.method,
      body: new FormData(event.target),
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.status) {
          this.renderError(response);
        } else {
          this.deleteError();
          this.dispatchCartChange(response);
        }
      })
      .catch(console.error);
  }

  renderError(response) {
    this.deleteError();

    if (!this.error) {
      this.error = document.createElement('span');
      this.error.classList.add('form__error');
      this.error.setAttribute('id', 'form-error');
      this.error.setAttribute('role', 'alert');

      this.numberInput = this.form.querySelector('[data-input]');
      this.numberInput.setAttribute('aria-describedby', 'form-error');
    }

    this.error.innerHTML = response.description;
    this.form.appendChild(this.error);
    this.numberInput.setAttribute('aria-invalid', 'true');
  }

  deleteError() {
    if (!this.form.querySelector('.form__error')) return;

    this.error.remove();
    this.numberInput.setAttribute('aria-invalid', 'false');
  }

  dispatchCartChange(response) {
    const event = new CustomEvent('cart:added', {
      detail: {
        header: response.sections['alternate-header'],
      },
      bubbles: true,
    });

    this.form.dispatchEvent(event);
  }
}
