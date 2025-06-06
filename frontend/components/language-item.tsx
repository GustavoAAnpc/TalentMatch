import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Globe, X, Check } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ModalForm } from "./modal-form"
import { ConfirmDialog } from "./confirm-dialog"

interface LanguageItemProps {
  language: {
    id: number
    name: string
    level: string
  }
  onEdit: (id: number, updatedLanguage: any) => void
  onDelete: (id: number) => void
}

export function LanguageItem({ language, onEdit, onDelete }: LanguageItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [formData, setFormData] = useState(language)
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Manejar cambios en el select
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, level: value }))
  }
  
  // Guardar los cambios
  const handleSave = () => {
    onEdit(language.id, formData)
    setIsEditing(false)
  }
  
  // Cancelar edición
  const handleCancel = () => {
    setFormData(language)
    setIsEditing(false)
  }
  
  // Confirmar eliminación
  const handleDelete = () => {
    setIsConfirmingDelete(true)
  }
  
  const confirmDelete = () => {
    onDelete(language.id)
  }
  
  // Traducir niveles de idioma
  const getNivelEtiqueta = (nivel: string) => {
    const niveles: Record<string, string> = {
      'basic': 'Básico',
      'intermediate': 'Intermedio',
      'advanced': 'Avanzado',
      'native': 'Nativo',
      'fluent': 'Fluido'
    };
    return niveles[nivel] || nivel;
  };
  
  // Formulario de edición
  const editForm = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Idioma</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej. Inglés, Español, Portugués"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="level">Nivel</Label>
        <Select
          value={formData.level}
          onValueChange={handleSelectChange}
        >
          <SelectTrigger id="level">
            <SelectValue placeholder="Selecciona un nivel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">Básico</SelectItem>
            <SelectItem value="intermediate">Intermedio</SelectItem>
            <SelectItem value="advanced">Avanzado</SelectItem>
            <SelectItem value="fluent">Fluido</SelectItem>
            <SelectItem value="native">Nativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Check className="h-4 w-4 mr-1" />
          Guardar
        </Button>
      </div>
    </div>
  )
  
  // Vista normal
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[#38bdf8]/10 p-2 text-[#38bdf8]">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-[#0a192f]">{language.name}</h3>
            <p className="text-sm text-muted-foreground">{getNivelEtiqueta(language.level)}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Eliminar</span>
          </Button>
        </div>
      </div>
      
      {/* Modal de edición */}
      <ModalForm
        title="Editar idioma"
        description="Actualiza el idioma y su nivel de dominio"
        isOpen={isEditing}
        onClose={handleCancel}
      >
        {editForm}
      </ModalForm>
      
      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={confirmDelete}
        title="Eliminar idioma"
        description="¿Estás seguro de que deseas eliminar este idioma? Esta acción no se puede deshacer."
      />
    </>
  )
}
