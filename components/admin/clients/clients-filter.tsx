"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

export function ClientsFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }
    router.push(`?${params.toString()}`)
  }

  const handleTypeFilter = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== "all") {
      params.set("type", value)
    } else {
      params.delete("type")
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes por nombre, email, empresa..."
          className="pl-9"
          defaultValue={searchParams.get("search") || ""}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      <Select defaultValue={searchParams.get("type") || "all"} onValueChange={handleTypeFilter}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Tipo de cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="individual">Individual</SelectItem>
          <SelectItem value="empresa">Empresa</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
