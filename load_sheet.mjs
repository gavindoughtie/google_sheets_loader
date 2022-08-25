function normalizeUrl(url) {
  const parsed = new URL(url);
  if (parsed.pathname.endsWith("/export")) {
    // Assuming this is correct for now
    return url;
  }
  const components = parsed.pathname.split("/");
  const lastIndex = components.length - 1;
  // parses the default share URL, but badly. Expects URLs like:
  // https://docs.google.com/spreadsheets/d/11XkkSwuZvNJeAxDkyJA9E9VGnFG4Dgj0yE9iTqtAY9Y/edit?usp=sharing
  if (components[lastIndex] == "edit") {
    // super-cheesy!
    components[lastIndex] = "export";
    const normalizedUrlString = `${parsed.protocol}//${
      parsed.hostname
    }/${components.join("/")}?format=csv`;
    let normalized = new URL(normalizedUrlString);
    return normalized;
  }
  return undefined;
}

async function load_sheet(data_url, destinationElement) {
  const normalized = normalizeUrl(data_url);
  if (!normalized) {
    const err = document.createElement("p");
    err.style.color = "#f00";
    err.innerText = "Error parsing URL";
    destinationElement.innerHTML = "";
    destinationElement.appendChild(err);
    return;
  }
  const response = await fetch(normalizeUrl(normalized));
  const reader = response.body.getReader();
  let stop = false;
  const decoded = [];
  const decoder = new TextDecoder();
  const CELL_STYLE =
    "text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap";
  do {
    let { done, value } = await reader.read();
    const decoded_value = decoder.decode(value);
    decoded.push(decoded_value);
    stop = done;
  } while (!stop);
  const rows = decoded.join("").split("\n");
  const table = document.createElement("table");
  const body = document.createElement("tbody");
  const head = document.createElement("thead");
  table.appendChild(head);
  table.appendChild(body);
  let headerRow = true;
  let tableHeaderRow;
  let headerColumnCount = 0;
  let maxColumnCount = 0;
  for (const row of rows) {
    const columns = row.split(",");
    let tableRow;
    let cell = "td";
    tableRow = document.createElement("tr");
    tableRow.className = "border-b";
    if (headerRow) {
      cell = "th";
    }
    let columnCount = 0;
    for (const column of columns) {
      const columnEl = document.createElement(cell);
      columnEl.className = CELL_STYLE;
      columnEl.innerText = column.trim();
      tableRow.appendChild(columnEl);
      if (headerRow) {
        headerColumnCount++;
      } else {
        columnCount++;
      }
    }
    maxColumnCount = Math.max(maxColumnCount, columnCount);
    if (headerRow) {
      headerRow = false;
      tableHeaderRow = tableRow;
      head.appendChild(tableRow);
    } else {
      body.appendChild(tableRow);
    }
  }
  const columnDiff = maxColumnCount - headerColumnCount;
  if (columnDiff) {
    for (let i = columnDiff; i >= 0; i--) {
      tableHeaderRow.appendChild(document.createElement("th"));
    }
  }
  destinationElement.innerHTML = "";
  destinationElement.appendChild(table);
}

function load() {
  const data_url = document.querySelector("#url").value;
  load_sheet(data_url, document.querySelector("#output"));
}

export { load, load_sheet };
