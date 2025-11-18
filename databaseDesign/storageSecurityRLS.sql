-- Enable RLS on long_term_storage
ALTER TABLE public.long_term_storage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own files"
ON public.long_term_storage
FOR SELECT
USING (auth.uid() = uid);

CREATE POLICY "Users can insert their own files"
ON public.long_term_storage
FOR INSERT
WITH CHECK (auth.uid() = uid);

CREATE POLICY "Users can update their own files"
ON public.long_term_storage
FOR UPDATE
USING (auth.uid() = uid);

CREATE POLICY "Users can delete their own files"
ON public.long_term_storage
FOR DELETE
USING (auth.uid() = uid);

-- Enable RLS on temp_storage
ALTER TABLE public.temp_storage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own temp files"
ON public.temp_storage
FOR SELECT
USING (auth.uid() = uid);

CREATE POLICY "Users can insert their own temp files"
ON public.temp_storage
FOR INSERT
WITH CHECK (auth.uid() = uid);

CREATE POLICY "Users can update their own temp files"
ON public.temp_storage
FOR UPDATE
USING (auth.uid() = uid);

CREATE POLICY "Users can delete their own temp files"
ON public.temp_storage
FOR DELETE
USING (auth.uid() = uid);