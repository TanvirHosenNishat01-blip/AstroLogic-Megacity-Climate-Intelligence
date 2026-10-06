// web/world_data.js - Lightweight Offline Continents Layer
const OFFLINE_WORLD_MAP = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Global Continents" },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          // Africa
          [[[-17, 15], [-5, 36], [32, 31], [51, 12], [40, -10], [28, -34], [18, -34], [9, 5], [-17, 15]]],
          // Eurasia & South Asia
          [[[-9, 36], [30, 35], [60, 25], [68, 24], [77, 35], [88, 28], [92, 21], [80, 8], [72, 18], [90, 22], [105, 10], [120, 25], [140, 35], [145, 60], [100, 75], [30, 70], [10, 55], [-5, 45], [-9, 36]]],
          // Maritime Southeast Asia (Indonesia)
          [[[95, 6], [110, 7], [119, -5], [106, -7], [95, 6]]]
        ]
      }
    }
  ]
};