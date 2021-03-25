outlets = 2;

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

var width = 0;
var height = 0;

var BG_COLOR = [0.12, 0.1, 0.1];
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

function circle(p, r) {
  mgraphics.ellipse(p[0] - r, p[1] - r, r * 2, r * 2);
}

function updatePoints(pts) {
  points = pts;
  edges = getEdges();
}

function bang() {
  mgraphics.redraw();
}

function setup() {
  width = box.rect[2] - box.rect[0];
  height = box.rect[3] - box.rect[1];
  edges = getEdges();
  mgraphics.redraw();
}

function paint() {
  edges = getEdges();

  with (mgraphics) {
    if (!edges) return;

    // draw edges
    edges.forEach(function (edge, i) {
      var p1 = edge[0];
      var p2 = edge[1];
      set_source_rgba(strokeColor, isHovered ? 1 : 0.6);
      set_line_width(isHovered ? 2 : 1);
      move_to(p1[0], p1[1]);
      line_to(p2[0], p2[1]);
      stroke();
    });

    if (isShiftPressed) {
      set_source_rgba(progressColor, 1);

      set_line_width(3);
      move_to(width / 2, 5);
      line_to(width / 2, height - 5);
      stroke();

      move_to(5, height / 2);
      line_to(width - 5, height / 2);
      stroke();
    }
    // draw points
    // points.forEach(function (p, i) {
    //   var centerRadius = (p.velocity / 127) * 1;
    //   var isFirst = i === 0;
    //   var vertexColor = strokeColor;

    //   set_source_rgba(vertexColor, 0.5);
    //   circle(p.pos, centerRadius);
    //   fill();
    // });

    // frameCount++;
  }
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

function onclick(x, y, but, cmd, shift, capslock, option, ctrl) {
  if (shift) {
    outlet(1, "bang");
  } else {
    outlet(0, "bang");
  }
}

// ----------- public functions ----------------

function setPoints(v) {
  var storedPoints = v.toString().split(" ");
  var newPoints = [];
  for (var i = 0; i < storedPoints.length; i += 3) {
    var pos = [
      (parseFloat(storedPoints[i]) / 170) * width,
      (parseFloat(storedPoints[i + 1]) / 170) * height,
    ];
    var velocity = parseInt(storedPoints[i + 2]);
    newPoints.push({ pos: pos, velocity: velocity });
  }
  updatePoints(newPoints);
  bang();
}

function setColor(c) {
  var cArray = c.toString().split(" ");
  cArray.length = 3;
  BG_COLOR = cArray.map(function (c) {
    return c * 0.8;
  });
  strokeColor = cArray.map(function (c) {
    return c * 2.8;
  });
  progressColor = cArray.map(function (c) {
    return c * 4.3;
  });
  bang();
}
