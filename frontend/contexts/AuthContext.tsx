"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import Cookies from 'js-cookie';

interface Usuario {
    id: number;
    email: string;
    nombre: string;
    apellido: string;
    rol: string;
    urlFoto?: string;
}

interface AuthContextType {
    usuario: Usuario | null;
    isAuthenticated: boolean;
    error: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<any>;
    loginConOAuth2: (provider: string) => Promise<void>;
    logout: () => void;
    clearError: () => void;
    isDemoMode: boolean;
    enableDemoMode: (role?: string) => void;
    setIsAuthenticated: (value: boolean) => void;
    setUsuario: (usuario: Usuario | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(false);
    
    // Efecto para forzar la recarga del estado cuando la URL de la foto cambia
    useEffect(() => {
        if (usuario) {
            console.log("Usuario en el contexto:", usuario);
            console.log("URL de foto actual:", usuario.urlFoto);
        }
    }, [usuario]);

    // Escuchar eventos personalizados para la actualización de la foto de perfil
    useEffect(() => {
        const handleUserPhotoUpdated = (event: any) => {
            if (usuario && event.detail && event.detail.urlFoto) {
                console.log("Evento userPhotoUpdated recibido:", event.detail);
                setUsuario(prevUsuario => {
                    if (!prevUsuario) return null;
                    return {
                        ...prevUsuario,
                        urlFoto: event.detail.urlFoto
                    };
                });
            }
        };
        
        window.addEventListener('userPhotoUpdated', handleUserPhotoUpdated as EventListener);
        
        return () => {
            window.removeEventListener('userPhotoUpdated', handleUserPhotoUpdated as EventListener);
        };
    }, [usuario]);

    useEffect(() => {
        // Cargar estado de autenticación al inicio
        loadAuthState();
    }, []);
    
    /**
     * Carga el estado de autenticación desde cookies/localStorage
     */
    const loadAuthState = () => {
        // Verificar si el modo demo está activado
        const demoMode = localStorage.getItem('demoMode') === 'true';
        setIsDemoMode(demoMode);
        
        if (demoMode) {
            loadDemoUser();
        } else {
            loadAuthenticatedUser();
        }
    };
    
    /**
     * Carga un usuario de demostración
     */
    const loadDemoUser = () => {
            const demoRole = localStorage.getItem('demoUserRole') || 'CANDIDATO';
            const demoUsuario = {
                id: 1,
                email: 'usuario.demo@talentmatch.com',
                nombre: demoRole === 'CANDIDATO' ? 'Juan' : demoRole === 'RECLUTADOR' ? 'Carlos' : 'Admin',
                apellido: demoRole === 'CANDIDATO' ? 'Pérez' : demoRole === 'RECLUTADOR' ? 'Mendoza' : 'Sistema',
                rol: demoRole
            };
        
            setUsuario(demoUsuario);
            setIsAuthenticated(true);
            
            // Guardar en cookies para que el middleware permita la navegación
            Cookies.set('demoMode', 'true', { expires: 1 });
            Cookies.set('usuario', JSON.stringify(demoUsuario), { expires: 1 });
    };
    
    /**
     * Carga un usuario autenticado desde cookies/localStorage
     */
    const loadAuthenticatedUser = () => {
            const usuarioGuardado = authService.getUsuario();
            if (usuarioGuardado) {
                setUsuario(usuarioGuardado);
                setIsAuthenticated(true);
        }
    };

    /**
     * Limpia los errores de autenticación
     */
    const clearError = () => {
        setError(null);
    };

    /**
     * Inicia sesión con email y contraseña
     */
    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await authService.login({ email, password });
            setUsuario(response.usuario);
            setIsAuthenticated(true);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Inicia el proceso de autenticación OAuth2
     */
    const loginConOAuth2 = async (provider: string) => {
        try {
            setLoading(true);
            setError(null);
            
            if (provider === 'google') {
                await authService.loginConGoogle();
            } else if (provider === 'github') {
                await authService.loginConGithub();
            } else {
                throw new Error('Proveedor de autenticación no soportado');
            }
            
            // No establecemos isAuthenticated aquí porque el usuario será redirigido
            // La autenticación se completará en la página de callback
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Error al iniciar sesión con ${provider}`;
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Cierra la sesión del usuario
     */
    const logout = () => {
        if (isDemoMode) {
            // Limpiar modo demo
            localStorage.removeItem('demoMode');
            localStorage.removeItem('demoUserRole');
            Cookies.remove('demoMode');
            Cookies.remove('usuario');
            setIsDemoMode(false);
            setUsuario(null);
            setIsAuthenticated(false);
            setError(null);
            window.location.href = '/login';
        } else {
            authService.logout();
            setUsuario(null);
            setIsAuthenticated(false);
            setError(null);
        }
    };

    /**
     * Activa el modo demostración
     */
    const enableDemoMode = (role: string = 'CANDIDATO') => {
        const demoUsuario = {
            id: 1,
            email: 'usuario.demo@talentmatch.com',
            nombre: role === 'CANDIDATO' ? 'Juan' : role === 'RECLUTADOR' ? 'Carlos' : 'Admin',
            apellido: role === 'CANDIDATO' ? 'Pérez' : role === 'RECLUTADOR' ? 'Mendoza' : 'Sistema',
            rol: role
        };
        
        setIsDemoMode(true);
        setUsuario(demoUsuario);
        setIsAuthenticated(true);
        setError(null);
        
        // Guardar en localStorage y cookies
        localStorage.setItem('demoMode', 'true');
        localStorage.setItem('demoUserRole', role);
        Cookies.set('demoMode', 'true', { expires: 1 });
        Cookies.set('usuario', JSON.stringify(demoUsuario), { expires: 1 });
        
        // Redirigir según el rol
        const redirectPath = getRedirectPathByRole(role);
        window.location.href = redirectPath;
    };
    
    /**
     * Determina la ruta de redirección según el rol
     */
    const getRedirectPathByRole = (role: string): string => {
        switch (role) {
            case 'RECLUTADOR':
                return '/reclutador';
            case 'ADMINISTRADOR':
                return '/admin';
            case 'CANDIDATO':
            default:
                return '/dashboard';
        }
    };
    
    return (
        <AuthContext.Provider value={{ 
            usuario, 
            isAuthenticated, 
            error,
            loading,
            login, 
            loginConOAuth2,
            logout,
            clearError,
            isDemoMode,
            enableDemoMode,
            setIsAuthenticated,
            setUsuario
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
}