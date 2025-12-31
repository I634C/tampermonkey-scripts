let policyNumber = document
  .querySelector("div.row.Form-header > label")
  .innerText.trim();
let claimNumber = document
  .querySelector("#taskDescription")
  .innerText.split(" ")[0];

function createBbsContent(policyNumber, claimNumber) {
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

function downloadBbsFile(policyNumber, claimNumber) {
  const content = createBbsContent(policyNumber, claimNumber);
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  // Convert target script name into a .bbs wrapper filename
  const downloadName = `GoToPUUR${claimNumber}.bbs`;
  const a = document.createElement("a");
  a.href = url;
  a.download = downloadName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

downloadBbsFile(policyNumber, claimNumber);
