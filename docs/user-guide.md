# TubeRank User Guide

A comprehensive guide to using TubeRank for YouTube content curation and management.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Profile Management](#profile-management)
4. [Kanban Board Workflow](#kanban-board-workflow)
5. [Content Discovery](#content-discovery)
6. [Analytics & Insights](#analytics--insights)
7. [Settings & Preferences](#settings--preferences)
8. [Daily Digest](#daily-digest)
9. [Mobile Experience](#mobile-experience)
10. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### First Launch

When you first open TubeRank, you'll see the main dashboard with a cyberpunk-inspired interface featuring:

- **Header**: "TUBERANK" title with live status indicator
- **Stats Bar**: Four metric cards showing Active profiles, Total profiles, Sources, and Videos
- **Profile List**: Your content curation profiles (empty initially)
- **New Profile Button**: Primary action to create your first profile

### Creating Your First Profile

1. Click the **"New Profile"** button (green, top-right)
2. Fill in the profile form:
   - **Name**: Descriptive name (e.g., "Tech Reviews", "Cooking Channels")
   - **Description**: Optional details about the profile's purpose
   - **Type**: Choose from available profile types
3. Click **"Create Profile"** to save

---

## Dashboard Overview

The dashboard serves as your command center with real-time statistics and quick access to all profiles.

### Stats Overview

The four metric cards display:

- **Active**: Number of profiles currently enabled for content ingestion
- **Total**: Total number of profiles created
- **Sources**: Total YouTube channels/sources across all profiles
- **Videos**: Total videos discovered and processed

### Global Actions

- **Refresh All**: Triggers RSS refresh for all active profiles
  - Shows spinner animation while processing
  - Displays toast notification with results
  - Rate limited to prevent abuse (3 requests per 5 minutes)

### Profile Grid

Each profile card shows:
- Profile name and description
- Creation date
- Quick access to view/edit actions
- Visual indicators for active/inactive status

---

## Profile Management

### Profile Types

TubeRank supports different profile types for various content curation strategies:

- **Channel Stack**: Focus on specific YouTube channels
- **Keyword Radar**: Track videos matching specific keywords
- **Category Pulse**: Monitor trending videos in categories

### Profile Settings

Access profile settings by clicking the **Settings** button on any profile page:

- **Basic Information**: Edit name and description
- **Sources**: Manage YouTube channels or keywords
- **Preferences**: Configure scoring thresholds and filters
- **Status**: Enable/disable the profile

### Adding Content Sources

1. Navigate to a profile's settings page
2. Click **"Add Source"**
3. Choose source type:
   - **YouTube Channel**: Enter channel URL or ID
   - **Keyword**: Enter search terms
   - **Category**: Select from YouTube categories
4. Save the source

---

## Kanban Board Workflow

The heart of TubeRank is the Kanban board for triaging video content across five columns.

### Column Structure

1. **Inbox**: New videos appear here automatically
2. **Recommended**: Videos marked as worth watching
3. **Skim**: Videos to quickly review or sample
4. **Watch**: Videos queued for full viewing
5. **Archived**: Completed or dismissed videos

### Drag & Drop Operations

**Desktop Experience**:
- Click and drag cards between columns
- Smooth animations provide visual feedback
- Cards snap to drop zones with visual indicators

**Mobile Experience**:
- Touch and hold to initiate drag
- Horizontal scrolling between columns
- Optimized touch targets (44px minimum)

### Card Information

Each video card displays:
- **Thumbnail**: Video preview image
- **Title**: Full video title (truncated if long)
- **Channel**: YouTube channel name
- **Score**: AI-generated relevance score (if available)
- **Published Date**: When the video was uploaded
- **Duration**: Video length (if available)

### Bulk Operations

Select multiple cards using:
- **Shift+Click**: Select range of cards
- **Ctrl/Cmd+Click**: Select individual cards
- **Select All**: Checkbox in column header

Bulk actions available:
- Move selected cards to any column
- Delete selected cards
- Mark as read/unread

---

## Content Discovery

### Automatic RSS Ingestion

TubeRank automatically discovers new videos through:

- **Scheduled Checks**: Every 15 minutes for active profiles
- **Manual Refresh**: Click refresh button on profile or dashboard
- **RSS Feeds**: Direct YouTube channel RSS (no API quota needed)

### Manual Refresh

**Global Refresh** (Dashboard):
- Refreshes all active profiles simultaneously
- Shows progress notification with channel count
- Rate limited to prevent server overload

**Profile Refresh** (Profile Page):
- Refreshes only the current profile's sources
- Displays last checked timestamp
- Individual rate limiting per profile

### Content Processing

When new videos are discovered:
1. **Metadata Extraction**: Title, description, thumbnail, publish date
2. **Deduplication**: Prevents duplicate videos across profiles
3. **Inbox Placement**: New videos appear in the Inbox column
4. **Background Processing**: AI scoring and transcript fetching (if enabled)

---

## Analytics & Insights

Access detailed analytics through the navigation menu.

### Performance Analytics

**Overview Page**:
- Total cards processed
- Average processing time
- Success/error rates
- System health metrics

**Channel Health**:
- Per-channel statistics
- Last update timestamps
- Error tracking
- Performance trends

### Workflow Analytics

**Velocity Tracking**:
- Cards moved per day/week
- Time spent in each column
- Completion rates

**Score Distribution**:
- Histogram of video scores
- Quality trends over time
- Profile comparisons

### Funnel Analysis

Track how videos flow through your workflow:
- Inbox → Recommended conversion rate
- Watch completion percentage
- Archive patterns
- Bottleneck identification

---

## Settings & Preferences

### Daily Digest Configuration

**Enable/Disable Digest**:
- Toggle daily email summaries
- Configure delivery time
- Set minimum score threshold

**Score Threshold Slider**:
- Range: 0-100
- Default: 75
- Only videos above threshold included in digest

### Notification Preferences

*Coming Soon*: Email notifications, push alerts, and custom notification rules.

### Data Management

- **Export Data**: Download your profiles and video data
- **Clear Cache**: Reset local storage and refresh data
- **Backup Settings**: Save configuration for restore

---

## Daily Digest

The Digest page provides a curated summary of high-scoring videos across all profiles.

### Digest Cards

Each digest entry shows:
- **Profile Name**: Source profile for the videos
- **Date Range**: When the digest was generated
- **Video Count**: Number of videos included
- **Video List**: Ranked list with scores

### Video Rankings

Videos in digest are ranked by:
1. **AI Score**: Relevance and quality metrics
2. **Recency**: Newer videos get slight boost
3. **Channel Authority**: Trusted channels weighted higher

### Filtering Options

- **Date Range**: Last 24 hours, 7 days, 30 days
- **Profile Filter**: Show specific profiles only
- **Score Threshold**: Minimum score for inclusion

---

## Mobile Experience

TubeRank is fully responsive and optimized for mobile devices.

### Mobile Navigation

- **Hamburger Menu**: Collapsible navigation on small screens
- **Bottom Navigation**: Quick access to main sections
- **Swipe Gestures**: Navigate between pages and columns

### Touch Optimizations

- **44px Touch Targets**: All interactive elements meet accessibility standards
- **Swipe to Refresh**: Pull-down refresh on lists and boards
- **Haptic Feedback**: Vibration on drag operations (iOS/Android)

### Mobile Kanban

- **Horizontal Scroll**: Swipe between columns
- **Column Tabs**: Quick column switching
- **Optimized Cards**: Larger text and buttons for touch

---

## Tips & Best Practices

### Profile Organization

**Focused Profiles**:
- Create specific profiles for different interests
- Use descriptive names and descriptions
- Keep source lists manageable (5-10 channels per profile)

**Regular Maintenance**:
- Review and clean up sources monthly
- Archive completed videos regularly
- Adjust score thresholds based on content quality

### Workflow Efficiency

**Triage Strategy**:
1. **Quick Scan**: Review Inbox daily, move obvious candidates
2. **Batch Processing**: Handle similar videos together
3. **Time Boxing**: Set limits for each column review
4. **Regular Archives**: Don't let columns overflow

**Keyboard Shortcuts**:
- **Arrow Keys**: Navigate between cards
- **Space**: Move card to next column
- **Delete**: Archive current card
- **R**: Refresh current view

### Content Quality

**Score Interpretation**:
- **90-100**: Exceptional content, high priority
- **75-89**: Good content, worth watching
- **60-74**: Average content, skim or skip
- **Below 60**: Low quality, consider archiving

**Channel Curation**:
- Monitor channel performance in analytics
- Remove consistently low-scoring channels
- Add new channels based on recommendations

### Performance Optimization

**Reduce Load Times**:
- Archive old videos regularly (older than 30 days)
- Limit active profiles to essential ones
- Use specific keywords rather than broad terms

**Manage Notifications**:
- Set appropriate score thresholds for digests
- Configure digest frequency to avoid overload
- Use profile-specific settings for different content types

---

## Troubleshooting

### Common Issues

**Videos Not Appearing**:
1. Check if profile is active
2. Verify channel URLs are correct
3. Try manual refresh
4. Check RSS feed accessibility

**Slow Performance**:
1. Archive old videos
2. Reduce number of active sources
3. Clear browser cache
4. Check internet connection

**Drag & Drop Not Working**:
1. Ensure JavaScript is enabled
2. Try refreshing the page
3. Check for browser compatibility
4. Disable browser extensions temporarily

### Getting Help

- **Health Check**: Visit `/api/health` for system status
- **Error Logs**: Check browser console for errors
- **Documentation**: Refer to API docs for technical details
- **Community**: Join discussions and report issues

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | Create new profile |
| `R` | Refresh current view |
| `Ctrl/Cmd + R` | Force refresh all data |
| `Arrow Keys` | Navigate cards |
| `Space` | Move card to next column |
| `Delete` | Archive selected card |
| `Ctrl/Cmd + A` | Select all cards in column |
| `Escape` | Clear selection |
| `?` | Show keyboard shortcuts |

---

*This guide covers TubeRank v1.0. Features and interface may evolve with updates.*