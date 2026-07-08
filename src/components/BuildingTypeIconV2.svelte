<script lang="ts">
  import { TYPES, ROOM_TYPES } from "../data/constants";
  import type { SearchResultKind } from "../interfaces/ISearchResult";
  import {
    GraduationCap,
    House,
    TreePine,
    Users,
    Landmark,
    Store,
    Dumbbell,
    Library,
    Briefcase,
    Stethoscope,
    Banknote,
    Wrench,
    WashingMachine,
    BookOpen,
    User,
    FlaskConical,
    Presentation,
    Bed,
  } from "lucide-svelte";

  export let type: TYPES;
  export let kind: SearchResultKind = "building";
  export let roomType: ROOM_TYPES | undefined = undefined;

  // Most appropriate Lucide icon per building type.
  const ICONS: Record<string, any> = {
    [TYPES.ACADEMIC]: GraduationCap,
    [TYPES.DORMITORY]: House,
    [TYPES.PARK]: TreePine,
    [TYPES.COMMUNITY]: Users,
    [TYPES.LANDMARK]: Landmark,
    [TYPES.SHOP]: Store,
    [TYPES.GYM]: Dumbbell,
    [TYPES.LIBRARY]: Library,
    [TYPES.ADMINOFFICE]: Briefcase,
    [TYPES.CLINIC]: Stethoscope,
    [TYPES.BANK]: Banknote,
    [TYPES.SUPPORT]: Wrench,
    [TYPES.LAUNDRY]: WashingMachine,
  };

  // Distinct Lucide icon per room type.
  const ROOM_ICONS: Record<string, any> = {
    [ROOM_TYPES.ACADEMIC]: BookOpen,
    [ROOM_TYPES.FACULTY]: User,
    [ROOM_TYPES.ADMIN]: Briefcase,
    [ROOM_TYPES.LABORATORY]: FlaskConical,
    [ROOM_TYPES.LECTURE_HALL]: Presentation,
    [ROOM_TYPES.DORM]: Bed,
  };

  $: Icon =
    kind === "room"
      ? ROOM_ICONS[roomType ?? ""] ?? BookOpen
      : ICONS[type] ?? GraduationCap;
</script>

<svelte:component
  this={Icon}
  class="w-5 h-5 shrink-0 text-blue-600"
  strokeWidth={1.8}
/>
