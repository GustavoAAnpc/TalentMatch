"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Shield, Lock, Key, User, Mail, Smartphone, Globe } from "lucide-react"

export default function PaginaConfiguracion() {
  const [notificacionesCorreo, setNotificacionesCorreo] = useState(true)
  const [notificacionesPush, setNotificacionesPush] = useState(true)
  const [actualizacionesVacantes, setActualizacionesVacantes] = useState(true)
  const [recomendacionesVacantes, setRecomendacionesVacantes] = useState(true)
  const [mensajesReclutadores, setMensajesReclutadores] = useState(true)
  const [alertasEntrevistas, setAlertasEntrevistas] = useState(true)
  const [idiomaSeleccionado, setIdiomaSeleccionado] = useState("es")
  const [temaSeleccionado, setTemaSeleccionado] = useState("claro")

  return (
    <div className="space-y-6 px-2 py-4 md:px-4 lg:px-5 max-w-[100%] w-full mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-[#0a192f] to-[#112240] p-5 rounded-xl shadow-md">
        <div className="text-white">
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-gray-300 mt-1">Personaliza tu experiencia en la plataforma</p>
        </div>
      </div>
        
        <Tabs defaultValue="notificaciones">
          <TabsList className="mb-4">
            <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
            <TabsTrigger value="privacidad">Privacidad y Seguridad</TabsTrigger>
            <TabsTrigger value="cuenta">Cuenta</TabsTrigger>
            <TabsTrigger value="preferencias">Preferencias</TabsTrigger>
          </TabsList>
          
          <TabsContent value="notificaciones">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
              <CardTitle className="flex items-center text-lg font-semibold text-[#0a192f]">
                  <Bell className="mr-2 h-5 w-5" />
                  Configuración de Notificaciones
                </CardTitle>
                <CardDescription>
                  Administra cómo y cuándo quieres recibir notificaciones.
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6 pt-4 px-5">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Canales de notificación</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notificaciones-correo">Notificaciones por correo electrónico</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe actualizaciones importantes por correo electrónico
                      </p>
                    </div>
                    <Switch 
                      id="notificaciones-correo" 
                      checked={notificacionesCorreo} 
                      onCheckedChange={setNotificacionesCorreo} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notificaciones-push">Notificaciones push</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe notificaciones en tu navegador
                      </p>
                    </div>
                    <Switch 
                      id="notificaciones-push" 
                      checked={notificacionesPush} 
                      onCheckedChange={setNotificacionesPush} 
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Tipos de notificaciones</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="actualizaciones-vacantes">Actualizaciones de vacantes</Label>
                      <p className="text-sm text-muted-foreground">
                        Cambios en el estado de tus postulaciones
                      </p>
                    </div>
                    <Switch 
                      id="actualizaciones-vacantes" 
                      checked={actualizacionesVacantes} 
                      onCheckedChange={setActualizacionesVacantes} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="recomendaciones-vacantes">Recomendaciones de vacantes</Label>
                      <p className="text-sm text-muted-foreground">
                        Nuevas vacantes que coinciden con tu perfil
                      </p>
                    </div>
                    <Switch 
                      id="recomendaciones-vacantes" 
                      checked={recomendacionesVacantes} 
                      onCheckedChange={setRecomendacionesVacantes} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="mensajes-reclutadores">Mensajes de reclutadores</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificaciones cuando un reclutador te contacta
                      </p>
                    </div>
                    <Switch 
                      id="mensajes-reclutadores" 
                      checked={mensajesReclutadores} 
                      onCheckedChange={setMensajesReclutadores} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="alertas-entrevistas">Alertas de entrevistas</Label>
                      <p className="text-sm text-muted-foreground">
                        Recordatorios de próximas entrevistas
                      </p>
                    </div>
                    <Switch 
                      id="alertas-entrevistas" 
                      checked={alertasEntrevistas} 
                      onCheckedChange={setAlertasEntrevistas} 
                    />
                  </div>
                </div>
              </CardContent>
            <CardFooter className="px-5 py-4 border-t">
              <Button className="ml-auto bg-[#38bdf8] hover:bg-[#0ea5e9]">Guardar cambios</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacidad">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
              <CardTitle className="flex items-center text-lg font-semibold text-[#0a192f]">
                  <Shield className="mr-2 h-5 w-5" />
                  Privacidad y Seguridad
                </CardTitle>
                <CardDescription>
                  Administra la visibilidad de tu perfil y mantén tu cuenta segura.
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6 pt-4 px-5">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Visibilidad del perfil</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="visibilidad-perfil">¿Quién puede ver tu perfil?</Label>
                      <Select defaultValue="todos">
                        <SelectTrigger id="visibilidad-perfil">
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="todos">Todos los reclutadores</SelectItem>
                          <SelectItem value="aplicados">Solo empresas a las que he aplicado</SelectItem>
                          <SelectItem value="nadie">Nadie (perfil oculto)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="visibilidad-datos">Datos personales visibles para reclutadores</Label>
                      <Select defaultValue="parcial">
                        <SelectTrigger id="visibilidad-datos">
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="completo">Mostrar todos mis datos</SelectItem>
                          <SelectItem value="parcial">Ocultar datos de contacto hasta match</SelectItem>
                          <SelectItem value="minimo">Mostrar solo información profesional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Seguridad de la cuenta</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Autenticación de dos factores</Label>
                        <p className="text-sm text-muted-foreground">
                          Añade una capa extra de seguridad a tu cuenta
                        </p>
                      </div>
                      <Button variant="outline" className="gap-1">
                        <Lock className="h-4 w-4" />
                        Configurar
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Cambiar contraseña</Label>
                        <p className="text-sm text-muted-foreground">
                          Actualiza tu contraseña regularmente para mayor seguridad
                        </p>
                      </div>
                      <Button variant="outline" className="gap-1">
                        <Key className="h-4 w-4" />
                        Cambiar
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Sesiones activas</Label>
                        <p className="text-sm text-muted-foreground">
                          Gestiona todos los dispositivos donde has iniciado sesión
                        </p>
                      </div>
                      <Button variant="outline" className="gap-1">
                        <Smartphone className="h-4 w-4" />
                        Ver sesiones
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            <CardFooter className="px-5 py-4 border-t">
              <Button className="ml-auto bg-[#38bdf8] hover:bg-[#0ea5e9]">Guardar cambios</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="cuenta">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
              <CardTitle className="flex items-center text-lg font-semibold text-[#0a192f]">
                  <User className="mr-2 h-5 w-5" />
                  Información de la Cuenta
                </CardTitle>
                <CardDescription>
                  Gestiona la información básica de tu cuenta.
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6 pt-4 px-5">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre</Label>
                    <Input id="nombre" placeholder="Tu nombre" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido">Apellido</Label>
                    <Input id="apellido" placeholder="Tu apellido" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="flex items-center gap-2">
                    <Input id="email" type="email" placeholder="tu@email.com" className="flex-1" />
                    <Button variant="outline" size="sm" className="whitespace-nowrap gap-1">
                      <Mail className="h-4 w-4" />
                      Verificar
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" type="tel" placeholder="+51 999 888 777" />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                <h3 className="text-sm font-medium">Eliminar cuenta</h3>
                <div className="rounded-md border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Shield className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Atención: Esta acción no se puede deshacer</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          Al eliminar tu cuenta, se borrarán permanentemente todos tus datos, incluyendo tu perfil, 
                          postulaciones y documentos. No podrás recuperar esta información después.
                        </p>
                      </div>
                      <div className="mt-4">
                        <Button variant="destructive" size="sm">
                          Eliminar mi cuenta
                    </Button>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </CardContent>
            <CardFooter className="px-5 py-4 border-t">
              <Button className="ml-auto bg-[#38bdf8] hover:bg-[#0ea5e9]">Guardar cambios</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferencias">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100 px-5">
              <CardTitle className="flex items-center text-lg font-semibold text-[#0a192f]">
                  <Globe className="mr-2 h-5 w-5" />
                  Preferencias
                </CardTitle>
                <CardDescription>
                Personaliza la apariencia y el comportamiento de la plataforma.
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6 pt-4 px-5">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Idioma y región</h3>
                    <div className="space-y-2">
                      <Label htmlFor="idioma">Idioma</Label>
                  <Select 
                    value={idiomaSeleccionado} 
                    onValueChange={setIdiomaSeleccionado}
                  >
                        <SelectTrigger id="idioma">
                      <SelectValue placeholder="Seleccionar idioma" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Apariencia</h3>
                  <div className="space-y-2">
                    <Label htmlFor="tema">Tema</Label>
                  <Select 
                    value={temaSeleccionado} 
                    onValueChange={setTemaSeleccionado}
                  >
                      <SelectTrigger id="tema">
                      <SelectValue placeholder="Seleccionar tema" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="claro">Claro</SelectItem>
                        <SelectItem value="oscuro">Oscuro</SelectItem>
                        <SelectItem value="sistema">Usar configuración del sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            <CardFooter className="px-5 py-4 border-t">
              <Button className="ml-auto bg-[#38bdf8] hover:bg-[#0ea5e9]">Guardar cambios</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}
