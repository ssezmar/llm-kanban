import { useMemo, useCallback, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeTypes,
  type Connection,
  type EdgeMouseHandler,
  Handle,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Column, TransitionRule } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import { DynamicIcon } from './ui/dynamic-icon'

interface ColumnNodeData {
  label: string
  icon: string
  description: string
  color: string
  taskCount: number
  limit?: number
}

function ColumnNode({ data }: { data: ColumnNodeData }) {
  const isOverLimit = data.limit !== undefined && data.limit > 0 && data.taskCount > data.limit
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-xl border-2 bg-card min-w-[140px] text-center',
        'shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing'
      )}
      style={{ borderColor: data.color }}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-3 !h-3 !border-2 !border-card hover:!bg-foreground !transition-colors" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-3 !h-3 !border-2 !border-card hover:!bg-foreground !transition-colors" />
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground !w-3 !h-3 !border-2 !border-card hover:!bg-foreground !transition-colors" />
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground !w-3 !h-3 !border-2 !border-card hover:!bg-foreground !transition-colors" />
      <div className="flex justify-center mb-1"><DynamicIcon name={data.icon} className="h-6 w-6 text-muted-foreground" /></div>
      <div className="text-sm font-semibold">{data.label}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 max-w-[150px]">{data.description}</div>
      <div className={cn(
        'text-xs mt-1.5 tabular-nums',
        isOverLimit ? 'text-red-400 font-medium' : 'text-muted-foreground'
      )}>
        {data.taskCount} задач{data.limit ? ` / ${data.limit}` : ''}
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  column: ColumnNode as any,
}

interface TransitionGraphProps {
  columns: Column[]
  transitions: TransitionRule[]
  taskCounts: Record<string, number>
  className?: string
  interactive?: boolean
  onAddTransition?: (from: string, to: string) => void
  onRemoveTransition?: (from: string, to: string) => void
}

function buildNodes(columns: Column[], taskCounts: Record<string, number>): Node[] {
  const count = columns.length
  const cols = Math.min(count, 4)
  const xGap = 220
  const yGap = 180

  return columns.map((col, i) => {
    const row = Math.floor(i / cols)
    const colInRow = i % cols
    const itemsInRow = Math.min(cols, count - row * cols)
    const xOffset = ((cols - itemsInRow) * xGap) / 2

    return {
      id: col.id,
      type: 'column',
      position: {
        x: colInRow * xGap + xOffset,
        y: row * yGap,
      },
      data: {
        label: col.title,
        icon: col.icon,
        description: col.description,
        color: col.color,
        taskCount: taskCounts[col.id] || 0,
        limit: col.limit,
      } satisfies ColumnNodeData,
    }
  })
}

function buildEdges(transitions: TransitionRule[], columns: Column[], selectedEdgeId: string | null): Edge[] {
  return transitions.map((t, i) => {
    const fromCol = columns.find((c) => c.id === t.from)
    const toCol = columns.find((c) => c.id === t.to)
    const fromIdx = columns.findIndex((c) => c.id === t.from)
    const toIdx = columns.findIndex((c) => c.id === t.to)
    const isBackward = toIdx < fromIdx
    const edgeId = `e-${t.from}-${t.to}`
    const isSelected = edgeId === selectedEdgeId

    return {
      id: edgeId,
      source: t.from,
      target: t.to,
      animated: !isBackward,
      style: {
        stroke: isSelected ? '#ef4444' : isBackward ? (toCol?.color || '#f97316') : (fromCol?.color || '#64748b'),
        strokeWidth: isSelected ? 3 : isBackward ? 1.5 : 2,
        strokeDasharray: isBackward ? '5 5' : undefined,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: isSelected ? '#ef4444' : isBackward ? (toCol?.color || '#f97316') : (fromCol?.color || '#64748b'),
      },
      type: 'smoothstep',
    }
  })
}

export function TransitionGraph({
  columns,
  transitions,
  taskCounts,
  className,
  interactive = false,
  onAddTransition,
  onRemoveTransition,
}: TransitionGraphProps) {
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null)

  const initialNodes = useMemo(() => buildNodes(columns, taskCounts), [columns, taskCounts])
  const computedEdges = useMemo(() => buildEdges(transitions, columns, selectedEdge), [transitions, columns, selectedEdge])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(computedEdges)

  // Sync nodes when columns/taskCounts change from outside
  useMemo(() => {
    setNodes((prev) => {
      const posMap = new Map(prev.map((n) => [n.id, n.position]))
      return initialNodes.map((n) => ({
        ...n,
        position: posMap.get(n.id) || n.position,
      }))
    })
  }, [initialNodes])

  // Sync edges when transitions change from outside
  useMemo(() => {
    setEdges(computedEdges)
  }, [computedEdges])

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      if (connection.source === connection.target) return
      // Check if transition already exists
      const exists = transitions.some(
        (t) => t.from === connection.source && t.to === connection.target
      )
      if (exists) return
      onAddTransition?.(connection.source, connection.target)
    },
    [transitions, onAddTransition]
  )

  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      if (!interactive) return
      setSelectedEdge((prev) => (prev === edge.id ? null : edge.id))
    },
    [interactive]
  )

  const handleDeleteSelected = useCallback(() => {
    if (!selectedEdge) return
    // Parse source/target from edge id: "e-{from}-{to}"
    const transition = transitions.find((t) => `e-${t.from}-${t.to}` === selectedEdge)
    if (transition) {
      onRemoveTransition?.(transition.from, transition.to)
    }
    setSelectedEdge(null)
  }, [selectedEdge, transitions, onRemoveTransition])

  const selectedTransition = selectedEdge
    ? transitions.find((t) => `e-${t.from}-${t.to}` === selectedEdge)
    : null

  return (
    <div className={cn('rounded-xl border bg-card overflow-hidden relative', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={interactive ? onNodesChange : undefined}
        onEdgesChange={interactive ? onEdgesChange : undefined}
        onConnect={interactive ? onConnect : undefined}
        onEdgeClick={onEdgeClick}
        onPaneClick={() => setSelectedEdge(null)}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={interactive}
        nodesConnectable={interactive}
        elementsSelectable={interactive}
        panOnDrag
        zoomOnScroll
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        connectionLineStyle={{ stroke: 'hsl(var(--foreground))', strokeWidth: 2 }}
      >
        <Background gap={20} size={1} className="!bg-background" />
        <Controls
          showInteractive={false}
          className="!bg-card !border-border !shadow-sm [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted"
        />
      </ReactFlow>

      {/* Selected edge toolbar */}
      {interactive && selectedTransition && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-card border shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="text-sm">
            <span className="font-medium inline-flex items-center gap-1"><DynamicIcon name={columns.find((c) => c.id === selectedTransition.from)?.icon ?? ''} className="h-4 w-4 text-muted-foreground" />{columns.find((c) => c.id === selectedTransition.from)?.title}</span>
            <span className="text-muted-foreground mx-2">→</span>
            <span className="font-medium inline-flex items-center gap-1"><DynamicIcon name={columns.find((c) => c.id === selectedTransition.to)?.icon ?? ''} className="h-4 w-4 text-muted-foreground" />{columns.find((c) => c.id === selectedTransition.to)?.title}</span>
          </span>
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Удалить
          </button>
        </div>
      )}
    </div>
  )
}
