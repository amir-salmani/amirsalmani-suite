/* Where each imported item lands, and what it is called.
 *
 * Authored, and deliberately not generated: upstream's registry carries no
 * title, no description and no category for any of its 102 items, and its own
 * component index is a flat list. So this is the one editorial file in the
 * component tier — everything else under src/imported/ is written by
 * tools/import-obsidian.mjs and must not be hand-edited.
 *
 * Six categories are new here. The brand tier never had a cursor, a scroll
 * choreography or a WebGL surface to file.
 */

export const IMPORTED_CATEGORIES = [
  ['Controls',    'Things a reader operates. Every one has a 44px target.'],
  ['Navigation',  'Getting somewhere, and knowing where you are.'],
  ['Overlay',     'Things that open over the page and have to close.'],
  ['Feedback',    'What the interface says back, including while it waits.'],
  ['Data',        'Rows, values, media and the frames around them.'],
  ['Text',        'Type that arrives rather than appears.'],
  ['Scroll',      'Choreography bound to scroll position.'],
  ['Cursor',      'What follows the pointer. Desktop-only by nature.'],
  ['Surface',     'Grounds, fields and washes drawn rather than filled.'],
  ['Dimensional', 'Depth, perspective and WebGL.'],
];

/** name → [category, title] */
export const IMPORTED = {

  // Controls
  "arrow-fill-button"               : ["Controls", "Arrow Fill Button"],
  "button"                          : ["Controls", "Button"],
  "button-group"                    : ["Controls", "Button Group"],
  "checkbox"                        : ["Controls", "Checkbox"],
  "field"                           : ["Controls", "Field"],
  "file-input"                      : ["Controls", "File Input"],
  "form"                            : ["Controls", "Form"],
  "input"                           : ["Controls", "Input"],
  "input-group"                     : ["Controls", "Input Group"],
  "input-otp"                       : ["Controls", "Input Otp"],
  "interactive-arrows"              : ["Controls", "Interactive Arrows"],
  "interactive-hover-button"        : ["Controls", "Interactive Hover Button"],
  "label"                           : ["Controls", "Label"],
  "otp-input"                       : ["Controls", "OTP Input"],
  "playground-button"               : ["Controls", "Playground Button"],
  "raised-button"                   : ["Controls", "Raised Button"],
  "radio-group"                     : ["Controls", "Radio Group"],
  "select"                          : ["Controls", "Select"],
  "slider"                          : ["Controls", "Slider"],
  "switch"                          : ["Controls", "Switch"],
  "textarea"                        : ["Controls", "Textarea"],
  "toggle"                          : ["Controls", "Toggle"],
  "toggle-group"                    : ["Controls", "Toggle Group"],

  // Navigation
  "breadcrumb"                      : ["Navigation", "Breadcrumb"],
  "circle-menu"                     : ["Navigation", "Circle Menu"],
  "command"                         : ["Navigation", "Command"],
  "magnet-tabs"                     : ["Navigation", "Magnet Tabs"],
  "menubar"                         : ["Navigation", "Menubar"],
  "navigation-menu"                 : ["Navigation", "Navigation Menu"],
  "pagination"                      : ["Navigation", "Pagination"],
  "playground-navbar"               : ["Navigation", "Playground Navbar"],
  "sidebar"                         : ["Navigation", "Sidebar"],
  "sidebar-stackbits"               : ["Navigation", "Sidebar Stackbits"],
  "tabs"                            : ["Navigation", "Tabs"],

  // Overlay
  "collapsible"                     : ["Overlay", "Collapsible"],
  "context-menu"                    : ["Overlay", "Context Menu"],
  "dialog"                          : ["Overlay", "Dialog"],
  "drawer"                          : ["Overlay", "Drawer"],
  "dropdown-menu"                   : ["Overlay", "Dropdown Menu"],
  "hover-card"                      : ["Overlay", "Hover Card"],
  "popover"                         : ["Overlay", "Popover"],
  "sheet"                           : ["Overlay", "Sheet"],
  "tooltip"                         : ["Overlay", "Tooltip"],

  // Feedback
  "alert"                           : ["Feedback", "Alert"],
  "empty"                           : ["Feedback", "Empty"],
  "jelly-loader"                    : ["Feedback", "Jelly Loader"],
  "progress"                        : ["Feedback", "Progress"],
  "ripple-pulse-loader"             : ["Feedback", "Ripple Pulse Loader"],
  "skeleton"                        : ["Feedback", "Skeleton"],
  "sonner"                          : ["Feedback", "Sonner"],
  "spinner"                         : ["Feedback", "Spinner"],

  // Data
  "avatar"                          : ["Data", "Avatar"],
  "badge"                           : ["Data", "Badge"],
  "calendar"                        : ["Data", "Calendar"],
  "card"                            : ["Data", "Card"],
  "carousel"                        : ["Data", "Carousel"],
  "chart"                           : ["Data", "Chart"],
  "footer"                          : ["Data", "Footer"],
  "item"                            : ["Data", "Item"],
  "kbd"                             : ["Data", "Kbd"],
  "resizable"                       : ["Data", "Resizable"],
  "scroll-area"                     : ["Data", "Scroll Area"],
  "separator"                       : ["Data", "Separator"],
  "table"                           : ["Data", "Table"],
  "visitor-count"                   : ["Data", "Visitor Count"],

  // Text
  "flip-text"                       : ["Text", "Flip Text"],
  "rectangular-text-reveal"         : ["Text", "Rectangular Text Reveal"],
  "text-fill-animation"             : ["Text", "Text Fill Animation"],
  "text-stream"                     : ["Text", "Text Stream"],

  // Scroll
  "draggable-marquee"               : ["Scroll", "Draggable Marquee"],
  "flip-scroll"                     : ["Scroll", "Flip Scroll"],
  "flow-scroll"                     : ["Scroll", "Flow Scroll"],
  "glowing-scroll-indicator"        : ["Scroll", "Glowing Scroll Indicator"],
  "horizontal-scroll"               : ["Scroll", "Horizontal Scroll"],
  "parallax-gallery"                : ["Scroll", "Parallax Gallery"],
  "scroll-effect"                   : ["Scroll", "Scroll Effect"],
  "scroll-stack"                    : ["Scroll", "Scroll Stack"],
  "smooth-scroll"                   : ["Scroll", "Smooth Scroll"],
  "svg-path-marquee"                : ["Scroll", "Marquee on SVG Path"],
  "svg-pixel-reveal"                : ["Scroll", "SVG Pixel Reveal"],

  // Cursor
  "butterfly-trail-cursor"          : ["Cursor", "Butterfly Trail Cursor"],
  "click-spark"                     : ["Cursor", "Click Spark"],
  "colorful-cursor-aura"            : ["Cursor", "Colorful Cursor Aura"],
  "magnetic-image-trail"            : ["Cursor", "Magnetic Image Trail"],
  "mask-cursor-effect"              : ["Cursor", "Mask Cursor Effect"],
  "rope-cursor"                     : ["Cursor", "Rope Cursor"],

  // Surface
  "apple-spotlight"                 : ["Surface", "Apple Spotlight"],
  "dither-canvas"                   : ["Surface", "Dither Canvas"],
  "dotted-grid"                     : ["Surface", "Dotted Grid"],
  "fractal-glass"                   : ["Surface", "Fractal Glass"],
  "grid-lift"                       : ["Surface", "Grid Lift"],
  "interactive-blur-reveal"         : ["Surface", "Interactive Blur Reveal"],
  "liquid-metal"                    : ["Surface", "Liquid Metal"],

  // Dimensional
  "art-gallery"                     : ["Dimensional", "Art Gallery"],
  "book-flip"                       : ["Dimensional", "Book Flip"],
  "curved-plane"                    : ["Dimensional", "Curved Plane"],
  "folder-preview"                  : ["Dimensional", "Folder Preview"],
  "hover-img"                       : ["Dimensional", "Hover Image"],
  "interactive-hover-slider"        : ["Dimensional", "Hover Slider"],
  "masonry-grid"                    : ["Dimensional", "Masonry Grid"],
  "pixelated-carousel"              : ["Dimensional", "Pixelated Carousel"],
  "skeumorphic-music-card"          : ["Dimensional", "Skeumorphic Music Card"],
  "trading-card"                    : ["Dimensional", "Trading Card"],
};
