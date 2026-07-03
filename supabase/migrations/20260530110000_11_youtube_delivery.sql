-- Phase 8 Migration: YouTube Unlisted Delivery Shift
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS video_source TEXT DEFAULT 'youtube',
  ADD COLUMN IF NOT EXISTS video_id TEXT;
