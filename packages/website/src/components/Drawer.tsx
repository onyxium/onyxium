import { useState, useEffect } from "preact/hooks"
import type { ComponentChildren } from "preact"

function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(false)

  useEffect(() => {
    const updateBreakpoint = () => {
      setBreakpoint(window.matchMedia("(min-width: 768px)").matches)
    }

    updateBreakpoint()
    window.addEventListener("resize", updateBreakpoint)

    return () => {
      window.removeEventListener("resize", updateBreakpoint)
    }
  })

  return breakpoint
}

export const toggleDrawer = (open: boolean) => {
  document.documentElement.style.setProperty(
    "--drawer-display",
    open ? "block" : "none"
  )
}

export default function Drawer({ children }: { children: ComponentChildren }) {
  const isDesktop = useBreakpoint()

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--drawer-width",
      isDesktop ? "20rem" : "0px"
    )
  }, [isDesktop])

  return isDesktop ? (
    <div
      className="fixed h-full bg-paper"
      style={{ width: "var(--drawer-width)" }}
    >
      {children}
    </div>
  ) : (
    <div
      className="fixed z-50 h-screen w-full bg-black/40"
      style={{ display: "var(--drawer-display)" }}
      onClick={() => {
        toggleDrawer(false)
      }}
    >
      <div
        className="h-full w-3/5 bg-paper"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        {children}
      </div>
    </div>
  )
}
