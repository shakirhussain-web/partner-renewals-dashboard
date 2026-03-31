// =============================================================
// PASTE THIS INTO: Extensions > Apps Script in your PASSWORD Google Sheet
// Then: Deploy > New deployment > Web app
//   - Execute as: Me
//   - Who has access: Anyone
//   - Click Deploy > Copy the web app URL
// =============================================================

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var password = sheet.getRange('A2').getValue().toString();

  var result = {
    password: password
  };

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
