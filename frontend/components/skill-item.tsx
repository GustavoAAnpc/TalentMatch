import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Edit2, Trash2, Check, X } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ModalForm } from "./modal-form"
import { ConfirmDialog } from "./confirm-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface SkillItemProps {
  skill: {
    id: number
    name: string
    level: number
    destacada?: boolean
  }
  onEdit: (id: number, updatedSkill: any) => void
  onDelete: (id: number) => void
}

export function SkillItem({ skill, onEdit, onDelete }: SkillItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [formData, setFormData] = useState({
    ...skill,
    destacada: skill.destacada !== undefined ? skill.destacada : false
  })
  
  // Obtener etiqueta del nivel
  const getLevelLabel = (level: number) => {
    if (level < 25) return "Básico";
    if (level < 50) return "Intermedio";
    if (level < 75) return "Avanzado";
    return "Experto";
  };
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Manejar cambios en el slider
  const handleSliderChange = (value: number[]) => {
    setFormData(prev => ({ ...prev, level: value[0] }))
  }
  
  // Manejar cambios en el checkbox
  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, destacada: checked }))
  }
  
  // Guardar los cambios
  const handleSave = () => {
    onEdit(skill.id, formData)
    setIsEditing(false)
  }
  
  // Cancelar edición
  const handleCancel = () => {
    setFormData({
      ...skill,
      destacada: skill.destacada !== undefined ? skill.destacada : false
    })
    setIsEditing(false)
  }
  
  // Confirmar eliminación
  const handleDelete = () => {
    setIsConfirmingDelete(true)
  }
  
  const confirmDelete = () => {
    onDelete(skill.id)
  }
  
  // Formulario de edición
  const editForm = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Habilidad</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej. React, Python, Gestión de proyectos"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="level">Nivel: {getLevelLabel(formData.level)}</Label>
          <span className="text-sm text-muted-foreground">{formData.level}%</span>
        </div>
        <Slider
          id="level"
          value={[formData.level]}
          min={0}
          max={100}
          step={5}
          onValueChange={handleSliderChange}
          className="my-4"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="destacada" 
          checked={formData.destacada} 
          onCheckedChange={handleCheckboxChange} 
        />
        <Label htmlFor="destacada" className="text-sm">Mostrar como habilidad destacada en mi perfil</Label>
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
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="font-medium text-[#0a192f]">{skill.name}</div>
              {skill.destacada && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                  Destacada
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{skill.level}%</div>
          </div>
          <Progress value={skill.level} className="h-2" />
          <div className="text-xs mt-1 text-muted-foreground">{getLevelLabel(skill.level)}</div>
        </div>
        <div className="flex ml-4">
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
        title="Editar habilidad"
        description="Actualiza el nombre y nivel de tu habilidad"
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
        title="Eliminar habilidad"
        description="¿Estás seguro de que deseas eliminar esta habilidad? Esta acción no se puede deshacer."
      />
    </>
  )
}
