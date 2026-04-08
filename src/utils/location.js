const normalizePincode = (value) => String(value || "").replace(/\D/g, "");

const uniq = (list) => {
  const seen = new Set();
  return list.filter((item) => {
    const key = String(item || "").trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const parseGoogleAddress = (components = []) => {
  const get = (...types) =>
    components.find((component) => types.every((type) => component.types.includes(type)))?.long_name || "";

  const society =
    get("premise") ||
    get("subpremise") ||
    get("point_of_interest") ||
    get("establishment") ||
    get("neighborhood") ||
    get("sublocality_level_3", "sublocality", "political") ||
    get("sublocality_level_2", "sublocality", "political") ||
    "";

  const area =
    get("sublocality_level_2", "sublocality", "political") ||
    get("sublocality_level_1", "sublocality", "political") ||
    get("sublocality", "political") ||
    get("neighborhood") ||
    get("route") ||
    "";

  const city =
    get("locality", "political") ||
    get("postal_town", "political") ||
    get("administrative_area_level_2", "political") ||
    "";

  const state = get("administrative_area_level_1", "political") || "";
  const pincode = normalizePincode(get("postal_code"));

  const label = society || area || city || "Current location";
  const subtitle = uniq([society || area, area, city]).join(", ");

  return {
    label,
    subtitle,
    area: society || area,
    city,
    state,
    pincode,
  };
};

const parseNominatimAddress = (address = {}) => {
  const society =
    address.amenity ||
    address.building ||
    address.residential ||
    address.suburb ||
    address.neighbourhood ||
    address.city_district ||
    "";

  const area =
    address.suburb ||
    address.neighbourhood ||
    address.hamlet ||
    address.quarter ||
    address.city_district ||
    "";

  const city = address.city || address.town || address.village || address.county || "";
  const state = address.state || "";
  const pincode = normalizePincode(address.postcode || "");

  const label = society || area || city || "Current location";
  const subtitle = uniq([society || area, area, city]).join(", ");

  return {
    label,
    subtitle,
    area: society || area,
    city,
    state,
    pincode,
  };
};

const fetchFromGoogle = async (latitude, longitude, key) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${key}`;
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok || data.status !== "OK" || !Array.isArray(data.results) || !data.results.length) {
    throw new Error("Google geocoding failed");
  }
  return parseGoogleAddress(data.results[0]?.address_components || []);
};

const fetchFromNominatim = async (latitude, longitude) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error("Nominatim geocoding failed");
  }
  return parseNominatimAddress(data?.address || {});
};

export const reverseGeocodeLocation = async (latitude, longitude) => {
  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (googleKey) {
    try {
      return await fetchFromGoogle(latitude, longitude, googleKey);
    } catch (_error) {
      // Fallback to OSM below.
    }
  }

  return fetchFromNominatim(latitude, longitude);
};

