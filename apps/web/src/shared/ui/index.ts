// Shared UI Segment Public API

// Alert
export {
	Alert,
	AlertDescription,
	AlertTitle,
	alertVariants,
} from "./alert/alert";

// Alert Dialog
export {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	AlertDialogPortal,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./alert-dialog/alert-dialog";

// Avatar
export { Avatar, AvatarFallback, AvatarImage } from "./avatar/avatar";

// Badge
export { Badge, badgeVariants } from "./badge/badge";

// Badge With Icon
export { BadgeWithIcon } from "./badge-with-icon/badge-with-icon";

// Breadcrumb
export {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "./breadcrumb/breadcrumb";
export type { ButtonProps } from "./button/button";
// Button
export { Button, buttonVariants } from "./button/button";

// Card
export {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./card/card";

// Chart
export {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartStyle,
	ChartTooltip,
	ChartTooltipContent,
} from "./chart/chart";

// Checkbox
export { Checkbox } from "./checkbox/checkbox";

// Command
export {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "./command/command";

// Data Table
export type {
	DataTableColumn,
	DataTablePagination,
	DataTableSort,
} from "./data-table/data-table";
export {
	DataTableFacetedFilter,
	type DataTableFacetedFilterOption,
} from "./data-table/data-table-faceted-filter";
export { DataTableSkeleton } from "./data-table/data-table-skeleton";
export { DataTable } from "./data-table/data-table-tanstack";

// Dialog
export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
} from "./dialog/dialog";

// Dropdown Menu
export {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "./dropdown-menu/dropdown-menu";

// Form
export {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	useFormField,
} from "./form/form";

// Input
export { Input } from "./input/input";

// Label
export { Label } from "./label/label";

// Locale Switcher
export { LocaleSwitcher } from "./locale-switcher/locale-switcher";

// Popover
export {
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverTrigger,
} from "./popover/popover";

// Progress
export { Progress } from "./progress/progress";

// Radio Group
export { RadioGroup, RadioGroupItem } from "./radio-group/radio-group";

// Select
export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "./select/select";

// Separator
export { Separator } from "./separator/separator";

// Sheet
export {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "./sheet/sheet";

// Sidebar
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
} from "./sidebar/sidebar";

// Skeleton
export { Skeleton } from "./skeleton/skeleton";

// Switch
export { Switch } from "./switch/switch";

// Table
export {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "./table/table";
export type { TableOfContentsProps } from "./table-of-contents/table-of-contents";
// Table of Contents
export { TableOfContents } from "./table-of-contents/table-of-contents";

// Tabs
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs/tabs";

// Textarea
export { Textarea } from "./textarea/textarea";

// Theme Provider
export { ThemeProvider } from "./theme-provider";

// Theme Selector
export {
	isTheme,
	type Theme,
	type ThemeOption,
	ThemeSelector,
	themeOptions,
} from "./theme-selector/theme-selector";

// Tooltip
export {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./tooltip/tooltip";
