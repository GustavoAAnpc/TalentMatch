import { AutenticacionRequest, AutenticacionResponse, ErrorResponse, RegistroRequest } from '@/types/auth';
import Cookies from 'js-cookie';

const API_URL = 'http://localhost:8080/api';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const COOKIE_EXPIRY = 7; // días

/**
 * Servicio para manejar la autenticación de usuarios
 */
export const authService = {
    /**
     * Inicia sesión con credenciales de email y contraseña
     */
    login: async (credentials: AutenticacionRequest): Promise<AutenticacionResponse> => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const errorData: ErrorResponse = await response.json();
                throw new Error(errorData.mensaje);
            }

            const data: AutenticacionResponse = await response.json();
            
            // Guardar datos de autenticación
            authService.guardarDatosAutenticacion(data);
            
            return data;
        } catch (error) {
            console.error("Error durante el login:", error);
            throw error;
        }
    },

    /**
     * Cierra la sesión del usuario
     */
    logout: () => {
        // Limpiar cookies y localStorage
        Cookies.remove('token');
        Cookies.remove('usuario');
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = '/login';
    },

    /**
     * Obtiene el token JWT almacenado
     */
    getToken: (): string | null => {
        return Cookies.get('token') || localStorage.getItem(TOKEN_KEY);
    },

    /**
     * Obtiene los datos del usuario autenticado
     */
    getUsuario: () => {
        const usuarioCookie = Cookies.get('usuario');
        let usuario = null;
        
        if (usuarioCookie) {
            try {
                usuario = JSON.parse(usuarioCookie);
            } catch (e) {
                console.error("Error al parsear usuario de cookie:", e);
                // Si hay error al parsear, intentamos con localStorage
                const usuarioLS = localStorage.getItem(USER_KEY);
                if (usuarioLS) {
                    try {
                        usuario = JSON.parse(usuarioLS);
                    } catch (e) {
                        console.error("Error al parsear usuario de localStorage:", e);
                    }
                }
            }
        } else {
            // Si no hay cookie, intentamos con localStorage
            const usuarioLS = localStorage.getItem(USER_KEY);
            if (usuarioLS) {
                try {
                    usuario = JSON.parse(usuarioLS);
                } catch (e) {
                    console.error("Error al parsear usuario de localStorage:", e);
                }
            }
        }
        
        return usuario;
    },

    /**
     * Verifica si el usuario está autenticado
     */
    isAuthenticated: (): boolean => {
        return !!Cookies.get('token');
    },
    
    /**
     * Registra un nuevo usuario
     */
    registrar: async (datosRegistro: RegistroRequest): Promise<AutenticacionResponse> => {
        try {
            const respuesta = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datosRegistro),
            });

            if (!respuesta.ok) {
                const datosError: ErrorResponse = await respuesta.json();
                throw new Error(datosError.mensaje);
            }

            const datos: AutenticacionResponse = await respuesta.json();
            
            // Guardar datos de autenticación
            authService.guardarDatosAutenticacion(datos);
            
            return datos;
        } catch (error) {
            console.error("Error durante el registro:", error);
            throw error;
        }
    },

    /**
     * Obtiene la información del usuario actual desde localStorage
     */
    getUsuarioActual: () => {
        const userData = localStorage.getItem(USER_KEY);
        if (!userData) return null;
        
        try {
            return JSON.parse(userData);
        } catch (error) {
            console.error('Error al parsear datos del usuario:', error);
            return null;
        }
    },

    /**
     * Actualiza la información del usuario actual en localStorage y cookies
     */
    actualizarUsuarioActual: (usuario: any) => {
        if (!usuario || !usuario.id) {
            console.error("Datos de usuario inválidos para actualización:", usuario);
            return;
        }
        
        try {
            // Actualizar en localStorage
            localStorage.setItem(USER_KEY, JSON.stringify(usuario));
            
            // Actualizar en cookies
            Cookies.set('usuario', JSON.stringify(usuario), { expires: COOKIE_EXPIRY });
            
            console.log("Datos de usuario actualizados correctamente");
        } catch (error) {
            console.error("Error al actualizar datos del usuario:", error);
        }
    },

    /**
     * Registra un nuevo candidato
     */
    registrarCandidato: async (datosRegistro: { 
        nombre: string;
        apellido: string;
        email: string;
        password: string;
        confirmacionPassword: string;
    }) => {
        try {
            const respuesta = await fetch(`${API_URL}/auth/registro/candidato`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosRegistro)
            });

            if (!respuesta.ok) {
                const error = await respuesta.json();
                throw new Error(error.mensaje || 'Error al registrar candidato');
            }

            return await respuesta.json();
        } catch (error) {
            console.error('Error en registrarCandidato:', error);
            throw error;
        }
    },

    /**
     * Inicia el proceso de autenticación con Google
     */
    loginConGoogle: async () => {
        try {
            return await authService.iniciarAutenticacionOAuth2('google');
        } catch (error) {
            console.error('Error en loginConGoogle:', error);
            throw error;
        }
    },

    /**
     * Inicia el proceso de autenticación con GitHub
     */
    loginConGithub: async () => {
        try {
            return await authService.iniciarAutenticacionOAuth2('github');
        } catch (error) {
            console.error('Error en loginConGithub:', error);
            throw error;
        }
    },

    /**
     * Inicia el proceso de autenticación OAuth2 con el proveedor especificado
     */
    iniciarAutenticacionOAuth2: async (provider: string) => {
        try {
            const respuesta = await fetch(`${API_URL}/oauth2/authorization/${provider}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!respuesta.ok) {
                const error = await respuesta.json();
                throw new Error(error.mensaje || `Error al iniciar autenticación con ${provider}`);
            }

            const { authorizationUrl } = await respuesta.json();
            
            console.log(`URL de autorización de ${provider}:`, authorizationUrl);
            
            // Redirigir al usuario a la URL de autorización
            window.location.href = authorizationUrl;
        } catch (error) {
            console.error(`Error al iniciar autenticación con ${provider}:`, error);
            throw error;
        }
    },

    /**
     * Maneja el callback de OAuth2 después de la autorización
     */
    manejarCallbackOAuth2: async (provider: string, code: string): Promise<AutenticacionResponse> => {
        try {
            console.log(`Procesando callback de ${provider} con código:`, code);
            
            const callbackUrl = `${API_URL}/oauth2/callback/${provider}?code=${code}`;
            
            const respuesta = await fetch(callbackUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!respuesta.ok) {
                const error = await respuesta.json();
                throw new Error(error.mensaje || `Error en autenticación con ${provider}`);
            }

            const datos = await respuesta.json();
            
            // Guardar datos de autenticación
            authService.guardarDatosAutenticacion(datos);
            
            return datos;
        } catch (error) {
            console.error('Error en manejarCallbackOAuth2:', error);
            throw error;
        }
    },
    
    /**
     * Guarda los datos de autenticación en cookies y localStorage
     */
    guardarDatosAutenticacion: (datos: AutenticacionResponse) => {
        if (!datos || !datos.token || !datos.usuario) {
            console.error("Datos de autenticación inválidos:", datos);
            return;
        }
        
        // Registrar la URL de la foto para depuración
        console.log(`Datos de autenticación - URL de foto: ${datos.usuario.urlFoto}`);
        
        // Guardar token
        Cookies.set('token', datos.token, { expires: COOKIE_EXPIRY });
        localStorage.setItem(TOKEN_KEY, datos.token);
        
        // Guardar datos de usuario
        const usuarioData = {
            id: datos.usuario.id,
            nombre: datos.usuario.nombre,
            apellido: datos.usuario.apellido,
            email: datos.usuario.email,
            rol: datos.usuario.rol,
            urlFoto: datos.usuario.urlFoto
        };
        
        Cookies.set('usuario', JSON.stringify(usuarioData), { expires: COOKIE_EXPIRY });
        localStorage.setItem(USER_KEY, JSON.stringify(usuarioData));
        
        console.log("Datos de autenticación guardados correctamente");
    }
}; 