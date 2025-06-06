import { useState, useEffect } from "react";
import { AvatarImage } from "./avatar";

// Componente optimizado para mostrar imágenes de avatar con manejo especial para Google
export function GoogleAvatarImage({ src, alt, ...props }: React.ComponentPropsWithoutRef<typeof AvatarImage>) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  
  useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }
    
    // Función para validar y optimizar la URL
    const processImageUrl = (url: string) => {
      // Optimizar URLs de Google para evitar problemas de CORS y tamaño
      if (url.includes('googleusercontent') && url.includes('=')) {
        return url.split('=')[0] + '=s400-c';
      }
      
      return url;
    };
    
    const optimizedSrc = processImageUrl(src);
    setProcessedSrc(optimizedSrc);
    
    // Si la URL es de Google Cloud Storage, intentaremos cargarla, pero no bloquearemos
    // la renderización en caso de error
    if (optimizedSrc.includes('storage.googleapis.com')) {
      setImageLoaded(true);
      setLoading(false);
      return;
    }
    
    // Para otras URLs, verificamos si se pueden cargar
    const img = new Image();
    
    img.onload = () => {
      setImageLoaded(true);
      setLoading(false);
    };
    
    img.onerror = () => {
      console.error("Error al cargar la imagen:", optimizedSrc);
      setImageLoaded(false);
      setLoading(false);
    };
    
    img.src = optimizedSrc;
    
    // Timeout para evitar esperar indefinidamente
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("Timeout al cargar la imagen:", optimizedSrc);
        setImageLoaded(true); // Intentaremos mostrarla de todos modos
        setLoading(false);
      }
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [src, loading]);
  
  if (loading) return null;
  
  return imageLoaded ? (
    <AvatarImage 
      src={processedSrc || ""} 
      alt={alt || "Avatar de usuario"}
      referrerPolicy="no-referrer"
      {...props}
    />
  ) : null;
} 