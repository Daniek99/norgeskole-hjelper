-- Insert a test daily word "Frukt" for demonstration
INSERT INTO public.daily_words (norwegian, theme, date, classroom_id, approved)
VALUES ('Frukt', null, CURRENT_DATE, (SELECT id FROM public.classrooms LIMIT 1), true)
ON CONFLICT (classroom_id, date) DO UPDATE SET
  norwegian = EXCLUDED.norwegian,
  theme = EXCLUDED.theme,
  approved = EXCLUDED.approved;