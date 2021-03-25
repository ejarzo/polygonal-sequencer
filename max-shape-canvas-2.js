var mouseX = 0;
var mouseY = 0;

outlets = 5;

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

var width = 0;
var height = 0;

setoutletassist(0, "Edge Durations");
setoutletassist(1, "Note Values");
setoutletassist(2, "Note Velocities");
setoutletassist(3, "Perimeter Length");
setoutletassist(4, "Note indexes");

var hoveredVertex = -1;
var hoveredMidpoint = -1;
var draggingVertex = -1;
var currentNoteIndex = 0;
var currentEdgeProgress = 0;
var mousePos = [-2, -2];
var fixedPerimeterLength = 350;
var frameCount = 0;

var isGridEnabled = false;
var gridSize;
var isPlaying = false;

var NOTE_MODES = { SINGLE: "SINGLE", MULTI: "MULTI" };
var activeMode = NOTE_MODES.SINGLE;

var lastX = 0;
var lastY = 0;
var isShiftPressed = false;
var isCmdPressed = false;
var isDragging = false;

var DEFAULT_VELOCITY = 127;

var DEFAULT_POINTS = [
  { pos: [20, 20], velocity: DEFAULT_VELOCITY },
  { pos: [150, 150], velocity: DEFAULT_VELOCITY },
];
var points = [];
var velocities = [];
var edges = [];

var currEdgeEndIndex = 1;

var DEFAULT_VERTEX_RADIUS = 8;
var DEFAULT_EDGE_WIDTH = 2;
var BG_COLOR = [0.12, 0.1, 0.1];

var strokeColor = [0.9, 0.5, 0.5];
var progressColor = [0.9, 0.8, 0.8];

setup();
mgraphics.redraw();

// -----------------------------------------------
// -------------------- UTILS --------------------
// -----------------------------------------------

function map(n, start1, stop1, start2, stop2, withinBounds) {
  return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
}

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

function clampToScreen(val) {
  return Math.min(Math.max(val, 10), width - 10);
}

function dist(p1, p2) {
  var a = p1[0] - p2[0];
  var b = p1[1] - p2[1];
  return Math.sqrt(a * a + b * b);
}

function getPerimeterLength(points) {
  if (!points || points.length === 0) return 0;
  var len = 0;
  var n = points.length;
  for (var i = 1; i < points.length; i += 1) {
    var p = points[i];
    var prevP = points[i - 1];
    len += dist(p.pos, prevP.pos);
  }
  // last edge
  len += dist(points[0].pos, points[n - 1].pos);
  return len;
}

function pointAlongEdge(edge, percent) {
  if (!edge) {
    post("pointAlongEdge called for empty edge");
    return;
  }
  var p1 = edge[0];
  var p2 = edge[1];
  return [p1[0] + (p2[0] - p1[0]) * percent, p1[1] + (p2[1] - p1[1]) * percent];
}

function getAveragePoint(points) {
  if (!points || points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];

  var totalX = 0;
  var totalY = 0;

  for (var i = 0; i < points.length; i += 2) {
    var p = points[i].pos;
    totalX += p[0];
    totalY += p[1];
  }

  return [totalX / (points.length / 2), totalY / (points.length / 2)];
}

function getPointsForFixedPerimeterLength(points, length) {
  var currLen = getPerimeterLength(points);
  var avgPoint = getAveragePoint(points);
  var centerPoint = [width / 2, height / 2];
  var ratio = length / currLen;
  var newPoints = points.slice();

  points.forEach(function (p, i) {
    var pos = p.pos;
    var x = pos[0] * ratio + (1 - ratio) * centerPoint[0];
    var y = pos[1] * ratio + (1 - ratio) * centerPoint[1];
    var newP = { pos: [x, y], velocity: p.velocity };
    newPoints[i] = newP;
  });

  return newPoints;
}

function getMidPoint(p1, p2) {
  return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
}

function isBetween(val, a, b) {
  return val >= a && val <= b;
}

// TODO rewrite this?
function angleBetween(p1, p2, p3) {
  var atanA = Math.atan2(p1[0] - p2[0], p1[1] - p2[1]);
  var atanC = Math.atan2(p3[0] - p2[0], p3[1] - p2[1]);
  var diff = atanA - atanC;
  diff = (diff * 180) / Math.PI;
  return diff;
}

