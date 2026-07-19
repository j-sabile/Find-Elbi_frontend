<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import L from "leaflet";
  import "leaflet/dist/leaflet.css";
  import { drawBuildingStore } from "../../stores/drawBuilding";
  import { mapInstance } from "../../stores/mapV2";

  let markersByIndex: Record<number, L.CircleMarker> = {};
  let draggingIndex: number | null = null;
  let draftSectionPolygon: L.Polygon | null = null;
  let justFinishedDragging = false;
  let renderedSections: Record<string, L.Polygon> = {};
  let guidePointsLayer = L.layerGroup();

  onMount(() => {
    const map = $mapInstance;
    if (map == null) return;

    map.on("click", (e: L.LeafletMouseEvent) => {
      if (justFinishedDragging) return;
      if ($drawBuildingStore.procedure === "generate_sections" && draggingIndex === null) {
        drawBuildingStore.addDraftPoint([e.latlng.lat, e.latlng.lng]);
      }

      // If a section is selected globally, clicking the map deselects it
      if ($drawBuildingStore.selectedSectionId !== null) {
        drawBuildingStore.setSelectedSection(null);
      }
    });

    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      if (draggingIndex !== null && markersByIndex[draggingIndex]) {
        // 1. Visually move the circle marker
        markersByIndex[draggingIndex].setLatLng(e.latlng);

        // 2. Visually update the polygon fill in real-time
        if (draftSectionPolygon) {
          // Clone the store array so we don't mutate state directly
          const tempPoints = [...$drawBuildingStore.draftPoints];
          // Inject the current mouse position for the dragged point
          tempPoints[draggingIndex] = [e.latlng.lat, e.latlng.lng];
          // Stretch the polygon
          draftSectionPolygon.setLatLngs(tempPoints);
        }
      }
    });

    map.on("mouseup", (e: L.LeafletMouseEvent) => {
      if (draggingIndex !== null) {
        drawBuildingStore.updateDraftPoint(draggingIndex, [e.latlng.lat, e.latlng.lng]);
        map.dragging.enable();
        draggingIndex = null;

        justFinishedDragging = true;
        setTimeout(() => (justFinishedDragging = false), 50);
      }
    });
  });

  onDestroy(() => {
    if ($mapInstance) $mapInstance.remove();
    if (draftSectionPolygon) draftSectionPolygon.remove();
    guidePointsLayer.clearLayers();
  });

  // --- DRAFT POITNS REACTIVE BLOCK ---
  $: if ($mapInstance && $drawBuildingStore.draftPoints) {
    const map = $mapInstance;
    if (map != null) {
      const currentPoints = $drawBuildingStore.draftPoints;

      // A. Clean up markers if points were removed from the store
      Object.keys(markersByIndex).forEach((key) => {
        const index = Number(key);
        if (index >= currentPoints.length) {
          markersByIndex[index].remove();
          delete markersByIndex[index];
        }
      });

      // B. Add new markers or update existing ones
      currentPoints.forEach((point, index) => {
        if (markersByIndex[index]) {
          // Update position if we are not currently dragging it
          if (draggingIndex !== index) {
            markersByIndex[index].setLatLng(point);
          }
        } else {
          // Create new marker
          const newMarker = L.circleMarker(point, {
            radius: 8,
            color: "#ff3388",
            fillOpacity: 0.8,
          }).addTo(map);

          // Attach drag start listener
          newMarker.on("mousedown", () => {
            draggingIndex = index;
            map.dragging.disable();
          });

          markersByIndex[index] = newMarker;
        }
      });

      // FILL: Draw a polygon if there are at least 2 points
      if (currentPoints.length >= 2) {
        // If we have at least 2 points, we can draw a shape
        if (!draftSectionPolygon) {
          // Create it if it doesn't exist
          draftSectionPolygon = L.polygon(currentPoints, {
            color: "#ff3388", // Border color
            fillColor: "#ff3388", // Fill color
            fillOpacity: 0.3, // Semi-transparent fill
            weight: 2,
            dashArray: "5, 5", // Optional: dashed line looks like a "draft"
            interactive: false, // Prevents the polygon from stealing mouse clicks
          }).addTo(map);
        } else {
          // Update its coordinates instantly when dragging or adding points
          draftSectionPolygon.setLatLngs(currentPoints);
        }
      } else {
        // If there are 1 or 0 points, remove the polygon
        if (draftSectionPolygon) {
          draftSectionPolygon.remove();
          draftSectionPolygon = null;
        }
      }
    }
  }

  // --- COMMITTED SECTIONS REACTIVE BLOCK ---
  $: if ($mapInstance && $drawBuildingStore) {
    const map = $mapInstance;
    const currentSections = $drawBuildingStore.building.sections;
    const currentSectionIds = new Set(currentSections.map((s) => s.id));

    // A. Clean up polygons
    Object.keys(renderedSections).forEach((id) => {
      if (!currentSectionIds.has(id)) {
        renderedSections[id].remove();
        delete renderedSections[id];
      }
    });

    // B. Draw or Update sections
    currentSections?.forEach((section) => {
      // USE STORE VARIABLE HERE
      const isSelected = $drawBuildingStore.selectedSectionId === section.id;

      const polyStyle = {
        color: isSelected ? "#ffaa00" : "#3388ff",
        fillColor: isSelected ? "#ffaa00" : "#3388ff",
        fillOpacity: isSelected ? 0.6 : 0.3,
        weight: isSelected ? 3 : 2,
        interactive: true,
      };

      if (!renderedSections[section.id]) {
        const poly = L.polygon(section.polygon, polyStyle).addTo(map);

        poly.on("click", (e: L.LeafletMouseEvent) => {
          if ($drawBuildingStore.procedure === "generate_sections") return;
          L.DomEvent.stopPropagation(e);
          drawBuildingStore.setSelectedSection(section.id);
        });

        renderedSections[section.id] = poly;
      } else {
        renderedSections[section.id].setLatLngs(section.polygon);
        renderedSections[section.id].setStyle(polyStyle);
      }
    });
  }

  // --- GUIDE POINTS REACTIVE BLOCK ---
  $: if ($mapInstance && $drawBuildingStore) {
    const map = $mapInstance;
    const showGuides = $drawBuildingStore.showAllSectionPoints;
    const sections = $drawBuildingStore.building?.sections;

    // 1. Always clear the old dots first so we don't infinitely stack them
    guidePointsLayer.clearLayers();

    // 2. If the toggle is OFF, ensure the layer is removed from the map entirely
    if (!showGuides) {
      if (map.hasLayer(guidePointsLayer)) {
        guidePointsLayer.remove();
      }
    }
    // 3. If the toggle is ON, build the dots
    else if (showGuides && sections && sections.length > 0) {
      // Ensure the layer container is on the map
      if (!map.hasLayer(guidePointsLayer)) {
        guidePointsLayer.addTo(map);
      }

      // Loop through every single section...
      sections.forEach((section) => {
        // ...and loop through every single point in that section
        section.polygon.forEach((point) => {
          // Create a small, distinct circle for the guide point
          const guideMarker = L.circleMarker(point, {
            radius: 4, // Smaller than draft points
            color: "#00cc66", // Green color to distinguish as a guide
            fillColor: "#00cc66",
            fillOpacity: 0.8,
            weight: 1,
            interactive: true, // Must be true so we can click it!
          });

          // Make it act as a snapping point
          guideMarker.on("click", (e: L.LeafletMouseEvent) => {
            // CRITICAL: Stop the click from hitting the map underneath,
            // otherwise you will drop TWO points (one exact, one slightly off)
            L.DomEvent.stopPropagation(e);

            // Only add the point if we are actively drawing!
            if ($drawBuildingStore.procedure === "generate_sections") {
              // We use the exact raw coordinates from the store (point),
              // NOT the mouse event coordinates, to guarantee a perfect snap!
              drawBuildingStore.addDraftPoint([point[0], point[1]]);
            }
          });

          // Add this dot to our group
          guidePointsLayer.addLayer(guideMarker);
        });
      });
    }
  }

  // --- PREVIEW SECTIONS REACTIVE BLOCK ---
  let renderedPreviews: Record<string, L.Polygon> = {};
  $: if ($mapInstance && $drawBuildingStore) {
    const map = $mapInstance;

    // --- EXISTING SECTIONS LOGIC ---
    const currentSections = $drawBuildingStore.building.sections;
    const currentSectionIds = new Set(currentSections.map((s) => s.id));

    // A. Clean up standard polygons
    Object.keys(renderedSections).forEach((id) => {
      if (!currentSectionIds.has(id)) {
        renderedSections[id].remove();
        delete renderedSections[id];
      }
    });

    // B. Draw or Update standard sections
    currentSections?.forEach((section) => {
      const isSelected = $drawBuildingStore.selectedSectionId === section.id;

      const polyStyle = {
        color: isSelected ? "#ffaa00" : "#3388ff",
        fillColor: isSelected ? "#ffaa00" : "#3388ff",
        fillOpacity: isSelected ? 0.6 : 0.3,
        weight: isSelected ? 3 : 2,
        interactive: true,
      };

      if (!renderedSections[section.id]) {
        const poly = L.polygon(section.polygon, polyStyle).addTo(map);

        poly.on("click", (e: L.LeafletMouseEvent) => {
          if ($drawBuildingStore.procedure === "generate_sections") return;
          L.DomEvent.stopPropagation(e);
          drawBuildingStore.setSelectedSection(section.id);
        });

        renderedSections[section.id] = poly;
      } else {
        renderedSections[section.id].setLatLngs(section.polygon);
        renderedSections[section.id].setStyle(polyStyle);
      }
    });

    // --- PREVIEW SECTIONS LOGIC ---
    const previewSections = $drawBuildingStore.previewSections || [];
    const previewSectionIds = new Set(previewSections.map((s) => s.id));

    // C. Clean up preview polygons
    Object.keys(renderedPreviews).forEach((id) => {
      if (!previewSectionIds.has(id)) {
        renderedPreviews[id].remove();
        delete renderedPreviews[id];
      }
    });

    // D. Draw or Update preview sections
    previewSections.forEach((section) => {
      const previewStyle = {
        color: "#888888", // Different border color (Grey)
        fillColor: "#cccccc", // Different fill color
        fillOpacity: 0.15, // Lighter transparency
        weight: 2,
        dashArray: "5, 5", // Dashed border makes it obviously a "preview"
        interactive: false, // NOT clickable - mouse events pass through to map
      };

      if (!renderedPreviews[section.id]) {
        // Notice we do NOT attach a click listener here
        const poly = L.polygon(section.polygon, previewStyle).addTo(map);
        renderedPreviews[section.id] = poly;
      } else {
        renderedPreviews[section.id].setLatLngs(section.polygon);
        renderedPreviews[section.id].setStyle(previewStyle);
      }
    });
  }
</script>
