// Resize phone photos before saving or uploading: one small JPEG, no original metadata.
export async function prepareAvatar(file: File): Promise<{ file: File; dataUrl: string }> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choisissez une photo au format JPG, PNG ou WebP.');
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Cette photo est trop volumineuse. Choisissez une image de moins de 20 Mo.');
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Impossible de lire cette photo. Essayez une autre image.'));
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Cette image est vide. Choisissez une autre photo.');
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Votre navigateur n’a pas pu préparer la photo. Réessayez.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      value => value ? resolve(value) : reject(new Error('Impossible de préparer cette photo. Réessayez.')),
      'image/jpeg', 0.85,
    ));
    return { file: new File([blob], 'photo-profil.jpg', { type: 'image/jpeg' }), dataUrl };
  } finally { URL.revokeObjectURL(url); }
}
