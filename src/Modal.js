export class Modal {
  #modal;

  constructor(modal) {
    this.#modal = modal;
    this.#outerAreaCloseModal();
  }

  open() {
    this.#modal.showModal();
  }

  close() {
    this.#modal.close();
  }

  getElement() {
    return this.#modal;
  }

  #outerAreaCloseModal() {
    document.addEventListener("click", (e) => {
      e.stopPropagation();

      const rect = this.#modal.getBoundingClientRect();

      const { left, right, top, bottom } = rect;
      const { clientX, clientY } = e;

      if (
        clientX < left ||
        clientX > right ||
        clientY > bottom ||
        clientY < top
      ) {
        this.close();
      }
    });
  }
}
