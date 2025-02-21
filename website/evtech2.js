var map = L.map("map", { zoomDelta : 0.05, zoomSnap: 0 }).setView([52.515509, 13.335667], 15);
osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);
var y = map.getSize().y,
  x = map.getSize().x;
var maxMeters = map
  .containerPointToLatLng([0, y])
  .distanceTo(map.containerPointToLatLng([x, y]));
var request = new XMLHttpRequest();
request.open("GET", "./results.json", false);
request.send(null);
var chargerInfo = JSON.parse(request.responseText);

//console.log(chargerInfo)

var evseico = L.icon({
  iconUrl: "evse.png",
  iconSize: [36, 36],
});

var markers = L.markerClusterGroup();

for (let i = 0; i < chargerInfo.length; i++) {
  var marker = L.marker([chargerInfo[i].lat, chargerInfo[i].lng], { icon: evseico });
  txt = `
          <div class= 'title'>Charger ${i}</div><br>
          <table>
          <tr><td><div class='item'>Connections:</div></td></tr>`;

  if (chargerInfo[i].anzahl_ladepunkte >= 1) {
    txt += `<tr><td class = 'lstelem'>${chargerInfo[i].anschluss_1} @ ${chargerInfo[i].ladeleistung_1} kW</td>`;
  }
  if (chargerInfo[i].anzahl_ladepunkte >= 2) {
    txt += `<td class = 'lstelem'>${chargerInfo[i].anschluss_2} @ ${chargerInfo[i].ladeleistung_2} kW</td>`;
  }
  if (chargerInfo[i].anzahl_ladepunkte >= 3) {
    txt += `<td class = 'lstelem'>${chargerInfo[i].anschluss_3} @ ${chargerInfo[i].ladeleistung_3} kW</td>`;
  }
  if (chargerInfo[i].anzahl_ladepunkte >= 4) {
    txt += `<td class = 'lstelem'>${chargerInfo[i].anschluss_4} @ ${chargerInfo[i].ladeleistung_4} kW</td>`;
  }
  txt += "</tr></table>";
  txt += `<br><div class='item'>Address:</div>${chargerInfo[i].adresse}, ${chargerInfo[i].plz}`;
  txt += `<br><div class='item'>Land Use Classification:</div>${chargerInfo[i].class}: ${chargerInfo[i].class_desc}`;
  txt += `<br><div class='item'>Nearby Population:</div>${chargerInfo[i].pop_near}`;
  txt += `<br><div class='item'>Nearby Parking:</div>${chargerInfo[i].park_near}`;
  txt += `<br><div class='item'>Nearby Chargers:</div>${chargerInfo[i].charger_near}`;
  txt += `<br><div class='item'>Nearby Traffic:</div>${chargerInfo[i].traffic_near}/year`;
  txt += `<br><div class='item'>EV Adoption:</div>${chargerInfo[i].anteilelektrogesamt}%`;
  txt += `<br><div class='item'>Per capita consumption in this district:</div>${chargerInfo[i].avg_consumption} kWh`;

  marker.bindPopup(txt);
  markers.addLayer(marker);
}
map.addLayer(markers);

ulearningOverlay = L.imageOverlay("./overlay.png", [
  [52.34222, 13.10023],
  [52.67472, 13.74734],
]);

var request = new XMLHttpRequest();
request.open("GET", "./locs.json", false);
request.send(null);
var jayanath = JSON.parse(request.responseText);

let chargerList = [];
for (let i = 0; i < jayanath.length; i++) {
  chargerList.push([
    jayanath[i].lat,
    jayanath[i].lng,
    Math.min(0.2 * jayanath[i].e_score, 0.6),
  ]);
}

let jayanathHeatmap = L.heatLayer(chargerList, {
  radius: 50,
  minOpacity: 0,
  maxZoom: 50,
});

var request = new XMLHttpRequest();
request.open("GET", "./ulearnlocs.json", false);
request.send(null);
var AHPresults = JSON.parse(request.responseText);

chargerList = [];
for (let i = 0; i < AHPresults.length; i++) {
  chargerList.push([
    AHPresults[i].lat,
    AHPresults[i].lng,
    AHPresults[i].score,
  ]);
}
AHPHeatmap = L.heatLayer(chargerList, {
  radius: 50,
  minOpacity: 0,
  maxZoom: 50,
})


var baseMaps = {
  OpenStreetMap: osm,
};


var legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {

  var div = L.DomUtil.create('div', 'info legend');
  labels = ['<div class="legend-container"><strong>Clusters</strong>'],

    div.innerHTML += 
    labels.push('<div class="legend"><i class="circle" style="background:  #C72C48"></i> Cluster 0</div>');
    labels.push('<div class="legend"><i class="circle" style="background:  #7b68ee"></i> Cluster 1</div>');
    labels.push('<div class="legend"><i class="circle" style="background:  #319177"></i> Cluster 2</div>');
    labels.push('<div class="legend"><i class="circle" style="background:  #cc7722"></i> Cluster 3</div>');
    labels.push('<div class="legend"><i class="circle" style="background:  #89CFF0"></i> Cluster 4</div>');
    labels.push('<div class="legend"><i class="circle" style="background:  #98777b"></i> Cluster 5</div>');
    labels.push('<div class="legend"><i class="circle" style="background:  #f0dc82"></i> Cluster 6</div></div>');

    div.innerHTML = labels.join('<br>');
  return div;
};


var overlayMaps = {
  "Charging Stations": markers,
  "Supervised, Jayanth et al.": jayanathHeatmap,
  "Unsupervised Learning": ulearningOverlay,
  "Unsupervised Learning + AHP": AHPHeatmap,
};
var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

ulearningOverlay.on('add',(e)=>{
  legend.addTo(map);
});
ulearningOverlay.on('remove',(e)=>{
  map.removeControl(legend)
});

map.on("zoomend", function () {
  console.log(map.getZoom());
  if (typeof jayanathHeatmap !== "undefined") {
    // calculate the distance the one side of the map to the other using the haversine formula
    var currMeters = map
      .containerPointToLatLng([0, y])
      .distanceTo(map.containerPointToLatLng([x, y]));
    // calculate how many meters each pixel represents
    var ratio = Math.max(maxMeters / currMeters, 0.25);
    jayanathHeatmap.setOptions({ radius: 50 * ratio });
    AHPHeatmap.setOptions({ radius: 50 * ratio });
  }
});
