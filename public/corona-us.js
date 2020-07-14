/* global topojson: false */
import {panZoomSetup} from './pan-zoom.js';

const SVG_HEIGHT = 610;
const SVG_WIDTH = 975;

// Create a function to format numbers with commas.
const format = d3.format(',');

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
panZoomSetup('map', SVG_WIDTH, SVG_HEIGHT);

const tooltip = d3.select('.tooltip');
const tooltipHospitalized = tooltip.select('.hospitalized');
const tooltipState = tooltip.select('.state');
const tooltipPositive = tooltip.select('.positive');
const tooltipVentilator = tooltip.select('.ventilator');

const pathGenerator = d3.geoPath();

const covidMap = {};
const idToNameMap = {};

function getColor(stateId) {
  const stateName = idToNameMap[stateId];
  const count = covidMap[stateName].positive;
  return count > 40000
    ? 'purple'
    : count > 30000
    ? 'red'
    : count > 20000
    ? 'orange'
    : count > 10000
    ? 'yellow'
    : 'green';
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
  tooltipState.text(stateName);
  const covidData = covidMap[stateName];
  console.log('corona-us.js pathMoved: covidData =', covidData);
  const positive = covidData ? covidData.positive : 'unknown';
  tooltipPositive.text(format(positive));
  tooltipHospitalized.text(covidData.hospitalizedCurrently);
  tooltipVentilator.text(covidData.onVentilatorCurrently || '0');

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

  // Load current Covid data for each U.S. state.
  const covidData = await d3.json(
    'https://covidtracking.com/api/v1/states/current.json'
  );
  console.log('corona-us.js x: covidData =', covidData);

  // Populate map from state names to state-specific Covid data.
  let max = 0;
  for (const stateData of covidData) {
    const stateAbbreviation = stateData.state;
    const stateName = stateIdMap[stateAbbreviation];
    covidMap[stateName] = stateData;
    if (stateData.positive > max) max = stateData.positive;
  }
  console.log('corona-us.js load: max positives =', max);

  // Load the TopoJSON data for U.S. states.
  const statesTopo = await d3.json('./states-albers-10m.json');

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