import { toggleDrawer } from "./Drawer"

export function MenuButton() {
  return (
    <button
      onClick={() => {
        toggleDrawer(true)
      }}
      className="h-6 w-6 rounded-full p-[0.20rem] transition-all hover:bg-zinc-400/10 md:hidden"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  )
}
