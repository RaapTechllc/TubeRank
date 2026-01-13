# Tomorrow's Work Plan - January 13, 2026

## 🎯 Goal: Complete TubeRank (15% remaining)

### Priority 1: Channel Management UI (2-3 hours)

#### Task 1: Add Channel Form
- Create `/profiles/[id]/channels/new` page
- Form to add YouTube channel by URL or ID
- Channel validation and preview
- Save to `profile_sources` table

#### Task 2: Channel List Management
- Display channels in profile view
- Edit/delete channel functionality
- Channel status indicators (active/inactive)

#### Task 3: Channel Integration
- Connect channel form to RSS processing
- Trigger RSS refresh when channels added
- Show channel statistics (videos, last updated)

### Priority 2: Video Dashboard (2-3 hours)

#### Task 4: Video Display Interface
- Create `/profiles/[id]/videos` page
- List videos from connected channels
- Show video metadata (title, description, published date)
- Display transcript status and content

#### Task 5: Video Management
- Video filtering and search
- Transcript viewing modal
- Video status management (processed/pending)

### Priority 3: Data Flow Testing (1 hour)

#### Task 6: End-to-End Workflow
- Test: Create Profile → Add Channels → Trigger RSS → View Videos
- Verify transcript processing pipeline
- Test job queue functionality

## 🔧 Technical Implementation

### Database Schema (Already Complete)
```sql
profiles → profile_sources → videos → transcripts
```

### API Endpoints Needed
- `POST /api/profiles/[id]/sources` - Add channel to profile
- `GET /api/profiles/[id]/videos` - Get videos for profile
- `DELETE /api/profiles/[id]/sources/[sourceId]` - Remove channel

### UI Components Needed
- Channel form component
- Video list component  
- Transcript viewer modal

## 📋 Success Criteria

- [ ] User can add YouTube channels to profiles
- [ ] User can see videos from their channels
- [ ] User can view video transcripts
- [ ] RSS processing works end-to-end
- [ ] Job queue processes videos automatically

## 🚀 Deployment

Once complete:
- Update PROJECT_STATUS.md to 100%
- Deploy to production
- Announce completion

**Estimated Time: 5-7 hours total**
**Expected Completion: January 13, 2026 EOD**
