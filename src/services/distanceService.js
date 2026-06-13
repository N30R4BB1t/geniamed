function distanceKm(originLat, originLng, targetLat, targetLng) {
  const earthRadiusKm = 6371;
  const latDelta = toRad(targetLat - originLat);
  const lngDelta = toRad(targetLng - originLng);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRad(originLat)) * Math.cos(toRad(targetLat)) *
    Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(value) {
  return value * Math.PI / 180;
}

module.exports = { distanceKm };

