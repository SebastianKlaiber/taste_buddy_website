import { createClient } from '@supabase/supabase-js';

// Runtime client creation to prevent credentials from being embedded in build output
export function getSupabaseClient() {
  // Only create the client at runtime when these variables are available
  // This prevents the values from being embedded in the build output
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getSharedRecipeByToken(token) {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase public credentials');
    return null;
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/shared-recipe`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${supabaseAnonKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (response.status === 404 || response.status === 410) {
    return null;
  }

  if (!response.ok) {
    console.error('Error fetching shared recipe:', response.status, await response.text());
    return null;
  }

  return response.json();
}

/**
 * Fetches recipe data from the share_recipe table.
 * Current app share URLs use the UUID share_token. Numeric IDs are kept as a
 * legacy fallback for older links.
 * @param {string|number} id - The share token or legacy recipe ID to fetch
 * @returns {Promise<Object|null>} - The recipe data or null if not found
 */
export async function getSharedRecipeById(id) {
  try {
    const shareId = String(id ?? '').trim();

    if (!shareId) {
      console.error('Invalid recipe ID:', id);
      return null;
    }

    if (uuidPattern.test(shareId)) {
      return await getSharedRecipeByToken(shareId);
    }

    if (!/^\d+$/.test(shareId)) {
      console.error('Invalid recipe ID:', id);
      return null;
    }

    // Get a fresh client for each request
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('share_recipe')
      .select('*')
      .eq('id', Number(shareId))
      .maybeSingle();

    if (error) {
      console.error('Error fetching legacy shared recipe:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Check if recipe has expired
    if (data.expired_at && new Date(data.expired_at) < new Date()) {
      console.log('Recipe has expired:', shareId);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error fetching recipe:', err);
    return null;
  }
}

/**
 * Fetches recipe data directly from the recipes table
 * @param {string|number} id - The recipe ID to fetch
 * @returns {Promise<Object|null>} - The formatted recipe data or null if not found
 */
export async function getRecipeById(id) {
  try {
    // Convert string ID to number if needed
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(numericId)) {
      console.error('Invalid recipe ID:', id);
      return null;
    }
    
    // Get a fresh client for each request
    const supabase = getSupabaseClient();
    
    // Query the recipes table with joined cuisine data
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        cuisine:cuisine_id (
          name
        ),
        ingredients:recipe_ingredients (
          id,
          amount,
          unit,
          ingredient:ingredient_id (
            name
          )
        ),
        instructions:recipe_instructions (
          id,
          step_number,
          instruction,
          time
        )
      `)
      .eq('id', numericId)
      .single();
      
    if (error) {
      console.error('Error fetching recipe from recipes table:', error);
      return null;
    }
    
    // Format the recipe data to match the expected structure
    return {
      id: data.id,
      created_at: data.created_at,
      recipe: {
        title: data.title,
        description: data.description,
        prepTime: data.preparation_time ? `${data.preparation_time} Min` : undefined,
        cookTime: data.cooking_time ? `${data.cooking_time} Min` : undefined,
        servings: data.servings,
        image_url: data.image_url,
        cuisine: data.cuisine?.name,
        level: data.level,
        equipment: data.equipment ? data.equipment.split(',').map(item => item.trim()) : [],
        ingredients: data.ingredients?.map(ing => ({
          name: `${ing.amount || ''} ${ing.unit || ''} ${ing.ingredient?.name || ''}`.trim()
        })) || [],
        instructions: data.instructions?.sort((a, b) => a.step_number - b.step_number)
          .map(step => step.instruction) || [],
        nutrition_values: data.nutrition_values
      }
    };
  } catch (err) {
    console.error('Unexpected error fetching recipe from recipes table:', err);
    return null;
  }
}
