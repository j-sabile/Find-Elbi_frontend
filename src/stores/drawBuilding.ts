import { derived, writable } from "svelte/store";
import { BUILDING_TYPES, type FLOORS } from "../data/constants";
import type { IRoom } from "../interfaces/IRoom";
import { generateNextId } from "../utils/idGenerator";
import type { IAcadBuilding, IBuilding, IRegBuilding, Section } from "../interfaces/IBuilding";
import buildings from "../data/buildings";
import { getBuildingLabelPoint } from "../utils/buildingGenerator";

// Define the 3 distinct drawing procedures
export type MapProcedure = "idle" | "generate_sections" | "trace_perimeter" | "trace_rooms";

export interface MapState {
  procedure: MapProcedure;
  perimeter: [number, number][]; // The main building outline
  draftPoints: [number, number][]; // Points currently being drawn on the map
  activeFloorLevel: FLOORS; // Keeps track of which floor rooms are being added to
  selectedSectionId: string | null;
  showAllSectionPoints: boolean;
  isEditingBuilding: boolean;
  building: IBuilding;
}

const initialState: MapState = {
  procedure: "idle",
  perimeter: [],
  draftPoints: [],
  activeFloorLevel: null as unknown as FLOORS, // Should be set when tracing rooms
  selectedSectionId: null,
  showAllSectionPoints: false,
  isEditingBuilding: true,
  building: { id: "", address: "", alternateNames: [], college: "College of Arts and Sciences", name: "", marker: [0, 0], polygon: [], sections: [], type: "Academic Building", floors: [] },
};

type BuildingCommonKeys = "name" | "alternateNames" | "address" | "floors" | "type" | "polygon"; // Keys that are common in Building
type BuildingOnlyUpdate = Pick<IRegBuilding, BuildingCommonKeys> | Pick<IAcadBuilding, BuildingCommonKeys | "college">;

function createBuildingMapStore() {
  const { subscribe, set, update } = writable<MapState>(initialState);

  return {
    subscribe,

    // --- State & Procedure Management ---
    setProcedure: (procedure: MapProcedure) =>
      update((state) => {
        // Clear draft points when switching modes so stray points don't carry over
        return { ...state, procedure, draftPoints: [] };
      }),

    setActiveFloor: (level: FLOORS) => update((state) => ({ ...state, activeFloorLevel: level })),

    // --- Drawing / Drafting ---
    addDraftPoint: (point: [number, number]) =>
      update((state) => ({
        ...state,
        draftPoints: [...state.draftPoints, point],
      })),

    removeLastDraftPoint: () =>
      update((state) => ({
        ...state,
        draftPoints: state.draftPoints.slice(0, -1),
      })),

    updateDraftPoint: (index: number, newPoint: [number, number]) =>
      update((state) => {
        const updatedPoints = [...state.draftPoints];
        updatedPoints[index] = newPoint;
        return { ...state, draftPoints: updatedPoints };
      }),

    deleteSection: (id: string) =>
      update((state) => {
        const newSections = state.building.sections.filter((s) => s.id !== id);
        const newSelection = state.selectedSectionId === id ? null : state.selectedSectionId;

        return {
          ...state,
          sections: newSections,
          selectedSectionId: newSelection,
        };
      }),

    setSelectedSection: (id: string | null) => update((state) => ({ ...state, selectedSectionId: id })),

    clearDraft: () => update((state) => ({ ...state, draftPoints: [] })),

    setShowAllSectionPoints: (show: boolean) => update((state) => ({ ...state, showAllSectionPoints: show })),

    // --- Committing Drafts to Final State ---
    saveAsSection: () =>
      update((state) => {
        if (state.draftPoints.length < 3) return state; // Needs to be a valid polygon
        return {
          ...state,
          draftPoints: [], // Reset for the next section
          building: {
            ...state.building,
            sections: [...state.building.sections, { id: generateNextId(state.building.sections, "Section"), polygon: state.draftPoints }],
          },
        };
      }),

    commitDraftAsPerimeter: () =>
      update((state) => {
        if (state.draftPoints.length < 3) return state;
        return {
          ...state,
          perimeter: state.draftPoints,
          draftPoints: [],
        };
      }),

    updateBuilding: (building: BuildingOnlyUpdate) => {
      console.log(`in updateBuilding: (building: BuildingOnlyUpdate): ${JSON.stringify(building)}`);

      update((state) => ({
        ...state,
        isEditingBuilding: false,
        building:
          building.type === BUILDING_TYPES.ACADEMIC
            ? {
                id: generateNextId(buildings, ""),
                marker: getBuildingLabelPoint(building.polygon),
                polygon: building.polygon,
                floors: building.floors,
                name: building.name,
                address: building.address,
                alternateNames: building.alternateNames,
                type: building.type,
                college: building.college,
                sections: state.building?.sections ?? [],
              }
            : {
                id: generateNextId(buildings, ""),
                marker: getBuildingLabelPoint(building.polygon),
                polygon: building.polygon,
                floors: building.floors,
                name: building.name,
                address: building.address,
                alternateNames: building.alternateNames,
                type: building.type,
                sections: state.building?.sections ?? [],
              },
      }));
    },

    addRoom: (room: Omit<IRoom, "id">, floorLevelIndex: number) => {
      update((state) => {
        if (!state.building) return state;

        const currentFloors = state.building.floors || [];
        const floorIndex = currentFloors.findIndex((f) => f.levelIndex === floorLevelIndex);
        let updatedFloors = [...currentFloors];

        if (floorIndex !== -1) {
          updatedFloors[floorIndex] = {
            ...updatedFloors[floorIndex],
            rooms: [...updatedFloors[floorIndex].rooms, { ...room, id: generateNextId(updatedFloors[floorIndex].rooms, "room") }],
          };
        }

        return { ...state, building: { ...state.building, floors: updatedFloors } };
      });
    },

    setIsEditingBuilding: (isEditing: boolean) => {
      update((state) => ({ ...state, isEditingBuilding: isEditing }));
    },

    // --- Resets ---
    resetAll: () => set(initialState),
  };
}

export const drawBuildingStore = createBuildingMapStore();

export const selectedSection = derived(drawBuildingStore, ($state) => {
  if (!$state.selectedSectionId) return null;
  return $state.building?.sections.find((s) => s.id === $state.selectedSectionId) || null;
});
