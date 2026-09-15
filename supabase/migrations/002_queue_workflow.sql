-- ==========================================================================
-- Queue Assignment Workflow Update
-- ==========================================================================

-- 1. Modify production_jobs table
ALTER TABLE public.production_jobs
  ALTER COLUMN production_date DROP NOT NULL,
  ALTER COLUMN queue_number DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'ready')),
  ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Update existing jobs to be 'ready' if they have a queue number
UPDATE public.production_jobs
  SET status = 'ready'
  WHERE queue_number IS NOT NULL AND status = 'preparing';

-- 2. Create start_file_preparation RPC
CREATE OR REPLACE FUNCTION public.start_file_preparation(
  p_order_id text,
  p_staff_id uuid
) RETURNS public.production_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job public.production_jobs;
BEGIN
  -- If an active job already exists, return it
  SELECT * INTO v_job
    FROM public.production_jobs
    WHERE order_id = p_order_id AND is_active = true;
  IF FOUND THEN
    RETURN v_job;
  END IF;

  -- Otherwise create a new preparing job without a queue
  INSERT INTO public.production_jobs (
    order_id, 
    status,
    preparation_started_by, 
    preparation_started_at
  )
  VALUES (
    p_order_id, 
    'preparing',
    p_staff_id, 
    now()
  )
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$;

-- 3. Create finalize_production_job RPC
CREATE OR REPLACE FUNCTION public.finalize_production_job(
  p_job_id uuid,
  p_staff_id uuid
) RETURNS public.production_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job public.production_jobs;
  v_today date;
  v_next_queue integer;
BEGIN
  -- Lock the row for update to prevent concurrent race conditions on the same job
  SELECT * INTO v_job
    FROM public.production_jobs
    WHERE id = p_job_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Production job not found';
  END IF;

  -- If it already has a queue number and is ready, return it idempotently
  IF v_job.status = 'ready' AND v_job.queue_number IS NOT NULL THEN
    RETURN v_job;
  END IF;

  -- Always derive "today" from America/New_York
  v_today := (now() AT TIME ZONE 'America/New_York')::date;

  -- Atomically increment the daily counter
  INSERT INTO public.daily_queue_counters (production_date, last_queue_number)
  VALUES (v_today, 1)
  ON CONFLICT (production_date)
  DO UPDATE SET last_queue_number = public.daily_queue_counters.last_queue_number + 1
  RETURNING last_queue_number INTO v_next_queue;

  -- Update the job with queue and finalization details
  UPDATE public.production_jobs SET
    production_date = v_today,
    queue_number = v_next_queue,
    status = 'ready',
    completed_by = p_staff_id,
    completed_at = now(),
    updated_at = now()
  WHERE id = p_job_id
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$;
