import { useAuth } from '../net/auth';
import { characterArt, loadCosmetics } from './cosmetics';
import { progressFor } from './meta';

export function usePlayerPortrait(characterId: string): string {
  const { user } = useAuth();
  return characterArt(characterId, loadCosmetics(progressFor(user), user?.uid));
}
