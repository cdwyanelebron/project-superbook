# PROJECT SUPERBOOK - Design Guidelines

## App Identity
- **Name:** PROJECT SUPERBOOK
- **Tagline:** Bible Stories for Filipino Kids
- **Target Audience:** Filipino children aged 5-12 years old
- **Language:** English titles, Tagalog content
- **Design Philosophy:** Child-friendly, educational, bright and inviting

## Navigation Architecture

### Root Navigation: Bottom Tab Bar (3 tabs)
1. **Home** - Main entry point with testament selection
2. **Library** - Story browsing (integrates stack navigator)
3. **Profile** - User stats and settings

### Navigation Stack
- Library Tab contains stack: LibraryMain → BookReader (modal-style)
- Screen transitions: Slide from right (forward), slide from left (back)
- Modal presentation: Fade up from bottom

## Color System

### Primary Colors
- **Primary:** `#FF9800` (Orange) - Main brand color
- **Old Testament:** `#4CAF50` (Green) - Lumang Tipan theme
- **New Testament:** `#2196F3` (Blue) - Bagong Tipan theme

### Neutral Colors
- **Background:** `#F8F9FA` (Light Gray)
- **Text Primary:** `#333333` (Dark Gray)
- **Text Secondary:** `#666666` (Medium Gray)

### Accent Colors (Book Categories)
Rotate through: `#FFB74D`, `#FFCC80`, `#4FC3F7`, `#AED581`, `#FF8A65`, `#BA68C8`, `#4DB6AC`, `#7986CB`, `#FFD54F`, `#A1887F`

## Typography
- **Headers:** Large, bold, child-friendly
- **Titles:** English primary, Tagalog secondary (smaller, italic)
- **Body Text:** Clear, readable for children
- **Font Sizes:** Adjustable in reader (12px - 24px range)

## Screen Specifications

### 1. Home Screen
**Purpose:** Welcome and testament selection

**Layout:**
- Header: Transparent, no back button
- Main content: Scrollable
- Bottom inset: `tabBarHeight + Spacing.xl`
- Top inset: `insets.top + Spacing.xl`

