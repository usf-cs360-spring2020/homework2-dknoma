/*
 * a lot of this example is hard-coded to match our tableau prototype...
 * and this is a reasonable approach for your own visualizations.
 * however, there are ways to automatically calculate these hard-coded values
 * in our javascript/d3 code.
 */

// showing use of const
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const

// if you need to change values, use let instead
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let

// set svg size and plot margins
const width = 960;
const height = 500;
const padding = 20;
const size = 230;

const columns = {
  NAME: 'name',
  COUNT: 'count',
  K_MEAN: 'k_mean',
  PAR_MEAN: 'par_mean',
  FEMALE: 'female',
  TYPE: 'type',
};

const types = [1, 2, 3];

const margin = {
  top: 30,
  bottom: 35,
  left: 45,
  right: 15
};

const x = d3.scaleLinear()
            .range([padding / 2, size - padding / 2]);

const y = d3.scaleLinear()
            .range([size - padding / 2, padding / 2]);

const xAxis = d3.axisBottom()
                .scale(x)
                .ticks(4);

const yAxis = d3.axisLeft()
                .scale(y)
                .ticks(4);

const color = d3.scaleOrdinal()
                .domain(types)
                .range(d3.schemeCategory10);

// select svg
const svg = d3.select('#scatter-plot');
console.assert(svg.size() === 1);

// add plot region
const plot = svg.append('g')
                .attr('id', 'plot');

// this is just so we can see the transform of the plot
// comment out for final version
// plot.append('rect').attr('width', 10).attr('height', 10);

// transform region by margin
// plot.attr('transform', translate(margin.left, margin.top));

/*
 * setup scales with ranges and the domains we set from tableau
 * defined globally for access within other functions
 */

const scales = {
  x: d3.scaleBand(),
  y: d3.scaleLinear(),
};

// we are going to hardcode the domains, so we can setup our scales now
// that is one benefit of prototyping!
// scales.x.range([0, width - margin.left - margin.right])
//         .domain(validMonths)
//         .paddingInner(0.05);
//
// scales.y.range([height - margin.top - margin.bottom, 0])
//         .domain([0, maxHeight]);

// load data and trigger draw
d3.csv('mrc_table2_filtered.csv', convert)
  .then(draw);
// d3.csv('mrc_table2_filtered.csv', function(error, data) {
//
// });

// since we do not need the data for our domains, we can draw our axis/legends right away
// drawAxis();
// drawTitles();
// drawColorLegend();

/*
 * converts values as necessary
 */
function convert(row) {
  let convert = {};

  let name = row[columns.NAME];
  let count = row[columns.COUNT];
  let kMean = row[columns.K_MEAN];
  let pMean = row[columns.PAR_MEAN];
  let female = row[columns.FEMALE];
  let type = row[columns.TYPE];

  convert[columns.NAME] = name;
  convert[columns.TYPE] = parseInt(type);
  convert[columns.COUNT] = parseInt(count);
  convert[columns.K_MEAN] = parseFloat(kMean);
  convert[columns.PAR_MEAN] = parseFloat(pMean);
  convert[columns.FEMALE] = parseFloat(female);

  return convert;
}

function draw(data) {
  console.log("data");
  console.log(data);
  console.log('loaded:', data.length, data[0]);

  drawCells(data);
  drawLabels(data);
}

/*
 * draw bars
 */
function drawCells(data) {
  let measures = d3.keys(data[0])
                   .filter(d => d !== columns.NAME && d !== columns.TYPE);
  let cellN = measures.length;
  let domainByMeasures = {};

  measures.forEach(m => {
    console.log("m");
    console.log(m);
    domainByMeasures[m] = d3.extent(data, d => d[m])
  });

  xAxis.tickSize(size * cellN);
  yAxis.tickSize(-size * cellN);

  console.log(domainByMeasures);
  console.log(cellN);
  console.log(size * cellN + padding);


// set svg size
  svg.attr('width', size * cellN + padding)
     .attr('height', size * cellN + padding);

  plot.attr("transform", "translate(" + padding + "," + padding / 2 + ")");

  const group = plot.append('g')
                    .attr('id', 'cells');

  group.selectAll(".x.axis")
       .data(measures)
       .enter()
       .append("g")
       .attr("class", "x axis")
       .attr("transform", (d, i) => "translate(" + (cellN - i - 1) * size + ",0)")
       .each(function(d) {
         x.domain(domainByMeasures[d]);
         d3.select(this)
           .call(xAxis);
       });

  group.selectAll(".y.axis")
       .data(measures)
       .enter()
       .append("g")
       .attr("class", "y axis")
       .attr("transform", (d, i) => "translate(0," +  i * size + ")")
       .each(function(d) {
         y.domain(domainByMeasures[d]);
         d3.select(this)
          .call(yAxis);
       });

  let cell = svg.selectAll(".cell")
                .data(cross(measures, measures))
                .enter().append("g")
                .attr("class", "cell")
                .attr("transform", d => "translate(" + (cellN - d.i - 1) * size + "," + d.j * size + ")")
                .each(doPlot);

  // Titles for the diagonal.
  cell.filter(function(d) { return d.i === d.j; }).append("text")
      .attr("x", padding)
      .attr("y", padding)
      .attr("dy", ".71em")
      .text(function(d) { return d.x; });

  function doPlot(p) {
    let cell = d3.select(this);

    x.domain(domainByMeasures[p.x]);
    y.domain(domainByMeasures[p.y]);

    cell.append("rect")
        .attr("class", "frame")
        .attr("x", padding / 2)
        .attr("y", padding / 2)
        .attr("width", size - padding)
        .attr("height", size - padding);

    cell.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", function(d) { return x(d[p.x]); })
        .attr("cy", function(d) { return y(d[p.y]); })
        .attr("r", 4)
        .style("fill", function(d) { return color(d.species); });
  }
}

