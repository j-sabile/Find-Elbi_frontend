import type { IBuilding } from "../interfaces/IBuilding";
import { COLLEGES, FLOORS, TYPES } from "./constants";

// BUILDINGS
// - School/UnivDepartment/Academic Building - College
// - Dormitory
// - Park
// - Public Plaza/Community Commons
// - Shop
// - Landmark
// - Gym/Sports
// - Library
// - Office/Administrative Office
// - Clinic
// - Bank
// - Utilities/Support Facilities

const buildings: IBuilding[] = [
  {
    id: "0001",
    name: "Men's Residence Hall",
    type: TYPES.DORMITORY,
    alternateNames: ["Men's Dormitory", "MRH", "Mens"],
    address: "Jose B Juliano Ave",
    marker: [14.16103, 121.24078],
    polygon: [
      [14.16173, 121.24057],
      [14.16137, 121.24077],
      [14.16129, 121.2406],
      [14.16115, 121.24068],
      [14.16117, 121.24073],
      [14.16085, 121.24089],
      [14.16095, 121.24108],
      [14.1606, 121.24124],
      [14.16041, 121.24082],
      [14.16072, 121.24066],
      [14.16077, 121.24075],
      [14.16096, 121.24065],
      [14.16097, 121.24068],
      [14.16141, 121.24046],
      [14.16134, 121.24031],
      [14.16122, 121.24036],
      [14.16115, 121.24021],
      [14.16148, 121.24005],
    ],
  },

  {
    id: "0002",
    name: "Freedom Park",
    type: TYPES.PARK,
    alternateNames: ["F-Park"],
    address: "Jose B Juliano Ave",
    marker: [14.16225, 121.24113],
    polygon: [
      [14.1636, 121.24055],
      [14.16305, 121.24086],
      [14.16207, 121.24197],
      [14.16154, 121.24233],
      [14.16091, 121.24132],
      [14.16343, 121.24014],
    ],
  },
  {
    id: "0003",
    name: "D.L. Umali Hall",
    type: TYPES.COMMUNITY,
    alternateNames: ["DL"],
    address: "Harold Cuzner Royal Palm Ave",
    marker: [14.164, 121.24012],
    polygon: [
      [14.16428, 121.24013],
      [14.16381, 121.24037],
      [14.16367, 121.24012],
      [14.16418, 121.2399],
    ],
  },
  {
    id: "0004",
    name: "Student Union",
    type: TYPES.COMMUNITY,
    alternateNames: ["SU"],
    address: "Mariano M. Mondenedo Ave",
    marker: [14.16332, 121.24136],
    polygon: [
      [14.16365, 121.24107],
      [14.16341, 121.24144],
      [14.16301, 121.24172],
      [14.1629, 121.24151],
      [14.16322, 121.24127],
      [14.16346, 121.24095],
    ],
  },
  {
    id: "0005",
    name: "Fertility Tree",
    type: TYPES.LANDMARK,
    alternateNames: ["F-Tree"],
    address: "Freedom Park",
    marker: [14.15981, 121.2426],
    polygon: [
      [14.15984, 121.24258],
      [14.15981, 121.24262],
      [14.1598, 121.24257],
    ],
  },
  {
    id: "0006",
    name: "Francisco O Santos",
    type: TYPES.ACADEMIC,
    college: COLLEGES.CAS,
    alternateNames: ["PhySci"],
    address: "Freedom Park",
    marker: [14.16425, 121.24204],
    polygon: [
      [14.16478, 121.24228],
      [14.16465, 121.24235],
      [14.16459, 121.24219],
      [14.1643, 121.24232],
      [14.16427, 121.24225],
      [14.16389, 121.24241],
      [14.16379, 121.24217],
      [14.16394, 121.24207],
      [14.16382, 121.24179],
      [14.16422, 121.24161],
      [14.16429, 121.24179],
      [14.16453, 121.24169],
    ],
    floors: [
      {
        level: FLOORS.F2,
        rooms: [
          {
            name: "PC-2",
            alternateNames: [],
            polygon: [
              [14.16454, 121.2422],
              [14.16447, 121.24224],
              [14.16444, 121.24218],
              [14.16451, 121.24214],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "0007",
    name: "We Deliver All Day Breakfast",
    type: TYPES.SHOP,
    alternateNames: [],
    address: "Jose R Velasco Ave",
    marker: [14.16793, 121.24184],
    polygon: [
      [14.16799, 121.24186],
      [14.16791, 121.2419],
      [14.16787, 121.24181],
      [14.16796, 121.24178],
    ],
  },
  {
    id: "0008",
    name: "Copeland Gymnasium",
    type: TYPES.GYM,
    alternateNames: [],
    address: "Joseph C Madamba",
    marker: [14.15694, 121.24255],
    polygon: [
      [14.15731, 121.24257],
      [14.15681, 121.24289],
      [14.15658, 121.24249],
      [14.15708, 121.24219],
    ],
  },
  {
    id: "0009",
    name: "UPLB Library",
    type: TYPES.LIBRARY,
    alternateNames: ["Main Library"],
    address: "Pedro R Sandoval Ave",
    marker: [14.16554, 121.23901],
    polygon: [
      [14.16574, 121.23924],
      [14.16531, 121.23919],
      [14.16536, 121.23883],
      [14.16578, 121.23888],
    ],
  },
  {
    id: "000A",
    name: "UPLB Registrar",
    type: TYPES.ADMINOFFICE,
    alternateNames: ["OUR", "Registrar"],
    address: "Pedro R Sandoval Ave",
    marker: [14.16559, 121.24136],
    polygon: [
      [14.16581, 121.24124],
      [14.16564, 121.24145],
      [14.16542, 121.2415],
      [14.16541, 121.24141],
      [14.1657, 121.24114],
    ],
  },
  {
    id: "000B",
    name: "UPLB Health Service",
    type: TYPES.CLINIC,
    alternateNames: ["UHS"],
    address: "Domingo M Lantican Ave",
    marker: [14.16255, 121.23836],
    polygon: [
      [14.16282, 121.23836],
      [14.16237, 121.23868],
      [14.16221, 121.23838],
      [14.16254, 121.23817],
      [14.16263, 121.23832],
      [14.16275, 121.23823],
    ],
  },
  {
    id: "000C",
    name: "UPLB Landbank",
    type: TYPES.BANK,
    alternateNames: [],
    address: "Victoria M Ela Ave",
    marker: [14.1671, 121.24383],
    polygon: [
      [14.16717, 121.24383],
      [14.16707, 121.24388],
      [14.16704, 121.24381],
      [14.16714, 121.24376],
    ],
  },
  {
    id: "000D",
    name: "UPLB Police Force",
    type: TYPES.SUPPORT,
    alternateNames: ["UPF"],
    address: "Andres P Aglibut Ave",
    marker: [14.16343, 121.24265],
    polygon: [
      [14.16351, 121.24275],
      [14.16333, 121.2427],
      [14.16336, 121.24258],
      [14.16354, 121.24264],
    ],
  },
];

export default buildings;
