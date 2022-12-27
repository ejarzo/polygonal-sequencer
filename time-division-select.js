autowatch = 1;
// outlets = 2;

// m.init();
// m.relative_coords = 0;
// m.autofill = 0;

var labels1 = ["1", "2", "3", "4"];
var labels2 = ["5", "6", "8", "16"];

var m = mgraphics;

function bang() {
  paint();
}

function paint() {
  var val = box.getvalueof()[0]; // this is an array of size 1
  var viewsize = m.size;
  var width = viewsize[0];
  var height = viewsize[1];
  var fgColor = box.getattr("activecolor");
  var bgColor = box.getattr("bgcolor");
  const labels = box.getattr("shape") == 0 ? labels1 : labels2;

  m.set_source_rgba(1, 1, 1, 1);
  m.rectangle(0, 0, width, height);
  m.fill();

  labels.forEach(function (label, i) {
    var w = width;
    var h = height / 4;
    var x = 0;
    var y = i * h;
    var isSelected = val === i;
    m.set_source_rgba(isSelected ? fgColor : bgColor);
    m.rectangle(x, y, w, h);
    m.fill();
    m.set_font_size(9.5);
    var textRect = m.text_measure(label);
    m.move_to(x + w / 2 - textRect[0] / 2, y + h / 2 + textRect[1] / 2 - 2);
    m.set_source_rgba(isSelected ? bgColor : fgColor);
    m.text_path(label);
    m.fill();
  });
}

function onclick(x, y) {
  post("click!!!!");
}
