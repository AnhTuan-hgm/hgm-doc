import { supabase } from "@/lib/supabase";
import { firestore } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { dbLogger } from "@/lib/db-logger";

export type DbOperation = "read" | "write";

/**
 * Attempts Supabase first, falls back to Firebase if Supabase fails.
 * Used for reading SOP pages (owner guides, templates).
 */
export async function readSopPage(slug: string) {
  try {
    // Try Supabase first (primary)
    const { data, error } = await supabase
      .from("sop_pages")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data;
  } catch (sbError) {
    dbLogger.error(`Supabase read failed for ${slug}, trying Firebase`, sbError as Error);
    dbLogger.fallback("sop_pages", "Supabase unavailable");

    try {
      // Fallback to Firebase
      const docRef = doc(firestore, "sop_pages", slug);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        throw new Error("Document not found in Firebase either");
      }
    } catch (fbError) {
      dbLogger.error(`Firebase fallback also failed for ${slug}`, fbError as Error);
      throw new Error("Failed to read from both Supabase and Firebase");
    }
  }
}

/**
 * Dual-write: writes to Supabase first, then writes to Firebase as backup.
 * Used for saving owner guide updates.
 */
export async function writeSopPage(slug: string, data: any) {
  let sbSuccess = false;
  let fbSuccess = false;

  try {
    // Write to Supabase (primary)
    dbLogger.dualWrite("sop_pages", "update", "supabase");
    const { error: sbError } = await supabase
      .from("sop_pages")
      .upsert({ slug, data, updated_at: new Date().toISOString() });

    if (sbError) throw sbError;
    dbLogger.success(`sop_pages:${slug} written to Supabase`);
    sbSuccess = true;
  } catch (sbErr) {
    dbLogger.error(`Supabase write failed for ${slug}`, sbErr as Error);
  }

  try {
    // Always write to Firebase as backup (even if Supabase succeeded)
    dbLogger.dualWrite("sop_pages", "update", "firebase");
    const docRef = doc(firestore, "sop_pages", slug);
    await setDoc(docRef, { ...data, updated_at: new Date().toISOString() });
    dbLogger.success(`sop_pages:${slug} written to Firebase`);
    fbSuccess = true;
  } catch (fbErr) {
    dbLogger.error(`Firebase write failed for ${slug}`, fbErr as Error);
  }

  // At least one DB must succeed
  if (!sbSuccess && !fbSuccess) {
    throw new Error("Failed to write to both Supabase and Firebase");
  }

  return { sbSuccess, fbSuccess };
}

/**
 * Check which DB is currently available (for diagnostics).
 */
export async function checkDbHealth() {
  const health = { supabase: false, firebase: false };

  try {
    const { error } = await supabase
      .from("sop_pages")
      .select("count", { count: "exact", head: true });
    health.supabase = !error;
  } catch {
    health.supabase = false;
  }

  try {
    await getDoc(doc(firestore, "sop_pages", "_health"));
    health.firebase = true;
  } catch {
    health.firebase = false;
  }

  return health;
}