// TODO rewrite this?
function thetaToScaleDegree(theta, nNotesInScale) {
  if (theta < 0) {
    theta = theta + 360;
  }

  if (theta > 180) {
    theta = theta - 360;
  }

  // right turn or left turn
  var negMult = theta < 0 ? 1 : -1;
  var absTheta = Math.abs(theta);

  // find sector
  var notesInScale = nNotesInScale;
  var dTheta = 180 / notesInScale;
  var lowerBound = 0;
  var upperBound = dTheta;

  var degreeDiff = 0;
  for (var i = notesInScale; i > 0; i--) {
    if (isBetween(absTheta, lowerBound, upperBound)) {
      degreeDiff = i * negMult;
      break;
    }
    lowerBound = upperBound;
    upperBound += dTheta;
  }
  return degreeDiff;
}

// ----------------------------------------------------------------
// ----------------------- DRAWING UTILS --------------------------
// ----------------------------------------------------------------

function circle(p, r) {
  mgraphics.ellipse(p[0] - r, p[1] - r, r * 2, r * 2);
}

function drawMidpoint(p, r, shouldFill) {
  mgraphics.set_line_width(2);
  mgraphics.set_source_rgba(strokeColor, 0.5);
  circle(p, r);
  mgraphics.stroke();
  if (shouldFill) {
    mgraphics.set_source_rgba(strokeColor, 0.5);
    circle(p, r);
    mgraphics.fill();
  }
}

// ----------------------------------------------------------------
// ----------------------------------------------------------------
// ----------------------------------------------------------------

function outputNoteInfo() {
  edges = getEdges();

  var startTimes = [];
  var dur = 0;
  var perimLength = points.length > 1 ? getPerimeterLength(points) : 0;

  var durations = edges.map(function (edge) {
    return dist(edge[0], edge[1]);
  });

  for (var i = 0; i < durations.length; i++) {
    var currentDuration = durations[i];
    startTimes.push(dur);
    dur += currentDuration;
  }

  var accumulatedDuration = 0;
  var noteStartTimesAsPercentOfTotalLength = [];

  if (durations.length > 1) {
    for (var i = 0; i < durations.length; i++) {
      var dur = durations[i];
      var start = accumulatedDuration;
      noteStartTimesAsPercentOfTotalLength.push(start / perimLength);
      accumulatedDuration += dur;
    }
  }

  var thetas = [];

  var pts = points.map(function (p) {
    return p.pos;
  });

  pts.push(points[0].pos);

  if (activeMode === NOTE_MODES.MULTI) {
    var scaleDegrees = [0];
    for (var i = 1; i < pts.length - 1; i++) {
      var p = pts[i];
      var pPrev = pts[i - 1];
      var pNext = pts[i + 1];
      var theta = angleBetween(pPrev, p, pNext);
      var scaleDegree = thetaToScaleDegree(theta, 7);
      var prevDegree = scaleDegrees[i - 1];
      scaleDegrees.push(scaleDegree + prevDegree);
      thetas.push(theta);
    }

    outlet(4, scaleDegrees);
  } else {
    outlet(
      4,
      points.map(function () {
        return 0;
      })
    );
  }

  outlet(
    0,
    noteStartTimesAsPercentOfTotalLength.length > 0
      ? noteStartTimesAsPercentOfTotalLength
      : "EMPTY"
  );

  var flattenedPoints = [];
  points.forEach(function (p) {
    flattenedPoints.push(p.pos[0], p.pos[1], p.velocity);
  });
  outlet(1, flattenedPoints.length > 0 ? flattenedPoints : "EMPTY");
  outlet(
    2,
    points.length > 0
      ? points.map(function (p) {
          return parseInt(p.velocity);
        })
      : "EMPTY"
  );

  outlet(3, perimLength);
}

function reset(v) {
  post("reset");
  hoveredVertex = -1;
  hoveredMidpoint = -1;
  updatePoints(DEFAULT_POINTS.slice());
  edges = getEdges();
  mgraphics.redraw();
  bang();
  outputNoteInfo();
}

function randomize() {
  var len = Math.floor(Math.random() * 7) + 3;
  var newPoints = [];
  for (var i = 0; i < len; i++) {
    newPoints.push({
      pos: [
        clampToScreen(Math.random() * width),
        clampToScreen(Math.random() * height),
      ],
      velocity: Math.random() * 127,
    });
  }
  updatePoints(newPoints);
  edges = getEdges();
  mgraphics.redraw();
  outputNoteInfo();
}

function updatePoints(pts) {
  // points = getPointsForFixedPerimeterLength(pts, fixedPerimeterLength);
  points = pts;
  outputNoteInfo();
}

function bang() {
  mgraphics.redraw();
}

