# TAILWIND_DESIGN_SYSTEM_V1

STYLE
minimal
flat
modern
compact
neutral
consistent

APP
bg-gray-100 min-h-screen text-gray-900 antialiased

SURFACE
bg-white border border-gray-200 rounded-2xl shadow-lg

CARD
bg-white border border-gray-200 rounded-xl p-4 transition-all duration-200 hover:bg-gray-50 hover:shadow-lg

ACTIVE
bg-blue-50 border-blue-300

PANEL
bg-white border border-gray-200 rounded-2xl shadow-lg p-4 flex flex-col gap-4

ROW
flex items-center justify-between gap-3

COLUMN
flex flex-col gap-3

GRID
grid gap-3

BUTTON
inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-blue-700

BUTTON_SECONDARY
inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors duration-200

ICON_BUTTON
flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-200

INPUT
w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none

TEXT_TITLE
text-lg font-semibold tracking-tight text-gray-900

TEXT_BODY
text-sm text-gray-700

TEXT_META
text-xs text-gray-500

BADGE
inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium

LIST
flex flex-col divide-y divide-gray-200

LIST_ITEM
flex items-center justify-between gap-3 p-4 hover:bg-gray-50 transition-colors duration-200

DIVIDER
border-t border-gray-200

ICON
w-5 h-5 shrink-0

FLOATING
absolute z-20 bg-white border border-gray-200 rounded-2xl shadow-lg

TRANSITION
transition-all duration-200 ease-out

RULES

- use bg-gray-100 only for page background
- every surface uses SURFACE
- every card uses CARD
- every panel uses PANEL
- every row uses ROW
- every column uses COLUMN
- every grid uses GRID
- every action uses BUTTON or BUTTON_SECONDARY
- every icon action uses ICON_BUTTON
- every input uses INPUT
- every title uses TEXT_TITLE
- every body text uses TEXT_BODY
- every metadata uses TEXT_META
- every badge uses BADGE
- every list uses LIST
- every list item uses LIST_ITEM
- every divider uses DIVIDER
- every icon uses ICON

STRICT

- primary color: blue-600
- active state: bg-blue-50 border-blue-300
- border: border-gray-200 only
- shadow: shadow-lg only
- radius: rounded-xl for cards, rounded-2xl for panels, rounded-lg for buttons
- spacing: p-4 gap-3 only
- font weight: font-medium or font-semibold only
- body text: text-sm only
- metadata: text-xs only
- title: text-lg only
- icon size: w-5 h-5 only
- transition: duration-200 only

NEVER

- gradients
- glassmorphism
- backdrop blur
- shadow-xl
- shadow-2xl
- rounded-full except avatars
- rounded-3xl
- border-2
- arbitrary spacing
- arbitrary colors
- font-bold
- saturated backgrounds
- decorative effects
- inconsistent spacing
- inconsistent radius
- inconsistent typography
- inconsistent shadows
- inconsistent borders
- multiple visual styles

PRIORITY

consistency > alignment > spacing > typography > color > decoration