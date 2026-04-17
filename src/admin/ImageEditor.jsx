import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

export default function ImageEditor({ image, onSave, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(16 / 9);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    console.log("Starting crop process for:", imageSrc.substring(0, 50) + "...");
    const img = new Image();
    img.crossOrigin = 'anonymous'; 
    
    const cacheBuster = imageSrc.includes('data:') ? '' : (imageSrc.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
    img.src = imageSrc + cacheBuster;
    
    await new Promise((resolve, reject) => { 
      img.onload = () => {
        console.log("Image loaded for cropping");
        resolve();
      };
      img.onerror = () => {
        console.error("Image failed to load for cropping");
        reject(new Error('Picha imeshindwa kupakia. Huenda imezuiwa na security (CORS). Jaribu kupakua picha na kui-upload badala ya kutumia link.'));
      };
    });

    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    try {
      ctx.drawImage(
        img,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      console.log("Canvas draw successful");
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (e) {
      console.error("Canvas draw error:", e);
      throw new Error("Imeshindwa ku-crop picha hii kwa sababu ya usalama (CORS). Tafadhali pakua picha kwanza kisha i-upload.", { cause: e });
    }
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      console.warn("No cropped area pixels defined");
      return;
    }
    
    setSaving(true);
    console.log("handleSave triggered");
    
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      console.log("Cropped image generated, calling onSave");
      await onSave(croppedImage);
      console.log("onSave completed successfully");
    } catch (err) {
      console.error("Error in handleSave:", err);
      const useOriginal = window.confirm(err.message + "\n\nJe, unataka kutumia picha halisi bila ku-crop?");
      if (useOriginal) {
        console.log("User chose to use original image due to error");
        await onSave(image);
      }
    } finally {
      console.log("handleSave finished, setting saving to false");
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'relative', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', padding: 20 }}>
      <div style={{ position: 'relative', flex: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div style={{ maxWidth: 400, margin: '20px auto', width: '100%' }}>
        <div style={{ color: '#fff', fontSize: 12, marginBottom: 8, textAlign: 'center', opacity: 0.6 }}>Zoom: {Math.round(zoom * 100)}%</div>
        <input
          type="range"
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          aria-labelledby="Zoom"
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          style={{ width: '100%', cursor: 'pointer', accentColor: '#F5A623' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setAspect(16 / 9)} style={{ padding: '8px 16px', fontSize: 13, background: aspect === 16/9 ? '#F5A623' : 'rgba(255,255,255,0.1)', color: aspect === 16/9 ? '#000' : '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>16:9</button>
        <button onClick={() => setAspect(4 / 3)} style={{ padding: '8px 16px', fontSize: 13, background: aspect === 4/3 ? '#F5A623' : 'rgba(255,255,255,0.1)', color: aspect === 4/3 ? '#000' : '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>4:3</button>
        <button onClick={() => setAspect(1 / 1)} style={{ padding: '8px 16px', fontSize: 13, background: aspect === 1/1 ? '#F5A623' : 'rgba(255,255,255,0.1)', color: aspect === 1/1 ? '#000' : '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>1:1</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
        <button 
          onClick={() => {
            console.log("Cancel clicked");
            onCancel();
          }} 
          disabled={saving}
          style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}
        >
          Ghairi
        </button>
        <button 
          onClick={handleSave} 
          disabled={saving}
          style={{ padding: '12px 32px', background: '#F5A623', color: '#000', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 800, minWidth: 120 }}
        >
          {saving ? 'Inahifadhi...' : 'Hifadhi Picha'}
        </button>
      </div>
    </div>
  );
}
