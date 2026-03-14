import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react"
import Button from "@/shared/components/ui/Button"

type Props = {
    ariaLabel: string
    title: string
    selectedColor: string
    paletteColors: readonly string[]
    onSelectColor: (color: string) => void
    triggerContent: ReactNode
}

export default function ColorPalettePicker({
    ariaLabel,
    title,
    selectedColor,
    paletteColors,
    onSelectColor,
    triggerContent,
}: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 })

    useEffect(() => {
        if (!isOpen) return

        const updatePosition = () => {
            if (!wrapperRef.current) return

            const rect = wrapperRef.current.getBoundingClientRect()
            setPanelPosition({
                top: rect.bottom + 8,
                left: rect.left,
            })
        }

        updatePosition()
        window.addEventListener("resize", updatePosition)
        window.addEventListener("scroll", updatePosition, true)

        return () => {
            window.removeEventListener("resize", updatePosition)
            window.removeEventListener("scroll", updatePosition, true)
        }
    }, [isOpen])

    useEffect(() => {
        function onOutsideMouseDown(event: MouseEvent) {
            if (!wrapperRef.current) return
            if (wrapperRef.current.contains(event.target as Node)) return
            setIsOpen(false)
        }

        function onEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", onOutsideMouseDown)
        window.addEventListener("keydown", onEscape)

        return () => {
            document.removeEventListener("mousedown", onOutsideMouseDown)
            window.removeEventListener("keydown", onEscape)
        }
    }, [])

    function onTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setIsOpen((prev) => !prev)
        }
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <Button
                variant="ghost"
                aria-label={ariaLabel}
                title={title}
                onClick={() => {
                    setIsOpen((prev) => !prev)
                }}
                onKeyDown={onTriggerKeyDown}
                className="h-8 w-8 rounded-md border border-(--border) px-0 py-0 text-(--fg-muted)"
            >
                {triggerContent}
            </Button>

            {isOpen ? (
                <div
                    className="fixed z-50 w-61.5 rounded-md border border-(--border) bg-(--bg-elevated) p-3 shadow-xl"
                    style={{ top: panelPosition.top, left: panelPosition.left }}
                >
                    <div className="grid grid-cols-10 gap-1">
                        {paletteColors.map((color) => {
                            const isActive = selectedColor === color
                            return (
                                <button
                                    key={color}
                                    type="button"
                                    aria-label={`${title} ${color}`}
                                    onMouseDown={(event) => {
                                        event.preventDefault()
                                        onSelectColor(color)
                                    }}
                                    className={[
                                        "h-5 w-5 rounded-full border transition",
                                        color === "#ffffff" ? "border-(--border)" : "border-transparent",
                                        isActive ? "ring-2 ring-(--accent) ring-offset-1" : "hover:scale-105",
                                    ].join(" ")}
                                    style={{ backgroundColor: color }}
                                />
                            )
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    )
}