function setup() {
  // calculate the current width and height
  width = box.rect[2] - box.rect[0];
  height = box.rect[3] - box.rect[1];
  gridSize = width / 7;
  updatePoints(DEFAULT_POINTS.slice());
  edges = getEdges();
  // force a redraw
  mgraphics.redraw();
  outlet(0, "bang");
}

function paint() {
  with (mgraphics) {
    set_source_rgba(BG_COLOR, 1);
    rectangle(0, 0, width, height);
    fill();

    // grid
    if (isGridEnabled) {
      for (var i = gridSize / 2; i < width; i += gridSize) {
        for (var j = gridSize / 2; j < height; j += gridSize) {
          set_source_rgba(strokeColor, 0.5);
          circle([i, j], 1);
          fill();
        }
      }
    }

    // draw edges
    edges.forEach(function (edge, i) {
      var p1 = edge[0];
      var p2 = edge[1];
      set_source_rgba(strokeColor, 1);
      set_line_width(DEFAULT_EDGE_WIDTH);
      move_to(p1[0], p1[1]);
      line_to(p2[0], p2[1]);
      stroke();

      if (isPlaying) {
        if (currentNoteIndex > i) {
          set_source_rgba(progressColor, 1);
          set_line_width(DEFAULT_EDGE_WIDTH * 2);
          move_to(p1[0], p1[1]);
          line_to(p2[0], p2[1]);
          stroke();
        } else if (currentNoteIndex === i) {
          set_source_rgba(progressColor, 1);
          set_line_width(DEFAULT_EDGE_WIDTH * 2);
          var progressP = pointAlongEdge(edge, currentEdgeProgress);
          move_to(p1[0], p1[1]);
          line_to(progressP[0], progressP[1]);
          stroke();
        }
      }

      var r = DEFAULT_VERTEX_RADIUS * 0.8;
      var a = 0;

      if (!isShiftPressed && !isCmdPressed) {
        var midpoint = getMidPoint(p1, p2);
        if (hoveredMidpoint > -1 && hoveredMidpoint === i) {
          r = r * 1.7;
          a = 0.6;
          var rect = text_measure("+");
          move_to(midpoint[0] - rect[0] / 2 + 10, midpoint[1] - rect[1] / 2);
          set_source_rgba(progressColor, 1);
          set_font_size(15);
          text_path("+");
          fill();
          drawMidpoint(midpoint, r, true);
        } else {
          drawMidpoint(midpoint, r, false);
        }
      }
    });

    // draw points
    points.forEach(function (p, i) {
      var centerRadius = map(p.velocity, 0, 127, 3, DEFAULT_VERTEX_RADIUS);
      var a = 1;
      var isFirst = i === 0;
      var isHovering = hoveredVertex > -1 && hoveredVertex === i;

      // Background vertex
      set_source_rgba(strokeColor, 0.4);
      circle(p.pos, DEFAULT_VERTEX_RADIUS);
      fill();

      // set_line_width(1);
      // circle(p.pos, r * 1.2);
      // stroke();

      var vertexColor = progressColor;

      if (isHovering) {
        a = 1;

        // Line around
        set_source_rgba(progressColor, 0.9);
        set_line_width(1);
        circle(p.pos, DEFAULT_VERTEX_RADIUS * 1.5);
        stroke();

        if (isShiftPressed && points.length > 2) {
          var rect = text_measure("-");
          move_to(p.pos[0] - rect[0] / 2 + 12, p.pos[1] - rect[1] / 2);
          set_source_rgba(progressColor, 1);
          set_font_size(15);
          text_path("-");
          fill();
        }
        if (isCmdPressed && !isDragging) {
          centerRadius = centerRadius + 1 * Math.sin(frameCount / 3);
        }
      }
      // set_source_rgba(vertexColor, a);
      // circle(p.pos, DEFAULT_VERTEX_RADIUS);
      // fill();
      set_source_rgba(vertexColor, a);
      circle(p.pos, centerRadius);
      fill();
    });

    if (isPlaying && currentNoteIndex > -1 && edges.length > 0) {
      var progressP = pointAlongEdge(
        edges[currentNoteIndex],
        currentEdgeProgress
      );
      set_source_rgba(progressColor, 1);
      circle(
        [progressP[0], progressP[1]],
        (DEFAULT_VERTEX_RADIUS * 2) / (currentEdgeProgress + 1)
      );
      fill();
    }

    // if (hoveredVertex === -1 && hoveredMidpoint === -1) {
    //   mgraphics.set_source_rgba(strokeColor, 0.5);
    //   mgraphics.ellipse(
    //     mouseX - DEFAULT_VERTEX_RADIUS,
    //     mouseY - DEFAULT_VERTEX_RADIUS,
    //     DEFAULT_VERTEX_RADIUS * 2,
    //     DEFAULT_VERTEX_RADIUS * 2
    //   );
    //   mgraphics.fill();
    // }

    frameCount++;
  }
}

