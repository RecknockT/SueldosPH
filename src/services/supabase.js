import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://bukxxbirnmffavutagrz.supabase.co"

const supabaseKey = "sb_publishable_U3opGhSpMKqWaDsCpMX1-Q_U_Mz6f_k"

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)