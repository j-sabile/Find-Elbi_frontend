import L from "leaflet";

export enum TYPES {
  DORMITORY = "Dormitory",
  ACADEMIC = "Academic Building",
  PARK = "Park",
  COMMUNITY = "Community Commons",
  LANDMARK = "Landmark",
  SHOP = "Shop",
  GYM = "Gymnasium",
  LIBRARY = "Library",
  ADMINOFFICE = "Administrative Office",
  CLINIC = "Clinic",
  BANK = "Bank",
  SUPPORT = "Support Facility",
  LAUNDRY = "Laundry Service",
}

export enum ROOM_TYPES {
  ACADEMIC = "Academic Room",
  FACULTY = "Faculty Room",
  ADMIN = "Administrative Room",
  LABORATORY = "Laboratory",
  LECTURE_HALL = "Lecture Hall",
  DORM = "Dorm Room",
  CR = "Comfort Room CR",
}

export enum FLOORS {
  NONE = "",
  BASEMENT = "B",
  F1 = "F1",
  F2 = "F2",
  F3 = "F3",
  F4 = "F4",
}

export enum COLLEGES {
  CAFS = "College of Agriculture and Food Sciences",
  CAS = "College of Arts and Sciences",
  CDC = "College of Development Communication",
  CEM = "College of Economics and Management",
  CEAT = "College of Engineering and Agro-Industrial Technology",
  CFNR = "College of Forestry and Natural Resources",
  CHE = "College of Human Ecology",
  CPAD = "College of Public Affairs and Development",
  CVM = "College of Veterinary Medicine",
  GS = "Graduate School",
  SESM = "School of Environmental Science and Management",
}

type Basemap = {
  id: string;
  title: string;
  meta: string;
  thumb: string;
  tileLayer: L.TileLayer;
};

export const basemaps: Basemap[] = [
  {
    id: "street",
    title: "Street Map",
    meta: "Esri World Street Map",
    thumb: "https://placehold.co/300x180/e2e8f0/64748b?text=Street",
    tileLayer: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
    }),
  },
  {
    id: "osm",
    title: "OpenStreetMap",
    meta: "OSM Standard Tiles",
    thumb: "https://placehold.co/300x180/dcfce7/166534?text=OSM",
    tileLayer: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }),
  },
  {
    id: "satellite",
    title: "Satellite",
    meta: "Esri World Imagery",
    thumb: "https://placehold.co/300x180/1e293b/e2e8f0?text=Satellite",
    tileLayer: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
    }),
  },
];

export const CAMPUS_BOUNDARY: [number, number][] = [
  [14.1649, 121.2371],
  [14.1679, 121.239],
  [14.1679, 121.2435],
  [14.1658, 121.2468],
  [14.1635, 121.248],
  [14.1601, 121.2478],
  [14.1572, 121.2462],
  [14.1558, 121.243],
  [14.1565, 121.2395],
  [14.1589, 121.2371],
  [14.162, 121.236],
  [14.1649, 121.2371],
];
