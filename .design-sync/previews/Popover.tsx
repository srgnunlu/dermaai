import {
  Popover, PopoverTrigger, PopoverContent, Button, Label, Input,
} from 'corioscan-ui';

export const FilterPopover = () => (
  <Popover defaultOpen>
    <PopoverTrigger asChild>
      <Button variant="outline">Filters</Button>
    </PopoverTrigger>
    <PopoverContent align="start" style={{ width: 260 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>Filter cases</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label htmlFor="minrisk">Minimum risk score</Label>
          <Input id="minrisk" placeholder="0.0 – 1.0" />
        </div>
        <Button size="sm">Apply</Button>
      </div>
    </PopoverContent>
  </Popover>
);
