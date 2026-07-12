import { writable, get, derived } from "svelte/store";
import { FLOORS } from "../data/constants";
import type { IBuilding } from "../interfaces/IBuilding";
import type { IFloor } from "../interfaces/IFloor";
import type { IRoom } from "../interfaces/IRoom";
import type { ISearchResult } from "../interfaces/ISearchResult";
import { dataStoreV2 } from "./dataV2";
import { mapStoreV2 } from "./mapV2";
import L from "leaflet";
import { searchV2 } from "../utils/searchV2";

export interface NavigationState {
  // status: STACKSTATUS;
  // history: IMapStatus[];
  searchInput: string;
  searchResults: ISearchResult[];
  selectedBuilding: IBuilding | null;
  selectedFloor: IFloor | null;
  selectedRoom: IRoom | null;
}

const defaultState: NavigationState = {
  // status: STACKSTATUS.HOME,
  // history: [],
  searchInput: "",
  searchResults: [],
  selectedBuilding: null,
  selectedFloor: null,
  selectedRoom: null,
};

// function pushHistory(current: NavigationState): IMapStatus[] {
//   const snap: IMapStatus = {
//     // status: current.status,
//     searchInput: current.searchInput,
//     searchResults: current.searchResults,
//     selectedBuilding: current.selectedBuilding || undefined,
//     selectedFloor: current.selectedFloor || undefined,
//     selectedRoom: current.selectedRoom || undefined,
//   };

//   let nextHistory = [...current.history];
//   if (snap.status === STACKSTATUS.HOME) {
//     nextHistory = [mapStatusDefault];
//   } else if (snap.status === STACKSTATUS.SEARCH) {
//     const homeSnap = nextHistory.find((h) => h.status === STACKSTATUS.HOME) || mapStatusDefault;
//     nextHistory = [homeSnap, snap];
//   } else if (snap.status === STACKSTATUS.BUILDING) {
//     if (nextHistory.length > 0 && nextHistory[nextHistory.length - 1].status === STACKSTATUS.BUILDING) {
//       nextHistory[nextHistory.length - 1] = snap;
//     } else {
//       nextHistory.push(snap);
//     }
//   } else {
//     nextHistory.push(snap);
//   }
//   return nextHistory;
// }

function createNavigationStoreV2() {
  const { subscribe, set, update } = writable<NavigationState>({ ...defaultState });

  return {
    subscribe,
    setSearchInput: (query: string) => update((s) => ({ ...s, searchInput: query })),
    executeSearch: () => {
      update((s) => {
        const buildingsList = get(dataStoreV2).buildings;
        const results = searchV2(s.searchInput, buildingsList);
        // const nextHistory = pushHistory(s);
        return {
          ...s,
          // status: STACKSTATUS.SEARCH,
          searchResults: results,
          // history: nextHistory,?
        };
      });
    },
    selectBuilding: (buildingId: string) => {
      update((s) => {
        const buildingsList = get(dataStoreV2).buildings;
        const building = buildingsList.find((b) => b.id === buildingId) || null;
        if (!building) return s;
        // const nextHistory = pushHistory(s);
        return {
          ...s,
          // status: STACKSTATUS.BUILDING,
          selectedBuilding: building,
          selectedFloor: null,
          selectedRoom: null,
          searchInput: building.name,
          // history: nextHistory,
        };
      });
    },
    selectFloor: (level: FLOORS) => {
      update((s) => {
        if (!s.selectedBuilding) return s;
        const floor = s.selectedBuilding.floors?.find((f) => f.level === level) || null;
        if (!floor) return s;
        // const nextHistory = pushHistory(s);
        return {
          ...s,
          // status: STACKSTATUS.FLOOR,
          selectedFloor: floor,
          selectedRoom: null,
          // history: nextHistory,
        };
      });
    },
    selectRoom: (roomCode: string) => {
      update((s) => {
        if (!s.selectedFloor) return s;
        const room = s.selectedFloor.rooms.find((r) => r.code === roomCode) || null;
        if (!room) return s;
        // const nextHistory = pushHistory(s);
        return {
          ...s,
          // status: STACKSTATUS.ROOM,
          selectedRoom: room,
          // history: nextHistory,
        };
      });
    },
    selectSearchResult: (result: ISearchResult) => {
      update((s) => {
        // const nextHistory = pushHistory(s);
        if (result.kind === "building" && result.building) {
          return {
            ...s,
            // status: STACKSTATUS.BUILDING,
            selectedBuilding: result.building,
            selectedFloor: null,
            selectedRoom: null,
            searchInput: result.name,
            // history: nextHistory,
          };
        } else if (result.kind === "room" && result.building && result.floorLevel) {
          const b = result.building;
          const f = b.floors?.find((fl) => fl.level === result.floorLevel) || null;
          const r = f?.rooms.find((rm) => rm.name === result.name) || null;
          return {
            ...s,
            // status: STACKSTATUS.ROOM,
            selectedBuilding: b,
            selectedFloor: f,
            selectedRoom: r,
            searchInput: result.name,
            // history: nextHistory,
          };
        }
        return s;
      });
    },
    clearFloorSelection: () => {
      update((s) => {
        // if (s.status === STACKSTATUS.FLOOR || s.status === STACKSTATUS.ROOM) {
        // const nextHistory = pushHistory(s);
        return {
          ...s,
          // status: STACKSTATUS.BUILDING,
          selectedFloor: null,
          selectedRoom: null,
          // history: nextHistory,
        };
        // }
        // return s;
      });
    },
    // goBack: () => {
    //   update((s) => {
    //     // if (s.history.length === 0) return s;
    //     const nextHistory = [...s.history];
    //     const prev = nextHistory.pop();
    //     if (!prev) return s;
    //     return {
    //       ...s,
    //       status: prev.status,
    //       searchInput: prev.searchInput,
    //       searchResults: prev.searchResults,
    //       selectedBuilding: prev.selectedBuilding || null,
    //       selectedFloor: prev.selectedFloor || null,
    //       selectedRoom: prev.selectedRoom || null,
    //       history: nextHistory,
    //     };
    //   });
    // },
    closeAndReset: () => {
      set({ ...defaultState });
    },
  };
}

