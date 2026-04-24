import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Get VPN config URL for a specific user from their own user doc.
 * PREFERRED approach: pass userId so we look up the real assigned configLink.
 */
export const getVpnConfig = async (userId?: string): Promise<string> => {
  if (userId) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const vpn = userSnap.data().vpn;
      if (vpn?.configLink) {
        return vpn.configLink;
      }
    }
    throw new Error('Hakuna config iliyopatikana kwa akaunti yako. Tafadhali wasiliana na admin.');
  }
  throw new Error('User ID inahitajika kupata config ya VPN.');
};
