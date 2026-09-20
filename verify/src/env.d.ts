/* A side-effect CSS import has no type, and three imported components ship one.
 * Without this tsc reports them as missing modules and the real errors are
 * buried under the noise. */
declare module '*.css';
