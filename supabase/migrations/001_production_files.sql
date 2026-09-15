-- ==========================================================================
-- Production File Management — Database Migration
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. DAILY QUEUE COUNTERS
-- Atomic daily counter for production queue numbers.
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.daily_queue_counters (
  production_date  date PRIMARY KEY,
  last_queue_number integer NOT NULL DEFAULT 0
);

ALTER TABLE public.daily_queue_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Queue counters are viewable by authenticated users"
  ON public.daily_queue_counters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Queue counters are insertable by authenticated users"
  ON public.daily_queue_counters FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Queue counters are updatable by authenticated users"
  ON public.daily_queue_counters FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- --------------------------------------------------------------------------
-- 2. PRODUCTION JOBS TABLE
-- Each row represents one production run for an order.
-- An order can have multiple jobs over time (reprints), but only one active.
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.production_jobs (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id               text NOT NULL,
  production_date        date NOT NULL,
  queue_number           integer NOT NULL,
  include_sample         boolean NOT NULL DEFAULT false,
  is_active              boolean NOT NULL DEFAULT true,
  preparation_started_by uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  preparation_started_at timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Safety constraint: no duplicate queue numbers on the same date
ALTER TABLE public.production_jobs
  ADD CONSTRAINT uq_production_jobs_date_queue
  UNIQUE (production_date, queue_number);

-- Partial unique index: only one ACTIVE production job per order
CREATE UNIQUE INDEX idx_production_jobs_active_order
  ON public.production_jobs (order_id)
  WHERE (is_active = true);

CREATE INDEX idx_production_jobs_order_id ON public.production_jobs (order_id);
CREATE INDEX idx_production_jobs_date ON public.production_jobs (production_date);

ALTER TABLE public.production_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Production jobs are viewable by authenticated users"
  ON public.production_jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Production jobs are insertable by authenticated users"
  ON public.production_jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Production jobs are updatable by authenticated users"
  ON public.production_jobs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at
CREATE TRIGGER set_production_jobs_updated_at
  BEFORE UPDATE ON public.production_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- --------------------------------------------------------------------------
-- 3. ORDER FILES TABLE
-- Metadata for production files (design files, shipping labels, etc.).
-- No binary data stored — future uploads go directly to object storage.
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.order_files (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              text NOT NULL,
  production_job_id     uuid NOT NULL REFERENCES public.production_jobs(id) ON DELETE CASCADE,
  file_type             text NOT NULL CHECK (file_type IN ('design', 'shipping_label', 'other')),
  original_filename     text,
  generated_filename    text,
  design_length_inches  integer,
  file_sequence         integer,
  storage_provider      text,
  storage_key           text,
  mime_type             text,
  file_size_bytes       bigint,
  upload_status         text NOT NULL DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed')),
  uploaded_by           uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  completed_at          timestamptz,
  version               integer NOT NULL DEFAULT 1,
  is_active             boolean NOT NULL DEFAULT true
);

CREATE INDEX idx_order_files_order_id ON public.order_files (order_id);
CREATE INDEX idx_order_files_production_job_id ON public.order_files (production_job_id);
CREATE INDEX idx_order_files_type ON public.order_files (file_type);

ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order files are viewable by authenticated users"
  ON public.order_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Order files are insertable by authenticated users"
  ON public.order_files FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Order files are updatable by authenticated users"
  ON public.order_files FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Order files are deletable by authenticated users"
  ON public.order_files FOR DELETE
  TO authenticated
  USING (true);

-- Auto-update updated_at
CREATE TRIGGER set_order_files_updated_at
  BEFORE UPDATE ON public.order_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- --------------------------------------------------------------------------
-- 4. ATOMIC QUEUE ASSIGNMENT FUNCTION
-- Uses INSERT ... ON CONFLICT DO UPDATE ... RETURNING for the counter,
-- then creates the production job. Idempotent: if order already has an
-- active job, returns it without consuming a new queue number.
-- Uses America/New_York timezone explicitly.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.assign_queue_number(
  p_order_id text,
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
  -- Always derive "today" from America/New_York, regardless of server TZ
  v_today := (now() AT TIME ZONE 'America/New_York')::date;

  -- If an active job already exists for this order, return it (idempotent)
  SELECT * INTO v_job
    FROM public.production_jobs
    WHERE order_id = p_order_id AND is_active = true;
  IF FOUND THEN
    RETURN v_job;
  END IF;

  -- Atomically increment the daily counter
  INSERT INTO public.daily_queue_counters (production_date, last_queue_number)
  VALUES (v_today, 1)
  ON CONFLICT (production_date)
  DO UPDATE SET last_queue_number = public.daily_queue_counters.last_queue_number + 1
  RETURNING last_queue_number INTO v_next_queue;

  -- Create the production job
  INSERT INTO public.production_jobs (
    order_id, production_date, queue_number,
    preparation_started_by, preparation_started_at
  )
  VALUES (
    p_order_id, v_today, v_next_queue,
    p_staff_id, now()
  )
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$;
