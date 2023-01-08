import {register} from '@shopify/theme-sections';
import {getUrlWithVariant, ProductForm} from '@shopify/theme-product-form';
import {formatMoney} from '@shopify/theme-currency';

// Accordion
class Toggle {
  constructor(element) {
    this.details = element;
    this.summary = this.details.querySelector('[data-summary]');
    this.eventTarget = new EventTarget()

    this.createAnimation();

    this.initEvents()
  }

  dispatchEvent(type, detail)  {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  addEventListener(event, callback) {
    this.eventTarget.addEventListener(event, callback);
  }

  createAnimation() {
    this.content = this.details.querySelector('[data-details-collapse]');
    const contentProperties = document.defaultView.getComputedStyle(
      this.content,
    );
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

    const keyframeEffect = new KeyframeEffect(this.content, keyframes, options);

    this.details.open = false;

    this.animation = new Animation(keyframeEffect);
  }

  updateAnimationHeight() {
    const animationKeyframes = this.animation.effect.getKeyframes();
    animationKeyframes[1].height = document.defaultView
      .getComputedStyle(this.content)
      .getPropertyValue('height');
    this.animation.effect.setKeyframes(animationKeyframes);
  }

  expand() {
    this.details.open = true;
    this.animation.play();
  }

  collapse() {
    this.animation.reverse();
    this.animation.finished.then(() => {
      this.animation.reverse();
      this.animation.pause();
      this.details.open = false;
    });
  }

  toggleAction() {
    if (this.animation.playState === 'running') return;
    this.updateAnimationHeight();

    if (this.details.open) {
        this.collapse()
        this.dispatchEvent('toggle:closed')
    }
    else {
        this.expand()
        this.dispatchEvent('toggle:opened', { target: this})
    }
  }

  initEvents() {
    this.summary.addEventListener('click', (event) => {
        event.preventDefault()
        this.toggleAction()
    })
  }
}

class Accordion {
  constructor(element) {
    this.toggles = Array.from(
      element.querySelectorAll('[data-details]'),
      (item) => {
        const toggle = new Toggle(item);
        this.initEvents(toggle);
        return toggle;
      },
    );
  }

  refresh(event) {
    if (this.activeToggleIndex >= 0) {
      this.toggles[this.activeToggleIndex].collapse()
    }

    this.activeToggleIndex = this.toggles.indexOf(event.detail.target)
  }

  initEvents(toggle) {
    toggle.addEventListener('toggle:opened', this.refresh.bind(this))
    toggle.addEventListener('toggle:closed', () => {
        this.activeToggleIndex = -1
    })
  }
}

// Form
class Form {
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
        element.removeAttribute('role');
        element.removeAttribute('disabled');
        element.innerHTML = element.value;
      }
      buttons[0].setAttribute('role', 'status');
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
