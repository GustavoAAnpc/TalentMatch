import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useState } from "react"
import { Check, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface AddSkillFormProps {
  onAdd: (skill: any) => void
  onCancel: () => void
}

export function AddSkillForm({ onAdd, onCancel }: AddSkillFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    level: 50,
    destacada: true
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
  
  // Enviar el formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(formData)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Habilidad *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej. React, Python, Gestión de proyectos"
          required
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
        <Label htmlFor="destacada">Mostrar como habilidad destacada en mi perfil</Label>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
        <Button type="submit" size="sm">
          <Check className="h-4 w-4 mr-1" />
          Guardar
        </Button>
      </div>
    </form>
  )
} 