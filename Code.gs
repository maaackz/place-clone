const APP_FOLDER_NAME = "Place";
const SHEET_FILE_NAME = "place";
const WIDTH = 50;
const HEIGHT = 50;
const DEFAULT_COLOR = "#FFFFFF";

// 🔧 Utility to get the sheet
function _getCanvasSheet() {
  const folder = DriveApp.getFoldersByName(APP_FOLDER_NAME);
  if (!folder.hasNext()) throw new Error(`Folder '${APP_FOLDER_NAME}' not found`);

  const file = folder.next().getFilesByName(SHEET_FILE_NAME);
  if (!file.hasNext()) throw new Error(`Spreadsheet '${SHEET_FILE_NAME}' not found`);

  const spreadsheet = SpreadsheetApp.open(file.next());
  return spreadsheet.getSheets()[0];
}

// 🟩 GET: canvas data
function _getCanvasData() {
  const sheet = _getCanvasSheet();
  const data = sheet.getRange(1, 1, HEIGHT, WIDTH).getValues();
  return data;
}

// 🎨 Update a single pixel (value + fill color)
function _updatePixel(x, y, color) {
  if (isNaN(x) || isNaN(y) || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    throw new Error("Invalid pixel data");
  }

  const sheet = _getCanvasSheet();
  const cell = sheet.getRange(y + 1, x + 1);
  cell.setValue(color);
  cell.setBackground(color); // Set fill color here
  return { success: true };
}

// 🧹 Reset the entire canvas (values + fill colors)
function _resetCanvas() {
  // const sheet = _getCanvasSheet();
  // const rowValues = Array(WIDTH).fill(DEFAULT_COLOR);
  // const data = Array.from({ length: HEIGHT }, () => [...rowValues]);
  // sheet.getRange(1, 1, HEIGHT, WIDTH).setValues(data);

  // // Also set background colors in bulk
  // const bgColors = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(DEFAULT_COLOR));
  // sheet.getRange(1, 1, HEIGHT, WIDTH).setBackgrounds(bgColors);

  return { success: true };
}


// 🌐 GET endpoint — supports get, reset, update
function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;

  try {
    let responseData;

    if (action === "get") {
      const data = _getCanvasData();
      responseData = { success: true, data };
    } else if (action === "reset") {
      responseData = _resetCanvas();
    } else if (action === "update") {
      const x = Number(e.parameter.x);
      const y = Number(e.parameter.y);
      const color = e.parameter.color;
      responseData = _updatePixel(x, y, color);
    } else {
      responseData = { success: false, message: "Invalid action" };
    }

    const json = JSON.stringify(responseData);
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${json})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(json)
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (err) {
    const errorData = { success: false, message: err.message };
    const json = JSON.stringify(errorData);
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${json})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(json)
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}

// POST remains for completeness, but won't work cross-origin from localhost
function doPost(e) {
  try {
    const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const { x, y, color } = body;
    const result = _updatePixel(Number(x), Number(y), color);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}
