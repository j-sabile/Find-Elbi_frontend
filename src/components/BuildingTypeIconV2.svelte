<script lang="ts">
  import { TYPES, ROOM_TYPES } from "../data/constants";
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

  export let type: TYPES | ROOM_TYPES;

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

    [ROOM_TYPES.ACADEMIC]: BookOpen,
    [ROOM_TYPES.FACULTY]: User,
    [ROOM_TYPES.ADMIN]: Briefcase,
    [ROOM_TYPES.LABORATORY]: FlaskConical,
    [ROOM_TYPES.LECTURE_HALL]: Presentation,
    [ROOM_TYPES.DORM]: Bed,
    [ROOM_TYPES.CR]: Bath,
  };
</script>

<svelte:component this={ICONS[type]} class="w-5 h-5 shrink-0 text-blue-600" strokeWidth={1.8} />
