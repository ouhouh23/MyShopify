import {register} from '@shopify/theme-sections';

import {Toggle, Accordion} from '../components/accordion';
import {Form} from '../components/form';
import {ProductPrice} from '../components/product-price';
import {Counter, CounterInput} from '../components/counter';

register('alternate-main-product', {
  onLoad() {
    this.form = new Form(this.container);
    this.productPrice = new ProductPrice(
      this.container.querySelector('[data-price]'),
    );
    this.counterInput = new CounterInput(
      this.container.querySelector('[data-counter]'),
      1,
      1,
      1,
      11,
    );
    this.accordion = new Accordion(
      this.container.querySelector('[data-accordion]'),
    );
  },

  onUnload() {
    this.form.destroyProductForm();
    this.productPrice.destroyEvents();
    this.accordion.destroyEvents();
    this.counterInput.destroyEvents();
  },

  onBlockSelect(event) {
    const selectedBlock = event.target.querySelector('[data-details]');
    const accordionItem = this.accordion.toggles.find(
      (element) => element.details === selectedBlock,
    );
    accordionItem.toggleAction();
  },
});
