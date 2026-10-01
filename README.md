# Personal Dashboard

A personal productivity **PWA** for managing tasks, reading lists, notes, ideas and long-term challenges.

The application combines local-first behaviour with authenticated cloud synchronization through Supabase.

## Features

- task and note management
- reading and idea tracking
- authenticated user accounts
- local IndexedDB storage
- Supabase synchronization
- Row Level Security
- installable PWA
- offline application shell
- personal challenge tracking
- automatic deployment

## Tech stack

- HTML
- CSS
- JavaScript
- IndexedDB
- Supabase
- PostgreSQL
- Supabase Auth
- Netlify
- Progressive Web App APIs

## Architecture

The application follows a lightweight local-first approach.

**Client**
- static web application
- IndexedDB for local persistence
- service worker for PWA behaviour

**Backend**
- Supabase Auth
- PostgreSQL persistence
- Row Level Security
- synchronization of authenticated user data

Each database row is associated with a user ID and protected through RLS policies.

## Challenge module

The project also contains a dedicated long-term challenge module with:

- day-based progress tracking
- local private photo storage
- metadata synchronization
- calendar-day calculations using the `Europe/Lisbon` timezone
- browser notification support while the application is running

## Deployment

The application is deployed automatically through Netlify from the `main` branch.
