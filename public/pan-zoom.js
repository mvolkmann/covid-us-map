// Each pan using the arrow keys pans the SVG by this percentage.
const PAN_PERCENT = 0.05;

// Each zoom in/out does so by this percentage.
const ZOOM_PERCENT = 0.15;

// This maps key names to functions that
// should be invoked when they are pressed.
const keyToFnMap = {
  //'+': zoomIn,
  //'-': zoomOut,
  ArrowLeft: panLeft,
  ArrowRight: panRight,
  ArrowUp: panUp,
  ArrowDown: panDown
};

function addControlButtons(svg, svgWidth, svgHeight) {
  function addButton(parent, html, onClick) {
    parent
      .append('button')
      .html(html)
      .on('click', () => onClick(svg));
  }

  // This resets the SVG viewBox to its original values
  // which undoes all panning and zooming.
  function reset(svg) {
    svg.transition().attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  }

  const container = getParentSelection(svg);
  const controls = container.append('div').attr('class', 'controls');
  const panDiv = controls.append('div').attr('class', 'pan');

  let div = panDiv.append('div');
  addButton(div, '&#x25b2;', panUp);

  div = panDiv.append('div');
  addButton(div, '&#x25c0;', panLeft);
  addButton(div, '&#x21ba;', reset);
  addButton(div, '&#x25b6;', panRight);

  div = panDiv.append('div');
  addButton(div, '&#x25bc;', panDown);

  div = controls.append('div').attr('class', 'zoom');
  //addButton(div, '&#x2795;', zoomIn);
  //addButton(div, '&#x2796;', zoomOut);
}

function getParentSelection(selection) {
  return selection.select(function () {
    return this.parentNode;
  });
}

function panDown(svg) {
  const [x, y, width, height] = svg.attr('viewBox').split(' ');
  const dy = Number(height) * PAN_PERCENT;
  svg.transition().attr('viewBox', `${x} ${Number(y) + dy} ${width} ${height}`);
}

function panLeft(svg) {
  const [x, y, width, height] = svg.attr('viewBox').split(' ');
  const dx = Number(width) * PAN_PERCENT;
  svg.transition().attr('viewBox', `${Number(x) - dx} ${y} ${width} ${height}`);
}

function panRight(svg) {
  const [x, y, width, height] = svg.attr('viewBox').split(' ');
  const dx = Number(width) * PAN_PERCENT;
  svg.transition().attr('viewBox', `${Number(x) + dx} ${y} ${width} ${height}`);
}

function panUp(svg) {
  const [x, y, width, height] = svg.attr('viewBox').split(' ');
  const dy = Number(height) * PAN_PERCENT;
  svg.transition().attr('viewBox', `${x} ${Number(y) - dy} ${width} ${height}`);
}

/*
// This zooms in or out depending on whether the shift key is down.
function zoom(svg) {
  const fn = d3.event.shiftKey ? zoomOut : zoomIn;
  fn(svg);
}

// This zooms in on the SVG, maintaining the current center.
function zoomIn(svg) {
  const [x, y, width, height] = svg.attr('viewBox').split(' ');
  const factor = 1 - ZOOM_PERCENT;
  const newWidth = Number(width) * factor;
  const dx = (newWidth - width) / 2;
  const newHeight = Number(height) * factor;
  const dy = (newHeight - height) / 2;
  svg.attr('viewBox', `${x - dx} ${y - dy} ${newWidth} ${newHeight}`);
}

// This zooms out on the SVG, maintaining the current center.
function zoomOut(svg) {
  const [x, y, width, height] = svg.attr('viewBox').split(' ');
  const factor = 1 + ZOOM_PERCENT;
  const newWidth = Number(width) * factor;
  const dx = (newWidth - width) / 2;
  const newHeight = Number(height) * factor;
  const dy = (newHeight - height) / 2;
  svg.attr('viewBox', `${x - dx} ${y - dy} ${newWidth} ${newHeight}`);
}
*/

export function panZoomSetup(svgId, svgWidth, svgHeight) {
  const svg = d3.select('#' + svgId);

  let lastK = 1;

  function zooming(d) {
    // Get current view box location and size.
    const [x, y, width, height] = svg.attr('viewBox').split(' ');

    const {transform} = d3.event;
    const {k} = transform;

    let newX, newY, newWidth, newHeight;
    if (k === lastK) {
      //TODO: This doesn't pan correctly after double-clicking at maxK has been reached.
      //TODO: The values of transform.x and transform.y seem wrong then.
      // not scaling
      newX = Number(x) - transform.x;
      newY = Number(y) - transform.y;
      svg.attr('viewBox', `${newX} ${newY} ${width} ${height}`);
    } else {
      const scale = 1 + (k - 1) / 10;
      const newWidth = svgWidth / scale;
      const newHeight = svgHeight / scale;
      const newX = x - (newWidth - width) / 2;
      const newY = y - (newHeight - height) / 2;
      svg.attr('viewBox', `${newX} ${newY} ${newWidth} ${newHeight}`);

      lastK = k;
    }
  }

  const maxTimesToZoom = 7;
  const maxK = 2 ** maxTimesToZoom;
  const minK = 1 / maxK;
  const zoom = d3
    .zoom()
    .scaleExtent([minK, maxK])
    /*
    .translateExtent([
      [-svgWidth / 2, -svgHeight / 2],
      [svgWidth / 2, svgHeight / 2]
    ])
    */
    .on('zoom', zooming);

  svg.call(zoom);

  // Set up event handling for all the keyboard shortcuts in keyToFnMap.
  d3.select('body').on('keydown', () => {
    const fn = keyToFnMap[d3.event.key];
    if (fn) fn(svg);
  });

  addControlButtons(svg, svgWidth, svgHeight);
}
