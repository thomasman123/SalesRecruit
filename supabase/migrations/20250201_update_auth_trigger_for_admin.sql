-- Update the auth trigger to handle admin role

-- Update the handle_new_user function to support admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the role from metadata, defaulting to sales-professional
  DECLARE
    user_role TEXT;
  BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'sales-professional');
    
    -- Validate role
    IF user_role NOT IN ('recruiter', 'sales-professional', 'admin') THEN
      user_role := 'sales-professional';
    END IF;
    
    -- Insert into public.users
    INSERT INTO public.users (id, email, name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
      user_role
    ) ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      role = CASE 
        WHEN public.users.role = 'admin' THEN public.users.role -- Don't overwrite admin role
        ELSE EXCLUDED.role 
      END;
    
    -- Add default calendar availability if applicable
    PERFORM add_default_availability_for_user(NEW.id);
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 