/* One is a Tailwind class, one is a three.js clear colour — same ground, two
 * vocabularies.
 */
export default [
  ['bg-[#EAEAE9]', 'bg-[var(--bg)]'],
  ["args={['#EAEAE9']}", 'args={[tokenColour("--bg", "#EAEAE9")]}'],
  ["import * as THREE from 'three'", "import * as THREE from 'three'\nimport { tokenColour } from '@lib/token-colour'", /butterfly\-trail\-cursor\.(jsx|tsx)$/],
];
export const addRegistry = ['token-colour'];
