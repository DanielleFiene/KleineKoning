// components/ui/sidebar.tsx
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Menu as MenuIcon } from "lucide-react"
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import { useMediaQuery, useTheme } from "@mui/material/styles";

import { useIsMobile } from "@/hooks/use-mobile"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    // Helper to toggle the sidebar.
    // Op desktop altijd expanded, alleen op mobile togglen
    const toggleSidebar = React.useCallback(() => {
      if (isMobile) {
        setOpenMobile((open) => !open)
      }
      // Op desktop doen we niets - sidebar blijft altijd expanded
    }, [isMobile, setOpenMobile])

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // Op desktop altijd expanded, op mobile afhankelijk van openMobile
    const state = isMobile ? (openMobile ? "expanded" : "collapsed") : "expanded"

    const contextValue = React.useMemo<SidebarContextProps>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <Box
          sx={{
            display: "flex",
            minHeight: "100svh",
            width: "100%",
            ...style,
          }}
          ref={ref}
          {...props}
        >
          {children}
        </Box>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    const theme = useTheme()
    const isMd = useMediaQuery(theme.breakpoints.up("md"))

    if (collapsible === "none") {
      return (
        <Box
          sx={{
            display: "flex",
            height: "100%",
            width: SIDEBAR_WIDTH,
            flexDirection: "column",
            backgroundColor: "background.paper",
            color: "text.primary",
          }}
          ref={ref}
          {...props}
        >
          {children}
        </Box>
      )
    }

    if (isMobile) {
      return (
        <Drawer
          open={openMobile}
          onClose={() => setOpenMobile(false)}
          anchor={side}
          PaperProps={{
            sx: {
              width: SIDEBAR_WIDTH_MOBILE,
              backgroundColor: "background.paper",
              color: "text.primary",
            },
          }}
        >
          <Box sx={{ display: "flex", height: "100%", width: "100%", flexDirection: "column" }}>
            {children}
          </Box>
        </Drawer>
      )
    }

    // Op desktop altijd volledige breedte, nooit collapsed
    const sidebarWidth = SIDEBAR_WIDTH

    return (
      <Box
        ref={ref}
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
        sx={{
          display: { xs: "none", md: "block" },
          position: "relative",
        }}
      >
        <Box
          sx={{
            width: sidebarWidth,
            transition: "width 200ms ease-linear",
          }}
        />
        <Box
          component="nav"
          sx={{
            position: "fixed",
            top: 0,
            bottom: 0,
            zIndex: 10,
            width: sidebarWidth,
            height: "100svh",
            transition: side === "left" 
              ? `left 200ms ease-linear, width 200ms ease-linear`
              : `right 200ms ease-linear, width 200ms ease-linear`,
            // Op desktop altijd zichtbaar (left: 0 of right: 0)
            left: side === "left" ? 0 : "auto",
            right: side === "right" ? 0 : "auto",
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            backgroundColor: "background.paper",
            color: "text.primary",
            ...(variant === "floating" || variant === "inset" ? {
              padding: 1,
            } : {
              borderRight: side === "left" ? "1px solid" : "none",
              borderLeft: side === "right" ? "1px solid" : "none",
              borderColor: "divider",
            }),
            ...(variant === "floating" && {
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: 2,
            }),
          }}
          {...props}
        >
          <Box
            data-sidebar="sidebar"
            sx={{
              display: "flex",
              height: "100%",
              width: "100%",
              flexDirection: "column",
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof IconButton>
>(({ onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <IconButton
      ref={ref}
      data-sidebar="trigger"
      size="small"
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
      sx={{ width: 28, height: 28, ...props.sx }}
    >
      <MenuIcon size={24} />
      <Box component="span" sx={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: 0 }}>
        Toggle Sidebar
      </Box>
    </IconButton>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Box
      component="button"
      ref={ref as any}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      sx={{
        position: "absolute",
        top: 0,
        bottom: 0,
        zIndex: 20,
        width: 16,
        display: { xs: "none", sm: "flex" },
        transform: "translateX(-50%)",
        transition: "all 200ms ease-linear",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "action.hover",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "50%",
          width: 2,
          transform: "translateX(-50%)",
        },
        "&:hover::after": {
          backgroundColor: "divider",
        },
      }}
      {...props}
    />
  )
})
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Box>
>(({ ...props }, ref) => {
  return (
    <Box
      component="main"
      ref={ref}
      sx={{
        position: "relative",
        display: "flex",
        width: "100%",
        flex: 1,
        flexDirection: "column",
        backgroundColor: "background.default",
      }}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ ...props }, ref) => {
  return (
    <Box
      component="input"
      ref={ref}
      data-sidebar="input"
      sx={{
        height: 32,
        width: "100%",
        backgroundColor: "background.default",
        boxShadow: "none",
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
        },
      }}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Box>
>(({ ...props }, ref) => {
  return (
    <Box
      ref={ref}
      data-sidebar="header"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 1,
      }}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Box>
>(({ ...props }, ref) => {
  return (
    <Box
      ref={ref}
      data-sidebar="footer"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 1,
      }}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Box>
>(({ ...props }, ref) => {
  return (
    <Box
      ref={ref}
      data-sidebar="separator"
      component="hr"
      sx={{
        mx: 1,
        width: "auto",
        border: "none",
        borderTop: "1px solid",
        borderColor: "divider",
      }}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Box>
>(({ ...props }, ref) => {
  return (
    <Box
      ref={ref}
      data-sidebar="content"
      sx={{
        display: "flex",
        minHeight: 0,
        flex: 1,
        flexDirection: "column",
        gap: 1,
        overflow: "auto",
      }}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Box>
>(({ ...props }, ref) => {
  return (
    <Box
      ref={ref}
      data-sidebar="group"
      sx={{
        position: "relative",
        display: "flex",
        width: "100%",
        minWidth: 0,
        flexDirection: "column",
        p: 1,
      }}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Box> & { asChild?: boolean }
>(({ asChild = false, ...props }, ref) => {
  if (asChild) {
    const { sx, ...restProps } = props as any
    return <Slot ref={ref as any} data-sidebar="group-label" {...restProps} />
  }

  return (
    <Box
      ref={ref}
      data-sidebar="group-label"
      sx={{
        display: "flex",
        height: 32,
        flexShrink: 0,
        alignItems: "center",
        borderRadius: 1,
        px: 1,
        fontSize: "0.75rem",
        fontWeight: 500,
        color: "text.secondary",
        outline: "none",
        transition: "margin 200ms ease-linear, opacity 200ms ease-linear",
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
        },
        "& svg": {
          width: 16,
          height: 16,
          flexShrink: 0,
        },
      }}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof IconButton> & { asChild?: boolean }
>(({ asChild = false, ...props }, ref) => {
  if (asChild) {
    return <Slot ref={ref as any} data-sidebar="group-action" {...props} />
  }

  return (
    <IconButton
      ref={ref}
      data-sidebar="group-action"
      size="small"
      sx={{
        position: "absolute",
        right: 12,
        top: 14,
        width: 20,
        height: 20,
        minWidth: 20,
        padding: 0,
        color: "text.primary",
        outline: "none",
        transition: "transform 200ms",
        "&:hover": {
          backgroundColor: "action.hover",
          color: "text.primary",
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
        },
        "& svg": {
          width: 16,
          height: 16,
          flexShrink: 0,
        },
        ...props.sx,
      }}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Box>
>(({ ...props }, ref) => (
  <Box
    ref={ref}
    data-sidebar="group-content"
    sx={{
      width: "100%",
      fontSize: "0.875rem",
    }}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ ...props }, ref) => (
  <Box
    component="ul"
    ref={ref as any}
    data-sidebar="menu"
    sx={{
      display: "flex",
      width: "100%",
      minWidth: 0,
      flexDirection: "column",
      gap: 0.5,
      listStyle: "none",
      padding: 0,
      margin: 0,
    }}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => (
  <Box
    component="li"
    ref={ref as any}
    data-sidebar="menu-item"
    sx={{
      position: "relative",
    }}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof IconButton> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string
    variant?: "default" | "outline"
    size?: "default" | "sm" | "lg"
  }
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : IconButton
    const { isMobile, state } = useSidebar()

    const sizeStyles: Record<"default" | "sm" | "lg", { height: number; fontSize: string }> = {
      default: { height: 32, fontSize: "0.875rem" },
      sm: { height: 28, fontSize: "0.75rem" },
      lg: { height: 48, fontSize: "0.875rem" },
    }

    const button = (
      <IconButton
        ref={ref as any}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        sx={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          gap: 1,
          overflow: "hidden",
          borderRadius: 1,
          p: 1,
          textAlign: "left",
          outline: "none",
          transition: "width 200ms, height 200ms, padding 200ms",
          "&:hover": {
            backgroundColor: "action.hover",
            color: "text.primary",
          },
          "&:active": {
            backgroundColor: "action.selected",
            color: "text.primary",
          },
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
          },
          "&:disabled": {
            pointerEvents: "none",
            opacity: 0.5,
          },
          ...(isActive && {
            backgroundColor: "action.selected",
            fontWeight: 500,
            color: "text.primary",
          }),
          ...(variant === "outline" && {
            backgroundColor: "background.default",
            boxShadow: "0 0 0 1px",
            borderColor: "divider",
            "&:hover": {
              backgroundColor: "action.hover",
              boxShadow: "0 0 0 1px",
              borderColor: "primary.main",
            },
          }),
          ...sizeStyles[size as "default" | "sm" | "lg"],
          "& svg": {
            width: 16,
            height: 16,
            flexShrink: 0,
          },
          "& > span:last-child": {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
          ...props.sx,
        }}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    return button
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof IconButton> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ asChild = false, showOnHover = false, ...props }, ref) => {
  if (asChild) {
    return <Slot ref={ref as any} data-sidebar="menu-action" {...props} />
  }

  return (
    <IconButton
      ref={ref as any}
      data-sidebar="menu-action"
      size="small"
      sx={{
        position: "absolute",
        right: 4,
        top: 6,
        width: 20,
        height: 20,
        minWidth: 20,
        padding: 0,
        color: "text.primary",
        outline: "none",
        transition: "transform 200ms",
        "&:hover": {
          backgroundColor: "action.hover",
          color: "text.primary",
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
        },
        "& svg": {
          width: 16,
          height: 16,
          flexShrink: 0,
        },
        ...(showOnHover && {
          opacity: { xs: 1, md: 0 },
          "&:hover": {
            opacity: 1,
          },
        }),
        ...props.sx,
      }}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Box>
>(({ ...props }, ref) => (
  <Box
    ref={ref}
    data-sidebar="menu-badge"
    sx={{
      pointerEvents: "none",
      position: "absolute",
      right: 4,
      top: 6,
      display: "flex",
      height: 20,
      minWidth: 20,
      userSelect: "none",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 1,
      px: 0.5,
      fontSize: "0.75rem",
      fontWeight: 500,
      fontVariantNumeric: "tabular-nums",
      color: "text.primary",
    }}
    {...props}
  />
))
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Box> & {
    showIcon?: boolean
  }
>(({ showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <Box
      ref={ref}
      data-sidebar="menu-skeleton"
      sx={{
        display: "flex",
        height: 32,
        alignItems: "center",
        gap: 1,
        borderRadius: 1,
        px: 1,
      }}
      {...props}
    >
      {showIcon && (
        <Box
          data-sidebar="menu-skeleton-icon"
          sx={{
            width: 16,
            height: 16,
            borderRadius: 1,
            backgroundColor: "action.hover",
          }}
        />
      )}
      <Box
        data-sidebar="menu-skeleton-text"
        sx={{
          height: 16,
          maxWidth: width,
          flex: 1,
          borderRadius: 1,
          backgroundColor: "action.hover",
        }}
      />
    </Box>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ ...props }, ref) => (
  <Box
    component="ul"
    ref={ref as any}
    data-sidebar="menu-sub"
    sx={{
      mx: 1.75,
      display: "flex",
      minWidth: 0,
      transform: "translateX(1px)",
      flexDirection: "column",
      gap: 0.5,
      borderLeft: "1px solid",
      borderColor: "divider",
      px: 1.25,
      py: 0.5,
      listStyle: "none",
      padding: 0,
      margin: 0,
    }}
    {...props}
  />
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => (
  <Box component="li" ref={ref as any} {...props} />
))
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean
    size?: "sm" | "md"
    isActive?: boolean
  }
>(({ asChild = false, size = "md", isActive, ...props }, ref) => {
  if (asChild) {
    return <Slot ref={ref as any} data-sidebar="menu-sub-button" data-size={size} data-active={isActive} {...props} />
  }

  const { sx, ...restProps } = props as any

  return (
    <Box
      ref={ref as any}
      component="a"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      sx={{
        display: "flex",
        height: 28,
        minWidth: 0,
        transform: "translateX(-1px)",
        alignItems: "center",
        gap: 1,
        overflow: "hidden",
        borderRadius: 1,
        px: 1,
        color: "text.primary",
        outline: "none",
        textDecoration: "none",
        "&:hover": {
          backgroundColor: "action.hover",
          color: "text.primary",
        },
        "&:active": {
          backgroundColor: "action.selected",
          color: "text.primary",
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
        },
        "&:disabled": {
          pointerEvents: "none",
          opacity: 0.5,
        },
        ...(isActive && {
          backgroundColor: "action.selected",
          color: "text.primary",
        }),
        ...(size === "sm" && {
          fontSize: "0.75rem",
        }),
        ...(size === "md" && {
          fontSize: "0.875rem",
        }),
        "& > span:last-child": {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
        "& svg": {
          width: 16,
          height: 16,
          flexShrink: 0,
          color: "text.primary",
        },
        ...sx,
      }}
      {...restProps}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
