import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  SelectGroup, SelectLabel,
} from 'corioscan-ui';

export const BodyRegion = () => (
  <Select defaultOpen defaultValue="arm">
    <SelectTrigger style={{ width: 240 }}>
      <SelectValue placeholder="Select body region" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Body region</SelectLabel>
        <SelectItem value="face">Face &amp; neck</SelectItem>
        <SelectItem value="arm">Arm</SelectItem>
        <SelectItem value="trunk">Trunk</SelectItem>
        <SelectItem value="leg">Leg</SelectItem>
        <SelectItem value="scalp">Scalp</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
);
