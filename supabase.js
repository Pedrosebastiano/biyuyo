import { createClient } from '@supabase/supabase-js';

// URL de tu proyecto
const supabaseUrl = "https://pmjjguyibxydzxnofcjx.supabase.co";

// ¡NUEVA CLAVE - ÚSALA!
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtampndXlpYnh5ZHp4bm9mY2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwODE2NTAsImV4cCI6MjA4NTY1NzY1MH0.ZYTzwvzdcjgiiJHollA7vyNZ7ZF8hIN1NuTOq5TdtjI";
export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadImage = async (file, bucket = 'factura', folder = 'imagenes') => {
    try {
        // Verificar que el archivo es una imagen
        if (!file.type.match('image.*')) {
            throw new Error('Solo se permiten archivos de imagen');
        }

        // Generar nombre único para el archivo
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        // Subir el archivo directamente (asumiendo que el bucket ya existe)
        const { error: uploadError } = await supabase
            .storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type
            });

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase
            .storage
            .from(bucket)
            .getPublicUrl(filePath);
        
        return publicUrl;
    } catch (error) {
        console.error("Error al subir la imagen:", error);
        throw new Error(`Error al subir imagen: ${error.message}`);
    }
};