**Components:**
- Large "PROJECT SUPERBOOK" title with subtitle
- Two prominent CTA buttons (min 60px height):
  - "LUMANG TIPAN" - Green (#4CAF50), book icon
  - "BAGONG TIPAN" - Blue (#2196F3), star icon
- Horizontal scroll: Featured stories (3-4 cards)
- Statistics badges: "60 Stories", "2 Testaments", "100% Free"

**Animations:**
- Screen entry: Fade in + slide up
- Buttons: Bounce effect on mount
- Featured cards: Staggered fade-in (50ms delay each)

### 2. Library Screen
**Purpose:** Browse and search all stories by testament

**Layout:**
- Header: Custom with testament title ("LUMANG TIPAN" or "BAGONG TIPAN")
- Search bar: Fixed at top below header
- Filter tabs: Horizontal scrollable category pills
- List: Scrollable with smooth animations
- Bottom inset: `tabBarHeight + Spacing.xl`

**Components:**
- Search bar with magnifying glass icon
- Category filter tabs (All, Genesis, Exodus, etc.)
- Book list items showing:
  - Book number (01-60)
  - English title (bold)
  - Tagalog title (italic, smaller)
  - Category badge (colored)
  - Reading time estimate
  - Chevron right
- Counter: "X of 35 stories" or "X of 25 stories"

**List Item Specifications:**
- Touch-friendly height (min 80px)
- Left-aligned content
- Color-coded left border matching testament
- Subtle shadow on press

**Animations:**
- List items: Staggered fade-in on load
- Press: Scale down to 0.95
- Search: Smooth filter transition

### 3. Book Reader Screen (CRITICAL)
**Purpose:** PDF reading with page-flip experience

**Layout:**
- Header: Custom with book title + page counter
- PDF viewer: Full-screen
- Controls bar: Fixed at bottom
- Settings bar: Above controls
- Bottom inset: `insets.bottom + Spacing.xl`
- Top inset: `headerHeight + Spacing.xl`

**Header Components:**
- Back button (left)
- Book title (center, truncated if long)
- Page counter (right): "Page X of Y"

**PDF Viewer:**
- Full-screen display
- **PAGE FLIP ANIMATION (NON-NEGOTIABLE):**
  - Simulate real book page turning
  - Page curls from corner
  - Shadow effect under turning page
  - Next page preview during turn
  - 60fps smooth animation
  - Swipe left/right gesture support

**Bottom Controls Bar:**
- Previous button: Left arrow + "Previous" text
- Bookmark button: Star icon (center)
- Next button: Right arrow + "Next" text
- All buttons large and touch-friendly

**Settings Bar (Above Controls):**
- Font size: A- [Current Size] A+
- Brightness: Moon icon [Slider] Sun icon
- Minimal, non-intrusive design

### 4. Profile Screen
**Purpose:** Reading stats and app settings

**Layout:**
- Header: Default with "Profile" title
- Content: Scrollable sections
- Bottom inset: `tabBarHeight + Spacing.xl`
- Top inset: `Spacing.xl`

**Sections:**
1. User Profile: Avatar, name, email
2. Reading Statistics:
   - Total stories read (large number)
   - Completed stories count
   - Total reading time
   - Last read date
3. Bookmarks: Grid or list of bookmarked stories
4. Settings:
   - Dark mode toggle
   - Notifications toggle
   - Language settings
   - Clear data (with confirmation)
5. App Info: Version, About, Credits

## Component Design Patterns

### Buttons
- **Large CTAs:** Min 60px height, rounded corners (8px), bold text
- **Press Effect:** Scale to 0.95, 100ms duration
- **Release:** Scale back to 1.0, spring animation
- **Testament Buttons:** Full-width or 48% width each with icon

### Book Cards/List Items
- **Card Style:** White background, subtle shadow (optional)
- **Border:** 2px left border in accent color
- **Spacing:** 16px padding, 12px between elements
- **Touch Feedback:** Background color change on press

### Icons
- Use Material Icons from react-native-vector-icons
- Icon sizes: 24px (standard), 32px (large buttons)
- No emojis - use proper icon library

### Loading States
- Spinning book icon animation
- Fade in/out pulse effect
- Centered on screen

### Empty States
- Bounce animation
- Friendly message
- Suggested action button

## Animations & Transitions

### Screen Transitions
- **Forward:** Slide from right (300ms)
- **Back:** Slide from left (300ms)
- **Modal:** Fade up from bottom (250ms)

### List Animations
- **On Load:** Staggered fade-in (50ms delay per item)
- **On Filter:** Fade out old, fade in new (200ms)

### Button Animations
- **Press:** Scale 0.95 + slight opacity (100ms)
- **Release:** Spring back to 1.0 (150ms)
- **Disabled:** 50% opacity, no press effect

### Page Flip (Critical)
- **Gesture:** Swipe left/right
- **Animation:** 3D page curl effect
- **Duration:** 400-600ms
- **Easing:** Ease-in-out
- **Shadow:** Dynamic shadow under curling page
- **Preview:** Show next page during transition

## Accessibility Requirements

### Touch Targets
- Minimum 44x44 points for all interactive elements
- Large buttons: Minimum 60px height
- Adequate spacing between touch targets (min 8px)

### Text Readability
- High contrast ratios (4.5:1 minimum)
- Adjustable font sizes in reader
- Clear typography hierarchy

### Child-Friendly Design
- Large, obvious buttons
- Clear visual feedback on all interactions
- Simple, intuitive navigation
- Bright, engaging colors
- Minimal text, maximum clarity

## Performance Requirements
- 60fps animations (especially page flip)
- Lazy loading for PDFs
- Image caching for book covers
- Optimized list rendering
- Smooth scrolling with no jank

## Visual Style Notes
- **Overall Feel:** Bright, playful, educational
- **Shadows:** Subtle, minimal (avoid heavy drop shadows)
- **Borders:** Mostly borderless design, color-coded accents
- **Corners:** Rounded (8px standard, 12px for large cards)
- **Spacing:** Generous white space, child-friendly layout
- **Testament Visual Split:** Clear color differentiation (Green vs Blue)