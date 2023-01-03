import {register} from '@shopify/theme-sections';
import {getUrlWithVariant, ProductForm} from '@shopify/theme-product-form';
import {formatMoney} from '@shopify/theme-currency';

// Accordion
class Toggle {
  constructor(element) {
    this.details = element;
    this.summary = this.details.querySelector('[data-summary]');

    this.animation = this.createAnimation();
    this.animation.cancel();
  }

  createAnimation() {
    const content = this.details.querySelector('[data-details-collapse]');
    const contentProperties = window.getComputedStyle(content);
    const contentHeight = contentProperties.getPropertyValue('height');
    const contentPadding = contentProperties.getPropertyValue('padding');

    const keyframes = [
      {
        height: 0,
        padding: 0,
        opacity: 0,
      },
      {
        height: contentHeight,
        padding: contentPadding,
        opacity: 1,
      },
    ];

    const options = {
      duration: 400,
      easing: 'ease-in',
    };

    content.style.overflow = 'hidden';

    return content.animate(keyframes, options);
  }

  expand() {
    this.details.open = true;
    this.animation.play();
  }

  collapse() {
    this.animation.playbackRate = -1;
    this.animation.play();
    this.animation.finished.then(() => {
      this.details.open = false;
      this.animation.playbackRate = 1;
      this.animation.pause();
    });
  }

  initAction() {
    if (this.details.open) {
      this.collapse();
    } else {
      this.expand();
    }
  }
}

class Accordion {
  constructor(element) {
    this.toggles = Array.from(
      element.querySelectorAll('[data-details]'),
      (item) => new Toggle(item),
    );
    this.toggles.forEach((toggle) => {
      this.initEvents(toggle);
    });
  }

  refresh() {
    const toggleOpened = this.toggles.find(
      (element) => element.details.open === true,
    );
    if (toggleOpened) {
      toggleOpened.collapse();
    }
  }

  initEvents(toggle) {
    const details = toggle.details;
    const summary = toggle.summary;

    summary.addEventListener('click', () => {
      if (details.open === false) {
        this.refresh();
      }
    });
    summary.addEventListener('click', (event) => {
      event.preventDefault();
      toggle.initAction();
    });
  }
}

// Form
class Form {
  constructor(container) {
    this.container = container;
    this.form = this.container.querySelector('[data-form]');
    this.error = this.form.querySelector('[data-form-error]');

    this.createProductForm();
  }

  createProductForm() {
    const productHandle = this.container.dataset.handle;

    fetch(`/products/${productHandle}.js`)
      .then((response) => {
        return response.json();
      })
      .then((productJSON) => {
        this.productForm = new ProductForm(this.form, productJSON, {
          onOptionChange: this.optionChange.bind(this),
          onFormSubmit: this.submit.bind(this),
        });
      });
  }

  destroyProductForm() {
    if (!this.productForm) return;
    this.productForm.destroy();
  }

  optionChange() {
    this.variant = event.dataset.variant;

    this.changeButtons();
    if (!this.variant) return;
    this.changeVariantUrl();
    this.dispatchPriceChange();
  }

  changeButtons() {
    const buttons = [
      this.form.querySelector('[data-button-add]'),
      this.form.querySelector('[data-button-buy]'),
    ];
    buttons.forEach((element) => {
      if (!this.variant) {
        element.setAttribute('disabled', 'disabled');
        element.innerHTML = unavailable;
      } else if (this.variant && !this.variant.available) {
        element.setAttribute('disabled', 'disabled');
        element.innerHTML = soldOut;
      } else if (this.variant && this.variant.available && element.disabled) {
        element.removeAttribute('disabled');
        element.innerHTML = element.value;
      }
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
    if (this.error.innerHTML === response.description) return;

    this.error.innerHTML = response.description;
    this.error.style.display = 'inline-block';
  }

  deleteError() {
    if (this.error.style.display === 'inline-block') {
      this.error.style.display = 'none';
    }
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

// Price
class ProductPrice {
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

// Shopify integration
register('alternate-main-product', {
  onLoad() {
    this.form = new Form(this.container);
    this.productPrice = new ProductPrice(
      this.container.querySelector('[data-price]'),
    );
    this.accordion = new Accordion(
      this.container.querySelector('[data-accordion]'),
    );
  },

  onUnload() {
    this.form.destroyProductForm();
    this.productPrice.destroyEvents();
  },

  onBlockSelect(event) {
    this.accordion.refresh();

    const selectedBlock = event.target.querySelector('[data-details]');
    const accordionItem = this.accordion.toggles.find(
      (element) => element.details === selectedBlock,
    );

    accordionItem.expand();
  },
});
