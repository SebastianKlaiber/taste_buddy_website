import { createClient } from '@supabase/supabase-js';

// Runtime client creation to prevent credentials from being embedded in build output
export function getSupabaseClient() {
  // Only create the client at runtime when these variables are available
  // This prevents the values from being embedded in the build output
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Fetches recipe data by ID from the share_recipe table
 * @param {string|number} id - The recipe ID to fetch
 * @returns {Promise<Object|null>} - The recipe data or null if not found
 */
export async function getSharedRecipeById(id) {
  try {
    // Convert string ID to number if needed
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(numericId)) {
      console.error('Invalid recipe ID:', id);
      return null;
    }
    
    // Get a fresh client for each request
    const supabase = getSupabaseClient();
    
    // Query the share_recipe table
    const { data, error } = await supabase
      .from('share_recipe')
      .select('*')
      .eq('id', numericId)
      .single();
      
    if (error) {
      console.error('Error fetching recipe:', error);
      return null;
    }
    
    // Check if recipe has expired
    if (data.expired_at && new Date(data.expired_at) < new Date()) {
      console.log('Recipe has expired:', numericId);
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