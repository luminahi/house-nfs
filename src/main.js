import { HouseNFs } from "./HouseNFs.js";

function main() {
  const xmlInput = document.getElementById("xmlInput");
  const ongoingInput = document.getElementById("ongoingInput");
  const btnClear = document.getElementById("btn-clear");
  const tableContainer = document.getElementById("table-container");

  const nfTable = document.getElementById("nf-table");
  const itemModal = document.getElementById("item-modal");

  const houseNFs = new HouseNFs(nfTable, itemModal);

  ongoingInput.addEventListener("change", (e) => {
    houseNFs.clearOngoing();
    houseNFs.fillOngoingNf(e.target.files[0]);

    e.target.value = null;
  });

  xmlInput.addEventListener("click", () => {
    navigator.clipboard.writeText("path");
  });

  xmlInput.addEventListener("change", (e) => {
    const xmlFiles = Array.from(e.target.files).filter((file) => isXML(file));
    houseNFs.xmlReader(xmlFiles);
    tableContainer.hidden = false;

    e.target.value = null;
  });

  btnClear.addEventListener("click", () => {
    houseNFs.clearTable();
    tableContainer.hidden = true;
  });
}

function isXML(file) {
  if (file && file.type === "text/xml") return true;
  return false;
}

window.onload = () => main();