function cross(a, b) {
  var c = [], n = a.length, m = b.length, i, j;
  for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
  return c;
}

//
// // https://beta.observablehq.com/@tmcw/d3-scalesequential-continuous-color-legend-example
// function drawColorLegend() {
//   const boxWidth = 20;
//   const legendWidth = 200;
//   const legendHeight = 20;
//
//   // place legend in its own group
//   const group = svg.append('g')
//                    .attr('id', 'color-legend');
//
//   // shift legend to appropriate position
//   group.attr('transform', translate(width - margin.right - legendWidth, 0));
//
//   const title = group.append('text')
//                      .attr('class', 'axis-title')
//                      .text('GEO Summary')
//                      .attr('dy', 12);
//
//   let internationalText = group.append('text')
//                                .attr('class', 'text')
//                                .text('International')
//                                .attr('dy', 32).attr('dx', -60);
//
//   let domesticText = group.append('text')
//                           .attr('class', 'text')
//                           .text('Domestic')
//                           .attr('dy', 32).attr('dx', 80);
//
//   const internationalBox = group.append('rect')
//                                 .attr('x', -100)
//                                 .attr('y', 12 + 6)
//                                 .attr('width', boxWidth)
//                                 .attr('height', legendHeight)
//                                 .attr('fill', orange);
//
//   const domesticBox = group.append('rect')
//                             .attr('x', 40)
//                             .attr('y', 12 + 6)
//                             .attr('width', boxWidth)
//                             .attr('height', legendHeight)
//                             .attr('fill', blue);
// }

/*
 * draw labels for pre-selected bubbles
 */
function drawLabels(data) {
  // place the labels in their own group
  const group = plot.append('g').attr('id', 'labels');

  // create data join and enter selection
  const labels = group.selectAll('text')
    .data(data)
    .enter()
    .filter(d => d.label) // only keep values that we want to label
    .append('text');

  labels.text(d => d.name);

  labels.attr('x', d => scales.x(d.income));
  labels.attr('y', d => scales.y(d.mobility));

  labels.attr('text-anchor', 'middle');
  labels.attr('dy', d => -(scales.r(d.count) + 4));

  // maybe we also want to make it more clear which circle is associated
  // with the label above it---we will work with update selection here!
  // plot.select('#bar')
  //   .selectAll('rect')
  //   .data(data)
  //   .filter(d => d.label)
  //   .style('stroke', 'black')
  //   .style('stroke-width', 1);
}

/*
 * draw axis titles
 */
function drawTitles() {
  const xMiddle = margin.left + midpoint(scales.x.range());
  const yMiddle = margin.top + midpoint(scales.y.range());

  // test middle calculation
  // svg.append('circle').attr('cx', xMiddle).attr('cy', yMiddle).attr('r', 5);

  const xTitle = svg.append('text')
    .attr('class', 'axis-title')
    .text('2019');

  xTitle.attr('x', xMiddle);
  xTitle.attr('y', height);
  xTitle.attr('dy', -4);
  xTitle.attr('text-anchor', 'middle');

  // it is easier to rotate text if you place it in a group first
  // https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/rotate

  const yGroup = svg.append('g');

  // set the position by translating the group
  yGroup.attr('transform', translate(4, yMiddle));

  const yTitle = yGroup.append('text')
                       .attr('class', 'axis-title')
                       .text(columns.PASSENGER_COUNT);

  // keep x, y at 0, 0 for rotation around the origin
  yTitle.attr('x', 0);
  yTitle.attr('y', 0);

  yTitle.attr('dy', '1.75ex');
  yTitle.attr('text-anchor', 'middle');
  yTitle.attr('transform', 'rotate(-90)');
}

/*
 * create axis lines
 */
function drawAxis() {
  // place the xaxis and yaxis in their own groups
  const xGroup = svg.append('g')
                    .attr('id', 'x-axis')
                    .attr('class', 'axis');
  const yGroup = svg.append('g')
                    .attr('id', 'y-axis')
                    .attr('class', 'axis');

  // create axis generators
  const xAxis = d3.axisBottom(scales.x);
  const yAxis = d3.axisLeft(scales.y);

  // https://github.com/d3/d3-format#locale_formatPrefix
  xAxis.ticks(9, 's')
       .tickSizeOuter(0)
       .tickSizeInner(0);
  yAxis.ticks(5)
       .tickSizeInner(-width + margin.left + margin.right)
       .tickFormat(d => d3.format('.1s')(d))
       .tickSizeOuter(0);

  // shift x axis to correct location
  xGroup.attr('transform', translate(margin.left, height - margin.bottom));
  xGroup.call(xAxis);

  // shift y axis to correct location
  yGroup.attr('transform', translate(margin.left, margin.top))
  yGroup.call(yAxis);
}

/*
 * calculates the midpoint of a range given as a 2 element array
 */
function midpoint(range) {
  return range[0] + (range[1] - range[0]) / 2.0;
}

/*
 * returns a translate string for the transform attribute
 */
function translate(x, y) {
  return 'translate(' + String(x) + ',' + String(y) + ')';
}
