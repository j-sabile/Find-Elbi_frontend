import { writable, derived } from "svelte/store";
import type { ISearchResult } from "../interfaces/ISearchResult";
import { dataStoreV2 } from "./dataV2";
import { mapInstance } from "./mapV2";
import L from "leaflet";
import type { IBuilding } from "../interfaces/IBuilding";
import type { IFloor } from "../data/constants";
import type { IRoom } from "../interfaces/IRoom";
import search from "../services/search/search";

export interface NavigationState {
  searchInput: string;
  searchResults: ISearchResult[];
  selectedBuildingId: string | null;
  selectedFloorIndex: number | null;
  selectedRoomId: string | null;
}

const defaultState: NavigationState = {
  searchInput: "",
  searchResults: [],
  selectedBuildingId: null,
  selectedFloorIndex: null,
  selectedRoomId: null,
};

function createNavigationStoreV2() {
  const { subscribe, set, update } = writable<NavigationState>({ ...defaultState });

  return {
    subscribe,
    setSearchInput: (query: string) => update((s) => ({ ...s, searchInput: query })),

    // Note: searchV2 still needs dataStoreV2, but we can pass it dynamically where we call executeSearch
    // or just import the store's current value for the search function.
    executeSearch: (buildingsList: any[]) => {
      update((s) => ({
        ...s,
        searchResults: search(s.searchInput),
      }));
    },

    selectBuilding: (buildingId: string, buildingName: string = "") => {
      update((s) => ({
        ...s,
        selectedBuildingId: buildingId,
        selectedFloorIndex: null,
        selectedRoomCode: null,
        searchInput: buildingName || s.searchInput,
        searchResults: [],
      }));
    },

    selectFloor: (floorIndex: number) => {
      update((s) => ({
        ...s,
        selectedFloorIndex: floorIndex,
        selectedRoomCode: null,
      }));
    },

    selectRoom: (roomCode: string) => {
      update((s) => ({ ...s, selectedRoomId: roomCode }));
    },

    selectSearchResult: (result: ISearchResult) => {
      console.log("selectSearchResult: (result: ISearchResult)", result);

      update((s) => {
        if (result.kind === "building" && result.buildingId) {
          console.log("- building");

          return {
            ...s,
            selectedBuildingId: result.buildingId,
            selectedFloorIndex: null,
            selectedRoomCode: null,
            searchInput: result.buildingName,
            searchResults: [],
          };
        }
        // else if (result.kind === "room" && result.room && result.floorLevel !== undefined) {
        //   return {
        //     ...s,
        //     selectedBuildingId: result.building.id,
        //     selectedFloorIndex: result.floorLevel,
        //     // selectedRoomCode: result. || null, // Assuming ISearchResult has a room code
        //     searchInput: result.name,
        //     searchResults: [],
        //   };
        // }
        return s;
      });
    },

    clearFloorSelection: () => {
      update((s) => ({
        ...s,
        selectedFloorIndex: null,
        selectedRoomCode: null,
      }));
    },

    closeAndReset: () => {
      set({ ...defaultState });
    },
  };
}

export const navigationStoreV2 = createNavigationStoreV2();

export const activeSelectionStore = derived([navigationStoreV2, dataStoreV2], ([$nav, $data]) => {
  console.log("const activeSelectionStore = derived([navigationStoreV2, dataStoreV2],");

  const building: IBuilding | null = $nav.selectedBuildingId ? $data.buildings.find((b) => b.id === $nav.selectedBuildingId) || null : null;
  console.log("building", building);

  const floor: IFloor | null = building && $nav.selectedFloorIndex !== null ? building.floors?.find((f) => f.levelIndex === $nav.selectedFloorIndex) || null : null;

  const room: IRoom | null = floor && $nav.selectedRoomId ? floor.rooms.find((r) => r.id === $nav.selectedRoomId) || null : null;

  return { building, floor, room };
});

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

derived([navigationStoreV2, dataStoreV2, mapInstance], ([$nav, $data, $mapInstance]) => ({
  nav: $nav,
  data: $data,
  map: $mapInstance,
})).subscribe(({ nav, data, map }) => {
  if (!map) return;

  clearMapDrawings(map);

  const activeBuilding = nav.selectedBuildingId ? (data.buildings.find((b) => b.id === nav.selectedBuildingId) ?? null) : null;
  const activeFloor = activeBuilding && nav.selectedFloorIndex !== null ? (activeBuilding.floors?.find((f) => f.levelIndex === nav.selectedFloorIndex) ?? null) : null;

  // 1. Draw selected building outline
  if (activeBuilding) {
    console.log("if (activeBuilding), L.polygon(activeBuilding.polygon).addTo(map) ");

    selectedBuildingPolygon = L.polygon(activeBuilding.polygon, {
      color: "#2563eb",
      weight: 3,
      fillColor: "#2563eb",
      fillOpacity: 0.1,
    }).addTo(map);

    // Only zoom if no specific floor is selected
    if (!activeFloor) {
      map.fitBounds(activeBuilding.polygon, { padding: [50, 50], maxZoom: 18 });
    }
  }

  // 2. Draw floor rooms
  if (activeFloor && activeFloor.rooms) {
    floorRoomPolygons = activeFloor.rooms.map((room) => {
      const isSelectedRoom = nav.selectedRoomId === room.id;

      return L.polygon(room.polygon, {
        color: isSelectedRoom ? "#ef4444" : "#028A0F",
        fillColor: isSelectedRoom ? "#ef4444" : "#028A0F",
        fillOpacity: isSelectedRoom ? 0.35 : 0.15,
        weight: isSelectedRoom ? 3 : 1.5,
      })
        .bindTooltip(room.name)
        .on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          navigationStoreV2.selectRoom(room.id);
        })
        .addTo(map);
    });

    const allRoomCoords = activeFloor.rooms.flatMap((r) => r.polygon);
    if (allRoomCoords.length > 0) {
      map.fitBounds(allRoomCoords, { padding: [50, 50], maxZoom: 19 });
    }
  }

  // 3. Draw search markers
  // if (!activeBuilding && nav.searchResults.length > 0) {
  //   searchResultMarkers = nav.searchResults
  //     .map((res) => {
  //       const markerCoords = res.building?.marker;
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

  //   const markerCoordsArray = nav.searchResults.map((r) => r.building?.marker).filter(Boolean) as [number, number][];
  //   if (markerCoordsArray.length > 0) {
  //     map.fitBounds(markerCoordsArray, { padding: [50, 50], maxZoom: 18 });
  //   }
  // }
});
