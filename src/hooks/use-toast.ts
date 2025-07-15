
// Hook kustom untuk sistem notifikasi toast
import * as React from "react"

// Tipe data untuk varian toast
type ToastVariants = "default" | "destructive" | null | undefined

// Interface untuk props toast
export interface ToastProps {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactElement
  variant?: ToastVariants
}

// Tipe aksi yang dapat dilakukan pada toast
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST", 
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

// Tipe untuk action yang digunakan dalam reducer
type ActionType = typeof actionTypes

// Interface untuk action dalam reducer
type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToastProps
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToastProps>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToastProps["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToastProps["id"]
    }

// Interface untuk state toast
interface State {
  toasts: ToastProps[]
}

// State awal untuk toast
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

// Fungsi untuk menambahkan toast ke state
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  // Set timeout untuk menghapus toast otomatis setelah 5 detik
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, 5000)

  toastTimeouts.set(toastId, timeout)
}

// Reducer untuk mengelola state toast
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, 3), // Maksimal 3 toast
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // Jika tidak ada toastId, dismiss semua toast
      if (!toastId) {
        return {
          ...state,
          toasts: [],
        }
      }

      // Dismiss toast tertentu
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== toastId),
      }
    }

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

// Event listeners untuk toast
const listeners: Array<(state: State) => void> = []

// State global untuk toast
let memoryState: State = { toasts: [] }

// Fungsi dispatch untuk mengirim action
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

// Interface untuk props toast yang dapat diterima
type Toast = Omit<ToastProps, "id">

// Fungsi untuk menampilkan toast
function toast({ ...props }: Toast) {
  const id = Math.random().toString(36).substring(2, 9)

  const update = (props: ToastProps) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

// Hook untuk menggunakan toast dalam komponen
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
