(() => {
  "use strict";

  /**********************************************************************
   * 🛠 EDIT THIS JSON TO ADD / REMOVE BUTTONS
   **********************************************************************/
  const CUSTOM_MAINFRAME_BUTTONS = [
    {
      id: "script1",
      label: "PA Automater",
      filePath: "I:\\Apprentice's Scripts\\pa-automater-3000.vbs",
    },
    {
      id: "script2",
      label: "Check for 3rd Year",
      filePath: "I:\\Apprentice's Scripts\\3YearLossScope.vbs",
    },
  ];

  /**********************************************************************
   * Utilities
   **********************************************************************/
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /**
   * Generates the BlueZone .bbs wrapper content
   */
  function createBbsContent(filePath) {
    return `Sub Main()
  Dim bzhao
  Set bzhao = CreateObject("BZWhll.WhllObj")
  bzhao.Connect
  bzhao.RunScript "${filePath}"
End Sub`;
  }

  /**
   * Creates and downloads the .bbs file using the JSON-defined filePath
   */
  function downloadBbsFile(filePath) {
    const content = createBbsContent(filePath);

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // Convert target script name into a .bbs wrapper filename
    const baseName = filePath
      .split("\\")
      .pop()
      .replace(/\.(vbs|bbs)$/i, "");
    const downloadName = `${baseName}.bbs`;

    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**********************************************************************
   * DOM Creation
   **********************************************************************/
  function ensureCustomSection(mainframeRoot) {
    let section = mainframeRoot.querySelector("#tm-custom-mainframe-section");
    if (section) return section;

    section = document.createElement("div");
    section.id = "tm-custom-mainframe-section";
    section.className = "row top-buffer col-xs-12";
    section.style.marginTop = "10px";

    const label = document.createElement("label");
    label.className = "row paddingleftVI";
    label.textContent = "Custom Mainframe Scripts";

    const innerRow = document.createElement("div");
    innerRow.className = "row paddingleftVI";

    const col = document.createElement("div");
    col.className = "col-xs-12 top-buffer";
    col.id = "tm-custom-mainframe-buttons";

    innerRow.appendChild(col);
    section.appendChild(label);
    section.appendChild(innerRow);

    // Insert before "Other ERIE Systems" if present
    const otherSystemsLabel = mainframeRoot.querySelector(
      "label.row.col-xs-12.paddingleftVI"
    );

    if (otherSystemsLabel) {
      otherSystemsLabel.parentElement.insertBefore(section, otherSystemsLabel);
    } else {
      mainframeRoot.appendChild(section);
    }

    return section;
  }

  function renderButtons(container, buttons) {
    container.innerHTML = "";

    buttons.forEach((btn) => {
      const form = document.createElement("form");
      form.action = "javascript:void(0)";
      form.method = "post";
      form.style.display = "inline-block";
      form.style.marginRight = "6px";
      form.style.marginBottom = "6px";

      const button = document.createElement("button");
      button.type = "button";
      button.id = btn.id;
      button.textContent = btn.label;
      button.className = "btn btn-primary-variant btn-mainframe";

      // Capture-phase hard stop + dynamic script generation
      button.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          // 🔑 JSON → createBbsContent → download
          downloadBbsFile(btn.filePath);
        },
        true
      );

      form.addEventListener(
        "submit",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        },
        true
      );

      form.appendChild(button);
      container.appendChild(form);
    });
  }

  /**********************************************************************
   * Init
   **********************************************************************/
  async function init() {
    for (let i = 0; i < 60; i++) {
      const mainframeRoot = document.querySelector("#Mainframe");
      if (mainframeRoot) {
        const section = ensureCustomSection(mainframeRoot);
        const container = section.querySelector("#tm-custom-mainframe-buttons");
        renderButtons(container, CUSTOM_MAINFRAME_BUTTONS);

        // Keep buttons alive if the portal re-renders
        const observer = new MutationObserver(() => {
          const stillExists = document.querySelector(
            "#tm-custom-mainframe-buttons"
          );
          if (
            stillExists &&
            stillExists.children.length !== CUSTOM_MAINFRAME_BUTTONS.length
          ) {
            renderButtons(stillExists, CUSTOM_MAINFRAME_BUTTONS);
          }
        });

        observer.observe(mainframeRoot, { childList: true, subtree: true });
        return;
      }
      await sleep(250);
    }
  }

  init();
})();
