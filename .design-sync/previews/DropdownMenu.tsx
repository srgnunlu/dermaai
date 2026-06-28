import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, Button,
} from 'corioscan-ui';

export const CaseActions = () => (
  <DropdownMenu defaultOpen>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">Case actions</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" style={{ width: 220 }}>
      <DropdownMenuLabel>Case #A-1042</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Open case<DropdownMenuShortcut>⌘O</DropdownMenuShortcut></DropdownMenuItem>
      <DropdownMenuItem>Export PDF report</DropdownMenuItem>
      <DropdownMenuItem>Reassign reviewer</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Delete case</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
