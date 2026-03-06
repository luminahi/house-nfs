import { Modal } from "./Modal.js";
import { FILIAL } from "./Filial.js";

export class HouseNFs {
  nfMap;
  ongoingNfSet;

  filesRead;
  filesLength;

  nfTable;
  itemModal;
  itemTableModal;
  nfCSModal;
  btnCloseModal;
  nfTitle;

  constructor(table, modal) {
    this.nfMap = new Map();
    this.ongoingNfSet = new Set();

    this.filesRead = 0;
    this.filesLength = 0;

    this.nfTable = table.querySelector("tbody");
    this.itemModal = new Modal(modal);

    this.itemTableModal = this.itemModal.getElement().querySelector("tbody");
    this.btnCloseModal = this.itemModal.getElement().querySelector("button");
    this.nfCSModal = this.itemModal.getElement().querySelector("p");
    this.nfTitle = this.itemModal.getElement().querySelector("h2");

    this.btnCloseModal.addEventListener("click", () => {
      this.itemModal.close();
    });
  }

  fillOngoingNf(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.addEventListener("load", (e) => {
      const lines = e.target.result.split(/\r?\n/);

      lines.forEach((line) => {
        const parsedLine = line.split(/\s{2,}/);

        if (
          parsedLine[0]?.length === 8 &&
          parsedLine[1]?.length === 8 &&
          parsedLine[2]
        ) {
          this.ongoingNfSet.add(parsedLine[2]);
        }
      });
    });

    reader.readAsText(file);
  }

  read(file) {
    const nfKey = file.name.split(".")[0];
    const nfNumber = nfKey.substring(26, 34) - 0;

    if (!this.ongoingNfSet.has(`${nfNumber}`)) return this.filesLength--;

    const parser = new DOMParser();
    const reader = new FileReader();

    reader.addEventListener("load", (e) => {
      const data = e.target.result;
      const xmlData = parser.parseFromString(data, "application/xml");

      this.addNF(xmlData);
      this.filesRead++;

      if (this.filesRead === this.filesLength) this.fillTable();
    });

    reader.readAsText(file);
  }

  xmlReader(files) {
    if (files.length === 0) return;
    this.clearTable();

    this.filesLength = files.length;

    Array.from(files).forEach((file) => {
      this.read(file);
    });
  }

  addNF(xmlData) {
    const nfEmitCNPJ = xmlData.querySelector("emit CNPJ")?.innerHTML;
    const nfNumber = xmlData.querySelector("nNF")?.innerHTML;

    const rawProducts = xmlData.querySelectorAll("det");
    const products = new Array(rawProducts.length);

    for (let i = 0; i < rawProducts.length; i++) {
      const description = rawProducts[i].querySelector("xProd").innerHTML;
      const ean = rawProducts[i].querySelector("cEAN").innerHTML;
      const host = rawProducts[i].querySelector("cProd").innerHTML;
      const quantity = rawProducts[i].querySelector("qCom").innerHTML - 0;
      const packaging = rawProducts[i].querySelector("uCom").innerHTML;
      products[i] = { description, ean, host, quantity, packaging };
    }

    const timeInfo = xmlData.querySelector("dhEmi")?.innerHTML;
    const value = xmlData.querySelector("total ICMSTot vNF")?.innerHTML;
    const nature = xmlData.querySelector("natOp")?.innerHTML;

    const rawInfo = xmlData.querySelector("infCpl")?.innerHTML;
    const infoParts = rawInfo.split("CS");

    const info = infoParts[0];
    const cs = infoParts[1].split("-")[0].replace(":", "").trim();
    let situation = "normal";

    // possible new function
    if (!(rawInfo.toUpperCase().search("PEDIDO") !== -1)) {
      situation = "warning";
    }

    const arr = ["AUT", "A/C"];

    if (arr.some((text) => rawInfo.toUpperCase().search(text) !== -1))
      situation = "danger";

    // if (rawInfo.toUpperCase().search("AUT") !== -1) {
    //   situation = "danger";
    // }

    this.nfMap.set(nfNumber, {
      emitter: FILIAL[nfEmitCNPJ],
      nature,
      info,
      cs,
      value,
      timeInfo,
      products,
      situation,
    });
  }

  addItemRow(product) {
    const row = document.createElement("tr");

    const eanCell = document.createElement("td");
    eanCell.textContent = product.ean;
    row.appendChild(eanCell);

    const hostCell = document.createElement("td");
    hostCell.textContent = product.host;
    row.appendChild(hostCell);

    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = product.description;
    row.appendChild(descriptionCell);

    const typeCell = document.createElement("td");
    typeCell.textContent = product.packaging;
    row.appendChild(typeCell);

    const quantityCell = document.createElement("td");
    quantityCell.textContent = product.quantity;
    row.appendChild(quantityCell);

    this.itemTableModal.appendChild(row);
  }

  addNfRow(nf) {
    const row = document.createElement("tr");
    row.className = nf.situation;

    const dateCell = document.createElement("td");
    dateCell.textContent = nf.localTime;
    row.appendChild(dateCell);

    const emitterCell = document.createElement("td");
    emitterCell.textContent = nf.emitter;
    row.appendChild(emitterCell);

    const nfNumberCell = document.createElement("td");
    nfNumberCell.textContent = nf.nfNumber;
    row.appendChild(nfNumberCell);

    const natureCell = document.createElement("td");
    natureCell.textContent = nf.nature;
    row.appendChild(natureCell);

    const valueCell = document.createElement("td");
    valueCell.textContent = `R$ ${nf.value}`;
    row.appendChild(valueCell);

    const infoCell = document.createElement("td");
    infoCell.textContent = nf.info;
    row.appendChild(infoCell);

    const buttonCell = document.createElement("td");
    buttonCell.textContent = "Ver Mercadoria";
    buttonCell.classList.add("btn-items");

    buttonCell.addEventListener("click", (e) => {
      e.stopPropagation();

      this.itemTableModal.innerHTML = "";
      this.nfCSModal.textContent = `CS: ${nf.cs}`;
      this.nfTitle.textContent = `NF: ${nf.nfNumber}`;

      const products = [...nf.products];

      for (const product of products) {
        this.addItemRow(product);
      }

      this.itemModal.open();
    });

    row.appendChild(buttonCell);

    this.nfTable.appendChild(row);
  }

  fillTable() {
    const nfList = [...this.nfMap];

    // sort by nf number
    // nfList.sort();

    // sort by emission time
    nfList.sort((a, b) => a[1].timeInfo.localeCompare(b[1].timeInfo));

    for (const nf of nfList) {
      const localTime = new Date(nf[1].timeInfo).toLocaleString();

      const nfData = {
        localTime,
        emitter: nf[1].emitter,
        nfNumber: nf[0],
        nature: nf[1].nature,
        value: nf[1].value,
        info: nf[1].info,
        products: nf[1].products,
        cs: nf[1].cs,
        situation: nf[1].situation,
      };

      this.addNfRow(nfData);
    }
  }

  clearOngoing() {
    this.ongoingNfSet.clear();
  }

  clearTable() {
    this.filesRead = 0;
    this.filesLength = 0;
    this.nfMap.clear();
    this.nfTable.innerHTML = "";
    this.itemTableModal.innerHTML = "";
    this.nfCSModal.innerHTML = "";
  }
}
