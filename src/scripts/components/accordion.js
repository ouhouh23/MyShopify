// Accordion element
export class Toggle {
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

  removeEventListener(event, callback) {
    this.eventTarget.removeEventListener(event, callback);
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

//Accordion
export class Accordion {
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

  resetActiveToggleIndex() {
    this.activeToggleIndex = -1
  }

  initEvents(toggle) {
    toggle.addEventListener('toggle:opened', this.refresh.bind(this))
    toggle.addEventListener('toggle:closed', this.resetActiveToggleIndex.bind(this))
  }

  destroyEvents() {
    this.toggles.forEach(element => {
        element.removeEventListener('toggle:opened', this.refresh.bind(this))
        toggle.removeEventListener('toggle:closed', this.resetActiveToggleIndex.bind(this))
    })
  }
}
