-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_timezone TEXT;
BEGIN
  -- Try to get timezone from browser (default to UTC if not available)
  -- In practice, this will be set via the app, but we initialize with UTC
  user_timezone := COALESCE(current_setting('app.user_timezone', true), 'UTC');
  
  INSERT INTO public.profiles (id, timezone)
  VALUES (NEW.id, user_timezone);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

