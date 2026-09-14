-- Migration: 001_create_duties_table.sql
-- Description: Create the main duties table
-- Created: 2026-09-14

-- Create duties table
CREATE TABLE IF NOT EXISTS duties (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE,
    end_date DATE,
    notes TEXT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_duties_status ON duties(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_duties_priority ON duties(priority) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_duties_completed ON duties(completed) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_duties_end_date ON duties(end_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_duties_created_at ON duties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_duties_deleted_at ON duties(deleted_at);

-- Add comments
COMMENT ON TABLE duties IS 'Main duties/tasks table for the application';
COMMENT ON COLUMN duties.status IS 'Status: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN duties.priority IS 'Priority: low, medium, high, urgent';
COMMENT ON COLUMN duties.deleted_at IS 'Soft delete - if set, duty is considered deleted';
COMMENT ON COLUMN duties.completed_at IS 'Exact timestamp when duty was marked as completed';
