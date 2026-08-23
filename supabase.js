/**
 * evilfurrybird - Supabase Connection & Data Helpers
 * Replace the placeholder SUPABASE_URL and SUPABASE_ANON_KEY below with your actual keys from https://supabase.com/
 */

const SUPABASE_URL = "https://erzitydtbvkqkyfqtaoo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyeml0eWR0YnZrcWt5ZnF0YW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0OTc0MTcsImV4cCI6MjEwMzA3MzQxN30.V_fZ8S27xl5uZQGN3jPJFNJhJVJ62KNSpYJY7IjjKKo";

// Initialize Supabase Client dynamically
let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (typeof supabase !== "undefined" && SUPABASE_URL && SUPABASE_URL !== "YOUR_SUPABASE_URL_HERE") {
    try {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (err) {
      console.warn("Could not create Supabase client:", err);
    }
  }
  return supabaseClient;
}

/**
 * Fetch all gallery items ordered by display_order or created_at descending
 */
async function fetchGalleryItems() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("gallery_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch error for gallery_items:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Could not connect to Supabase gallery_items:", err);
    return null;
  }
}

/**
 * Fetch commission prices
 */
async function fetchCommissionPrices() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("commission_prices")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.warn("Supabase fetch error for commission_prices:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Could not connect to Supabase commission_prices:", err);
    return null;
  }
}

/**
 * Fetch global site settings (e.g. commission_status)
 */
async function fetchSiteSettings() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("site_settings")
      .select("*");

    if (error) {
      console.warn("Supabase fetch error for site_settings:", error.message);
      return null;
    }
    const settings = {};
    if (data) {
      data.forEach(item => {
        settings[item.key] = item.value;
      });
    }
    return settings;
  } catch (err) {
    console.warn("Could not connect to Supabase site_settings:", err);
    return null;
  }
}

/**
 * Upload a new image to Supabase Storage and insert a record into gallery_items
 */
async function uploadGalleryArtwork(file, title) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client is not configured yet. Please add your credentials in supabase.js");

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `artwork/${fileName}`;

  // 1. Upload to Storage Bucket 'gallery-artwork'
  const { error: uploadError } = await client.storage
    .from("gallery-artwork")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // 2. Get Public URL
  const { data: urlData } = client.storage
    .from("gallery-artwork")
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  // 3. Insert into gallery_items table
  const { data: dbData, error: dbError } = await client
    .from("gallery_items")
    .insert([
      { title: title || "Untitled Artwork", image_url: publicUrl, storage_path: filePath }
    ])
    .select();

  if (dbError) throw dbError;
  return dbData[0];
}

/**
 * Delete a gallery item from database and storage
 */
async function deleteGalleryArtwork(id, storagePath) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client is not configured.");

  // 1. Remove from database
  const { error: dbError } = await client
    .from("gallery_items")
    .delete()
    .eq("id", id);

  if (dbError) throw dbError;

  // 2. Remove file from storage if path exists
  if (storagePath) {
    await client.storage
      .from("gallery-artwork")
      .remove([storagePath]);
  }

  return true;
}

/**
 * Update commission price tier
 */
async function updatePriceTier(id, updates) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client is not configured.");

  const { data, error } = await client
    .from("commission_prices")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) throw error;
  return data[0];
}

/**
 * Update site commission status ('open', 'paused', 'closed')
 */
async function updateCommissionStatus(newStatus) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client is not configured.");

  const { data, error } = await client
    .from("site_settings")
    .upsert({ key: "commission_status", value: newStatus })
    .select();

  if (error) throw error;
  return data[0];
}
