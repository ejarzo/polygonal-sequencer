var currentStateDict = new Dict("---CurrentState");

outlets = 2;

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

var width = 0;
var height = 0;

var stateIndex = jsarguments[1];

var BG_COLOR = [0.12, 0.1, 0.1];
// var BG_COLOR_2 = [0.12, 0.1, 0.1];
var strokeColor = [0.9, 0.5, 0.5];
var progressColor = [0.9, 0.8, 0.8];

var points = [];
var isHovered = false;
var isShiftPressed = false;

setup();

setoutletassist(0, "Retrieve Preset");
setoutletassist(1, "Overwrite Preset");

function getEdges() {
  var edges = [];
  if (points.length < 2) return edges;
  var n = points.length;
  for (var i = 0; i < n - 1; i++) {
    var p = points[i];
    var pNext = points[i + 1];
    edges.push([p.pos, pNext.pos]);
  }
  edges.push([points[n - 1].pos, points[0].pos]);
  return edges;
}

function hasPoints() {
  var hasPoints = points.length > 0;
  return hasPoints;
}

function init() {
  getPointsFromDict();
}

function circle(p, r) {
  mgraphics.ellipse(p[0] - r, p[1] - r, r * 2, r * 2);
}

function getPointsFromDict() {
  var storedPoints = currentStateDict.get("savedShape" + stateIndex) || [];
  var newPoints = [];
  for (var i = 0; i < storedPoints.length; i += 3) {
    var pos = [
      (parseFloat(storedPoints[i]) / 170) * width,
      (parseFloat(storedPoints[i + 1]) / 170) * height,
    ];
    var velocity = parseInt(storedPoints[i + 2]);
    newPoints.push({ pos: pos, velocity: velocity });
  }

  points = newPoints.slice();
  edges = getEdges();
  // currentStateDict.set("savedShape" + stateIndex, newPoints);
  //  updatePoints(newPoints);
  //  bang();
}

function updatePoints(pts) {
  // var pts = currentStateDict.get("savedShape" + stateIndex);
  points = pts.slice();
  edges = getEdges();
}

function bang() {
  mgraphics.redraw();
}

function setup() {
  width = box.rect[2] - box.rect[0];
  height = box.rect[3] - box.rect[1];
  // var savedState = currentStateDict.get("savedShape" + stateIndex);
  // setPoints(savedState);
  // edges = getEdges();
  getPointsFromDict();
  mgraphics.redraw();
}

function paint() {
  edges = getEdges();

  var isHoveringAdd = isHovered && !hasPoints();
  var isHoveringDelete = isHovered && isShiftPressed && hasPoints();

  with (mgraphics) {
    set_source_rgba(BG_COLOR, 1);
    rectangle_rounded(0, 0, width, height, 8, 8);

    fill();

    if (!edges) return;

    if (isHovered) {
      // set_source_rgba(BG_COLOR_2, 1);
      //
      set_source_rgba(strokeColor, 1);
      set_line_width(1);
      rectangle_rounded(1, 1, width - 2, height - 2, 8, 8);
      // rectangle_rounded(0, 0, width, height, 8, 8);
      stroke();
      // fill();
    }

    // draw edges
    edges.forEach(function (edge, i) {
      var p1 = edge[0];
      var p2 = edge[1];
      set_source_rgba(strokeColor, isHovered ? 1 : 0.8);
      if (isHoveringDelete) {
        set_source_rgba(strokeColor, 0.2);
      }
      set_line_width(isHovered ? 2 : 1);
      move_to(p1[0], p1[1]);
      line_to(p2[0], p2[1]);
      stroke();
    });

    /* Draw Plus Sign */
    if (isHoveringAdd) {
      set_source_rgba(progressColor, 1);

      set_line_width(2);
      move_to(width / 2, 10);
      line_to(width / 2, height - 10);
      stroke();
      move_to(10, height / 2);
      line_to(width - 10, height / 2);
      stroke();
    }

    /* Draw Minus Sign */
    if (isHoveringDelete) {
      set_source_rgba(progressColor, 1);
      set_line_width(2);
      move_to(10, height / 2);
      line_to(width - 10, height / 2);
      stroke();
    }

    // draw points
    // points.forEach(function (p, i) {
    //   var centerRadius = (p.velocity / 127) * 1;
    //   var isFirst = i === 0;
    //   var vertexColor = strokeColor;

    //   set_source_rgba(vertexColor, 1);
    //   circle(p.pos, 1);
    //   fill();
    // });
  }
}

function clearPoints() {
  currentStateDict.set("savedShape" + stateIndex, []);
  getPointsFromDict();
  mgraphics.redraw();
  // var savedState = currentStateDict.get("savedShape" + stateIndex);
  // updatePoints();
}

// --------------------------------------------------
// ----------------- HANDLERS -----------------------
// --------------------------------------------------

function onidle(x, y, but, cmd, shift) {
  // bang();
  isHovered = true;
  isShiftPressed = shift;
  bang();
}

function onidleout(x, y, but, cmd, shift) {
  bang();
  isHovered = false;
  isShiftPressed = false;
  bang();
}

function onclick(x, y, but, mod1, shift, caps, opt, mod2) {
  if (!hasPoints() && !shift) {
    outlet(1, "bang");
    getPointsFromDict();
    return;
  }

  if (shift) {
    clearPoints();
    getPointsFromDict();
    return;
  }

  var storedPoints = currentStateDict.get("savedShape" + stateIndex) || [];
  outlet(0, storedPoints);
  // outlet(0, "bang");
}

function ondblclick(x, y, but, cmd, shift, capslock, option, ctrl) {}

// ----------- public functions ----------------

// function setPoints(v) {
//   // var storedPoints = pts || [];
//   var storedPoints = v.toString().split(" ");
//   var newPoints = [];
//   for (var i = 0; i < storedPoints.length; i += 3) {
//     var pos = [
//       (parseFloat(storedPoints[i]) / 170) * width,
//       (parseFloat(storedPoints[i + 1]) / 170) * height,
//     ];
//     var velocity = parseInt(storedPoints[i + 2]);
//     newPoints.push({ pos: pos, velocity: velocity });
//   }

//   // currentStateDict.set("savedShape" + stateIndex, newPoints);
//   updatePoints(newPoints);
//   bang();
// }

function setColor(c) {
  // if (hasPoints()) {
  //   return;
  // }
  var cArray = c.toString().split(" ");
  cArray.length = 3;
  BG_COLOR = cArray.map(function (c) {
    return c * 0.6;
  });
  // BG_COLOR_2 = cArray.map(function (c) {
  //   return c * 1.2;
  // });
  strokeColor = cArray.map(function (c) {
    return c * 2.8;
  });
  progressColor = cArray.map(function (c) {
    return c * 4.3;
  });
  bang();
}
