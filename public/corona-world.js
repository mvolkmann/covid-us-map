/* global topojson: false */

const HEIGHT = 500;
const WIDTH = 960;
const svg = d3.select('svg').attr('height', HEIGHT).attr('width', WIDTH);

svg.call(
  d3.zoom().on('zoom', () => {
    svg.attr('transform', d3.event.transform);
  })
);
/*
const zoomHandler = d3.zoom().on('zoom', () => {
  svg.attr('transform', d3.event.transform);
});
zoomHandler(svg);
*/
//panZoomSetup('map', svg.attr('width'), svg.attr('height'));

//const projection = d3.geoMercator(); // good for U.S.
//const projection = d3.geoOrthographic();
const projection = d3.geoNaturalEarth1(); // good for countries!
const pathGenerator = d3.geoPath().projection(projection);

svg
  .append('path')
  .attr('class', 'sphere')
  .attr('d', pathGenerator({type: 'Sphere'}));

async function doIt() {
  const data = await d3.json('./countries-50m.json');

  // Convert TopoJSON data to GeoJSON data.
  const countries = topojson.feature(data, data.objects.countries);

  const idToNameMap = {};
  for (const feature of countries.features) {
    idToNameMap[feature.id] = feature.properties.name;
  }

  // Convert GeoJSON to SVG.
  const paths = svg
    .selectAll('path')
    .data(countries.features)
    .enter()
    .append('path')
    .attr('class', 'country')
    .attr('d', pathGenerator)
    .append('title')
    .text(d => idToNameMap[d.id]);
}

doIt();