// --------------------------------------------------
// ----------------- HANDLERS -----------------------
// --------------------------------------------------

function snapToGrid(p) {
  if (!isGridEnabled) {
    return p;
  }

  var offset = gridSize / 2;
  return [
    Math.round((p[0] - offset) / gridSize) * gridSize + offset,
    Math.round((p[1] - offset) / gridSize) * gridSize + offset,
  ];
}

function ondrag(x, y, but, cmd, shift, capslock, option, ctrl) {
  var currP = [x, y];

  if (draggingVertex > -1) {
    var draggingPoint = points[draggingVertex];
    if (cmd) {
      isDragging = true;
      var deltaY = lastY - y;
      if (deltaY > 20) {
        deltaY = 20;
      }
      if (deltaY < -20) {
        deltaY = -20;
      }

      var newVelocity = draggingPoint.velocity + deltaY;
      if (newVelocity > 127) {
        newVelocity = 127;
      }
      if (newVelocity < 0) {
        newVelocity = 0;
      }
      points[draggingVertex].velocity = newVelocity;
      lastY = y;
    } else {
      points[draggingVertex].pos = snapToGrid(currP.map(clampToScreen));
    }
  }
  updatePoints(points);
  edges = getEdges();
}

function onidle(x, y, but, cmd, shift) {
  isDragging = false;
  mouseX = x;
  mouseY = y;

  isShiftPressed = shift;
  isCmdPressed = cmd;

  var mousePos = [mouseX, mouseY];

  hoveredMidpoint = -1;
  hoveredVertex = -1;

  for (var i = 0; i < points.length; i++) {
    var p = points[i];
    var pNext = points[i >= points.length - 1 ? 0 : i + 1];
    var midpoint = getMidPoint(p.pos, pNext.pos);
    var hoverRadius = DEFAULT_VERTEX_RADIUS;
    if (dist(mousePos, p.pos) < hoverRadius) {
      hoveredVertex = i;
    } else if (dist(mousePos, midpoint) < hoverRadius) {
      hoveredMidpoint = i;
    }
  }

  mgraphics.redraw();
}

function onclick(x, y, but, cmd, shift, capslock, option, ctrl) {
  lastX = x;
  lastY = y;

  var newP = { pos: [x, y], velocity: DEFAULT_VELOCITY };

  draggingVertex = -1;

  if (hoveredMidpoint > -1) {
    points.splice(hoveredMidpoint + 1, 0, newP);
    draggingVertex = hoveredMidpoint + 1;
    hoveredVertex = draggingVertex;
    hoveredMidpoint = -1;
  } else if (hoveredVertex > -1) {
    // hold shift to delete
    if (shift && points.length > 2) {
      points.splice(hoveredVertex, 1);
      updatePoints(points);
    } else {
      draggingVertex = hoveredVertex;
    }
  } else {
    // points.push(newP);
    // if (points.length > 1) {
    //   var quantizedPoints = getPointsForFixedPerimeterLength(
    //     points,
    //     fixedPerimeterLength
    //   );
    //   points = quantizedPoints;
    // }
  }

  edges = getEdges();

  mgraphics.redraw();
}

// ----------- public functions ----------------

function reverse() {
  var newPoints = points.slice();
  var first = newPoints.shift();
  newPoints = newPoints.reverse();
  newPoints.unshift(first);
  updatePoints(newPoints);
}

function setGrid(v) {
  isGridEnabled = !!v;
}

function setIsPlaying(v) {
  isPlaying = !!v;
}

function setPoints(v) {
  // post(typeof v);
  var storedPoints = v.toString().split(" ");
  post(storedPoints.length);
  var newPoints = [];
  for (var i = 0; i < storedPoints.length; i += 3) {
    var pos = [parseFloat(storedPoints[i]), parseFloat(storedPoints[i + 1])];
    var velocity = parseInt(storedPoints[i + 2]);
    newPoints.push({ pos: pos, velocity: velocity });
  }
  post(newPoints.length);
  updatePoints(newPoints);
  outputNoteInfo();
}

function setCurrentNote(v) {
  currentNoteIndex = v - 1;
}

function setCurrentEdgeProgress(v) {
  currentEdgeProgress = v;
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
}

function setMode(val) {
  post(val);
  activeMode = val;
  outputNoteInfo();
}
