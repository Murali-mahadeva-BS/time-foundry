import { ArrowUpDown, Filter } from 'lucide-react'
import type { Project } from '@/types'
import { useUIStore } from '@/stores/ui.store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'

interface TaskFiltersProps {
  project: Project
}

export function TaskFilters({ project }: TaskFiltersProps) {
  const { filters, setFilter } = useUIStore()
  const filter = filters[project.id] ?? { statusIds: [], sortOrder: 'asc' }

  const toggleStatus = (statusId: string) => {
    const current = filter.statusIds
    const next = current.includes(statusId)
      ? current.filter((s) => s !== statusId)
      : [...current, statusId]
    setFilter(project.id, { statusIds: next })
  }

  const activeFilterCount = filter.statusIds.length

  return (
    <div className="flex items-center gap-2">
      {/* Status filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Show statuses</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {project.statuses.map((status) => (
            <DropdownMenuCheckboxItem
              key={status.id}
              checked={filter.statusIds.length === 0 || filter.statusIds.includes(status.id)}
              onCheckedChange={() => toggleStatus(status.id)}
            >
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              {status.name}
            </DropdownMenuCheckboxItem>
          ))}
          {activeFilterCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={false}
                onCheckedChange={() => setFilter(project.id, { statusIds: [] })}
              >
                Clear filters
              </DropdownMenuCheckboxItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Sort by date</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={filter.sortOrder}
            onValueChange={(v) => setFilter(project.id, { sortOrder: v as 'asc' | 'desc' })}
          >
            <DropdownMenuRadioItem value="asc">Oldest first</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="desc">Newest first</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