export const navigationStoreV2 = createNavigationStoreV2();

// --- REACTIVE LEAFLET DRAWING SUBSCRIPTION ---
let selectedBuildingPolygon: L.Polygon | null = null;
let floorRoomPolygons: L.Polygon[] = [];
let searchResultMarkers: L.Marker[] = [];

function clearMapDrawings(map: L.Map) {
  if (selectedBuildingPolygon) {
    selectedBuildingPolygon.removeFrom(map);
    selectedBuildingPolygon = null;
  }
  floorRoomPolygons.forEach((p) => p.removeFrom(map));
  floorRoomPolygons = [];
  searchResultMarkers.forEach((m) => m.removeFrom(map));
  searchResultMarkers = [];
}

let lastSelectedBuildingId: string | null = null;
let lastSelectedFloorLevel: string | null = null;
// let lastStatus: STACKSTATUS | null = null;

derived([navigationStoreV2, mapStoreV2], ([$nav, $mapState]) => ({ nav: $nav, map: $mapState.map })).subscribe(({ nav, map }) => {
  if (!map) return;

  clearMapDrawings(map);

  // 1. Draw selected building outline if no floor selected
  if (nav.selectedBuilding) {
    selectedBuildingPolygon = L.polygon(nav.selectedBuilding.polygon, {
      color: "#2563eb",
      weight: 3,
      fillColor: "#2563eb",
      fillOpacity: 0.1,
    }).addTo(map);

    if (nav.selectedBuilding.id !== lastSelectedBuildingId) {
      map.fitBounds(nav.selectedBuilding.polygon, { padding: [50, 50], maxZoom: 18 });
    }
  }

  // 2. Draw floor rooms
  if (nav.selectedFloor) {
    floorRoomPolygons = nav.selectedFloor.rooms.map((room) => {
      const isSelectedRoom = nav.selectedRoom && nav.selectedRoom.code === room.code;
      return L.polygon(room.polygon, {
        color: isSelectedRoom ? "#ef4444" : "#028A0F",
        fillColor: isSelectedRoom ? "#ef4444" : "#028A0F",
        fillOpacity: isSelectedRoom ? 0.35 : 0.15,
        weight: isSelectedRoom ? 3 : 1.5,
      })
        .bindTooltip(room.name)
        .on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          navigationStoreV2.selectRoom(room.code);
        })
        .addTo(map);
    });

    if (nav.selectedFloor.level !== lastSelectedFloorLevel) {
      const allRoomCoords = nav.selectedFloor.rooms.flatMap((r) => r.polygon);
      if (allRoomCoords.length > 0) {
        map.fitBounds(allRoomCoords, { padding: [50, 50], maxZoom: 19 });
      }
    }
  }

  // 3. Draw search markers
  // if (nav.status === STACKSTATUS.SEARCH && nav.searchResults.length > 0) {
  //   searchResultMarkers = nav.searchResults
  //     .map((res) => {
  //       const markerCoords = res.building ? res.building.marker : null;
  //       if (!markerCoords) return null;
  //       return L.marker(markerCoords)
  //         .bindTooltip(res.name)
  //         .on("click", (e) => {
  //           L.DomEvent.stopPropagation(e);
  //           navigationStoreV2.selectSearchResult(res);
  //         })
  //         .addTo(map);
  //     })
  //     .filter(Boolean) as L.Marker[];

  // if (nav.status !== lastStatus) {
  //   const markers = nav.searchResults.map((r) => r.building?.marker).filter(Boolean) as [number, number][];
  //   if (markers.length > 0) {
  //     map.fitBounds(markers, { padding: [50, 50], maxZoom: 18 });
  //   }
  // }
  // }

  lastSelectedBuildingId = nav.selectedBuilding ? nav.selectedBuilding.id : null;
  lastSelectedFloorLevel = nav.selectedFloor ? nav.selectedFloor.level : null;
  // lastStatus = nav.status;
});
