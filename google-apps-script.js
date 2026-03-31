// =============================================================
// PASTE THIS INTO: Extensions > Apps Script in your Google Sheet
// Then: Deploy > Manage deployments > Edit > Update version > Deploy
// =============================================================

function doGet(e) {
  var sheetName = e.parameter.sheet || 'Reseller Customer with Active Subs';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Sheet not found: ' + sheetName }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Return raw 2D array — server handles header detection
  var data = sheet.getDataRange().getValues();
  var rows = [];

  for (var i = 0; i < data.length; i++) {
    var row = [];
    for (var j = 0; j < data[i].length; j++) {
      var val = data[i][j];
      if (val instanceof Date) {
        val = val.toISOString();
      }
      row.push(val);
    }
    rows.push(row);
  }

  var result = {
    sheetName: sheetName,
    totalRows: rows.length,
    totalCols: rows.length > 0 ? rows[0].length : 0,
    refreshedAt: new Date().toISOString(),
    rows: rows
  };

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
