<script lang="ts">
  import { BUILDING_TYPES, RoomType, type BuildingType } from "../data/constants";
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
    Bath,
  } from "lucide-svelte";

  export let type: BuildingType | RoomType;

  const ICONS: Record<string, any> = {
    [BUILDING_TYPES.ACADEMIC]: GraduationCap,
    [BUILDING_TYPES.DORMITORY]: House,
    [BUILDING_TYPES.PARK]: TreePine,
    [BUILDING_TYPES.COMMUNITY]: Users,
    [BUILDING_TYPES.LANDMARK]: Landmark,
    [BUILDING_TYPES.SHOP]: Store,
    [BUILDING_TYPES.GYM]: Dumbbell,
    [BUILDING_TYPES.LIBRARY]: Library,
    [BUILDING_TYPES.ADMINOFFICE]: Briefcase,
    [BUILDING_TYPES.CLINIC]: Stethoscope,
    [BUILDING_TYPES.BANK]: Banknote,
    [BUILDING_TYPES.SUPPORT]: Wrench,
    [BUILDING_TYPES.LAUNDRY]: WashingMachine,

    [RoomType.ACADEMIC]: BookOpen,
    [RoomType.FACULTY]: User,
    [RoomType.ADMIN]: Briefcase,
    [RoomType.LABORATORY]: FlaskConical,
    [RoomType.LECTURE_HALL]: Presentation,
    [RoomType.DORM]: Bed,
    [RoomType.CR]: Bath,
  };
</script>

<svelte:component this={ICONS[type]} class="w-5 h-5 shrink-0 text-blue-600" strokeWidth={1.8} />
