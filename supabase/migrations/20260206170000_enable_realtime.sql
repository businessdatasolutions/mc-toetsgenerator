-- Enable Realtime for exams table so the dashboard auto-updates
-- when analysis_status changes from 'processing' to 'completed'
ALTER PUBLICATION supabase_realtime ADD TABLE exams;
