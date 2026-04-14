import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const initVpnConfig = async () => {
  const vpnUrl = "https://e.ee88.tk/6/302f6159ee193a43dfc94ae6f3af6196";
  await setDoc(doc(db, 'vpnConfigs', 'trial'), { configUrl: vpnUrl });
  console.log("VPN config initialized");
};
