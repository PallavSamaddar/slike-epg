# TOI Global EPG Preview

A comprehensive Electronic Program Guide (EPG) preview and management system for TOI Global.

## Features

### Static + Dynamic Tabs Interface

The EPG Preview page now features a modern tab-based interface that replaces the previous dropdown system:

#### Static Tabs (Always Visible)
- **Master EPG** - Default view showing the master EPG data
- **Today's EPG** - Shows today's programming schedule
- **Weekly EPG** - Weekly view with drag-and-drop functionality
- **Monthly EPG** - Monthly calendar view

#### Dynamic Tabs
- **Date-specific tabs** - Created when users click dates from the calendar
- **Closeable** - Dynamic tabs have an X button to close them
- **Chrome-like behavior** - Closing a tab returns to the last active tab

#### Tab Styling
- **Active tab**: Blue background with white text
- **Inactive tab**: White background with black text
- **Left-aligned** tabs with horizontal scrolling for overflow

#### Master EPG Dropdown
- Positioned at the right end of the tab row
- Maintains all existing functionality
- Includes calendar for adding dynamic tabs

### Key Features

- **Drag and Drop**: Reorder programs within and between time slots
- **Real-time Preview**: Live preview of EPG data
- **Multiple Export Formats**: XMLTV, JSON, CSV, API Endpoint
- **Content Management**: Add, edit, and manage VOD and Event content
- **Ad Management**: Integrated ad break management
- **Schedule Replication**: Copy schedules to other dates

## Technical Implementation

### Tab Management
- State management for static and dynamic tabs
- Tab switching logic with proper view mode mapping
- Dynamic tab creation from calendar interactions
- Tab closing with fallback to previous tab

### View Rendering
- Conditional rendering based on active tab ID
- Support for date-specific views
- Maintained compatibility with existing components

### Styling
- Responsive tab design with overflow handling
- Consistent with existing design system
- Smooth transitions and hover effects

## Usage

1. **Switch between static tabs** by clicking on them
2. **Add dynamic tabs** by selecting dates from the Master EPG dropdown calendar
3. **Close dynamic tabs** by clicking the X button
4. **Export EPG data** using the export settings panel
5. **Manage content** using the action buttons

## Development

```bash
npm install
npm run dev
```

The application runs on `http://localhost:8080` by default.
