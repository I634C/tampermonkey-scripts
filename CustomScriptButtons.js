(() => {
  "use strict";

  /**********************************************************************
   * 🛠 EDIT THIS CONFIG TO ADD / REMOVE BUTTONS
   * Supported actions:
   *  - downloadFromPath: downloads .bbs wrapper that runs filePath via BlueZone
   *  - goToPUURClaim: downloads .bbs that navigates PUUR to the claim (policy/claim pulled from page)
   *  - runFunction: runs a JS function from FUNCTION_REGISTRY (no download)
   **********************************************************************/
  const CUSTOM_MAINFRAME_BUTTONS = [
    // ✅ Your existing “run script from file path” buttons
    {
      id: "script1",
      label: "PA Automater",
      action: "downloadFromPath",
      filePath: "I:\\Apprentice's Scripts\\pa-automater-3000.vbs",
    },
    {
      id: "script2",
      label: "Check for 3rd Year",
      action: "downloadFromPath",
      filePath: "I:\\Apprentice's Scripts\\3YearLossScope.vbs",
    },

    // ✅ NEW: PUUR claim navigation button (dynamic)
    {
      id: "goToPuurClaim",
      label: "Go To PUUR Claim",
      action: "goToPUURClaim",
      // optional extras:
      // confirm: "Download PUUR navigation script for this claim?",
    },

    // ✅ Example: run a JS function (no download)
    // {
    //   id: "sayHi",
    //   label: "Say Hi",
    //   action: "runFunction",
    //   fn: "sayHi",
    // },
  ];

  /**********************************************************************
   * Utilities
   **********************************************************************/
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function downloadTextFile({ content, downloadName }) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function baseNameNoExt(path) {
    return path
      .split("\\")
      .pop()
      .replace(/\.(vbs|bbs)$/i, "");
  }

  /**********************************************************************
   * Context extraction from portal
   * (matches the selectors you used in GoToPUURClaim.js)
   **********************************************************************/
  function getPortalContext() {
    const policyEl = document.querySelector("div.row.Form-header > label");
    const taskEl = document.querySelector("#taskDescription");

    const policyNumber = policyEl?.innerText?.trim() || "";
    const claimNumber =
      taskEl?.innerText?.trim()?.split(" ")?.[0]?.trim() || "";

    return { policyNumber, claimNumber };
  }

  /**********************************************************************
   * Action: downloadFromPath
   * Generates a .bbs wrapper that runs an existing file path
   **********************************************************************/
  function createBbsWrapperForPath(filePath) {
    return `Sub Main()
  Dim bzhao
  Set bzhao = CreateObject("BZWhll.WhllObj")
  bzhao.Connect
  bzhao.RunScript "${filePath}"
End Sub`;
  }

  function handleDownloadFromPath(btn) {
    if (!btn.filePath) {
      alert(`Button "${btn.label}" is missing filePath.`);
      return;
    }

    const content = createBbsWrapperForPath(btn.filePath);
    const downloadName = `${baseNameNoExt(btn.filePath)}.bbs`;

    downloadTextFile({ content, downloadName });
  }

  /**********************************************************************
   * Action: goToPUURClaim
   * Builds a BlueZone script that navigates PUUR to Policy + Claim
   * (based on your GoToPUURClaim.js)
   **********************************************************************/
  function createBbsGoToPUURClaim(policyNumber, claimNumber) {
    return `Option Explicit

Dim MFScreen As Object
Set MFScreen = CreateObject("BZWhll.WhllObj")

MFScreen.Connect ""
MFScreen.WaitReady 5, 0

Dim PolicyNumber, ClaimNumber
PolicyNumber = "${policyNumber}"
ClaimNumber  = "${claimNumber}"

Sub GoToClaim()
    Dim IsOnClaimsScreen, IsOnClaimsDetailScreen
    IsOnClaimsScreen = ReadAt(18, 6, 31)
    IsOnClaimsDetailScreen = ReadAt(28, 6, 26)
    If (IsOnClaimsDetailScreen) Then
        MFScreen.SendKeys "<PF4>"
    ElseIf Not (IsOnClaimsScreen) Then
        MFScreen.SendKeys "<Clear>PUUR " & PolicyNumber & "<Enter>"
        MFScreen.WaitReady 5, 1
    End If 
    MFScreen.SendKeys "A<Enter>"
    MFScreen.WaitReady 5, 1
    Dim CurrentClaimNumber
    While True
        CurrentClaimNumber = GetClaimNum()
        If (CurrentClaimNumber = ClaimNumber) Then
            Exit Sub
        ElseIf (CurrentClaimNumber = "") Then
            Exit Sub
        Else
            MFScreen.SendKeys "<Enter>"
            MFScreen.WaitReady 5, 1
        End If
    Wend 
End Sub
Function GetClaimNum()
    GetClaimNum = Trim(ReadAt(13, 7, 9))
End Function
Private Function ReadAt(length, row, col)
    Dim buf
    MFScreen.ReadScreen buf, length, row, col
    ReadAt = buf
End Function`;
  }

  function handleGoToPUURClaim(btn) {
    const { policyNumber, claimNumber } = getPortalContext();

    if (!policyNumber || !claimNumber) {
      alert(
        `Couldn't find policy/claim on this page.\n` +
          `Policy: "${policyNumber}"\nClaim: "${claimNumber}"\n\n` +
          `Make sure the selectors still match the portal UI.`
      );
      return;
    }

    if (btn.confirm && !confirm(btn.confirm)) return;

    const content = createBbsGoToPUURClaim(policyNumber, claimNumber);
    const downloadName = `GoToPUUR_${claimNumber}.bbs`;

    downloadTextFile({ content, downloadName });
  }

  /**********************************************************************
   * Action: runFunction
   * Run a registered JS function by name (safe registry)
   **********************************************************************/
  const FUNCTION_REGISTRY = {
    sayHi: () => alert("Hi!"),
    // add more here
  };

  function handleRunFunction(btn) {
    const fn = FUNCTION_REGISTRY[btn.fn];
    if (typeof fn !== "function") {
      alert(`Function "${btn.fn}" not found in FUNCTION_REGISTRY.`);
      return;
    }
    fn(btn);
  }

  /**********************************************************************
   * Action router
   **********************************************************************/
  const ACTIONS = {
    downloadFromPath: handleDownloadFromPath,
    goToPUURClaim: handleGoToPUURClaim,
    runFunction: handleRunFunction,
  };

  function handleButtonClick(btn) {
    const handler = ACTIONS[btn.action];
    if (!handler) {
      alert(
        `Unknown action "${btn.action}" for button "${btn.label}".\n` +
          `Valid actions: ${Object.keys(ACTIONS).join(", ")}`
      );
      return;
    }
    handler(btn);
  }

  /**********************************************************************
   * DOM Creation (same idea as your existing CustomScriptButtons.js)
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

      button.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          handleButtonClick(btn);
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
