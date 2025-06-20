export interface LocationData {
  section: string;
  label: string;
  easting: number;
  northing: number;
  latitude?: number;  // Optional, as it will be calculated
  longitude?: number; // Optional, as it will be calculated
}

export const locations: Omit<LocationData, 'latitude' | 'longitude'>[] = [
//   { section: 'Mens', label: 'Main Marquee 1', easting: 476141.49, northing: 137480.49 },
//   { section: 'Mens', label: 'Main Marquee 2', easting: 476118.76, northing: 137435.32 },
//   { section: 'Mens', label: 'Main Marquee 3', easting: 476266.19, northing: 137416.87 },
//   { section: 'Mens', label: 'Main Marquee 4', easting: 476243.42, northing: 137382.36 },
  { section: 'Mens', label: 'Main Marquee entrance 1', easting: 476143.15, northing: 137423.20 },
  { section: 'Mens', label: 'Main Marquee entrance 2', easting: 476173.89, northing: 137407.56 },
  { section: 'Mens', label: 'Main Marquee entrance 3', easting: 476205.50, northing: 137391.37 },
  { section: 'Mens', label: 'Main Marquee entrance 4', easting: 476231.80, northing: 137378.03 },
//   { section: 'Mens', label: 'Dining 1', easting: 476015.26, northing: 137442.31 },
//   { section: 'Mens', label: 'Dining 2', easting: 476038.32, northing: 137451.66 },
//   { section: 'Mens', label: 'Dining 3', easting: 476031.22, northing: 137331.45 },
//   { section: 'Mens', label: 'Dining 4', easting: 476083.44, northing: 137340.47 },
  { section: 'Mens', label: 'Dining entrance 1', easting: 476040.61, northing: 137446.02 },
  { section: 'Mens', label: 'Dining entrance 2', easting: 476044.81, northing: 137435.68 },
  { section: 'Mens', label: 'Dining entrance 3', easting: 476056.41, northing: 137407.07 },
  { section: 'Mens', label: 'Dining entrance 4', easting: 476061.90, northing: 137393.54 },
  { section: 'Mens', label: 'Dining entrance 5', easting: 476067.94, northing: 137378.67 },
  { section: 'Mens', label: 'Dining entrance 6', easting: 476073.54, northing: 137364.86 },
  { section: 'Mens', label: 'Dining entrance 7', easting: 476081.39, northing: 137345.52 },
  { section: 'Mens', label: 'Dining entrance 8', easting: 476085.79, northing: 137334.81 },
  { section: 'Mens', label: 'Dining entrance 9', easting: 476091.17, northing: 137321.55 },
  { section: 'Mens', label: 'Dining entrance 10', easting: 476096.50, northing: 137307.84 },
//   { section: 'Mens', label: 'Accom 1', easting: 475972.78, northing: 137398.11 },
//   { section: 'Mens', label: 'Accom 2', easting: 475917.67, northing: 137374.40 },
//   { section: 'Mens', label: 'Accom 3', easting: 475949.56, northing: 137293.54 },
//   { section: 'Mens', label: 'Accom 4', easting: 476008.30, northing: 137315.55 },
  { section: 'Mens', label: 'Accom entrance', easting: 475994.03, northing: 137370.27 },
  { section: 'Mens', label: 'Bazaar', easting: 475964.57, northing: 137455.61 },
//   { section: 'Lajna', label: 'Main Marquee 1', easting: 476173.00, northing: 137509.28 },
//   { section: 'Lajna', label: 'Main Marquee 2', easting: 476195.74, northing: 137553.81 },
//   { section: 'Lajna', label: 'Main Marquee 3', easting: 476279.95, northing: 137454.76 },
//   { section: 'Lajna', label: 'Main Marquee 4', easting: 476302.61, northing: 137499.22 },
  { section: 'Lajna', label: 'Main Marquee entrance 1', easting: 476217.60, northing: 137542.65 },
  { section: 'Lajna', label: 'Main Marquee entrance 2', easting: 476244.04, northing: 137529.10 },
  { section: 'Lajna', label: 'Main Marquee entrance 3', easting: 476271.44, northing: 137515.14 },
  { section: 'Lajna', label: 'Main Marquee entrance 4', easting: 476289.25, northing: 137506.04 },
//   { section: 'Lajna', label: 'Dining 1', easting: 476351.42, northing: 137670.25 },
//   { section: 'Lajna', label: 'Dining 2', easting: 476372.99, northing: 137682.89 },
//   { section: 'Lajna', label: 'Dining 3', easting: 476410.04, northing: 137570.15 },
//   { section: 'Lajna', label: 'Dining 4', easting: 476431.61, northing: 137582.79 },
  { section: 'Lajna', label: 'Dining entrance 1', easting: 476357.81, northing: 137659.38 },
  { section: 'Lajna', label: 'Dining entrance 2', easting: 476363.47, northing: 137650.02 },
  { section: 'Lajna', label: 'Dining entrance 3', easting: 476379.56, northing: 137622.43 },
  { section: 'Lajna', label: 'Dining entrance 4', easting: 476397.06, northing: 137591.69 },
  { section: 'Lajna', label: 'Dining entrance 5', easting: 476389.50, northing: 137558.06 },
  { section: 'Lajna', label: 'Dining entrance 6', easting: 476394.97, northing: 137541.14 },
//   { section: 'Lajna', label: 'Accom 1', easting: 476268.06, northing: 137686.19 },
//   { section: 'Lajna', label: 'Accom 2', easting: 476359.42, northing: 137738.47 },
//   { section: 'Lajna', label: 'Accom 3', easting: 476382.16, northing: 137699.63 },
//   { section: 'Lajna', label: 'Accom 4', easting: 476301.70, northing: 137630.58 },
  { section: 'Lajna', label: 'Accom entrance', easting: 476291.71, northing: 137701.39 },
//   { section: 'Lajna', label: 'Bazaar 1', easting: 476388.81, northing: 137511.84 },
//   { section: 'Lajna', label: 'Bazaar 2', easting: 476452.81, northing: 137549.51 },
//   { section: 'Lajna', label: 'Bazaar 3', easting: 476483.99, northing: 137495.93 },
//   { section: 'Lajna', label: 'Bazaar 4', easting: 476419.01, northing: 137460.00 },
  { section: 'Lajna', label: 'Bazaar entrance', easting: 476396.56, northing: 137518.88 },
]; 