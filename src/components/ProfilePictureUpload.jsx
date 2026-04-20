import { useState } from "react";
import { createPortal } from "react-dom";
import { storage, ref, uploadBytes, getDownloadURL, db, doc, updateDoc } from "../firebase.js";
import { Camera, X } from "lucide-react";
import Cropper from "react-easy-crop";
import ProfileImage from "./ProfileImage";

// ── Portal Component ──────────────────────────────────
const Portal = ({ children }) => {
  return createPortal(children, document.body);
};

// ── Helper: getCroppedImg ──────────────────────────────
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/jpeg");
  });
}

export default function ProfilePictureUpload({ userId, currentPhotoURL, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const [showCrop, setShowCrop] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
        setShowCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    if (!croppedArea || !image) return;
    setLoading(true);
    setShowCrop(false);
    try {
      const croppedBlob = await getCroppedImg(image, croppedArea);
      if (!croppedBlob) throw new Error("Failed to crop image");

      const storageRef = ref(storage, `profilePictures/${userId}/${Date.now()}.jpg`);
      await uploadBytes(storageRef, croppedBlob);
      const downloadURL = await getDownloadURL(storageRef);

      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, { photoURL: downloadURL });

      onUpdate(downloadURL);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Imeshindwa kupakia picha. Jaribu tena.");
    } finally {
      setLoading(false);
      setImage(null);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center shrink-0">
      <div className="relative group p-1.5 bg-gradient-to-br from-white/20 via-transparent to-white/5 rounded-[40px] shadow-2xl">
        {/* Outer Glow Ring */}
        <div className="absolute -inset-4 bg-[#F5A623]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {/* Profile Image Container */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-[36px] overflow-hidden border border-white/10 bg-[#05060a] transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(245,166,35,0.15)] group-hover:border-[#F5A623]/30">
          <div className="w-full h-full p-1.5">
            <div className="w-full h-full rounded-[30px] overflow-hidden bg-white/[0.02]">
              <ProfileImage
                src={currentPhotoURL}
                alt="Profile"
                userId={userId}
                className="w-full h-full scale-[1.01]"
              />
            </div>
          </div>
          
          {/* Subtle Overlay Pattern */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_120%,rgba(245,166,35,0.1),transparent_70%)]" />
        </div>

        {/* Edit Button Overlay */}
        <label className="absolute -right-2 -bottom-2 w-12 h-12 bg-[#F5A623] hover:bg-[#FFD17C] text-[#111] rounded-2xl flex items-center justify-center cursor-pointer shadow-2xl transition-all duration-300 hover:scale-110 hover:rotate-6 active:scale-95 border-[6px] border-[#0e101a] z-10 group/btn">
          <Camera size={20} strokeWidth={2.5} className="transition-transform group-hover/btn:scale-110" />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFile}
            disabled={loading}
          />
        </label>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#05060a]/90 backdrop-blur-md rounded-[36px]">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-[#F5A623]/20 border-t-[#F5A623] rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-[#F5A623] rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Crop Modal */}
      {showCrop && (
        <Portal>
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-[#040509]/95 backdrop-blur-2xl">
            <div className="relative w-full max-w-md bg-[#0e101a] rounded-[40px] border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-7 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-black text-white tracking-tight">Kata Picha</h3>
                <button 
                  onClick={() => setShowCrop(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="relative h-[350px] bg-black">
                <Cropper
                  image={image}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, c) => setCroppedArea(c)}
                />
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Zoom</span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-[#F5A623]"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCrop(false)}
                    className="flex-1 h-14 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
                  >
                    Ghairi
                  </button>
                  <button
                    onClick={handleCropSave}
                    className="flex-[2] h-14 rounded-2xl bg-[#F5A623] text-[#111] font-black hover:bg-[#FFD17C] transition-all active:scale-95"
                  >
                    Kamilisha
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
