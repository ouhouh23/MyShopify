import {register} from '@shopify/theme-sections';

import {Cart} from '../components/cart';

register('alternate-header', {
  onLoad() {
    this.cart = new Cart(this.container.querySelector('[data-cart-counter]'));
  },

  onUnload() {
    this.cart.destroyEvents();
  },
});
