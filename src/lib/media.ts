import logoEmbroidered from '../assets/images/logo_embroidered_hook_1794634340534.jpg';
import teeAcidWashObsidian from '../assets/images/tee_acid_wash_obsidian_1794634342601.jpg';
import teeForestPolo from '../assets/images/tee_forest_polo_1794634341715.jpg';
import teeOpticWashOlive from '../assets/images/tee_optic_wash_olive_1794634342282.jpg';
import teeRegularCream from '../assets/images/tee_regular_cream_1794634343039.jpg';
import pantsBaggyTrack from '../assets/images/pants_baggy_track_1794634342551.jpg';
import womensCropIvory from '../assets/images/womens_crop_ivory_1794634343420.jpg';
import womensOversizedEspresso from '../assets/images/womens_oversized_espresso_1794634344403.jpg';
import heroStreetwearAtelier from '../assets/images/hero_streetwear_atelier_1794634344729.jpg';

export const MEDIA_REGISTRY: Record<string, string> = {
  logo_embroidered_hook: logoEmbroidered,
  tee_acid_wash_obsidian: teeAcidWashObsidian,
  tee_forest_polo: teeForestPolo,
  tee_optic_wash_olive: teeOpticWashOlive,
  tee_regular_cream: teeRegularCream,
  pants_baggy_track: pantsBaggyTrack,
  womens_crop_ivory: womensCropIvory,
  womens_oversized_espresso: womensOversizedEspresso,
  hero_streetwear_atelier: heroStreetwearAtelier,
};

export function resolveMediaUrl(keyOrUrl?: string): string {
  if (!keyOrUrl) return teeAcidWashObsidian;
  if (MEDIA_REGISTRY[keyOrUrl]) {
    return MEDIA_REGISTRY[keyOrUrl];
  }
  return keyOrUrl;
}
