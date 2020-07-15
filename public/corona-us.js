/* global topojson: false */
import {panZoomSetup} from './pan-zoom.js';

const DELTA = 100000;
const SVG_HEIGHT = 610;
const SVG_WIDTH = 975;

// Create a function to format numbers with commas.
const format = d3.format(',');

const colors = ['green', 'yellow', 'orange', 'red', 'purple'];

const svg = d3
  .select('svg')
  .attr('height', SVG_HEIGHT)
  .attr('width', SVG_WIDTH)
  .attr('viewBox', `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`);

/* Panning and zooming from d3.zoom doesn't work as well as my implementation.
svg.call(
  d3.zoom().on('zoom', () => {
    svg.attr('transform', d3.event.transform);
  })
);
*/

// Disabled pan and zoom for now.
//panZoomSetup('map', SVG_WIDTH, SVG_HEIGHT);

const legend = d3.select('#legend');
colors.forEach((color, index) => {
  const div = legend.append('div').attr('class', 'row');
  div.append('div').attr('class', 'swatch').style('background-color', color);
  div
    .append('div')
    .attr('class', 'count')
    .text('less than ' + format((index + 1) * DELTA));
});

const tooltip = d3.select('.tooltip');
const tooltipHospitalized = tooltip.select('.hospitalized');
const tooltipIncrease = tooltip.select('.increase');
const tooltipState = tooltip.select('.state');
const tooltipPositive = tooltip.select('.positive');

const pathGenerator = d3.geoPath();

const covidMap = {};
const idToNameMap = {};

let currentStateName;

function getColor(stateId) {
  const stateName = idToNameMap[stateId];
  const count = covidMap[stateName].positive;
  const colorIndex = Math.floor(count / DELTA);
  if (colorIndex === 0) {
    const opacity = Math.floor((256 * count) / DELTA);
    const opacityHex = opacity.toString(16);
    // Return green with some opacity.
    return '#008000' + opacityHex;
  }
  return colors[colorIndex];
}

function hideTooltip() {
  tooltip.style('opacity', 0);
}

// This handles when the mouse cursor
// enters an SVG path that represent a country.
function pathEntered() {
  // Move this path element to the end of its SVG group so it
  // renders on top which allows it's entire stroke is visible.
  this.parentNode.appendChild(this);
}

// This handles when the mouse cursor
// moves over an SVG path that represent a country.
function pathMoved(d) {
  // Populate the tooltip.
  const stateName = d.properties.name;
  if (stateName !== currentStateName) {
    tooltipState.text(stateName);
    const covidData = covidMap[stateName];
    const positive = covidData ? covidData.positive : 'unknown';
    tooltipPositive.text(format(positive));
    tooltipHospitalized.text(format(covidData.hospitalizedCurrently));
    tooltipIncrease.text(format(covidData.positiveIncrease));
    currentStateName = stateName;
  }

  // Position the tooltip.
  tooltip
    .style('left', d3.event.pageX + 'px')
    .style('top', d3.event.pageY + 'px');

  // Show the tooltip.
  tooltip.style('opacity', 0.7);
}

export async function createMap() {
  // Load map from state abbreviations to state names.
  const stateIdMap = await d3.json('./us-states.json');

  // Load current COVID data for each U.S. state.
  const covidData = await d3.json(
    'https://covidtracking.com/api/v1/states/current.json'
  );
  //console.log('corona-us.js x: covidData =', covidData);

  // Populate map from state names to state-specific COVID data.
  let max = 0;
  for (const stateData of covidData) {
    const stateAbbreviation = stateData.state;
    const stateName = stateIdMap[stateAbbreviation];
    covidMap[stateName] = stateData;
    if (stateData.positive > max) max = stateData.positive;
  }
  //console.log('corona-us.js load: max positives =', max);

  // Load the TopoJSON data for U.S. states.
  const statesTopo = await d3.json('./topojson/states-albers-10m.json');

  // Convert TopoJSON data to GeoJSON data.
  const us = topojson.feature(statesTopo, statesTopo.objects.states);

  // Populate map of state ids to state names.
  for (const feature of us.features) {
    idToNameMap[feature.id] = feature.properties.name;
  }

  // Convert GeoJSON to SVG.
  const paths = svg
    .selectAll('path')
    .data(us.features)
    .enter()
    .append('path')
    .attr('class', 'state')
    .attr('d', pathGenerator)
    .style('fill', d => getColor(d.id))
    .on('mouseenter', pathEntered)
    .on('mousemove', pathMoved)
    .on('mouseout', hideTooltip);
}
